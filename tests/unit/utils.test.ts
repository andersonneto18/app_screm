import { describe, it, expect } from "vitest";
import { cn, formatDuration, absoluteUrl } from "@/lib/utils";

describe("cn", () => {
  it("joins truthy class values, flattening arrays", () => {
    expect(cn("a", false, undefined, ["b", null, "c"], 0)).toBe("a b c");
  });
});

describe("formatDuration", () => {
  it("formats seconds as HH:MM:SS", () => {
    expect(formatDuration(0)).toBe("00:00:00");
    expect(formatDuration(61)).toBe("00:01:01");
    expect(formatDuration(3661)).toBe("01:01:01");
    expect(formatDuration(-5)).toBe("00:00:00");
  });
});

describe("absoluteUrl", () => {
  it("prefixes the app URL and normalises the leading slash", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://example.test";
    expect(absoluteUrl("/join/abc")).toBe("https://example.test/join/abc");
    expect(absoluteUrl("join/abc")).toBe("https://example.test/join/abc");
  });
});
