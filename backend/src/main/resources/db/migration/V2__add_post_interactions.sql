ALTER TABLE posts
  ADD COLUMN like_count BIGINT NOT NULL DEFAULT 0;

CREATE TABLE post_comments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT NOT NULL,
  nickname VARCHAR(80) NOT NULL,
  email VARCHAR(160),
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_post_comments_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX idx_post_comments_post_created ON post_comments(post_id, created_at);
CREATE INDEX idx_post_comments_created ON post_comments(created_at);
