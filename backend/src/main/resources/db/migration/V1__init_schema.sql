CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(40) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  CONSTRAINT uk_users_username UNIQUE (username)
);

CREATE TABLE categories (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  CONSTRAINT uk_categories_name UNIQUE (name),
  CONSTRAINT uk_categories_slug UNIQUE (slug)
);

CREATE TABLE tags (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  CONSTRAINT uk_tags_name UNIQUE (name),
  CONSTRAINT uk_tags_slug UNIQUE (slug)
);

CREATE TABLE media_assets (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  size BIGINT NOT NULL,
  width INT,
  height INT,
  created_at TIMESTAMP NOT NULL,
  CONSTRAINT uk_media_assets_stored_name UNIQUE (stored_name)
);

CREATE TABLE posts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(220) NOT NULL,
  slug VARCHAR(240) NOT NULL,
  summary TEXT,
  content_html LONGTEXT,
  cover_media_id BIGINT,
  status VARCHAR(20) NOT NULL,
  category_id BIGINT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  published_at TIMESTAMP,
  CONSTRAINT uk_posts_slug UNIQUE (slug),
  CONSTRAINT fk_posts_category FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE post_tags (
  post_id BIGINT NOT NULL,
  tag_id BIGINT NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  CONSTRAINT fk_post_tags_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_post_tags_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE site_pages (
  page_key VARCHAR(80) PRIMARY KEY,
  title VARCHAR(220) NOT NULL,
  content_html LONGTEXT,
  updated_at TIMESTAMP NOT NULL,
  CONSTRAINT uk_site_pages_key UNIQUE (page_key)
);

CREATE INDEX idx_posts_status_published_at ON posts(status, published_at);
CREATE INDEX idx_posts_category ON posts(category_id, status, published_at);
CREATE INDEX idx_post_tags_tag ON post_tags(tag_id, post_id);
CREATE INDEX idx_posts_archive ON posts(published_at);
