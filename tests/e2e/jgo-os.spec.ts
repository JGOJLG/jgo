import { expect, test } from "@playwright/test";

const adminProtectedRoutes = [
  "/",
  "/clients",
  "/calendar",
  "/tasks",
  "/revenue",
  "/email",
  "/docs",
  "/settings",
];

const clientProtectedRoutes = [
  "/client-portal",
  "/client-portal/jobs",
  "/client-portal/documents",
  "/client-portal/resources",
];

const mutationEndpoints = [
  "/api/client-portal/invite",
  "/api/client-portal/reset-password",
  "/api/invoices/send",
  "/api/payments/receipt",
];

function isServerFailure(status: number) {
  return status >= 500;
}

test.describe("JGO OS access and route safety", () => {
  test("admin login renders", async ({ page }) => {
    const response = await page.goto("/login", { waitUntil: "domcontentloaded" });
    expect(response).not.toBeNull();
    expect(isServerFailure(response!.status())).toBeFalsy();
    await expect(page.getByRole("heading", { name: "JGO OS" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("client portal login renders", async ({ page }) => {
    const response = await page.goto("/client-portal/login", {
      waitUntil: "domcontentloaded",
    });
    expect(response).not.toBeNull();
    expect(isServerFailure(response!.status())).toBeFalsy();
    await expect(page.getByRole("heading", { name: "Client Portal" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Continue to Login/i })).toBeVisible();
  });

  for (const route of adminProtectedRoutes) {
    test(`admin route ${route} never throws a server error`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response).not.toBeNull();
      expect(isServerFailure(response!.status())).toBeFalsy();
      await expect(page.locator("body")).not.toBeEmpty();
    });
  }

  for (const route of clientProtectedRoutes) {
    test(`client route ${route} never throws a server error`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response).not.toBeNull();
      expect(isServerFailure(response!.status())).toBeFalsy();
      await expect(page.locator("body")).not.toBeEmpty();
    });
  }
});

test.describe("JGO OS data-loss guardrails", () => {
  for (const endpoint of mutationEndpoints) {
    test(`GET cannot trigger write endpoint ${endpoint}`, async ({ request }) => {
      const response = await request.get(endpoint, { maxRedirects: 0 });
      expect(response.status()).not.toBeGreaterThanOrEqual(500);
      expect(response.status()).not.toBe(200);
      expect(response.status()).not.toBe(201);
      expect(response.status()).not.toBe(204);
    });
  }

  test("client portal remains private when signed out", async ({ page }) => {
    await page.goto("/client-portal", { waitUntil: "domcontentloaded" });
    const url = page.url();
    const body = await page.locator("body").innerText();
    expect(
      url.includes("/login") ||
        url.includes("/client-portal/login") ||
        /Client Portal|sign in|login/i.test(body),
    ).toBeTruthy();
  });
});

test.describe("JGO OS browser regression checks", () => {
  test("no horizontal overflow on core login surfaces", async ({ page }) => {
    for (const route of ["/login", "/client-portal/login"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      );
      expect(overflow, `${route} has horizontal overflow`).toBeFalsy();
    }
  });

  test("core login surfaces do not emit uncaught page errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("/login", { waitUntil: "networkidle" });
    await page.goto("/client-portal/login", { waitUntil: "networkidle" });

    expect(errors).toEqual([]);
  });
});
