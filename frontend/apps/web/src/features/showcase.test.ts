import { describe, expect, it } from "vitest";
import type { Post, Series, Topic } from "@blog/shared";
import { buildShowcaseLinks } from "./showcase";

describe("buildShowcaseLinks", () => {
  it("builds a portfolio path from the latest post, first topic, first series, and archive", () => {
    const posts: Post[] = [
      {
        id: 1,
        title: "Build Blog",
        slug: "build-blog",
        summary: "A full-stack personal blog case study.",
        status: "PUBLISHED"
      }
    ];
    const topics: Topic[] = [
      { id: 2, name: "Spring Boot", slug: "spring-boot", description: "Backend practice", sortOrder: 0 }
    ];
    const series: Series[] = [
      { id: 3, name: "From Zero", slug: "from-zero", description: "Ordered build notes", primaryTopic: null, sortOrder: 0 }
    ];

    expect(buildShowcaseLinks(posts, topics, series)).toEqual([
      {
        label: "代表文章",
        title: "Build Blog",
        description: "A full-stack personal blog case study.",
        href: "/posts/build-blog"
      },
      {
        label: "技术专题",
        title: "Spring Boot",
        description: "Backend practice",
        href: "/topics/spring-boot"
      },
      {
        label: "阅读系列",
        title: "From Zero",
        description: "Ordered build notes",
        href: "/series/from-zero"
      },
      {
        label: "完整索引",
        title: "全部文章",
        description: "按时间、分类、标签、专题和系列检索公开内容。",
        href: "/archive"
      }
    ]);
  });

  it("falls back to durable default descriptions when data is sparse", () => {
    expect(buildShowcaseLinks([], [], [])).toEqual([
      {
        label: "完整索引",
        title: "全部文章",
        description: "按时间、分类、标签、专题和系列检索公开内容。",
        href: "/archive"
      }
    ]);
  });
});
