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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerIT {

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

    @BeforeEach
    void setUp() {
        rateLimitConfig.clearBuckets();
        jdbcTemplate.execute("DELETE FROM weekly_commits");
        jdbcTemplate.execute("DELETE FROM weekly_cycles");
        jdbcTemplate.execute("DELETE FROM audit_log");
        userRepository.deleteAll();

        User user = new User();
        user.setEmail("alice@st6.com");
        user.setDisplayName("Alice Chen");
        user.setPasswordHash(passwordEncoder.encode("Password1!"));
        user.setRole(Role.MANAGER);
        userRepository.save(user);
    }

    @Test
    void login_sets_httponly_cookie() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "alice@st6.com", "password": "Password1!"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("alice@st6.com"))
                .andExpect(jsonPath("$.displayName").value("Alice Chen"))
                .andExpect(jsonPath("$.role").value("MANAGER"))
                .andReturn();

        Cookie cookie = result.getResponse().getCookie("st6_token");
        assertThat(cookie).isNotNull();
        assertThat(cookie.isHttpOnly()).isTrue();
        assertThat(cookie.getSecure()).isTrue();
        assertThat(cookie.getPath()).isEqualTo("/");
        assertThat(cookie.getValue()).isNotBlank();
    }

    @Test
    void login_with_wrong_password_returns_401() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "alice@st6.com", "password": "wrongpass"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_with_nonexistent_user_returns_401() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "nobody@st6.com", "password": "Password1!"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void me_endpoint_reads_cookie_and_returns_user() throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "alice@st6.com", "password": "Password1!"}
                                """))
                .andExpect(status().isOk())
                .andReturn();

        Cookie token = loginResult.getResponse().getCookie("st6_token");

        mockMvc.perform(get("/api/v1/auth/me")
                        .cookie(token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("alice@st6.com"))
                .andExpect(jsonPath("$.displayName").value("Alice Chen"))
                .andExpect(jsonPath("$.role").value("MANAGER"));
    }

    @Test
    void me_endpoint_without_cookie_returns_401() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logout_clears_cookie() throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "alice@st6.com", "password": "Password1!"}
                                """))
                .andExpect(status().isOk())
                .andReturn();

        Cookie token = loginResult.getResponse().getCookie("st6_token");

        MvcResult logoutResult = mockMvc.perform(post("/api/v1/auth/logout")
                        .cookie(token)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andReturn();

        Cookie clearedCookie = logoutResult.getResponse().getCookie("st6_token");
        assertThat(clearedCookie).isNotNull();
        assertThat(clearedCookie.getMaxAge()).isZero();
    }

    @Test
    void logout_without_csrf_is_forbidden() throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "alice@st6.com", "password": "Password1!"}
                                """))
                .andExpect(status().isOk())
                .andReturn();

        Cookie token = loginResult.getResponse().getCookie("st6_token");

        mockMvc.perform(post("/api/v1/auth/logout")
                        .cookie(token))
                .andExpect(status().isForbidden());
    }

    @Test
    void login_response_does_not_expose_password_hash() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "alice@st6.com", "password": "Password1!"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist());
    }
}
