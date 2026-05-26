package com.example.blog.homeprofile;

import com.example.blog.TestApplicationProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestApplicationProperties.class)
class HomeProfileControllerTest {

  @Autowired
  MockMvc mvc;

  @Autowired
  HomeProfileRepository profiles;

  @BeforeEach
  void setUp() {
    profiles.deleteAll();
  }

  @Test
  void publicProfileReturnsDefaultsWhenNotConfigured() throws Exception {
    mvc.perform(get("/api/v1/home-profile"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.key").value("home"))
        .andExpect(jsonPath("$.musicTitle").value("私人电台"))
        .andExpect(jsonPath("$.musicAudioUrl").value(""))
        .andExpect(jsonPath("$.aboutTitle").value("我是 4946"))
        .andExpect(jsonPath("$.focusItems[0].label").value("正在写"))
        .andExpect(jsonPath("$.focusItems[0].text").value("设计模式与工程经验"));
  }

  @Test
  void adminCanUpdateProfileAndPublicEndpointReadsItBack() throws Exception {
    String token = login();

    mvc.perform(put("/api/v1/admin/home-profile")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "musicTitle": "午后电台",
                  "musicSubtitle": "调试时听",
                  "musicMeta": "ambient / focus",
                  "musicAudioUrl": "/uploads/focus.mp3",
                  "aboutKicker": "About / Now",
                  "aboutTitle": "我是编辑后的 4946",
                  "aboutBody": "新的首页介绍",
                  "focusItems": [
                    {"label": "正在写", "text": "首页配置"},
                    {"label": "正在听", "text": "环境音乐"},
                    {"label": "正在改", "text": "管理端"}
                  ]
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.musicTitle").value("午后电台"))
        .andExpect(jsonPath("$.musicAudioUrl").value("/uploads/focus.mp3"))
        .andExpect(jsonPath("$.focusItems[2].text").value("管理端"));

    mvc.perform(get("/api/v1/home-profile"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.musicTitle").value("午后电台"))
        .andExpect(jsonPath("$.musicSubtitle").value("调试时听"))
        .andExpect(jsonPath("$.aboutTitle").value("我是编辑后的 4946"))
        .andExpect(jsonPath("$.focusItems[1].text").value("环境音乐"));
  }

  @Test
  void adminUpdateRequiresAuthentication() throws Exception {
    mvc.perform(put("/api/v1/admin/home-profile")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{}"))
        .andExpect(status().isUnauthorized());
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
