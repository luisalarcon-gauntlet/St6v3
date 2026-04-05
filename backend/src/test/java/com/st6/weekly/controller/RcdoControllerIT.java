package com.st6.weekly.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.st6.weekly.config.RateLimitConfig;
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

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RcdoControllerIT {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private RateLimitConfig rateLimitConfig;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private ObjectMapper objectMapper;

    private Cookie memberCookie;
    private Cookie managerCookie;
    private Cookie adminCookie;

    @BeforeEach
    void setUp() throws Exception {
        rateLimitConfig.clearBuckets();

        // Clean in FK order
        jdbcTemplate.execute("DELETE FROM weekly_commits");
        jdbcTemplate.execute("DELETE FROM weekly_cycles");
        jdbcTemplate.execute("DELETE FROM audit_log");
        jdbcTemplate.execute("UPDATE users SET manager_id = NULL");
        jdbcTemplate.execute("DELETE FROM users");
        jdbcTemplate.execute("DELETE FROM outcomes");
        jdbcTemplate.execute("DELETE FROM defining_objectives");
        jdbcTemplate.execute("DELETE FROM rally_cries");

        createUser("bob@st6.com", "Bob Martinez", Role.MEMBER);
        createUser("alice@st6.com", "Alice Chen", Role.MANAGER);
        createUser("dave@st6.com", "Dave Kim", Role.ADMIN);

        memberCookie = login("bob@st6.com");
        managerCookie = login("alice@st6.com");
        adminCookie = login("dave@st6.com");

        rateLimitConfig.clearBuckets();
    }

    // --- GET /api/v1/rcdo/tree ---

    @Test
    void tree_endpoint_returns_full_hierarchy() throws Exception {
        // Insert test RCDO hierarchy
        UUID rcId = UUID.randomUUID();
        UUID doId = UUID.randomUUID();
        UUID outcomeId = UUID.randomUUID();

        jdbcTemplate.update(
                "INSERT INTO rally_cries (id, title, description, status, display_order) VALUES (?, ?, ?, ?, ?)",
                rcId, "Accelerate Adoption", "Main rally cry", "ACTIVE", 1);
        jdbcTemplate.update(
                "INSERT INTO defining_objectives (id, rally_cry_id, title, description, status) VALUES (?, ?, ?, ?, ?)",
                doId, rcId, "Reduce onboarding time", "By 50%", "ACTIVE");
        jdbcTemplate.update(
                "INSERT INTO outcomes (id, defining_objective_id, title, description, status) VALUES (?, ?, ?, ?, ?)",
                outcomeId, doId, "Self-serve flow live", "Full onboarding", "ACTIVE");

        mockMvc.perform(get("/api/v1/rcdo/tree")
                        .cookie(memberCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("Accelerate Adoption"))
                .andExpect(jsonPath("$[0].definingObjectives", hasSize(1)))
                .andExpect(jsonPath("$[0].definingObjectives[0].title").value("Reduce onboarding time"))
                .andExpect(jsonPath("$[0].definingObjectives[0].outcomes", hasSize(1)))
                .andExpect(jsonPath("$[0].definingObjectives[0].outcomes[0].title").value("Self-serve flow live"));
    }

    @Test
    void tree_endpoint_excludes_archived_rally_cries() throws Exception {
        UUID activeId = UUID.randomUUID();
        UUID archivedId = UUID.randomUUID();

        jdbcTemplate.update(
                "INSERT INTO rally_cries (id, title, description, status, display_order) VALUES (?, ?, ?, ?, ?)",
                activeId, "Active RC", "Active", "ACTIVE", 1);
        jdbcTemplate.update(
                "INSERT INTO rally_cries (id, title, description, status, display_order) VALUES (?, ?, ?, ?, ?)",
                archivedId, "Archived RC", "Archived", "ARCHIVED", 2);

        mockMvc.perform(get("/api/v1/rcdo/tree")
                        .cookie(memberCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("Active RC"));
    }

    @Test
    void tree_endpoint_requires_authentication() throws Exception {
        mockMvc.perform(get("/api/v1/rcdo/tree"))
                .andExpect(status().isUnauthorized());
    }

    // --- POST /api/v1/rally-cries ---

    @Test
    void create_rally_cry_requires_admin_role() throws Exception {
        mockMvc.perform(post("/api/v1/rally-cries")
                        .cookie(memberCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "New RC", "description": "A new rally cry"}
                                """)
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    void admin_can_create_rally_cry() throws Exception {
        mockMvc.perform(post("/api/v1/rally-cries")
                        .cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "New Rally Cry", "description": "Strategic theme"}
                                """)
                        .with(csrf()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.title").value("New Rally Cry"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void create_rally_cry_validates_blank_title() throws Exception {
        mockMvc.perform(post("/api/v1/rally-cries")
                        .cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "", "description": "Desc"}
                                """)
                        .with(csrf()))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.title").value("Validation Failed"));
    }

    // --- POST /api/v1/defining-objectives ---

    @Test
    void create_defining_objective_requires_admin_role() throws Exception {
        mockMvc.perform(post("/api/v1/defining-objectives")
                        .cookie(memberCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"rallyCryId": "00000000-0000-0000-0000-000000000001", "title": "New DO", "description": "Desc"}
                                """)
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    void admin_can_create_defining_objective() throws Exception {
        // Create rally cry first
        UUID rcId = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO rally_cries (id, title, description, status, display_order) VALUES (?, ?, ?, ?, ?)",
                rcId, "Test RC", "Test", "ACTIVE", 1);

        mockMvc.perform(post("/api/v1/defining-objectives")
                        .cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"rallyCryId": "%s", "title": "New DO", "description": "Measurable sub-goal"}
                                """, rcId))
                        .with(csrf()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.title").value("New DO"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    // --- POST /api/v1/outcomes ---

    @Test
    void create_outcome_requires_admin_role() throws Exception {
        mockMvc.perform(post("/api/v1/outcomes")
                        .cookie(memberCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"definingObjectiveId": "00000000-0000-0000-0000-000000000001", "title": "New Outcome", "description": "Desc"}
                                """)
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    void admin_can_create_outcome() throws Exception {
        // Create RC + DO first
        UUID rcId = UUID.randomUUID();
        UUID doId = UUID.randomUUID();

        jdbcTemplate.update(
                "INSERT INTO rally_cries (id, title, description, status, display_order) VALUES (?, ?, ?, ?, ?)",
                rcId, "Test RC", "Test", "ACTIVE", 1);
        jdbcTemplate.update(
                "INSERT INTO defining_objectives (id, rally_cry_id, title, description, status) VALUES (?, ?, ?, ?, ?)",
                doId, rcId, "Test DO", "Test", "ACTIVE");

        mockMvc.perform(post("/api/v1/outcomes")
                        .cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"definingObjectiveId": "%s", "title": "New Outcome", "description": "Specific deliverable"}
                                """, doId))
                        .with(csrf()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.title").value("New Outcome"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    // --- PUT /api/v1/rally-cries/{id} ---

    @Test
    void update_rally_cry_requires_admin_role_member_forbidden() throws Exception {
        UUID rcId = insertRallyCry("Original RC");

        mockMvc.perform(put("/api/v1/rally-cries/" + rcId)
                        .cookie(memberCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "Updated RC", "description": "Updated"}
                                """)
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    void update_rally_cry_requires_admin_role_manager_forbidden() throws Exception {
        UUID rcId = insertRallyCry("Original RC");

        mockMvc.perform(put("/api/v1/rally-cries/" + rcId)
                        .cookie(managerCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "Updated RC", "description": "Updated"}
                                """)
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    void admin_can_update_rally_cry() throws Exception {
        UUID rcId = insertRallyCry("Original RC");

        mockMvc.perform(put("/api/v1/rally-cries/" + rcId)
                        .cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "Updated Rally Cry", "description": "New description"}
                                """)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Rally Cry"))
                .andExpect(jsonPath("$.description").value("New description"));
    }

    // --- DELETE /api/v1/rally-cries/{id} ---

    @Test
    void archive_rally_cry_requires_admin_role_member_forbidden() throws Exception {
        UUID rcId = insertRallyCry("RC to archive");

        mockMvc.perform(delete("/api/v1/rally-cries/" + rcId)
                        .cookie(memberCookie)
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    void archive_rally_cry_requires_admin_role_manager_forbidden() throws Exception {
        UUID rcId = insertRallyCry("RC to archive");

        mockMvc.perform(delete("/api/v1/rally-cries/" + rcId)
                        .cookie(managerCookie)
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    void admin_can_archive_rally_cry() throws Exception {
        UUID rcId = insertRallyCry("RC to archive");

        mockMvc.perform(delete("/api/v1/rally-cries/" + rcId)
                        .cookie(adminCookie)
                        .with(csrf()))
                .andExpect(status().isNoContent());

        // Verify it no longer appears in active tree
        mockMvc.perform(get("/api/v1/rcdo/tree")
                        .cookie(adminCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // --- PUT /api/v1/defining-objectives/{id} ---

    @Test
    void admin_can_update_defining_objective() throws Exception {
        UUID rcId = insertRallyCry("Test RC");
        UUID doId = insertDefiningObjective(rcId, "Original DO");

        mockMvc.perform(put("/api/v1/defining-objectives/" + doId)
                        .cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "Updated DO", "description": "New description"}
                                """)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated DO"));
    }

    @Test
    void update_defining_objective_manager_forbidden() throws Exception {
        UUID rcId = insertRallyCry("Test RC");
        UUID doId = insertDefiningObjective(rcId, "Original DO");

        mockMvc.perform(put("/api/v1/defining-objectives/" + doId)
                        .cookie(managerCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "Updated DO", "description": "New description"}
                                """)
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }

    // --- DELETE /api/v1/defining-objectives/{id} ---

    @Test
    void admin_can_archive_defining_objective() throws Exception {
        UUID rcId = insertRallyCry("Test RC");
        UUID doId = insertDefiningObjective(rcId, "DO to archive");

        mockMvc.perform(delete("/api/v1/defining-objectives/" + doId)
                        .cookie(adminCookie)
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    // --- PUT /api/v1/outcomes/{id} ---

    @Test
    void admin_can_update_outcome() throws Exception {
        UUID rcId = insertRallyCry("Test RC");
        UUID doId = insertDefiningObjective(rcId, "Test DO");
        UUID outcomeId = insertOutcome(doId, "Original Outcome");

        mockMvc.perform(put("/api/v1/outcomes/" + outcomeId)
                        .cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "Updated Outcome", "description": "New description"}
                                """)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Outcome"));
    }

    @Test
    void update_outcome_member_forbidden() throws Exception {
        UUID rcId = insertRallyCry("Test RC");
        UUID doId = insertDefiningObjective(rcId, "Test DO");
        UUID outcomeId = insertOutcome(doId, "Original Outcome");

        mockMvc.perform(put("/api/v1/outcomes/" + outcomeId)
                        .cookie(memberCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "Updated Outcome", "description": "New description"}
                                """)
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }

    // --- DELETE /api/v1/outcomes/{id} ---

    @Test
    void admin_can_archive_outcome() throws Exception {
        UUID rcId = insertRallyCry("Test RC");
        UUID doId = insertDefiningObjective(rcId, "Test DO");
        UUID outcomeId = insertOutcome(doId, "Outcome to archive");

        mockMvc.perform(delete("/api/v1/outcomes/" + outcomeId)
                        .cookie(adminCookie)
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    // --- GET /api/v1/rcdo/tree?includeArchived=true ---

    @Test
    void tree_with_include_archived_returns_archived_items() throws Exception {
        insertRallyCry("Active RC");
        UUID archivedId = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO rally_cries (id, title, description, status, display_order) VALUES (?, ?, ?, ?, ?)",
                archivedId, "Archived RC", "Archived", "ARCHIVED", 2);

        mockMvc.perform(get("/api/v1/rcdo/tree")
                        .param("includeArchived", "true")
                        .cookie(memberCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    // --- Helpers ---

    private UUID insertRallyCry(String title) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO rally_cries (id, title, description, status, display_order) VALUES (?, ?, ?, ?, ?)",
                id, title, title, "ACTIVE", 1);
        return id;
    }

    private UUID insertDefiningObjective(UUID rallyCryId, String title) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO defining_objectives (id, rally_cry_id, title, description, status) VALUES (?, ?, ?, ?, ?)",
                id, rallyCryId, title, title, "ACTIVE");
        return id;
    }

    private UUID insertOutcome(UUID definingObjectiveId, String title) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO outcomes (id, defining_objective_id, title, description, status) VALUES (?, ?, ?, ?, ?)",
                id, definingObjectiveId, title, title, "ACTIVE");
        return id;
    }


    private void createUser(String email, String name, Role role) {
        User user = new User();
        user.setEmail(email);
        user.setDisplayName(name);
        user.setPasswordHash(passwordEncoder.encode("Password1!"));
        user.setRole(role);
        userRepository.save(user);
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
