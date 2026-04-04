package com.st6.weekly.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class InputSanitizerTest {

    private final InputSanitizer sanitizer = new InputSanitizer();

    @Test
    void strips_script_tags() {
        String input = "Hello <script>alert('xss')</script> World";
        assertThat(sanitizer.sanitize(input)).isEqualTo("Hello  World");
    }

    @Test
    void strips_onclick_attributes() {
        String input = "<div onclick=\"steal()\">Click me</div>";
        assertThat(sanitizer.sanitize(input)).isEqualTo("Click me");
    }

    @Test
    void strips_img_onerror_payload() {
        String input = "<img src=x onerror=alert(1)>";
        assertThat(sanitizer.sanitize(input)).isEqualTo("");
    }

    @Test
    void strips_iframe_tags() {
        String input = "Before <iframe src=\"evil.com\"></iframe> After";
        assertThat(sanitizer.sanitize(input)).isEqualTo("Before  After");
    }

    @Test
    void strips_nested_html() {
        String input = "<b><i><script>alert('nested')</script>text</i></b>";
        assertThat(sanitizer.sanitize(input)).isEqualTo("text");
    }

    @Test
    void preserves_plain_text() {
        String input = "Just a normal commit title";
        assertThat(sanitizer.sanitize(input)).isEqualTo("Just a normal commit title");
    }

    @Test
    void preserves_basic_punctuation() {
        String input = "Fix bug #42: handle edge-case (100% done)";
        assertThat(sanitizer.sanitize(input)).isEqualTo("Fix bug #42: handle edge-case (100% done)");
    }

    @Test
    void preserves_ampersands_and_special_chars() {
        String input = "R&D work — Q1 deliverable";
        assertThat(sanitizer.sanitize(input)).isEqualTo("R&D work — Q1 deliverable");
    }

    @Test
    void handles_null_input_gracefully() {
        assertThat(sanitizer.sanitize(null)).isNull();
    }

    @Test
    void handles_empty_input() {
        assertThat(sanitizer.sanitize("")).isEqualTo("");
    }

    @Test
    void handles_whitespace_only() {
        assertThat(sanitizer.sanitize("   ")).isEqualTo("   ");
    }
}
