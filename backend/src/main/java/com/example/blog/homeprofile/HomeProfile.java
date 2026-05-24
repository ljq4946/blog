package com.example.blog.homeprofile;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "home_profiles")
public class HomeProfile {

  @Id
  @Column(name = "profile_key")
  private String key;

  @Column(name = "music_title", nullable = false)
  private String musicTitle;

  @Column(name = "music_subtitle", nullable = false)
  private String musicSubtitle;

  @Column(name = "music_meta", nullable = false)
  private String musicMeta;

  @Column(name = "music_audio_url", nullable = false)
  private String musicAudioUrl;

  @Column(name = "about_kicker", nullable = false)
  private String aboutKicker;

  @Column(name = "about_title", nullable = false)
  private String aboutTitle;

  @Column(name = "about_body", nullable = false, columnDefinition = "TEXT")
  private String aboutBody;

  @Column(name = "focus1_label", nullable = false)
  private String focus1Label;

  @Column(name = "focus1_text", nullable = false)
  private String focus1Text;

  @Column(name = "focus2_label", nullable = false)
  private String focus2Label;

  @Column(name = "focus2_text", nullable = false)
  private String focus2Text;

  @Column(name = "focus3_label", nullable = false)
  private String focus3Label;

  @Column(name = "focus3_text", nullable = false)
  private String focus3Text;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected HomeProfile() {
  }

  public HomeProfile(String key) {
    this.key = key;
  }

  @PrePersist
  @PreUpdate
  void touch() {
    updatedAt = Instant.now();
  }

  public void update(HomeProfileController.HomeProfileRequest request) {
    musicTitle = clean(request.musicTitle());
    musicSubtitle = clean(request.musicSubtitle());
    musicMeta = clean(request.musicMeta());
    musicAudioUrl = clean(request.musicAudioUrl());
    aboutKicker = clean(request.aboutKicker());
    aboutTitle = clean(request.aboutTitle());
    aboutBody = clean(request.aboutBody());

    HomeProfileController.FocusItem first = focusAt(request, 0, "正在写", "设计模式与工程经验");
    HomeProfileController.FocusItem second = focusAt(request, 1, "正在读", "代码、散文与城市噪声");
    HomeProfileController.FocusItem third = focusAt(request, 2, "正在收集", "可复用的问题清单");
    focus1Label = clean(first.label());
    focus1Text = clean(first.text());
    focus2Label = clean(second.label());
    focus2Text = clean(second.text());
    focus3Label = clean(third.label());
    focus3Text = clean(third.text());
  }

  private static String clean(String value) {
    return value == null ? "" : value.trim();
  }

  private static HomeProfileController.FocusItem focusAt(
      HomeProfileController.HomeProfileRequest request,
      int index,
      String label,
      String text) {
    if (request.focusItems() == null || request.focusItems().size() <= index || request.focusItems().get(index) == null) {
      return new HomeProfileController.FocusItem(label, text);
    }
    return request.focusItems().get(index);
  }

  public String getKey() {
    return key;
  }

  public String getMusicTitle() {
    return musicTitle;
  }

  public String getMusicSubtitle() {
    return musicSubtitle;
  }

  public String getMusicMeta() {
    return musicMeta;
  }

  public String getMusicAudioUrl() {
    return musicAudioUrl;
  }

  public String getAboutKicker() {
    return aboutKicker;
  }

  public String getAboutTitle() {
    return aboutTitle;
  }

  public String getAboutBody() {
    return aboutBody;
  }

  public String getFocus1Label() {
    return focus1Label;
  }

  public String getFocus1Text() {
    return focus1Text;
  }

  public String getFocus2Label() {
    return focus2Label;
  }

  public String getFocus2Text() {
    return focus2Text;
  }

  public String getFocus3Label() {
    return focus3Label;
  }

  public String getFocus3Text() {
    return focus3Text;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
