package com.example.blog.media;

import com.example.blog.config.UploadProperties;
import com.example.blog.config.ConflictException;
import com.example.blog.operation.OperationLogService;
import com.example.blog.post.Post;
import com.example.blog.post.PostRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class MediaService {

  private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "audio/aac",
      "audio/flac",
      "audio/mpeg",
      "audio/mp4",
      "audio/ogg",
      "audio/wav",
      "audio/webm",
      "audio/x-m4a",
      "audio/x-wav",
      "video/mp4",
      "application/pdf",
      "text/plain");

  private final MediaAssetRepository media;
  private final UploadProperties uploadProperties;
  private final PostRepository posts;
  private final OperationLogService operationLogs;

  public MediaService(MediaAssetRepository media, UploadProperties uploadProperties,
      PostRepository posts, OperationLogService operationLogs) {
    this.media = media;
    this.uploadProperties = uploadProperties;
    this.posts = posts;
    this.operationLogs = operationLogs;
  }

  @Transactional(readOnly = true)
  public Page<MediaAsset> list(int page, int size) {
    return media.findAll(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
  }

  @Transactional
  public MediaAsset upload(MultipartFile file) throws IOException {
    if (file.isEmpty()) {
      throw new IllegalArgumentException("File is required");
    }
    String mimeType = file.getContentType() == null ? "application/octet-stream" : file.getContentType();
    if (!ALLOWED_MIME_TYPES.contains(mimeType)) {
      throw new IllegalArgumentException("Unsupported media type");
    }
    Path root = Path.of(uploadProperties.getDir()).toAbsolutePath().normalize();
    Files.createDirectories(root);
    String originalName = file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename();
    String storedName = UUID.randomUUID() + extension(originalName);
    Path destination = root.resolve(storedName);
    try (InputStream input = file.getInputStream()) {
      Files.copy(input, destination, StandardCopyOption.REPLACE_EXISTING);
    }
    Dimensions dimensions = dimensions(destination, mimeType);
    MediaAsset saved = media.save(new MediaAsset(
        originalName,
        storedName,
        "/uploads/" + storedName,
        mimeType,
        file.getSize(),
        dimensions.width(),
        dimensions.height()));
    operationLogs.record("media.upload", "media", saved.getId(), saved.getOriginalName());
    return saved;
  }

  @Transactional
  public void delete(Long id) throws IOException {
    MediaAsset asset = media.findById(id).orElseThrow();
    MediaReferences references = references(id);
    if (references.count() > 0) {
      throw new ConflictException("Media is still referenced by posts");
    }
    media.delete(asset);
    Files.deleteIfExists(Path.of(uploadProperties.getDir()).toAbsolutePath().normalize().resolve(asset.getStoredName()));
    operationLogs.record("media.delete", "media", id, asset.getOriginalName());
  }

  @Transactional(readOnly = true)
  public MediaReferences references(Long id) {
    MediaAsset asset = media.findById(id).orElseThrow();
    Map<Long, MediaPostReference> references = new LinkedHashMap<>();
    posts.findByCoverMediaIdOrderByTitleAsc(id).forEach(post ->
        references.put(post.getId(), MediaPostReference.from(post, "cover")));
    posts.findByContentHtmlContainingOrderByTitleAsc(asset.getUrl()).forEach(post ->
        references.putIfAbsent(post.getId(), MediaPostReference.from(post, "content")));
    List<MediaPostReference> postReferences = references.values().stream().toList();
    return new MediaReferences(postReferences.size(), postReferences);
  }

  private String extension(String filename) {
    int index = filename.lastIndexOf('.');
    if (index < 0 || index == filename.length() - 1) {
      return "";
    }
    return filename.substring(index).toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9.]", "");
  }

  private Dimensions dimensions(Path file, String mimeType) throws IOException {
    if (!mimeType.startsWith("image/") || "image/svg+xml".equals(mimeType)) {
      return new Dimensions(null, null);
    }
    BufferedImage image = ImageIO.read(file.toFile());
    return image == null ? new Dimensions(null, null) : new Dimensions(image.getWidth(), image.getHeight());
  }

  private record Dimensions(Integer width, Integer height) {
  }

  public record MediaReferences(int count, List<MediaPostReference> posts) {
  }

  public record MediaPostReference(Long id, String title, String slug, String referenceType) {
    static MediaPostReference from(Post post, String referenceType) {
      return new MediaPostReference(post.getId(), post.getTitle(), post.getSlug(), referenceType);
    }
  }
}
