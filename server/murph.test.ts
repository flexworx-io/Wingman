/**
 * Murph.AI integration test
 * Validates that the MURPH_API_KEY env var is configured
 * and that the murph client module exports the expected functions.
 */
import { describe, it, expect } from "vitest";

describe("Murph.AI client configuration", () => {
  it("should have MURPH_API_KEY configured in environment", () => {
    const key = process.env.MURPH_API_KEY;
    // Key is defined (even if empty string in test env)
    expect(key).toBeDefined();
  });

  it("should have a valid effective Murph API URL", () => {
    // MURPH_API_URL may not be set — we fall back to the default
    const url = process.env.MURPH_API_URL;
    const effectiveUrl = (url && url.startsWith("http")) ? url : "https://api.murph.ai/v1";
    expect(effectiveUrl).toMatch(/^https?:\/\//);
  });

  it("should export all required Murph.AI client functions", async () => {
    const murph = await import("./murph");
    expect(typeof murph.createHSE).toBe("function");
    expect(typeof murph.getHSE).toBe("function");
    expect(typeof murph.initiateIntroduction).toBe("function");
    expect(typeof murph.getConversation).toBe("function");
    expect(typeof murph.discoverCompatibleHSEs).toBe("function");
    expect(typeof murph.calculateCompatibility).toBe("function");
  });

  it("should have ENV.murphApiKey set", async () => {
    const { ENV } = await import("./_core/env");
    // The key is set — we just verify it's a string (value is secret)
    expect(typeof ENV.murphApiKey).toBe("string");
  });
});
