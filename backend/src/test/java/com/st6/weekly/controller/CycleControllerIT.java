package com.st6.weekly.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.st6.weekly.config.RateLimitConfig;
import com.st6.weekly.domain.commit.ChessCategory;
import com.st6.weekly.domain.commit.CompletionStatus;
import com.st6.weekly.domain.commit.WeeklyCommit;
import com.st6.weekly.domain.commit.WeeklyCommitRepository;
import com.st6.weekly.domain.cycle.CycleState;
import com.st6.weekly.domain.cycle.WeeklyCycle;
import com.st6.weekly.domain.cycle.WeeklyCycleRepository;
import com.st6.weekly.domain.user.Role;
import com.st6.weekly.domain.user.User;
import com.st6.weekly.domain.user.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CycleControllerIT {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private WeeklyCycleRepository cycleRepository;
    @Autowired private WeeklyCommitRepository commitRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private RateLimitConfig rateLimitConfig;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private ObjectMapper objectMapper;

    private Cookie bobCookie;
    private Cookie carolCookie;
    private User bob;
    private User carol;
    private UUID outcomeId;

    @BeforeEach
    void setUp() throws Exception {
        rateLimitConfig.clearBuckets();

        // Clean in FK order
        jdbcTemplate.execute("DELETE FROM weekly_commits");
        jdbcTemplate.execute("DELETE FROM weekly_cycles");
        jdbcTemplate.execute("DELETE FROM audit_log");
        jdbcTemplate.execute("DELETE FROM users");
        jdbcTemplate.execute("DELETE FROM outcomes");
        jdbcTemplate.execute("DELETE FROM defining_objectives");
        jdbcTemplate.execute("DELETE FROM rally_cries");

        outcomeId = createOutcome();

        bob = createUser("bob@st6.com", "Bob Martinez", Role.MEMBER);
        carol = createUser("carol@st6.com", "Carol Nguyen", Role.MEMBER);

        bobCookie = login("bob@st6.com");
        carolCookie = login("carol@st6.com");

        rateLimitConfig.clearBuckets();
    }

    @Test
    void full_lifecycle_draft_to_reconciled() throws Exception {
        // 1. Get/create current cycle (DRAFT)
        MvcResult createResult = mockMvc.perform(get("/api/v1/cycles/current")
                        .cookie(bobCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.state").value("DRAFT"))
                .andExpect(jsonPath("$.weekStartDate").isNotEmpty())
                .andReturn();

        String cycleId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("id").asText();

        // 2. Add 3 commits (1 KING + 2 others) directly to DB
        WeeklyCycle cycle = cycleRepository.findById(UUID.fromString(cycleId)).orElseThrow();
        addCommit(cycle, "King task", ChessCategory.KING, 1);
        addCommit(cycle, "Queen task", ChessCategory.QUEEN, 2);
        addCommit(cycle, "Rook task", ChessCategory.ROOK, 3);

        // 3. Lock the cycle
        mockMvc.perform(post("/api/v1/cycles/" + cycleId + "/lock")
                        .cookie(bobCookie)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.state").value("LOCKED"))
                .andExpect(jsonPath("$.lockedAt").isNotEmpty());

        // 4. Start reconciliation
        mockMvc.perform(post("/api/v1/cycles/" + cycleId + "/start-reconciliation")
                        .cookie(bobCookie)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.state").value("RECONCILING"));

        // 5. Set completion statuses on all commits
        cycle = cycleRepository.findByIdWithCommits(UUID.fromString(cycleId)).orElseThrow();
        cycle.getCommits().forEach(c -> {
            c.setCompletionStatus(CompletionStatus.COMPLETED);
            c.setActualHours(BigDecimal.valueOf(3));
        });
        cycleRepository.save(cycle);

        // 6. Reconcile
        mockMvc.perform(post("/api/v1/cycles/" + cycleId + "/reconcile")
                        .cookie(bobCookie)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.state").value("RECONCILED"))
                .andExpect(jsonPath("$.reconciledAt").isNotEmpty());
    }

    @Test
    void lock_returns_validation_errors_as_problem_detail() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/cycles/current")
                        .cookie(bobCookie))
                .andExpect(status().isOk())
                .andReturn();

        String cycleId = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("id").asText();

        mockMvc.perform(post("/api/v1/cycles/" + cycleId + "/lock")
                        .cookie(bobCookie)
                        .with(csrf()))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.title").value("Invalid State Transition"))
                .andExpect(jsonPath("$.detail").value(containsString("3 commits")));
    }

    @Test
    void lock_without_king_returns_error() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/cycles/current")
                        .cookie(bobCookie))
                .andExpect(status().isOk())
                .andReturn();

        String cycleId = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("id").asText();

        WeeklyCycle cycle = cycleRepository.findById(UUID.fromString(cycleId)).orElseThrow();
        addCommit(cycle, "Queen 1", ChessCategory.QUEEN, 1);
        addCommit(cycle, "Queen 2", ChessCategory.QUEEN, 2);
        addCommit(cycle, "Queen 3", ChessCategory.QUEEN, 3);

        mockMvc.perform(post("/api/v1/cycles/" + cycleId + "/lock")
                        .cookie(bobCookie)
                        .with(csrf()))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.detail").value(containsString("KING")));
    }

    @Test
    void pagination_works_correctly() throws Exception {
        LocalDate monday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        for (int i = 0; i < 5; i++) {
            WeeklyCycle cycle = new WeeklyCycle();
            cycle.setUserId(bob.getId());
            cycle.setWeekStartDate(monday.minusWeeks(i));
            cycle.setState(CycleState.DRAFT);
            cycleRepository.save(cycle);
        }

        mockMvc.perform(get("/api/v1/cycles")
                        .param("page", "0")
                        .param("size", "2")
                        .cookie(bobCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.totalElements").value(5))
                .andExpect(jsonPath("$.totalPages").value(3));

        mockMvc.perform(get("/api/v1/cycles")
                        .param("page", "2")
                        .param("size", "2")
                        .cookie(bobCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)));
    }

    @Test
    void member_can_only_see_own_cycles() throws Exception {
        mockMvc.perform(get("/api/v1/cycles/current")
                        .cookie(bobCookie))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/cycles")
                        .param("page", "0")
                        .param("size", "20")
                        .cookie(carolCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)));

        mockMvc.perform(get("/api/v1/cycles")
                        .param("page", "0")
                        .param("size", "20")
                        .cookie(bobCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)));
    }

    @Test
    void member_cannot_access_other_users_cycle_by_id() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/cycles/current")
                        .cookie(bobCookie))
                .andExpect(status().isOk())
                .andReturn();

        String cycleId = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("id").asText();

        mockMvc.perform(get("/api/v1/cycles/" + cycleId)
                        .cookie(carolCookie))
                .andExpect(status().isNotFound());
    }

    @Test
    void unauthenticated_request_returns_401() throws Exception {
        mockMvc.perform(get("/api/v1/cycles/current"))
                .andExpect(status().isUnauthorized());
    }

    // --- Helpers ---

    private User createUser(String email, String name, Role role) {
        User user = new User();
        user.setEmail(email);
        user.setDisplayName(name);
        user.setPasswordHash(passwordEncoder.encode("Password1!"));
        user.setRole(role);
        return userRepository.save(user);
    }

    private Cookie login(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"email": "%s", "password": "Password1!"}
                                """, email)))
                .andExpect(status().isOk())
                .andReturn();
        return result.getResponse().getCookie("st6_token");
    }

    private void addCommit(WeeklyCycle cycle, String title, ChessCategory category, int rank) {
        WeeklyCommit commit = new WeeklyCommit();
        commit.setWeeklyCycle(cycle);
        commit.setTitle(title);
        commit.setOutcomeId(outcomeId);
        commit.setChessCategory(category);
        commit.setPlannedHours(BigDecimal.valueOf(4));
        commit.setPriorityRank(rank);
        commitRepository.save(commit);
    }

    private UUID createOutcome() {
        UUID rallyCryId = UUID.randomUUID();
        UUID doId = UUID.randomUUID();
        UUID oid = UUID.randomUUID();

        jdbcTemplate.update(
                "INSERT INTO rally_cries (id, title, description, status, display_order) VALUES (?, ?, ?, ?, ?)",
                rallyCryId, "Test Rally Cry", "Test", "ACTIVE", 1);
        jdbcTemplate.update(
                "INSERT INTO defining_objectives (id, rally_cry_id, title, description, status) VALUES (?, ?, ?, ?, ?)",
                doId, rallyCryId, "Test DO", "Test", "ACTIVE");
        jdbcTemplate.update(
                "INSERT INTO outcomes (id, defining_objective_id, title, description, status) VALUES (?, ?, ?, ?, ?)",
                oid, doId, "Test Outcome", "Test", "ACTIVE");

        return oid;
    }
}
