<template>
  <section class="content-map">
    <div class="page-head">
      <h1>内容地图</h1>
    </div>

    <section class="panel action-board">
      <div class="section-head">
        <h2>下一步</h2>
        <span>{{ actions.length }} 项</span>
      </div>
      <ol v-if="actions.length" class="action-list">
        <li v-for="action in actions" :key="action.key">
          <strong>{{ action.title }}</strong>
          <span>{{ action.detail }}</span>
        </li>
      </ol>
      <p v-else class="empty-copy">暂无明显内容空洞</p>
    </section>

    <div class="map-grid">
      <section class="panel map-panel">
        <div class="section-head">
          <h2>专题覆盖</h2>
          <span>{{ governance?.metrics.emptyTopics ?? 0 }} 个空专题</span>
        </div>
        <ol>
          <li v-for="topic in governance?.topicCoverage ?? []" :key="topic.id">
            <strong>{{ topic.name }}</strong>
            <span>{{ topic.postCount }} 篇文章</span>
            <em v-if="topic.empty">空专题</em>
            <time v-else>{{ formatDate(topic.latestPostUpdatedAt) }}</time>
          </li>
        </ol>
      </section>

      <section class="panel map-panel">
        <div class="section-head">
          <h2>系列维护</h2>
          <span>{{ governance?.metrics.seriesWithIssues ?? 0 }} 个问题</span>
        </div>
        <ol>
          <li v-for="item in governance?.seriesCoverage ?? []" :key="item.id">
            <strong>{{ item.name }}</strong>
            <span>{{ item.postCount }} 篇文章</span>
            <em v-for="note in seriesNotes(item)" :key="note">{{ note }}</em>
          </li>
        </ol>
      </section>
    </div>

    <section class="panel issue-panel">
      <div class="section-head">
        <h2>待完善文章</h2>
        <span>{{ governance?.postIssues.length ?? 0 }} 篇</span>
      </div>
      <ol v-if="governance?.postIssues.length">
        <li v-for="post in governance.postIssues" :key="post.id">
          <strong>{{ post.title }}</strong>
          <span>{{ post.slug }}</span>
          <div>
            <em v-for="issue in post.issues" :key="issue">{{ issueLabel(issue) }}</em>
          </div>
        </li>
      </ol>
      <p v-else class="empty-copy">暂无待完善文章</p>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  formatDate,
  type ContentGovernance,
  type PostIssue,
  type PostIssueKey,
  type SeriesCoverage,
  type TopicCoverage
} from "@blog/shared";
import { adminApi } from "../lib/api";

const governance = ref<ContentGovernance | null>(null);

const actions = computed(() => {
  const snapshot = governance.value;
  if (!snapshot) {
    return [];
  }
  return [
    ...snapshot.topicCoverage.filter((topic) => topic.empty).map(topicAction),
    ...snapshot.seriesCoverage
      .filter((series) => series.empty || series.orderConflict || series.missingOrders.length)
      .flatMap(seriesActions),
    ...snapshot.postIssues.slice(0, 6).map(postAction)
  ];
});

onMounted(async () => {
  governance.value = await adminApi.contentGovernance();
});

function topicAction(topic: TopicCoverage) {
  return {
    key: `topic-${topic.id}`,
    title: `为 ${topic.name} 写首篇文章`,
    detail: topic.slug
  };
}

function seriesActions(series: SeriesCoverage) {
  const result: Array<{ key: string; title: string; detail: string }> = [];
  if (series.empty) {
    result.push({ key: `series-empty-${series.id}`, title: `启动 ${series.name}`, detail: "空系列" });
  }
  if (series.orderConflict) {
    result.push({ key: `series-conflict-${series.id}`, title: `整理 ${series.name} 顺序`, detail: "存在顺序冲突" });
  }
  result.push(...series.missingOrders.map((order) => ({
    key: `series-gap-${series.id}-${order}`,
    title: `补齐 ${series.name} 第 ${order} 章`,
    detail: series.slug
  })));
  return result;
}

function postAction(post: PostIssue) {
  return {
    key: `post-${post.id}`,
    title: `完善 ${post.title}`,
    detail: post.issues.map(issueLabel).join("、")
  };
}

function issueLabel(issue: PostIssueKey) {
  const labels: Record<PostIssueKey, string> = {
    MISSING_SUMMARY: "缺摘要",
    MISSING_COVER: "缺封面",
    MISSING_TOPIC: "未入专题"
  };
  return labels[issue];
}

function seriesNotes(item: SeriesCoverage) {
  const notes: string[] = [];
  if (item.empty) {
    notes.push("空系列");
  }
  if (item.orderConflict) {
    notes.push("顺序冲突");
  }
  if (item.missingOrders.length) {
    notes.push(`缺失章节 ${item.missingOrders.join("、")}`);
  }
  return notes.length ? notes : ["结构完整"];
}
</script>

<style scoped>
.content-map {
  display: grid;
  gap: 18px;
}

.map-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.section-head {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-head h2 {
  font-family: "Archivo Black", "Arial Black", sans-serif;
  margin: 0;
}

.section-head span {
  background: var(--yellow);
  border: 2px solid var(--ink);
  font-weight: 900;
  padding: 4px 8px;
}

.action-list,
.map-panel ol,
.issue-panel ol {
  display: grid;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.action-list li,
.map-panel li,
.issue-panel li {
  align-items: center;
  border: 2px solid var(--ink);
  display: grid;
  gap: 8px;
  padding: 8px;
}

.action-list li {
  grid-template-columns: minmax(180px, 1fr) minmax(120px, 220px);
}

.map-panel li {
  grid-template-columns: minmax(150px, 1fr) 90px minmax(120px, 1fr);
}

.issue-panel li {
  grid-template-columns: minmax(160px, 1fr) minmax(120px, 180px) minmax(180px, 1fr);
}

.map-panel time,
.issue-panel li > span,
.action-list span {
  color: var(--blue);
  font-family: "IBM Plex Mono", "Consolas", monospace;
  font-size: 12px;
  font-weight: 800;
}

.map-panel em,
.issue-panel em {
  background: var(--paper-soft);
  border: 2px solid var(--ink);
  display: inline-block;
  font-style: normal;
  font-weight: 900;
  margin-right: 6px;
  padding: 3px 6px;
}

.empty-copy {
  font-weight: 800;
  margin: 0;
}

@media (max-width: 900px) {
  .map-grid,
  .action-list li,
  .map-panel li,
  .issue-panel li {
    grid-template-columns: 1fr;
  }
}
</style>
