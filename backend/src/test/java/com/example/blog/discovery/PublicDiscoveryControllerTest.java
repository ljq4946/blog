package com.example.blog.discovery;

import com.example.blog.TestApplicationProperties;
import com.example.blog.post.Post;
import com.example.blog.post.PostRepository;
import com.example.blog.post.PostStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
    "app.site.base-url=https://blog.example.com",
    "app.site.name=4946 Blog",
    "app.site.description=Personal notebook",
    "app.cors.allowed-origins=https://reader.example.com"
})
@AutoConfigureMockMvc
@Import(TestApplicationProperties.class)
class PublicDiscoveryControllerTest {

  @Autowired
  MockMvc mvc;
  @Autowired
  PostRepository posts;

  @BeforeEach
  void setUp() {
    posts.deleteAll();

    Post first = new Post("First Public", "first-public", "First summary", "<p>Hello & welcome</p>", PostStatus.PUBLISHED);
    first.setPublishedAt(Instant.parse("2026-05-20T00:00:00Z"));
    posts.save(first);

    Post second = new Post("Second Public", "second-public", "Second summary", "<p>Latest</p>", PostStatus.PUBLISHED);
    second.setPublishedAt(Instant.parse("2026-05-21T00:00:00Z"));
    posts.save(second);

    posts.save(new Post("Draft", "draft-post", "Hidden", "<p>Hidden</p>", PostStatus.DRAFT));
  }

  @Test
  void sitemapContainsPublicPagesAndPublishedPostsOnly() throws Exception {
    mvc.perform(get("/sitemap.xml"))
        .andExpect(status().isOk())
        .andExpect(content().contentTypeCompatibleWith("application/xml"))
        .andExpect(content().string(containsString("<loc>https://blog.example.com/</loc>")))
        .andExpect(content().string(containsString("<loc>https://blog.example.com/archive</loc>")))
        .andExpect(content().string(containsString("<loc>https://blog.example.com/about</loc>")))
        .andExpect(content().string(containsString("<loc>https://blog.example.com/posts/first-public</loc>")))
        .andExpect(content().string(not(containsString("draft-post"))));
  }

  @Test
  void feedContainsLatestPublishedPostsOnly() throws Exception {
    mvc.perform(get("/feed.xml"))
        .andExpect(status().isOk())
        .andExpect(content().contentTypeCompatibleWith("application/rss+xml"))
        .andExpect(content().string(containsString("<title>4946 Blog</title>")))
        .andExpect(content().string(containsString("<link>https://blog.example.com/</link>")))
        .andExpect(content().string(containsString("<title>Second Public</title>")))
        .andExpect(content().string(containsString("Hello &amp; welcome")))
        .andExpect(content().string(not(containsString("Draft"))));
  }

  @Test
  void robotsReferencesSitemapAndHealthReportsUp() throws Exception {
    mvc.perform(get("/robots.txt"))
        .andExpect(status().isOk())
        .andExpect(content().contentTypeCompatibleWith("text/plain"))
        .andExpect(content().string(containsString("Sitemap: https://blog.example.com/sitemap.xml")));

    mvc.perform(get("/health"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("UP"));
  }

  @Test
  void corsUsesConfiguredAllowedOrigin() throws Exception {
    mvc.perform(options("/api/v1/posts")
            .header("Origin", "https://reader.example.com")
            .header("Access-Control-Request-Method", "GET"))
        .andExpect(status().isOk())
        .andExpect(header().string("Access-Control-Allow-Origin", "https://reader.example.com"));

    mvc.perform(options("/api/v1/posts")
            .header("Origin", "https://evil.example.com")
            .header("Access-Control-Request-Method", "GET"))
        .andExpect(status().isForbidden());
  }
}
