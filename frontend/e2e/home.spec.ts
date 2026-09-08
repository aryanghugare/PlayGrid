import { test, expect } from "@playwright/test";

test("homepage leads to discovery and explains creator use cases", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Your interests. Your people.All on one grid."
  );
  await expect
    .poll(() =>
      page
        .locator(".home-gallery img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0
          )
        )
    )
    .toBe(true);
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
  await page.getByRole("tab", { name: "For the watchers" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "For the creators" })
  ).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText(
    "Give your ideas a home."
  );
  await page
    .getByRole("link", { name: "Open creator studio", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Welcome back." })
  ).toBeVisible();
  await page.goto("/");
  await page.getByRole("link", { name: "Explore videos", exact: true }).click();
  await expect(page).toHaveURL(/\/explore$/);
  await expect(
    page.getByRole("heading", {
      name: "A little curiosity. A lot to discover.",
    })
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "A little curiosity. A lot to discover.",
    })
  ).toBeVisible();
  await page.goto("/");
  for (const width of [390, 768, 1024]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Let’s explore", exact: true }).click();
  await expect(page).toHaveURL(/\/explore$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.goto("/");
  await page.getByRole("link", { name: "Start creating", exact: true }).click();
  await expect(page).toHaveURL(/\/register$/);
  expect(errors).toEqual([]);
});
