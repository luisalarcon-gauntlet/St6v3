package com.st6.weekly.controller;

import com.st6.weekly.config.RateLimitConfig;
import com.st6.weekly.domain.audit.AuditLog;
import com.st6.weekly.domain.audit.AuditLogRepository;
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
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ManagerControllerIT {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private WeeklyCycleRepository cycleRepository;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private RateLimitConfig rateLimitConfig;
    @Autowired private JdbcTemplate jdbcTemplate;

    private Cookie aliceCookie;
    private Cookie bobCookie;
    private Cookie otherManagerCookie;
    private User alice;
    private User bob;

    @BeforeEach
    void setUp() throws Exception {
        rateLimitConfig.clearBuckets();

        jdbcTemplate.execute("DELETE FROM weekly_commits");
        jdbcTemplate.execute("DELETE FROM weekly_cycles");
        jdbcTemplate.execute("DELETE FROM audit_log");
        jdbcTemplate.execute("UPDATE users SET manager_id = NULL");
        jdbcTemplate.execute("DELETE FROM users");

        alice = createUser("alice@st6.com", "Alice Chen", Role.MANAGER);
        bob = createUser("bob@st6.com", "Bob Martinez", Role.MEMBER);
        User otherManager = createUser("eve@st6.com", "Eve Park", Role.MANAGER);

        bob.setManagerId(alice.getId());
        userRepository.save(bob);

        aliceCookie = login("alice@st6.com");
        bobCookie = login("bob@st6.com");
        otherManagerCookie = login("eve@st6.com");

        rateLimitConfig.clearBuckets();
    }

    @Test
    void manager_can_see_audit_for_reports_cycle() throws Exception {
        WeeklyCycle cycle = createCycleForBob();
        createAuditEntry(cycle.getId(), "LOCKED", alice.getId(), Map.of("previous_state", "DRAFT", "new_state", "LOCKED"));
        createAuditEntry(cycle.getId(), "REGRESSED", alice.getId(), Map.of("previous_state", "LOCKED", "new_state", "DRAFT", "reason", "Re-plan needed"));

        mockMvc.perform(get("/api/v1/manager/cycles/" + cycle.getId() + "/audit")
                        .param("page", "0")
                        .param("size", "20")
                        .param("sort", "createdAt,desc")
                        .cookie(aliceCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].action").isNotEmpty())
                .andExpect(jsonPath("$.content[0].actorDisplayName").value("Alice Chen"))
                .andExpect(jsonPath("$.content[0].entityType").value("WEEKLY_CYCLE"))
                .andExpect(jsonPath("$.content[0].details").isNotEmpty())
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void member_gets_403_for_audit_endpoint() throws Exception {
        WeeklyCycle cycle = createCycleForBob();
        createAuditEntry(cycle.getId(), "LOCKED", alice.getId(), Map.of());

        mockMvc.perform(get("/api/v1/manager/cycles/" + cycle.getId() + "/audit")
                        .param("page", "0")
                        .param("size", "20")
                        .cookie(bobCookie))
                .andExpect(status().isForbidden());
    }

    @Test
    void wrong_team_manager_gets_403_for_audit() throws Exception {
        WeeklyCycle cycle = createCycleForBob();
        createAuditEntry(cycle.getId(), "LOCKED", alice.getId(), Map.of());

        // Eve is a manager but Bob does not report to her
        mockMvc.perform(get("/api/v1/manager/cycles/" + cycle.getId() + "/audit")
                        .param("page", "0")
                        .param("size", "20")
                        .cookie(otherManagerCookie))
                .andExpect(status().isNotFound());
    }

    // --- Helpers ---

    private WeeklyCycle createCycleForBob() {
        WeeklyCycle cycle = new WeeklyCycle();
        cycle.setUserId(bob.getId());
        cycle.setWeekStartDate(LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)));
        cycle.setState(CycleState.LOCKED);
        return cycleRepository.saveAndFlush(cycle);
    }

    private void createAuditEntry(UUID cycleId, String action, UUID actorId, Map<String, Object> details) {
        AuditLog log = new AuditLog();
        log.setEntityType("WEEKLY_CYCLE");
        log.setEntityId(cycleId);
        log.setAction(action);
        log.setActorId(actorId);
        log.setDetails(details);
        log.setCreatedAt(Instant.now());
        auditLogRepository.saveAndFlush(log);
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
}
