package com.example.blog.media;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;

import static com.example.blog.media.MediaService.MediaReferences;

@RestController
@RequestMapping("/api/v1/admin/media")
public class MediaController {

  private final MediaService mediaService;

  public MediaController(MediaService mediaService) {
    this.mediaService = mediaService;
  }

  @GetMapping
  public Page<MediaResponse> list(@RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return mediaService.list(page, size).map(MediaResponse::from);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public MediaResponse upload(@RequestParam("file") MultipartFile file) throws IOException {
    return MediaResponse.from(mediaService.upload(file));
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable Long id) throws IOException {
    mediaService.delete(id);
  }

  @GetMapping("/{id}/references")
  public MediaReferences references(@PathVariable Long id) {
    return mediaService.references(id);
  }

  public record MediaResponse(
      Long id,
      String originalName,
      String storedName,
      String url,
      String mimeType,
      long size,
      Integer width,
      Integer height,
      Instant createdAt) {
    static MediaResponse from(MediaAsset asset) {
      return new MediaResponse(
          asset.getId(),
          asset.getOriginalName(),
          asset.getStoredName(),
          asset.getUrl(),
          asset.getMimeType(),
          asset.getSize(),
          asset.getWidth(),
          asset.getHeight(),
          asset.getCreatedAt());
    }
  }
}
