package com.example.blog.sitepage;

import com.example.blog.security.html.HtmlSanitizer;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
public class SitePageController {

  private static final String ABOUT = "about";
  private final SitePageRepository pages;
  private final HtmlSanitizer sanitizer;

  public SitePageController(SitePageRepository pages, HtmlSanitizer sanitizer) {
    this.pages = pages;
    this.sanitizer = sanitizer;
  }

  @GetMapping({"/api/v1/site-pages/about", "/api/v1/admin/site-pages/about"})
  public SitePageResponse getAbout() {
    return pages.findById(ABOUT).map(SitePageResponse::from)
        .orElseGet(() -> new SitePageResponse(ABOUT, "关于", "", Instant.EPOCH));
  }

  @PutMapping("/api/v1/admin/site-pages/about")
  public SitePageResponse updateAbout(@RequestBody SitePageRequest request) {
    SitePage page = pages.findById(ABOUT).orElseGet(() -> new SitePage(ABOUT, "关于", ""));
    page.update(request.title(), sanitizer.sanitize(request.contentHtml()));
    return SitePageResponse.from(pages.save(page));
  }

  public record SitePageRequest(String title, String contentHtml) {
  }

  public record SitePageResponse(String key, String title, String contentHtml, Instant updatedAt) {
    static SitePageResponse from(SitePage page) {
      return new SitePageResponse(page.getKey(), page.getTitle(), page.getContentHtml(), page.getUpdatedAt());
    }
  }
}
