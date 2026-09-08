import { test, expect } from "@playwright/test";
const avatar = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZ1kAAAAASUVORK5CYII=",
  "base64"
);
test("creator and viewer journey: signup, upload, play, save, discuss, edit and logout", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/explore");
  await expect(
    page.getByRole("heading", {
      name: "A little curiosity. A lot to discover.",
    })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "The grid is waiting" })
  ).toBeVisible();
  await page.getByRole("link", { name: "Sign in", exact: true }).click();
  await page.getByRole("link", { name: "Create an account" }).click();
  await page.getByLabel("Full name", { exact: true }).fill("Maya Rivers");
  await page.getByLabel("Username", { exact: true }).fill("maya");
  await page.getByLabel("Email", { exact: true }).fill("maya@example.com");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByLabel("Confirm password").fill("password123");
  await page
    .locator("input[name=avatar]")
    .setInputFiles({
      name: "avatar.png",
      mimeType: "image/png",
      buffer: avatar,
    });
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByText("Account created. Sign in to get started.")
  ).toBeVisible();
  await page.getByLabel("Email or username").fill("maya");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Account settings" })
  ).toBeVisible();
  await page.goto("/studio/upload");
  const media = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 540;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 540);
    gradient.addColorStop(0, "#c6b3e0");
    gradient.addColorStop(1, "#f4c7a5");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 960, 540);
    ctx.fillStyle = "#fff0bc";
    ctx.beginPath();
    ctx.arc(680, 170, 73, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#686783";
    ctx.beginPath();
    ctx.moveTo(0, 410);
    ctx.lineTo(300, 200);
    ctx.lineTo(600, 500);
    ctx.lineTo(960, 250);
    ctx.lineTo(960, 540);
    ctx.lineTo(0, 540);
    ctx.fill();
    ctx.fillStyle = "#404658";
    ctx.beginPath();
    ctx.moveTo(0, 490);
    ctx.lineTo(340, 390);
    ctx.lineTo(520, 480);
    ctx.lineTo(760, 350);
    ctx.lineTo(960, 450);
    ctx.lineTo(960, 540);
    ctx.lineTo(0, 540);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = "bold 48px sans-serif";
    ctx.fillText("A slower kind of Sunday", 55, 80);
    ctx.font = "18px sans-serif";
    ctx.fillText("MAYA RIVERS  /  FIELD NOTES", 58, 115);
    const thumbnail = canvas.toDataURL("image/png").split(",")[1];
    const stream = canvas.captureStream(10);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    const stopped = new Promise<void>(
      (resolve) => (recorder.onstop = () => resolve())
    );
    recorder.start();
    await new Promise((r) => setTimeout(r, 1300));
    recorder.stop();
    await stopped;
    stream.getTracks().forEach((t) => t.stop());
    const video = Array.from(
      new Uint8Array(
        await new Blob(chunks, { type: "video/webm" }).arrayBuffer()
      )
    );
    return { video, thumbnail };
  });
  await page
    .getByLabel("Video file")
    .setInputFiles({
      name: "sunday.webm",
      mimeType: "video/webm",
      buffer: Buffer.from(media.video),
    });
  await page
    .getByLabel("Title", { exact: true })
    .fill("A slower kind of Sunday");
  await page
    .getByLabel("Description", { exact: true })
    .fill("A small reminder to take the scenic route.");
  await page
    .locator("input[name=thumbnail]")
    .setInputFiles({
      name: "sunday.png",
      mimeType: "image/png",
      buffer: Buffer.from(media.thumbnail, "base64"),
    });
  await page.getByLabel("Visibility").selectOption("true");
  await page.getByRole("button", { name: "Upload video", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your content" })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "A slower kind of Sunday", exact: true })
  ).toBeVisible();
  await page.getByRole("link", { name: "Discover", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "A slower kind of Sunday", exact: true })
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/discover-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page
    .getByRole("link", { name: "A slower kind of Sunday", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "A slower kind of Sunday", exact: true })
  ).toBeVisible();
  await page.locator("video").evaluate((v: HTMLVideoElement) => v.play());
  await expect
    .poll(() =>
      page.locator("video").evaluate((v: HTMLVideoElement) => v.currentTime)
    )
    .toBeGreaterThan(0);
  await page.locator(".watch-buttons button").first().click();
  await expect(page.locator(".is-liked")).toBeVisible();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByLabel("Or create a playlist").fill("Sunday inspiration");
  await page.getByRole("button", { name: "Create and save" }).click();
  await expect(page.getByText("Video saved to your playlist.")).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByLabel("Join the conversation")
    .fill("A moment worth keeping.");
  await page.getByRole("button", { name: "Post", exact: true }).click();
  await expect(page.getByText("A moment worth keeping.")).toBeVisible();
  await page.getByRole("link", { name: "Your playlists", exact: true }).click();
  await page.getByRole("link", { name: /Sunday inspiration/ }).click();
  await expect(
    page.getByRole("heading", { name: "Sunday inspiration", exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "A slower kind of Sunday", exact: true })
  ).toBeVisible();
  await page.getByRole("link", { name: "Community", exact: true }).click();
  await page.getByLabel("What's on your mind?").fill("Hello from the grid.");
  await page.getByRole("button", { name: "Post", exact: true }).click();
  await expect(page.getByText("Hello from the grid.")).toBeVisible();
  await page.getByRole("button", { name: "Edit post" }).click();
  await page
    .getByLabel("Edit your post")
    .fill("Hello from my creative corner.");
  await page.getByRole("button", { name: "Post", exact: true }).last().click();
  await expect(page.getByText("Hello from my creative corner.")).toBeVisible();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page
    .getByLabel("Full name", { exact: true })
    .fill("Maya Rivers Studio");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(
    page.getByRole("heading", { name: "Maya Rivers Studio" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(
    page.getByRole("link", { name: "Sign in", exact: true })
  ).toBeVisible();
  await page.goto("/studio");
  await expect(
    page.getByRole("heading", { name: "Welcome back." })
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("mobile discovery navigation, search and direct links work without overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/explore");
  await expect(
    page.getByRole("heading", {
      name: "A little curiosity. A lot to discover.",
    })
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
    )
    .toBe(true);
  await page.screenshot({
    path: "test-results/discover-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Community", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "The conversation continues." })
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Search videos" }).fill("Sunday");
  await page.getByRole("textbox", { name: "Search videos" }).press("Enter");
  await expect(
    page.getByRole("heading", { name: "Results for “Sunday”" })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "A slower kind of Sunday", exact: true })
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Results for “Sunday”" })
  ).toBeVisible();
});
