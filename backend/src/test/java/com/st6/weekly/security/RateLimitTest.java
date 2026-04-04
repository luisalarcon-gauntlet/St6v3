package com.st6.weekly.security;

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
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import jakarta.servlet.http.Cookie;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "app.rate-limit.requests-per-minute=5")
class RateLimitTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RateLimitConfig rateLimitConfig;

    private Cookie authCookie;

    @BeforeEach
    void setUp() throws Exception {
        rateLimitConfig.clearBuckets();

        userRepository.deleteAll();

        User user = new User();
        user.setEmail("ratelimit@st6.com");
        user.setDisplayName("Rate Limiter");
        user.setPasswordHash(passwordEncoder.encode("Password1!"));
        user.setRole(Role.MEMBER);
        userRepository.save(user);

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "ratelimit@st6.com", "password": "Password1!"}
                                """))
                .andExpect(status().isOk())
                .andReturn();

        authCookie = loginResult.getResponse().getCookie("st6_token");

        // Clear buckets again after login so tests start with a fresh limit
        rateLimitConfig.clearBuckets();
    }

    @Test
    void allows_requests_under_limit() throws Exception {
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(get("/api/v1/auth/me")
                            .cookie(authCookie))
                    .andExpect(status().isOk());
        }
    }

    @Test
    void returns_429_when_limit_exceeded() throws Exception {
        // Exhaust the limit (5 requests)
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(get("/api/v1/auth/me")
                            .cookie(authCookie));
        }

        // Next request should be rate limited
        mockMvc.perform(get("/api/v1/auth/me")
                        .cookie(authCookie))
                .andExpect(status().isTooManyRequests());
    }
}
