CREATE TABLE topics (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  CONSTRAINT uk_topics_name UNIQUE (name),
  CONSTRAINT uk_topics_slug UNIQUE (slug)
);

CREATE TABLE series (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  description TEXT,
  primary_topic_id BIGINT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  CONSTRAINT uk_series_name UNIQUE (name),
  CONSTRAINT uk_series_slug UNIQUE (slug),
  CONSTRAINT fk_series_primary_topic FOREIGN KEY (primary_topic_id) REFERENCES topics(id)
);

CREATE TABLE post_topics (
  post_id BIGINT NOT NULL,
  topic_id BIGINT NOT NULL,
  PRIMARY KEY (post_id, topic_id),
  CONSTRAINT fk_post_topics_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_post_topics_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

ALTER TABLE posts ADD COLUMN series_id BIGINT;

ALTER TABLE posts ADD COLUMN series_order INT;

ALTER TABLE posts
  ADD CONSTRAINT fk_posts_series FOREIGN KEY (series_id) REFERENCES series(id);

ALTER TABLE posts
  ADD CONSTRAINT ck_posts_series_order_pair CHECK (
    (series_id IS NULL AND series_order IS NULL)
    OR
    (series_id IS NOT NULL AND series_order IS NOT NULL AND series_order > 0)
  );

ALTER TABLE posts
  ADD CONSTRAINT uk_posts_series_order UNIQUE (series_id, series_order);

CREATE INDEX idx_topics_sort_name ON topics(sort_order, name);
CREATE INDEX idx_series_sort_name ON series(sort_order, name);
CREATE INDEX idx_series_primary_topic ON series(primary_topic_id, sort_order, name);
CREATE INDEX idx_post_topics_topic ON post_topics(topic_id, post_id);
CREATE INDEX idx_posts_series_order ON posts(series_id, series_order);
