<template>
  <section class="panel">
    <div class="page-head">
      <h1>{{ isNew ? "新建文章" : "编辑文章" }}</h1>
      <el-button @click="$router.push('/posts')">返回</el-button>
    </div>
    <el-alert v-if="errors.length" type="error" :title="errors.join(', ')" :closable="false" />
    <el-form label-position="top">
      <div class="form-grid">
        <el-form-item label="标题">
          <el-input v-model="form.title" @blur="syncSlug" />
        </el-form-item>
        <el-form-item label="URL 标识">
          <el-input v-model="form.slug" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option label="草稿" value="DRAFT" />
            <el-option label="已发布" value="PUBLISHED" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.categoryId" clearable>
            <el-option v-for="category in categories" :key="category.id" :label="category.name" :value="category.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="form.tagIds" multiple>
            <el-option v-for="tag in tags" :key="tag.id" :label="tag.name" :value="tag.id" />
          </el-select>
        </el-form-item>
      </div>
      <el-form-item label="摘要">
        <el-input v-model="form.summary" type="textarea" :rows="3" />
      </el-form-item>
      <div class="toolbar">
        <el-button @click="editor?.chain().focus().toggleBold().run()">B</el-button>
        <el-button @click="editor?.chain().focus().toggleItalic().run()">I</el-button>
        <el-button @click="editor?.chain().focus().toggleBulletList().run()">列表</el-button>
        <el-button @click="editor?.chain().focus().toggleBlockquote().run()">引用</el-button>
      </div>
      <EditorContent v-if="editor" class="editor-surface" :editor="editor" />
      <el-button type="danger" @click="save">保存文章</el-button>
    </el-form>
  </section>
</template>

<script setup lang="ts">
import { slugify, type Category, type Post, type Tag } from "@blog/shared";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { validatePostForm, toPostInput, type PostForm } from "../features/posts/postForm";
import { adminApi } from "../lib/api";

const route = useRoute();
const router = useRouter();
const isNew = computed(() => route.params.id === undefined);
const categories = ref<Category[]>([]);
const tags = ref<Tag[]>([]);
const errors = ref<string[]>([]);
const form = reactive<PostForm>({
  title: "",
  slug: "",
  summary: "",
  contentHtml: "",
  status: "DRAFT",
  categoryId: null,
  tagIds: []
});

const editor = useEditor({
  extensions: [StarterKit, Link.configure({ openOnClick: false }), Image],
  content: form.contentHtml,
  onUpdate({ editor: current }) {
    form.contentHtml = current.getHTML();
  }
});

function syncSlug() {
  if (!form.slug && form.title) {
    form.slug = slugify(form.title);
  }
}

async function save() {
  errors.value = validatePostForm(form);
  if (errors.value.length) {
    return;
  }
  if (isNew.value) {
    await adminApi.createPost(toPostInput(form));
  } else {
    await adminApi.updatePost(Number(route.params.id), toPostInput(form));
  }
  router.push("/posts");
}

onMounted(async () => {
  [categories.value, tags.value] = await Promise.all([adminApi.categories(), adminApi.tags()]);
  if (!isNew.value) {
    const current = (await adminApi.posts()).find((post: Post) => post.id === Number(route.params.id));
    if (current) {
      Object.assign(form, {
        title: current.title,
        slug: current.slug,
        summary: current.summary ?? "",
        contentHtml: current.contentHtml ?? "",
        status: current.status,
        categoryId: current.category?.id ?? null,
        tagIds: current.tags?.map((tag) => tag.id) ?? []
      });
      editor.value?.commands.setContent(form.contentHtml ?? "");
    }
  }
});

onBeforeUnmount(() => editor.value?.destroy());
</script>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}
</style>
