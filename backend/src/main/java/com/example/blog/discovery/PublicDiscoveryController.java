package com.example.blog.discovery;

import com.example.blog.config.SiteProperties;
import com.example.blog.config.UploadProperties;
import com.example.blog.post.Post;
import com.example.blog.post.PostRepository;
import com.example.blog.series.SeriesRepository;
import com.example.blog.topic.TopicRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;

import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
public class PublicDiscoveryController {

  private static final DateTimeFormatter RFC_1123 = DateTimeFormatter.RFC_1123_DATE_TIME.withZone(ZoneOffset.UTC);

  private final PostRepository posts;
  private final TopicRepository topics;
  private final SeriesRepository series;
  private final SiteProperties site;
  private final DataSource dataSource;
  private final UploadProperties uploadProperties;

  public PublicDiscoveryController(
      PostRepository posts,
      TopicRepository topics,
      SeriesRepository series,
      SiteProperties site,
      DataSource dataSource,
      UploadProperties uploadProperties) {
    this.posts = posts;
    this.topics = topics;
    this.series = series;
    this.site = site;
    this.dataSource = dataSource;
    this.uploadProperties = uploadProperties;
  }

  @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
  public String sitemap() {
    String baseUrl = site.normalizedBaseUrl();
    StringBuilder xml = new StringBuilder("""
        <?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        """);
    List.of("/", "/archive", "/about", "/topics", "/series")
        .forEach(path -> appendSitemapUrl(xml, baseUrl + path));
    topics.findAllByOrderBySortOrderAscNameAsc()
        .forEach(topic -> appendSitemapUrl(xml, baseUrl + "/topics/" + topic.getSlug()));
    series.findAllByOrderBySortOrderAscNameAsc()
        .forEach(item -> appendSitemapUrl(xml, baseUrl + "/series/" + item.getSlug()));
    posts.findVisibleOrderByPublishedAtDescCreatedAtDesc(java.time.Instant.now())
        .forEach(post -> appendSitemapUrl(xml, baseUrl + "/posts/" + post.getSlug()));
    xml.append("</urlset>\n");
    return xml.toString();
  }

  @GetMapping(value = "/feed.xml", produces = "application/rss+xml")
  public String feed() {
    String baseUrl = site.normalizedBaseUrl();
    StringBuilder xml = new StringBuilder("""
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
        <channel>
        """);
    appendElement(xml, "title", site.getName());
    appendElement(xml, "link", baseUrl + "/");
    appendElement(xml, "description", site.getDescription());
    posts.findVisibleForFeed(java.time.Instant.now(), PageRequest.of(0, 20))
        .forEach(post -> appendFeedItem(xml, baseUrl, post));
    xml.append("</channel>\n</rss>\n");
    return xml.toString();
  }

  @GetMapping(value = "/robots.txt", produces = MediaType.TEXT_PLAIN_VALUE)
  public String robots() {
    return """
        User-agent: *
        Allow: /
        Sitemap: %s/sitemap.xml
        """.formatted(site.normalizedBaseUrl());
  }

  @GetMapping("/health")
  public Map<String, String> health() {
    String database = databaseStatus();
    String uploads = uploadsStatus();
    String status = "UP".equals(database) && "UP".equals(uploads) ? "UP" : "DOWN";
    return Map.of("status", status, "database", database, "uploads", uploads);
  }

  private String databaseStatus() {
    try (Connection ignored = dataSource.getConnection()) {
      return "UP";
    } catch (Exception ignored) {
      return "DOWN";
    }
  }

  private String uploadsStatus() {
    try {
      Path root = Path.of(uploadProperties.getDir()).toAbsolutePath().normalize();
      Files.createDirectories(root);
      return Files.isWritable(root) ? "UP" : "DOWN";
    } catch (Exception ignored) {
      return "DOWN";
    }
  }

  private void appendSitemapUrl(StringBuilder xml, String url) {
    xml.append("<url><loc>").append(escapeXml(url)).append("</loc></url>\n");
  }

  private void appendFeedItem(StringBuilder xml, String baseUrl, Post post) {
    xml.append("<item>\n");
    appendElement(xml, "title", post.getTitle());
    appendElement(xml, "link", baseUrl + "/posts/" + post.getSlug());
    appendElement(xml, "guid", baseUrl + "/posts/" + post.getSlug());
    appendElement(xml, "description", plainText(post.getContentHtml()));
    if (post.getPublishedAt() != null) {
      appendElement(xml, "pubDate", RFC_1123.format(post.getPublishedAt()));
    }
    xml.append("</item>\n");
  }

  private void appendElement(StringBuilder xml, String name, String value) {
    xml.append("<").append(name).append(">")
        .append(escapeXml(value == null ? "" : value))
        .append("</").append(name).append(">\n");
  }

  private String plainText(String html) {
    return html == null ? "" : html.replaceAll("<[^>]*>", "").trim();
  }

  private String escapeXml(String value) {
    return value
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
        .replace("'", "&apos;");
  }
}
