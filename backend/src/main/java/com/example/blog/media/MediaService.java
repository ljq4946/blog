package com.example.blog.media;

import com.example.blog.config.UploadProperties;
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
      "application/pdf",
      "text/plain");

  private final MediaAssetRepository media;
  private final UploadProperties uploadProperties;

  public MediaService(MediaAssetRepository media, UploadProperties uploadProperties) {
    this.media = media;
    this.uploadProperties = uploadProperties;
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
    return media.save(new MediaAsset(
        originalName,
        storedName,
        "/uploads/" + storedName,
        mimeType,
        file.getSize(),
        dimensions.width(),
        dimensions.height()));
  }

  @Transactional
  public void delete(Long id) throws IOException {
    MediaAsset asset = media.findById(id).orElseThrow();
    media.delete(asset);
    Files.deleteIfExists(Path.of(uploadProperties.getDir()).toAbsolutePath().normalize().resolve(asset.getStoredName()));
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
}
