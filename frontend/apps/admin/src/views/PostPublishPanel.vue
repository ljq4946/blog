<template>
  <aside class="publish-panel" aria-label="文章发布设置">
    <section class="publish-card save-card">
      <p class="card-kicker">保存状态</p>
      <strong>{{ saveStatusText }}</strong>
      <div v-if="recoveryAvailable" class="recovery-actions">
        <el-button data-test="restore-recovery" type="warning" @click="emit('restore-recovery')">恢复草稿</el-button>
        <el-button data-test="discard-recovery" @click="emit('discard-recovery')">丢弃恢复</el-button>
      </div>
    </section>

    <section class="publish-card publish-checks">
      <h2>发布检查</h2>
      <ul>
        <li v-for="check in checks" :key="check.key" :class="{ 'is-passed': check.passed }">
          <span>{{ check.label }}</span>
          <strong>{{ checkStateText(check) }}</strong>
        </li>
      </ul>
    </section>

    <section class="publish-card publish-settings">
      <h2>发布设置</h2>
      <div class="publish-form">
        <el-form-item label="状态">
          <el-select :model-value="form.status" @update:model-value="updateField('status', $event)">
            <el-option label="草稿" value="DRAFT" />
            <el-option label="已排期" value="SCHEDULED" />
            <el-option label="已发布" value="PUBLISHED" />
          </el-select>
        </el-form-item>

        <el-form-item label="可见性">
          <el-select :model-value="form.visibility ?? 'PUBLIC'" @update:model-value="updateField('visibility', $event)">
            <el-option label="公开" value="PUBLIC" />
            <el-option label="私有" value="PRIVATE" />
          </el-select>
        </el-form-item>

        <el-form-item label="内容类型">
          <el-select :model-value="form.contentType ?? 'ARTICLE'" @update:model-value="updateField('contentType', $event)">
            <el-option label="文章" value="ARTICLE" />
            <el-option label="笔记" value="NOTE" />
          </el-select>
        </el-form-item>

        <el-form-item label="发布时间 / 排期">
          <el-date-picker
            :model-value="form.publishedAt"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss[Z]"
            placeholder="选择发布时间"
            @update:model-value="updateField('publishedAt', $event ?? null)"
          />
        </el-form-item>

        <el-form-item label="URL 标识">
          <el-input aria-label="URL 标识" :model-value="form.slug" @update:model-value="updateField('slug', $event)" />
          <p class="canonical-preview">Canonical: /posts/{{ form.slug || "未设置" }}</p>
        </el-form-item>

        <el-form-item label="SEO 标题">
          <input
            data-test="seo-title"
            :value="form.seoTitle"
            maxlength="220"
            @input="updateField('seoTitle', ($event.target as HTMLInputElement).value)"
          />
        </el-form-item>

        <el-form-item label="SEO 描述">
          <textarea
            data-test="seo-description"
            :value="form.seoDescription"
            rows="2"
            @input="updateField('seoDescription', ($event.target as HTMLTextAreaElement).value)"
          ></textarea>
        </el-form-item>

        <el-form-item label="摘要">
          <el-input :model-value="form.summary" type="textarea" :rows="3" @update:model-value="updateField('summary', $event)" />
        </el-form-item>

        <el-form-item label="封面图">
          <el-select :model-value="form.coverMediaId" clearable placeholder="选择媒体库图片" @update:model-value="updateField('coverMediaId', $event)">
            <el-option v-for="asset in mediaAssets" :key="asset.id" :label="asset.originalName" :value="asset.id" />
          </el-select>
          <div class="cover-preview">
            <img v-if="selectedCover" :src="selectedCover.url" :alt="selectedCover.originalName" />
            <span v-else>未选择封面图</span>
          </div>
        </el-form-item>

        <el-form-item label="分类">
          <el-button data-test="quick-category" class="quick-create" size="small" @click="emit('quick-create', 'category')">新建分类</el-button>
          <el-select :model-value="form.categoryId" clearable placeholder="选择分类" @update:model-value="updateField('categoryId', $event)">
            <el-option v-for="category in categories" :key="category.id" :label="category.name" :value="category.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="专题">
          <el-button data-test="quick-topic" class="quick-create" size="small" @click="emit('quick-create', 'topic')">新建专题</el-button>
          <el-select :model-value="form.topicIds" multiple placeholder="选择专题" @update:model-value="updateField('topicIds', $event)">
            <el-option v-for="topic in topics" :key="topic.id" :label="topic.name" :value="topic.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="系列">
          <el-select :model-value="form.seriesId" clearable placeholder="选择系列" @update:model-value="updateField('seriesId', $event)">
            <el-option v-for="item in series" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="form.seriesId" label="系列序号">
          <el-input-number
            :model-value="form.seriesOrder ?? 1"
            :min="1"
            @update:model-value="updateField('seriesOrder', $event ?? null)"
          />
        </el-form-item>

        <el-form-item label="标签">
          <el-button data-test="quick-tag" class="quick-create" size="small" @click="emit('quick-create', 'tag')">新建标签</el-button>
          <el-select :model-value="form.tagIds" multiple placeholder="选择标签" @update:model-value="updateField('tagIds', $event)">
            <el-option v-for="tag in tags" :key="tag.id" :label="tag.name" :value="tag.id" />
          </el-select>
        </el-form-item>
      </div>
    </section>
  </aside>
