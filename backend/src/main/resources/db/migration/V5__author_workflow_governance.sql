ALTER TABLE posts
  ADD COLUMN seo_title VARCHAR(220);

ALTER TABLE posts
  ADD COLUMN seo_description TEXT;

ALTER TABLE posts
  ADD COLUMN view_count BIGINT NOT NULL DEFAULT 0;

ALTER TABLE post_comments
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'APPROVED';

CREATE TABLE post_revisions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT NOT NULL,
  title VARCHAR(220) NOT NULL,
  slug VARCHAR(240) NOT NULL,
  summary TEXT,
  content_html LONGTEXT,
  cover_media_id BIGINT,
  status VARCHAR(20) NOT NULL,
  category_id BIGINT,
  topic_ids TEXT,
  tag_ids TEXT,
  series_id BIGINT,
  series_order INT,
  seo_title VARCHAR(220),
  seo_description TEXT,
  published_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_post_revisions_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX idx_post_revisions_post_created ON post_revisions(post_id, created_at);

CREATE TABLE operation_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  action VARCHAR(80) NOT NULL,
  target_type VARCHAR(80) NOT NULL,
  target_id BIGINT,
  message TEXT,
  created_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_operation_logs_created ON operation_logs(created_at);
CREATE INDEX idx_operation_logs_target ON operation_logs(target_type, target_id);
