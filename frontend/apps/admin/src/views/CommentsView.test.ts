import { flushPromises, mount } from "@vue/test-utils";
import ElementPlus from "element-plus";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CommentsView from "./CommentsView.vue";

const commentsMock = vi.hoisted(() => vi.fn());
const deleteCommentMock = vi.hoisted(() => vi.fn());
const updateCommentStatusMock = vi.hoisted(() => vi.fn());

vi.mock("../lib/api", () => ({
  adminApi: {
    comments: commentsMock,
    deleteComment: deleteCommentMock,
    updateCommentStatus: updateCommentStatusMock
  }
}));

describe("CommentsView", () => {
  beforeEach(() => {
    commentsMock.mockReset();
    deleteCommentMock.mockReset();
    updateCommentStatusMock.mockReset();
    commentsMock.mockResolvedValue([
      {
        id: 7,
        postId: 1,
        postTitle: "Reader Upgrade",
        postSlug: "reader-upgrade",
        nickname: "Ada",
        email: "ada@example.com",
        content: "Useful note",
        status: "PENDING",
        createdAt: "2026-05-20T12:00:00Z"
      }
    ]);
    deleteCommentMock.mockResolvedValue(undefined);
    updateCommentStatusMock.mockResolvedValue(undefined);
  });

  it("renders admin comments and deletes a comment", async () => {
    const wrapper = mount(CommentsView, {
      global: {
        plugins: [ElementPlus]
      }
    });
    await flushPromises();

    expect(commentsMock).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain("Reader Upgrade");
    expect(wrapper.text()).toContain("Ada");
    expect(wrapper.text()).toContain("ada@example.com");
    expect(wrapper.text()).toContain("Useful note");
    expect(wrapper.text()).toContain("待审核");

    await wrapper.get('[data-test="approve-comment-7"]').trigger("click");
    await flushPromises();

    expect(updateCommentStatusMock).toHaveBeenCalledWith(7, "APPROVED");

    await wrapper.get('[data-test="delete-comment-7"]').trigger("click");
    await flushPromises();

    expect(deleteCommentMock).toHaveBeenCalledWith(7);
    expect(commentsMock).toHaveBeenCalledTimes(3);
  });
});