</template>

<script setup lang="ts">
import type { Category, MediaAsset, Series, Tag, Topic } from "@blog/shared";
import type { PostForm, PublishCheck } from "../features/posts/postForm";

const props = defineProps<{
  form: PostForm;
  checks: PublishCheck[];
  categories: Category[];
  topics: Topic[];
  series: Series[];
  tags: Tag[];
  mediaAssets: MediaAsset[];
  selectedCover: MediaAsset | null;
  saveStatusText: string;
  recoveryAvailable: boolean;
}>();

const emit = defineEmits<{
  "update:form": [form: PostForm];
  "restore-recovery": [];
  "discard-recovery": [];
  "quick-create": [type: "category" | "tag" | "topic"];
}>();

function checkStateText(check: PublishCheck) {
  if (check.passed) {
    return "通过";
  }
  return check.level === "required" ? "必填" : "建议完善";
}

function updateField<K extends keyof PostForm>(key: K, value: PostForm[K]) {
  emit("update:form", {
    ...props.form,
    [key]: value
  });
}
</script>

<style scoped>
.publish-panel {
  display: grid;
  gap: 14px;
}

.publish-card {
  background: var(--paper-soft);
  border: 2px solid var(--ink);
  box-shadow: 6px 6px 0 rgba(17, 16, 13, 0.2);
  padding: 14px;
}

.publish-card h2,
.card-kicker {
  font-family: "Archivo Black", "Arial Black", sans-serif;
  font-size: 16px;
  line-height: 1;
  margin: 0 0 12px;
}

.card-kicker {
  color: var(--blue);
}

.save-card strong {
  display: block;
  font-size: 15px;
}

.recovery-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.recovery-actions .el-button {
  margin-left: 0;
}

.publish-checks ul {
  display: grid;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.publish-checks li {
  align-items: center;
  background: var(--paper);
  border: 2px solid var(--ink);
  display: flex;
  gap: 10px;
  justify-content: space-between;
  padding: 9px 10px;
}

.publish-checks li strong {
  color: var(--red);
  font-size: 13px;
}

.publish-checks li.is-passed strong {
  color: var(--blue);
}

.publish-form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.canonical-preview {
  color: var(--blue);
  font-family: "IBM Plex Mono", "Consolas", monospace;
  font-size: 12px;
  font-weight: 800;
  margin: 6px 0 0;
  overflow-wrap: anywhere;
}

.quick-create {
  margin: 0 0 8px;
}

.publish-form input,
.publish-form textarea {
  background: var(--paper);
  border: 2px solid var(--ink);
  color: var(--ink);
  font: inherit;
  font-weight: 700;
  min-height: 36px;
  padding: 7px 9px;
  width: 100%;
}

.publish-form textarea {
  resize: vertical;
}

.cover-preview {
  align-items: center;
  background:
    repeating-linear-gradient(135deg, rgba(29, 88, 168, 0.12), rgba(29, 88, 168, 0.12) 8px, transparent 8px, transparent 16px),
    var(--paper-soft);
  border: 2px dashed var(--blue);
  color: var(--blue);
  display: grid;
  font-weight: 800;
  margin-top: 10px;
  min-height: 92px;
  overflow: hidden;
  padding: 10px;
  place-items: center;
  text-align: center;
  width: 100%;
}

.cover-preview img {
  display: block;
  max-height: 140px;
  max-width: 100%;
  object-fit: cover;
}
</style>
