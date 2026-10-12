import { describe, it, expect } from "vitest";
import { mockAdapter, estimateTokens, type ChatRequest } from "./inference";

const req = (content: string, stream = false): ChatRequest => ({ model: "qwen3-8b", messages: [{ role: "user", content }], temperature: 0.7, top_p: 0.9, max_tokens: 256, stream });

describe("mock inference adapter", () => {
  // @kliv-spec-derived — from user intent: "never pretend a local mock response came from a real model"
  it("labels every response as simulated", async () => {
    const r = await mockAdapter.chat(req("hello"), () => {});
    expect(r.simulated).toBe(true);
    expect(r.content.toLowerCase()).toContain("simulated");
  });
  // @kliv-spec-derived — from user intent: "simulated streaming responses"
  it("streams the response in multiple chunks that add up to the full content", async () => {
    const chunks: string[] = [];
    const r = await mockAdapter.chat(req("explain retries", true), (c) => chunks.push(c));
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join("")).toBe(r.content);
  });
  // @kliv-spec-derived — from user intent: "error states" in the chat playground
  it("can produce an error state", async () => {
    await expect(mockAdapter.chat(req("/error"), () => {})).rejects.toThrow();
  });
  it("estimates at least one token", () => {
    expect(estimateTokens("")).toBe(1);
    expect(estimateTokens("abcdefgh")).toBe(2);
  });
});
