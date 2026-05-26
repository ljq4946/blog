package com.example.blog.media;

import com.example.blog.TestApplicationProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestApplicationProperties.class)
class MediaControllerTest {

  @TempDir
  static Path uploadDir;

  @DynamicPropertySource
  static void uploadProperties(DynamicPropertyRegistry registry) {
    registry.add("app.upload.dir", () -> uploadDir.resolve("media").toString());
  }

  @Autowired
  MockMvc mvc;

  @Test
  void authenticatedAdminCanUploadListAndDeleteMedia() throws Exception {
    String token = login();
    MockMultipartFile file = new MockMultipartFile(
        "file", "note.txt", "text/plain", "hello".getBytes());

    Long id = Long.valueOf(mvc.perform(multipart("/api/v1/admin/media")
            .file(file)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.originalName").value("note.txt"))
        .andExpect(jsonPath("$.url").value(containsString("/uploads/")))
        .andReturn()
        .getResponse()
        .getContentAsString()
        .replaceAll("^.*\"id\"\\s*:\\s*(\\d+).*$", "$1"));

    mvc.perform(get("/api/v1/admin/media")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(content().string(containsString("note.txt")));

    mvc.perform(delete("/api/v1/admin/media/" + id)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isNoContent());

    mvc.perform(get("/api/v1/admin/media")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(content().string(not(containsString("note.txt"))));
  }

  @Test
  void uploadedMediaIsServedFromPublicUploadsPath() throws Exception {
    String token = login();
    MockMultipartFile file = new MockMultipartFile(
        "file", "cover.txt", "text/plain", "hello cover".getBytes(StandardCharsets.UTF_8));

    String response = mvc.perform(multipart("/api/v1/admin/media")
            .file(file)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.url").value(containsString("/uploads/")))
        .andReturn()
        .getResponse()
        .getContentAsString();

    String url = response.replaceAll("^.*\"url\"\\s*:\\s*\"([^\"]+)\".*$", "$1");

    mvc.perform(get(url))
        .andExpect(status().isOk())
        .andExpect(content().string("hello cover"));
  }

  @Test
  void authenticatedAdminCanUploadAudioMedia() throws Exception {
    String token = login();
    MockMultipartFile file = new MockMultipartFile(
        "file", "focus.mp3", "audio/mpeg", "fake audio".getBytes(StandardCharsets.UTF_8));

    mvc.perform(multipart("/api/v1/admin/media")
            .file(file)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.originalName").value("focus.mp3"))
        .andExpect(jsonPath("$.mimeType").value("audio/mpeg"))
        .andExpect(jsonPath("$.url").value(containsString("/uploads/")));
  }

  @Test
  void invalidMimeTypesAreRejected() throws Exception {
    String token = login();
    MockMultipartFile file = new MockMultipartFile(
        "file", "shell.sh", "application/x-sh", "rm -rf /".getBytes());

    mvc.perform(multipart("/api/v1/admin/media")
            .file(file)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isBadRequest());
  }

  private String login() throws Exception {
    return mvc.perform(post("/api/v1/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"username\":\"4946\",\"password\":\"541312\"}"))
        .andReturn()
        .getResponse()
        .getContentAsString()
        .replaceAll("^.*\"token\"\\s*:\\s*\"([^\"]+)\".*$", "$1");
  }
}
