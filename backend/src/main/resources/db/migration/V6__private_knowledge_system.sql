ALTER TABLE posts
  ADD COLUMN visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC';

ALTER TABLE posts
  ADD COLUMN content_type VARCHAR(20) NOT NULL DEFAULT 'ARTICLE';

ALTER TABLE post_revisions
  ADD COLUMN visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC';

ALTER TABLE post_revisions
  ADD COLUMN content_type VARCHAR(20) NOT NULL DEFAULT 'ARTICLE';

CREATE TABLE knowledge_relations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  source_post_id BIGINT NOT NULL,
  target_post_id BIGINT NOT NULL,
  type VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_knowledge_relations_source FOREIGN KEY (source_post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_knowledge_relations_target FOREIGN KEY (target_post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX idx_knowledge_relations_source ON knowledge_relations(source_post_id);
CREATE INDEX idx_knowledge_relations_target ON knowledge_relations(target_post_id);
