<template>
  <section>
    <div class="page-head">
      <h1>控制台</h1>
    </div>
    <div class="metric-grid">
      <article class="metric">
        <b>{{ metrics.totalPosts }}</b>
        <span>文章</span>
      </article>
      <article class="metric">
        <b>{{ metrics.published }}</b>
        <span>已发布</span>
      </article>
      <article class="metric">
        <b>{{ metrics.drafts }}</b>
        <span>草稿</span>
      </article>
      <article class="metric">
        <b>{{ metrics.scheduled }}</b>
        <span>已排期</span>
      </article>
      <article class="metric">
        <b>{{ metrics.missingSummary }}</b>
        <span>缺摘要</span>
      </article>
      <article class="metric">
        <b>{{ metrics.missingCover }}</b>
        <span>缺封面</span>
      </article>
      <article class="metric">
        <b>{{ metrics.missingTopic }}</b>
        <span>未入专题</span>
      </article>
      <article class="metric">
        <b>{{ metrics.seriesWithIssues }}</b>
        <span>系列问题</span>
      </article>
    </div>

    <section class="panel dashboard-statistics">
      <div class="section-head">
        <h2>反馈统计</h2>
        <span>轻量运行观察</span>
      </div>
      <div class="feedback-grid">
        <article class="feedback-metric">
          <b>{{ statisticsMetrics.totalViews }}</b>
          <span>总浏览</span>
        </article>
        <article class="feedback-metric">
          <b>{{ statisticsMetrics.totalLikes }}</b>
          <span>总点赞</span>
        </article>
        <article class="feedback-metric">
          <b>{{ statisticsMetrics.totalComments }}</b>
          <span>总评论</span>
        </article>
        <article class="feedback-metric">
          <b>{{ statisticsMetrics.pendingComments }}</b>
          <span>待审核</span>
        </article>
      </div>
      <ol v-if="statistics?.popularPosts.length" class="popular-post-list">
        <li v-for="post in statistics.popularPosts" :key="post.id">
          <strong>{{ post.title }}</strong>
          <span>{{ post.viewCount }} 浏览</span>
          <span>{{ post.likeCount }} 点赞</span>
          <span>{{ post.commentCount }} 评论</span>
        </li>
      </ol>
      <p v-else class="empty-copy">暂无反馈数据</p>
    </section>

    <section class="panel dashboard-governance">
      <div class="section-head">
        <h2>内容治理</h2>
        <span>{{ metrics.emptyTopics }} 个空专题</span>
      </div>
      <ol v-if="governance?.postIssues.length" class="issue-list">
        <li v-for="post in governance.postIssues" :key="post.id">
          <strong>{{ post.title }}</strong>
          <span class="issue-slug">{{ post.slug }}</span>
          <div class="issue-tags">
            <span v-for="issue in post.issues" :key="issue">{{ issueLabel(issue) }}</span>
          </div>
        </li>
      </ol>
      <p v-else class="empty-copy">暂无待完善文章</p>
    </section>

    <div class="dashboard-columns">
      <section class="panel governance-panel">
        <h2>专题覆盖</h2>
        <ol>
          <li v-for="topic in governance?.topicCoverage ?? []" :key="topic.id">
            <strong>{{ topic.name }}</strong>
            <span>{{ topic.postCount }} 篇文章</span>
            <em v-if="topic.empty">空专题</em>
            <time v-else>{{ formatDate(topic.latestPostUpdatedAt) }}</time>
          </li>
        </ol>
      </section>

      <section class="panel governance-panel">
        <h2>系列维护</h2>
        <ol>
          <li v-for="item in governance?.seriesCoverage ?? []" :key="item.id">
            <strong>{{ item.name }}</strong>
            <span>{{ item.postCount }} 篇文章</span>
            <em v-for="note in seriesNotes(item)" :key="note">{{ note }}</em>
          </li>
        </ol>
      </section>
    </div>

    <section v-if="operationLogs.length" class="panel dashboard-logs">
      <h2>最近操作</h2>
      <ol>
        <li v-for="log in operationLogs" :key="log.id">
          <strong>{{ log.action }}</strong>
          <span>{{ log.message }}</span>
          <time>{{ formatDate(log.createdAt) }}</time>
        </li>
      </ol>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  formatDate,
  type AdminStatistics,
  type ContentGovernance,
  type OperationLog,
  type PostIssueKey,
  type SeriesCoverage
} from "@blog/shared";
import { adminApi } from "../lib/api";

