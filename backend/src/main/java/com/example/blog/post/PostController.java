package com.example.blog.post;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

import static com.example.blog.post.PostDtos.*;

@RestController
public class PostController {

  private final PostService postService;

  public PostController(PostService postService) {
    this.postService = postService;
  }

  @GetMapping("/api/v1/admin/posts")
  public List<PostResponse> adminList() {
    return postService.adminList();
  }

  @PostMapping("/api/v1/admin/posts")
  @ResponseStatus(HttpStatus.CREATED)
  public PostResponse create(@RequestBody PostRequest request) {
    return postService.create(request);
  }

  @PutMapping("/api/v1/admin/posts/{id}")
  public PostResponse update(@PathVariable Long id, @RequestBody PostRequest request) {
    return postService.update(id, request);
  }

  @DeleteMapping("/api/v1/admin/posts/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable Long id) {
    postService.delete(id);
  }

  @GetMapping("/api/v1/posts")
  public List<PostResponse> publicList(
      @RequestParam Optional<String> category,
      @RequestParam Optional<String> tag) {
    return postService.publicList(category, tag);
  }

  @GetMapping("/api/v1/posts/search")
  public PageResponse<PostResponse> publicSearch(
      @RequestParam Optional<String> keyword,
      @RequestParam Optional<Integer> year,
      @RequestParam Optional<String> category,
      @RequestParam Optional<String> tag,
      @RequestParam Optional<Integer> page,
      @RequestParam Optional<Integer> size,
      @RequestParam Optional<String> sort) {
    return postService.search(new PostSearchRequest(keyword, year, category, tag, page, size, sort));
  }

  @GetMapping("/api/v1/posts/{slug}")
  public PostResponse publicDetail(@PathVariable String slug) {
    return postService.publicDetail(slug);
  }

  @GetMapping("/api/v1/archive")
  public List<ArchiveMonth> archive() {
    return postService.archive();
  }
}
