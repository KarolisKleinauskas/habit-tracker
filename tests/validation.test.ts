import { describe, expect, it } from "vitest";
import { habitFormToObject, habitSchema, isSingleEmoji } from "@/lib/validation";

describe("isSingleEmoji", () => {
  it("accepts single emoji including composed ones", () => {
    for (const e of ["💧", "✍️", "👍🏽", "🧑‍💻", "🇱🇹", "☀️"]) {
      expect(isSingleEmoji(e), e).toBe(true);
    }
  });

  it("rejects text and multiple emoji", () => {
    for (const e of ["", "a", "ab", "💧💧", "1"]) {
      expect(isSingleEmoji(e), e).toBe(false);
    }
  });
});

function form(entries: [string, string][]) {
  const fd = new FormData();
  for (const [k, v] of entries) fd.append(k, v);
  return habitFormToObject(fd);
}

describe("habitSchema", () => {
  const valid: [string, string][] = [
    ["name", "  Bėgimas  "],
    ["emoji", "🏃"],
    ["color", "blue"],
    ["scheduleDays", "5"],
    ["scheduleDays", "1"],
    ["scheduleDays", "3"],
    ["reminderTime", "07:30"],
  ];

  it("parses a valid form", () => {
    const result = habitSchema.parse(form(valid));
    expect(result).toEqual({
      name: "Bėgimas",
      emoji: "🏃",
      color: "blue",
      scheduleDays: [1, 3, 5],
      reminderTime: "07:30",
    });
  });

  it("treats an empty reminder as none", () => {
    const entries = valid.map(([k, v]): [string, string] => [k, k === "reminderTime" ? "" : v]);
    expect(habitSchema.parse(form(entries)).reminderTime).toBeNull();
  });

  it("requires at least one weekday", () => {
    const entries = valid.filter(([k]) => k !== "scheduleDays");
    const result = habitSchema.safeParse(form(entries));
    expect(result.success).toBe(false);
  });

  it("rejects unknown colors, bad times and out-of-range days", () => {
    expect(habitSchema.safeParse(form([...valid, ["scheduleDays", "8"]])).success).toBe(false);
    const badColor = valid.map(([k, v]): [string, string] => [k, k === "color" ? "black" : v]);
    expect(habitSchema.safeParse(form(badColor)).success).toBe(false);
    const badTime = valid.map(([k, v]): [string, string] => [k, k === "reminderTime" ? "25:00" : v]);
    expect(habitSchema.safeParse(form(badTime)).success).toBe(false);
  });
});
