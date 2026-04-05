package com.st6.weekly.controller;

import com.st6.weekly.config.RateLimitConfig;
import com.st6.weekly.domain.user.Role;
import com.st6.weekly.domain.user.User;
import com.st6.weekly.domain.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import jakarta.servlet.http.Cookie;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityRoleIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RateLimitConfig rateLimitConfig;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private Cookie memberCookie;
    private Cookie managerCookie;
    private Cookie adminCookie;

    @BeforeEach
    void setUp() throws Exception {
        rateLimitConfig.clearBuckets();
        jdbcTemplate.execute("DELETE FROM weekly_commits");
        jdbcTemplate.execute("DELETE FROM weekly_cycles");
        jdbcTemplate.execute("DELETE FROM audit_log");
        userRepository.deleteAll();

        memberCookie = createUserAndLogin("bob@st6.com", "Bob", Role.MEMBER);
        managerCookie = createUserAndLogin("alice@st6.com", "Alice", Role.MANAGER);
        adminCookie = createUserAndLogin("dave@st6.com", "Dave", Role.ADMIN);

        rateLimitConfig.clearBuckets();
    }

    @Test
    void member_cannot_access_manager_endpoints() throws Exception {
        mockMvc.perform(get("/api/v1/manager/team")
                        .cookie(memberCookie))
                .andExpect(status().isForbidden());
    }

    @Test
    void manager_can_access_manager_endpoints() throws Exception {
        mockMvc.perform(get("/api/v1/manager/team")
                        .cookie(managerCookie))
                .andExpect(status().isOk());
    }

    @Test
    void admin_can_access_manager_endpoints() throws Exception {
        mockMvc.perform(get("/api/v1/manager/team")
                        .cookie(adminCookie))
                .andExpect(status().isOk());
    }

    @Test
    void unauthenticated_gets_401_on_protected_endpoints() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/manager/team"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/cycles/current"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_endpoint_is_public() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "bob@st6.com", "password": "Password1!"}
                                """))
                .andExpect(status().isOk());
    }

    @Test
    void authenticated_member_can_access_own_endpoints() throws Exception {
        // /me should work for any authenticated user
        mockMvc.perform(get("/api/v1/auth/me")
                        .cookie(memberCookie))
                .andExpect(status().isOk());
    }

    private Cookie createUserAndLogin(String email, String name, Role role) throws Exception {
        User user = new User();
        user.setEmail(email);
        user.setDisplayName(name);
        user.setPasswordHash(passwordEncoder.encode("Password1!"));
        user.setRole(role);
        userRepository.save(user);

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
