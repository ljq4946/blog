import { mount, flushPromises } from "@vue/test-utils";
import ElementPlus from "element-plus";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { tokenStorage } from "@blog/shared";
import LoginView from "./LoginView.vue";

const pushMock = vi.hoisted(() => vi.fn());
const loginMock = vi.hoisted(() => vi.fn());

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: pushMock })
}));

vi.mock("../lib/api", () => ({
  adminApi: {
    login: loginMock
  }
}));

describe("LoginView", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    pushMock.mockReset();
    loginMock.mockReset();
    tokenStorage.clear();
  });

  it("submits credentials and navigates to the dashboard", async () => {
    loginMock.mockResolvedValue({
      token: "token",
      user: { id: 1, username: "4946", role: "ADMIN" }
    });

    const wrapper = mount(LoginView, {
      global: {
        plugins: [ElementPlus]
      }
    });

    expect(wrapper.findAll("form")).toHaveLength(1);

    await wrapper.find('input[autocomplete="current-password"]').setValue("541312");
    await wrapper.get("form.login-card").trigger("submit");
    await flushPromises();

    expect(loginMock).toHaveBeenCalledWith("4946", "541312");
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("renders Chinese login copy", () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [ElementPlus]
      }
    });

    expect(wrapper.text()).toContain("博客管理");
    expect(wrapper.text()).toContain("用户名");
    expect(wrapper.text()).toContain("密码");
    expect(wrapper.text()).toContain("登录");
  });
});
