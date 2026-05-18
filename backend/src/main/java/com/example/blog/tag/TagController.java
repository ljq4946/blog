package com.example.blog.tag;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
public class TagController {

  private final TagRepository tags;

  public TagController(TagRepository tags) {
    this.tags = tags;
  }

  @GetMapping({"/api/v1/tags", "/api/v1/admin/tags"})
  public List<TagResponse> list() {
    return tags.findAllByOrderByNameAsc().stream().map(TagResponse::from).toList();
  }

  @PostMapping("/api/v1/admin/tags")
  @ResponseStatus(HttpStatus.CREATED)
  public TagResponse create(@Valid @RequestBody TagRequest request) {
    return TagResponse.from(tags.save(new Tag(request.name(), request.slug())));
  }

  @PutMapping("/api/v1/admin/tags/{id}")
  public TagResponse update(@PathVariable Long id, @Valid @RequestBody TagRequest request) {
    Tag tag = tags.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    tag.update(request.name(), request.slug());
    return TagResponse.from(tags.save(tag));
  }

  @DeleteMapping("/api/v1/admin/tags/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable Long id) {
    tags.deleteById(id);
  }

  public record TagRequest(@NotBlank String name, @NotBlank String slug) {
  }

  public record TagResponse(Long id, String name, String slug) {
    public static TagResponse from(Tag tag) {
      return new TagResponse(tag.getId(), tag.getName(), tag.getSlug());
    }
  }
}
