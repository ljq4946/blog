import { expect, test } from "@playwright/test";

test("admin can publish a post that appears publicly", async ({ page }) => {
  const adminUser = process.env.E2E_ADMIN_USERNAME ?? "4946";
  const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "541312";
  const suffix = Date.now();
  const title = `E2E Constructivist Note ${suffix}`;
  const slug = `e2e-constructivist-note-${suffix}`;

  await page.goto("/admin/login");
  await page.getByLabel("Username").fill(adminUser);
  await page.getByLabel("Password").fill(adminPassword);
  await page.getByRole("button", { name: "Enter" }).click();

  await page.goto("/admin/categories");
  await page.getByRole("button", { name: "New" }).click();
  await page.getByLabel("Name").fill(`E2E Category ${suffix}`);
  await page.getByLabel("Slug").fill(`e2e-category-${suffix}`);
  await page.getByLabel("Sort").fill("1");
  await page.getByRole("button", { name: "Save" }).click();

  await page.goto("/admin/tags");
  await page.getByRole("button", { name: "New" }).click();
  await page.getByLabel("Name").fill(`E2E Tag ${suffix}`);
  await page.getByLabel("Slug").fill(`e2e-tag-${suffix}`);
  await page.getByRole("button", { name: "Save" }).click();

  await page.goto("/admin/posts/new");
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Slug").fill(slug);
  await page.getByLabel("Summary").fill("Published by Playwright");
  await page.getByText("Draft").click();
  await page.getByText("Published").click();
  await page.locator(".editor-surface").click();
  await page.keyboard.type("Hello from the E2E editor.");
  await page.getByRole("button", { name: "Save post" }).click();

  await page.goto(`/posts/${slug}`);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await page.goto("/archive");
  await expect(page.getByText(title)).toBeVisible();
});
