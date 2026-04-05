package com.st6.weekly.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.st6.weekly.config.RateLimitConfig;
import com.st6.weekly.domain.audit.AuditLog;
import com.st6.weekly.domain.audit.AuditLogRepository;
import com.st6.weekly.domain.commit.ChessCategory;
import com.st6.weekly.domain.commit.CompletionStatus;
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

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CommitControllerIT {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private WeeklyCycleRepository cycleRepository;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private RateLimitConfig rateLimitConfig;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private ObjectMapper objectMapper;

    private Cookie bobCookie;
    private User bob;
    private UUID outcomeId;
    private String cycleId;

    @BeforeEach
    void setUp() throws Exception {
        rateLimitConfig.clearBuckets();

        jdbcTemplate.execute("DELETE FROM audit_log");
        jdbcTemplate.execute("DELETE FROM weekly_commits");
        jdbcTemplate.execute("DELETE FROM weekly_cycles");
        jdbcTemplate.execute("UPDATE users SET manager_id = NULL");
        jdbcTemplate.execute("DELETE FROM users");
        jdbcTemplate.execute("DELETE FROM outcomes");
        jdbcTemplate.execute("DELETE FROM defining_objectives");
        jdbcTemplate.execute("DELETE FROM rally_cries");

        outcomeId = createOutcome();
        bob = createUser("bob@st6.com", "Bob Martinez", Role.MEMBER);
        bobCookie = login("bob@st6.com");
        rateLimitConfig.clearBuckets();

        // Create a draft cycle for bob
        MvcResult result = mockMvc.perform(get("/api/v1/cycles/current")
                        .cookie(bobCookie))
                .andExpect(status().isOk())
                .andReturn();
        cycleId = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("id").asText();
    }

    @Test
    void create_commit_returns_201_with_location() throws Exception {
        String body = String.format("""
                {
                    "title": "Build login page",
                    "description": "Implement the login UI",
                    "outcomeId": "%s",
                    "chessCategory": "QUEEN",
                    "plannedHours": 8
                }
                """, outcomeId);

        mockMvc.perform(post("/api/v1/cycles/" + cycleId + "/commits")
                        .cookie(bobCookie)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Build login page"))
                .andExpect(jsonPath("$.chessCategory").value("QUEEN"))
                .andExpect(jsonPath("$.plannedHours").value(8))
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(header().exists("Location"));
    }

    @Test
    void validation_error_returns_422_with_field_details() throws Exception {
        String body = """
                {
                    "title": "",
                    "outcomeId": null,
                    "chessCategory": null,
                    "plannedHours": 100
                }
                """;

        mockMvc.perform(post("/api/v1/cycles/" + cycleId + "/commits")
                        .cookie(bobCookie)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.title").value("Validation Failed"))
                .andExpect(jsonPath("$.violations", hasSize(greaterThanOrEqualTo(3))));
    }

    @Test
    void xss_payload_in_title_is_sanitized() throws Exception {
        String body = String.format("""
                {
                    "title": "<script>alert('xss')</script>Build page",
                    "description": "Safe desc <img onerror=alert(1)>",
                    "outcomeId": "%s",
                    "chessCategory": "QUEEN",
                    "plannedHours": 4
                }
                """, outcomeId);

        mockMvc.perform(post("/api/v1/cycles/" + cycleId + "/commits")
                        .cookie(bobCookie)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value(not(containsString("<script>"))))
                .andExpect(jsonPath("$.description").value(not(containsString("<img"))));
    }

    @Test
    void delete_is_soft_and_returns_204() throws Exception {
        // Create a commit first
        String body = String.format("""
                {
                    "title": "To delete",
                    "outcomeId": "%s",
                    "chessCategory": "PAWN",
                    "plannedHours": 1
                }
                """, outcomeId);

        MvcResult createResult = mockMvc.perform(post("/api/v1/cycles/" + cycleId + "/commits")
                        .cookie(bobCookie)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();

        String commitId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("id").asText();

        // Delete it
        mockMvc.perform(delete("/api/v1/commits/" + commitId)
                        .cookie(bobCookie)
                        .with(csrf()))
                .andExpect(status().isNoContent());

        // Verify the cycle's commits list doesn't include deleted ones
        mockMvc.perform(get("/api/v1/cycles/" + cycleId)
                        .cookie(bobCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.commits", hasSize(0)));
    }

    @Test
    void second_king_returns_error() throws Exception {
        // Create first KING
        String kingBody = String.format("""
                {
                    "title": "King task",
                    "outcomeId": "%s",
                    "chessCategory": "KING",
                    "plannedHours": 8
                }
                """, outcomeId);

        mockMvc.perform(post("/api/v1/cycles/" + cycleId + "/commits")
                        .cookie(bobCookie)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(kingBody))
                .andExpect(status().isCreated());

        // Try second KING
        mockMvc.perform(post("/api/v1/cycles/" + cycleId + "/commits")
                        .cookie(bobCookie)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(kingBody))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.detail").value(containsString("KING")));
    }

    @Test
    void update_commit_in_draft_succeeds() throws Exception {
        // Create
        String body = String.format("""
                {
                    "title": "Original",
                    "outcomeId": "%s",
                    "chessCategory": "PAWN",
                    "plannedHours": 2
                }
                """, outcomeId);

        MvcResult createResult = mockMvc.perform(post("/api/v1/cycles/" + cycleId + "/commits")
                        .cookie(bobCookie)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();

        String commitId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("id").asText();

        // Update
        String updateBody = String.format("""
                {
                    "title": "Updated title",
                    "description": "New desc",
                    "outcomeId": "%s",
                    "chessCategory": "QUEEN",
                    "plannedHours": 6
                }
                """, outcomeId);

        mockMvc.perform(put("/api/v1/commits/" + commitId)
                        .cookie(bobCookie)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated title"))
                .andExpect(jsonPath("$.chessCategory").value("QUEEN"))
                .andExpect(jsonPath("$.plannedHours").value(6));
    }

    @Test
    void reconcile_commit_in_reconciling_state_succeeds() throws Exception {
        // Create 3 commits (1 KING + 2 others), lock, start reconciliation
        createThreeCommitsAndTransitionTo(CycleState.RECONCILING);

        // Get commits from the cycle
        MvcResult cycleResult = mockMvc.perform(get("/api/v1/cycles/" + cycleId)
                        .cookie(bobCookie))
                .andExpect(status().isOk())
                .andReturn();

        String firstCommitId = objectMapper.readTree(cycleResult.getResponse().getContentAsString())
                .get("commits").get(0).get("id").asText();

        // Reconcile the commit
        String reconcileBody = """
                {
                    "actualHours": 6,
                    "completionStatus": "COMPLETED",
                    "reconciliationNotes": "Finished on time"
                }
                """;

        mockMvc.perform(put("/api/v1/commits/" + firstCommitId + "/reconcile")
                        .cookie(bobCookie)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reconcileBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actualHours").value(6))
                .andExpect(jsonPath("$.completionStatus").value("COMPLETED"))
                .andExpect(jsonPath("$.reconciliationNotes").value("Finished on time"));
    }

    @Test
    void audit_log_created_for_commit_operations() throws Exception {
        // Create a commit
        String body = String.format("""
                {
                    "title": "Audited task",
                    "outcomeId": "%s",
                    "chessCategory": "ROOK",
                    "plannedHours": 4
                }
                """, outcomeId);

        MvcResult createResult = mockMvc.perform(post("/api/v1/cycles/" + cycleId + "/commits")
                        .cookie(bobCookie)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();

        String commitId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("id").asText();

        // Check audit log
        List<AuditLog> logs = auditLogRepository
                .findByEntityTypeAndEntityIdOrderByCreatedAtDesc("WEEKLY_COMMIT", UUID.fromString(commitId));

        assertThat(logs).hasSize(1);
        assertThat(logs.get(0).getAction()).isEqualTo("CREATED");
        assertThat(logs.get(0).getActorId()).isEqualTo(bob.getId());
        assertThat(logs.get(0).getDetails()).containsKey("title");
    }

    @Test
    void unauthenticated_create_returns_401() throws Exception {
        String body = String.format("""
                {
                    "title": "Task",
                    "outcomeId": "%s",
                    "chessCategory": "PAWN",
                    "plannedHours": 1
                }
                """, outcomeId);

        mockMvc.perform(post("/api/v1/cycles/" + cycleId + "/commits")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void reorder_commit_succeeds() throws Exception {
        String body = String.format("""
                {
                    "title": "Reorder me",
                    "outcomeId": "%s",
                    "chessCategory": "PAWN",
                    "plannedHours": 1
                }
                """, outcomeId);

        MvcResult createResult = mockMvc.perform(post("/api/v1/cycles/" + cycleId + "/commits")
                        .cookie(bobCookie)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();

        String commitId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("id").asText();

        mockMvc.perform(put("/api/v1/commits/" + commitId + "/reorder")
                        .cookie(bobCookie)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"priorityRank": 5}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.priorityRank").value(5));
    }

    // --- Helpers ---

    private void createThreeCommitsAndTransitionTo(CycleState targetState) throws Exception {
        String[] categories = {"KING", "QUEEN", "ROOK"};
        for (String cat : categories) {
            String body = String.format("""
                    {
                        "title": "%s task",
                        "outcomeId": "%s",
                        "chessCategory": "%s",
                        "plannedHours": 4
                    }
                    """, cat, outcomeId, cat);

            mockMvc.perform(post("/api/v1/cycles/" + cycleId + "/commits")
                            .cookie(bobCookie)
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isCreated());
        }

        // Lock
        mockMvc.perform(post("/api/v1/cycles/" + cycleId + "/lock")
                        .cookie(bobCookie)
                        .with(csrf()))
                .andExpect(status().isOk());

        if (targetState == CycleState.RECONCILING || targetState == CycleState.RECONCILED) {
            mockMvc.perform(post("/api/v1/cycles/" + cycleId + "/start-reconciliation")
                            .cookie(bobCookie)
                            .with(csrf()))
                    .andExpect(status().isOk());
        }
    }

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
