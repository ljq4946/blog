package com.example.blog.category;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
public class CategoryController {

  private final CategoryRepository categories;

  public CategoryController(CategoryRepository categories) {
    this.categories = categories;
  }

  @GetMapping({"/api/v1/categories", "/api/v1/admin/categories"})
  public List<CategoryResponse> list() {
    return categories.findAllByOrderBySortOrderAscNameAsc().stream().map(CategoryResponse::from).toList();
  }

  @PostMapping("/api/v1/admin/categories")
  @ResponseStatus(HttpStatus.CREATED)
  public CategoryResponse create(@Valid @RequestBody CategoryRequest request) {
    return CategoryResponse.from(categories.save(new Category(
        request.name(), request.slug(), request.description(), request.sortOrder())));
  }

  @PutMapping("/api/v1/admin/categories/{id}")
  public CategoryResponse update(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
    Category category = categories.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    category.update(request.name(), request.slug(), request.description(), request.sortOrder());
    return CategoryResponse.from(categories.save(category));
  }

  @DeleteMapping("/api/v1/admin/categories/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable Long id) {
    categories.deleteById(id);
  }

  public record CategoryRequest(@NotBlank String name, @NotBlank String slug, String description, int sortOrder) {
  }

  public record CategoryResponse(Long id, String name, String slug, String description, int sortOrder) {
    public static CategoryResponse from(Category category) {
      return new CategoryResponse(
          category.getId(),
          category.getName(),
          category.getSlug(),
          category.getDescription(),
          category.getSortOrder());
    }
  }
}
