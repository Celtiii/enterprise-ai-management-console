import { scenario, step, expect } from "kliv-scenario";

scenario("engineer chats with the mock model", { setup: {} }, async ({ page }) => {
  await step("open chat playground", async () => {
    await page.goto("/workspace/chat");
    await expect(page.getByPlaceholder("Message the model… (Enter to send, Shift+Enter for new line)")).toBeVisible();
  });
  await step("send a message", async () => {
    await page.getByPlaceholder("Message the model… (Enter to send, Shift+Enter for new line)").fill("Summarize our access policy");
    await page.getByRole("button", { name: "Send" }).click();
  });
  await step("simulated reply appears", async () => {
    await expect(page.getByText("Simulated response from the local mock adapter", { exact: false }).first()).toBeVisible();
  });
});

scenario("admin registers a model", { setup: {} }, async ({ page }) => {
  await step("open registry", async () => {
    await page.goto("/models/registry");
    await page.getByRole("button", { name: "Register model" }).click();
  });
  await step("fill and save", async () => {
    await page.getByPlaceholder("Qwen3-14B").fill("Scenario-Test-7B");
    await page.getByPlaceholder("Alibaba Qwen").fill("Internal");
    await page.getByRole("dialog").getByRole("button", { name: "Register" }).click();
  });
  await step("model is listed", async () => {
    await expect(page.getByText("Scenario-Test-7B").first()).toBeVisible();
  });
});
