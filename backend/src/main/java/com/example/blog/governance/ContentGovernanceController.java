package com.example.blog.governance;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import static com.example.blog.governance.ContentGovernanceDtos.ContentGovernanceResponse;

@RestController
public class ContentGovernanceController {

  private final ContentGovernanceService governance;

  public ContentGovernanceController(ContentGovernanceService governance) {
    this.governance = governance;
  }

  @GetMapping("/api/v1/admin/content-governance")
  public ContentGovernanceResponse snapshot() {
    return governance.snapshot();
  }
}
