package com.example.blog.homeprofile;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
public class HomeProfileController {

  private static final String HOME = "home";
  private final HomeProfileRepository profiles;

  public HomeProfileController(HomeProfileRepository profiles) {
    this.profiles = profiles;
  }

  @GetMapping({"/api/v1/home-profile", "/api/v1/admin/home-profile"})
  public HomeProfileResponse getHomeProfile() {
    return profiles.findById(HOME).map(HomeProfileResponse::from).orElseGet(HomeProfileResponse::defaults);
  }

  @PutMapping("/api/v1/admin/home-profile")
  public HomeProfileResponse updateHomeProfile(@RequestBody HomeProfileRequest request) {
    HomeProfile profile = profiles.findById(HOME).orElseGet(() -> new HomeProfile(HOME));
    profile.update(request);
    return HomeProfileResponse.from(profiles.save(profile));
  }

  public record FocusItem(String label, String text) {
  }

  public record HomeProfileRequest(
      String musicTitle,
      String musicSubtitle,
      String musicMeta,
      String musicAudioUrl,
      String aboutKicker,
      String aboutTitle,
      String aboutBody,
      List<FocusItem> focusItems) {
  }

  public record HomeProfileResponse(
      String key,
      String musicTitle,
      String musicSubtitle,
      String musicMeta,
      String musicAudioUrl,
      String aboutKicker,
      String aboutTitle,
      String aboutBody,
      List<FocusItem> focusItems,
      Instant updatedAt) {

    static HomeProfileResponse defaults() {
      return new HomeProfileResponse(
          HOME,
          "私人电台",
          "深夜写作清单",
          "lo-fi / city rain / quiet loop",
          "",
          "About / 4946",
          "我是 4946",
          "这里像一本公开笔记：记录技术实战、写作训练和日常观察，也保留问题被解决前后的纹理。",
          List.of(
              new FocusItem("正在写", "设计模式与工程经验"),
              new FocusItem("正在读", "代码、散文与城市噪声"),
              new FocusItem("正在收集", "可复用的问题清单")),
          Instant.EPOCH);
    }

    static HomeProfileResponse from(HomeProfile profile) {
      return new HomeProfileResponse(
          profile.getKey(),
          profile.getMusicTitle(),
          profile.getMusicSubtitle(),
          profile.getMusicMeta(),
          profile.getMusicAudioUrl(),
          profile.getAboutKicker(),
          profile.getAboutTitle(),
          profile.getAboutBody(),
          List.of(
              new FocusItem(profile.getFocus1Label(), profile.getFocus1Text()),
              new FocusItem(profile.getFocus2Label(), profile.getFocus2Text()),
              new FocusItem(profile.getFocus3Label(), profile.getFocus3Text())),
          profile.getUpdatedAt());
    }
  }
}
