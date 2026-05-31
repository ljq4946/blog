package com.example.blog.knowledge;

import com.example.blog.post.PostContentType;
import com.example.blog.post.PostDtos;
import com.example.blog.post.PostVisibility;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

import static com.example.blog.knowledge.KnowledgeDtos.*;

@RestController
public class KnowledgeController {

  private final KnowledgeService knowledge;

  public KnowledgeController(KnowledgeService knowledge) {
    this.knowledge = knowledge;
  }

  @GetMapping("/api/v1/admin/knowledge-search")
  public PostDtos.PageResponse<PostDtos.PostResponse> search(
      @RequestParam Optional<String> keyword,
      @RequestParam Optional<PostVisibility> visibility,
      @RequestParam Optional<PostContentType> contentType,
      @RequestParam Optional<Integer> page,
      @RequestParam Optional<Integer> size) {
    return knowledge.search(keyword, visibility, contentType, page, size);
  }

  @GetMapping("/api/v1/admin/knowledge-relations")
  public List<KnowledgeRelationResponse> relations(@RequestParam Optional<Long> postId) {
    return knowledge.relations(postId);
  }

  @PostMapping("/api/v1/admin/knowledge-relations")
  @ResponseStatus(HttpStatus.CREATED)
  public KnowledgeRelationResponse createRelation(@RequestBody KnowledgeRelationRequest request) {
    return knowledge.createRelation(request);
  }

  @DeleteMapping("/api/v1/admin/knowledge-relations/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteRelation(@PathVariable Long id) {
    knowledge.deleteRelation(id);
  }

  @PostMapping("/api/v1/admin/posts/{id}/convert-to-article")
  @ResponseStatus(HttpStatus.CREATED)
  public PostDtos.PostResponse convertToArticle(@PathVariable Long id) {
    return knowledge.convertToArticle(id);
  }

  @GetMapping("/api/v1/admin/export")
  public ResponseEntity<KnowledgeExport> export() {
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=blog-export.json")
        .body(knowledge.export());
  }
}
