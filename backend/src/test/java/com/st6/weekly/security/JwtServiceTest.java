package com.st6.weekly.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String SECRET = "test-jwt-secret-key-that-is-at-least-32-characters-long";
    private static final long EXPIRATION_MS = 3600000; // 1 hour

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, EXPIRATION_MS);
    }

    @Test
    void generates_valid_token_with_claims() {
        String token = jwtService.generateToken("alice@st6.com", "MANAGER");

        assertThat(token).isNotBlank();
        assertThat(jwtService.extractUsername(token)).isEqualTo("alice@st6.com");
        assertThat(jwtService.extractRole(token)).isEqualTo("MANAGER");
    }

    @Test
    void extracts_username_from_token() {
        String token = jwtService.generateToken("bob@st6.com", "MEMBER");
        assertThat(jwtService.extractUsername(token)).isEqualTo("bob@st6.com");
    }

    @Test
    void extracts_role_from_token() {
        String token = jwtService.generateToken("admin@st6.com", "ADMIN");
        assertThat(jwtService.extractRole(token)).isEqualTo("ADMIN");
    }

    @Test
    void validates_non_expired_token() {
        String token = jwtService.generateToken("alice@st6.com", "MEMBER");
        assertThat(jwtService.isTokenValid(token)).isTrue();
    }

    @Test
    void rejects_expired_token() {
        // Create a service with 0ms expiration
        JwtService expiredService = new JwtService(SECRET, 0);
        String token = expiredService.generateToken("alice@st6.com", "MEMBER");

        assertThat(expiredService.isTokenValid(token)).isFalse();
    }

    @Test
    void rejects_tampered_token() {
        String token = jwtService.generateToken("alice@st6.com", "MEMBER");
        // Tamper with the token by changing a character in the signature
        String tampered = token.substring(0, token.length() - 2) + "xx";

        assertThat(jwtService.isTokenValid(tampered)).isFalse();
    }

    @Test
    void rejects_token_with_wrong_secret() {
        String token = jwtService.generateToken("alice@st6.com", "MEMBER");

        JwtService otherService = new JwtService(
                "different-secret-key-that-is-also-at-least-32-chars", EXPIRATION_MS);

        assertThat(otherService.isTokenValid(token)).isFalse();
    }

    @Test
    void rejects_null_token() {
        assertThat(jwtService.isTokenValid(null)).isFalse();
    }

    @Test
    void rejects_empty_token() {
        assertThat(jwtService.isTokenValid("")).isFalse();
    }

    @Test
    void rejects_malformed_token() {
        assertThat(jwtService.isTokenValid("not.a.jwt")).isFalse();
    }
}
