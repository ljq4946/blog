package com.example.blog.auth;

import com.example.blog.config.JwtProperties;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;

@Service
public class JwtService {

  private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
  private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
  private static final Base64.Decoder DECODER = Base64.getUrlDecoder();
  private final JwtProperties properties;

  public JwtService(JwtProperties properties) {
    this.properties = properties;
  }

  public String create(User user) {
    try {
      String header = encodeJson(Map.of("alg", "HS256", "typ", "JWT"));
      String payload = encodeJson(Map.of(
          "sub", user.getUsername(),
          "role", user.getRole().name(),
          "exp", Instant.now().plusSeconds(properties.getExpirationMinutes() * 60).getEpochSecond()));
      String signingInput = header + "." + payload;
      return signingInput + "." + sign(signingInput);
    } catch (Exception exception) {
      throw new IllegalStateException("Could not create token", exception);
    }
  }

  public Optional<JwtPrincipal> parse(String token) {
    try {
      String[] parts = token.split("\\.");
      if (parts.length != 3) {
        return Optional.empty();
      }
      String signingInput = parts[0] + "." + parts[1];
      if (!MessageDigest.isEqual(sign(signingInput).getBytes(StandardCharsets.UTF_8),
          parts[2].getBytes(StandardCharsets.UTF_8))) {
        return Optional.empty();
      }
      Map<String, Object> claims = OBJECT_MAPPER.readValue(DECODER.decode(parts[1]), new TypeReference<>() {
      });
      long expiresAt = ((Number) claims.get("exp")).longValue();
      if (expiresAt < Instant.now().getEpochSecond()) {
        return Optional.empty();
      }
      return Optional.of(new JwtPrincipal((String) claims.get("sub"), UserRole.valueOf((String) claims.get("role"))));
    } catch (Exception exception) {
      return Optional.empty();
    }
  }

  private String encodeJson(Map<String, ?> value) throws Exception {
    return ENCODER.encodeToString(OBJECT_MAPPER.writeValueAsBytes(value));
  }

  private String sign(String value) throws Exception {
    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(properties.getSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
    return ENCODER.encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
  }
}
