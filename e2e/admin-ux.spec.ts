import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { build } from "vite";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let script: string;
let css: string;
let temporary: string;

test.beforeAll(async () => {
  temporary = await fs.mkdtemp(path.join(os.tmpdir(), "arcan-admin-ux-"));
  await build({
    configFile: false,
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    root,
    logLevel: "error",
    resolve: { alias: { "@": path.join(root, "src") } },
    esbuild: { jsx: "automatic" },
    build: {
      outDir: temporary,
      emptyOutDir: false,
      lib: { entry: path.join(root, "e2e/admin-ux.fixture.jsx"), formats: ["iife"], name: "AdminUX", fileName: () => "fixture.js" },
    },
  });
  script = await fs.readFile(path.join(temporary, "fixture.js"), "utf8");
  // Use the application's actual compiled Tailwind CSS, including dialog classes.
  const assets = path.join(root, "build/client/assets");
  const styles = (await fs.readdir(assets)).filter((name) => name.endsWith(".css"));
  css = (await Promise.all(styles.map((name) => fs.readFile(path.join(assets, name), "utf8")))).join("\n");
});
test.afterAll(async () => { if (temporary) await fs.rm(temporary, { recursive: true, force: true }); });

async function fixture(page: Page) {
  await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div></body></html>');
  await page.addStyleTag({ content: css });
  await page.addScriptTag({ content: script });
  await expect(page.getByRole("heading", { name: "Jobs", exact: true })).toBeVisible();
}

// Component-level rendered evidence; this is not authenticated lifecycle proof.
test("dialogs contain keyboard focus, cancel only the top dialog, and restore focus", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await fixture(page);
  const open = page.getByRole("button", { name: "New job", exact: true });
  await open.click();
  const job = page.getByRole("dialog", { name: "New job", exact: true });
  await expect(job).toBeVisible();
  await job.getByRole("textbox", { name: "Job name" }).fill("Kitchen repaint");
  await job.getByRole("button", { name: "Add photo" }).click();
  const photo = page.getByRole("dialog", { name: "Add photo", exact: true });
  await expect(photo).toBeVisible();
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("Tab");
    expect(await photo.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(photo).toBeHidden();
  await expect(job).toBeVisible();
  await expect(job.getByRole("button", { name: "Add photo" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(job).toBeHidden();
  await expect(open).toBeFocused();
  expect(errors).toEqual([]);
});

for (const width of [320, 390, 768, 1440]) {
  test(`admin shell and long dialog stay within a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await fixture(page);
    await page.getByRole("button", { name: "New job", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "New job", exact: true });
    await expect(dialog.getByRole("button", { name: "Cancel job" })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    await page.keyboard.press("Escape");
    if (width < 1024) {
      await page.getByRole("button", { name: "More", exact: true }).click();
      const menu = page.getByRole("dialog", { name: "Business navigation" });
      await expect(menu).toBeVisible();
      await expect(menu.getByRole("link", { name: "Team", exact: true })).toBeVisible();
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press("Tab");
        expect(await menu.evaluate((node) => node.contains(document.activeElement))).toBe(true);
      }
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "More", exact: true })).toBeFocused();
    }
  });
}
