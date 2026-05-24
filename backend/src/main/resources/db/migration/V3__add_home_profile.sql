CREATE TABLE home_profiles (
  profile_key VARCHAR(80) PRIMARY KEY,
  music_title VARCHAR(220) NOT NULL,
  music_subtitle VARCHAR(220) NOT NULL,
  music_meta VARCHAR(220) NOT NULL,
  music_audio_url VARCHAR(500) NOT NULL,
  about_kicker VARCHAR(220) NOT NULL,
  about_title VARCHAR(220) NOT NULL,
  about_body TEXT NOT NULL,
  focus1_label VARCHAR(80) NOT NULL,
  focus1_text VARCHAR(220) NOT NULL,
  focus2_label VARCHAR(80) NOT NULL,
  focus2_text VARCHAR(220) NOT NULL,
  focus3_label VARCHAR(80) NOT NULL,
  focus3_text VARCHAR(220) NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