const governance = ref<ContentGovernance | null>(null);
const statistics = ref<AdminStatistics | null>(null);
const operationLogs = ref<OperationLog[]>([]);
const zeroMetrics = {
  totalPosts: 0,
  published: 0,
  drafts: 0,
  scheduled: 0,
  missingSummary: 0,
  missingCover: 0,
  missingTopic: 0,
  emptyTopics: 0,
  seriesWithIssues: 0
};
const zeroStatisticsMetrics = {
  totalViews: 0,
  totalLikes: 0,
  totalComments: 0,
  pendingComments: 0,
  approvedComments: 0,
  rejectedComments: 0
};
const metrics = computed(() => governance.value?.metrics ?? zeroMetrics);
const statisticsMetrics = computed(() => statistics.value?.metrics ?? zeroStatisticsMetrics);

onMounted(async () => {
  const [snapshot, feedback, logs] = await Promise.all([
    adminApi.contentGovernance(),
    adminApi.statistics().catch(() => null),
    adminApi.operationLogs().catch(() => [])
  ]);
  governance.value = snapshot;
  statistics.value = feedback;
  operationLogs.value = logs;
});

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
.dashboard-statistics,
.dashboard-governance,
.dashboard-logs {
  margin-top: 18px;
}

.section-head {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-head span {
  background: var(--yellow);
  border: 2px solid var(--ink);
  font-weight: 900;
  padding: 4px 8px;
}

.dashboard-columns {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 18px;
}

.dashboard-statistics h2,
.dashboard-governance h2,
.governance-panel h2,
.dashboard-logs h2 {
  font-family: "Archivo Black", "Arial Black", sans-serif;
  margin: 0 0 12px;
}

.feedback-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 14px;
}

.feedback-metric {
  background: var(--paper-soft);
  border: 2px solid var(--ink);
  display: grid;
  gap: 2px;
  padding: 12px;
}

.feedback-metric b {
  font-family: "Archivo Black", "Arial Black", sans-serif;
  font-size: 28px;
  line-height: 1;
}

.feedback-metric span {
  font-weight: 900;
}

.popular-post-list {
  display: grid;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.popular-post-list li {
  align-items: center;
  border: 2px solid var(--ink);
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(160px, 1fr) repeat(3, 84px);
  padding: 8px;
}

.popular-post-list span {
  background: var(--yellow);
  border: 2px solid var(--ink);
  font-family: "IBM Plex Mono", "Consolas", monospace;
  font-size: 12px;
  font-weight: 900;
  padding: 3px 6px;
  text-align: center;
}

.issue-list,
.governance-panel ol,
.dashboard-logs ol {
  display: grid;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.issue-list li,
.governance-panel li,
.dashboard-logs li {
  align-items: center;
  border: 2px solid var(--ink);
  display: grid;
  gap: 8px;
  grid-template-columns: 140px minmax(0, 1fr) 140px;
  padding: 8px;
}

.issue-list li {
  grid-template-columns: minmax(160px, 1fr) minmax(120px, 180px) minmax(220px, 1fr);
}

.governance-panel li {
  grid-template-columns: minmax(150px, 1fr) 90px minmax(120px, 1fr);
}

.issue-slug,
.governance-panel time {
  color: var(--blue);
  font-family: "IBM Plex Mono", "Consolas", monospace;
  font-size: 12px;
  font-weight: 800;
}

.issue-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.issue-tags span,
.governance-panel em {
  background: var(--paper-soft);
  border: 2px solid var(--ink);
  color: var(--ink);
  font-style: normal;
  font-weight: 900;
  padding: 3px 6px;
}

.empty-copy {
  font-weight: 800;
  margin: 0;
}

.dashboard-logs time {
  color: var(--blue);
  font-family: "IBM Plex Mono", "Consolas", monospace;
  font-size: 12px;
  font-weight: 800;
}

@media (max-width: 900px) {
  .dashboard-columns,
  .feedback-grid {
    grid-template-columns: 1fr;
  }

  .issue-list li,
  .governance-panel li,
  .dashboard-logs li,
  .popular-post-list li {
    grid-template-columns: 1fr;
  }
}
</style>
