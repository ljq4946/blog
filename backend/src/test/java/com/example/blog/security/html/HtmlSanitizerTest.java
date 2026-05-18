package com.example.blog.security.html;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class HtmlSanitizerTest {

  HtmlSanitizer sanitizer = new HtmlSanitizer();

  @Test
  void removesScriptsHandlersAndUnsafeUrls() {
    String sanitized = sanitizer.sanitize("""
        <h2 onclick="alert(1)">Title</h2>
        <script>alert(1)</script>
        <a href="javascript:alert(1)">Bad</a>
        <img src="data:text/html,bad" onerror="alert(1)">
        """);

    assertThat(sanitized).contains("<h2>Title</h2>");
    assertThat(sanitized).doesNotContain("script", "onclick", "onerror", "javascript:", "data:text/html");
  }

  @Test
  void preservesCommonTipTapMarkup() {
    String sanitized = sanitizer.sanitize("""
        <h1>Heading</h1><p><strong>Bold</strong> and <em>italic</em></p>
        <blockquote>Quote</blockquote><ul><li>One</li></ul>
        <pre><code>const x = 1;</code></pre>
        <a href="https://example.com">Link</a>
        <img src="/uploads/image.png" alt="Image">
        """);

    assertThat(sanitized)
        .contains("<h1>Heading</h1>")
        .contains("<strong>Bold</strong>")
        .contains("<em>italic</em>")
        .contains("<blockquote")
        .contains("Quote")
        .contains("<pre><code>const x = 1;</code></pre>")
        .contains("href=\"https://example.com\"")
        .contains("src=\"/uploads/image.png\"");
  }
}
