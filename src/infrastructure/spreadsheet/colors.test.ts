import { expect, it } from "vitest";
import { tintColor } from "./colors";
it("resolves neutral and accent theme tints through HSL lightness", () => {
  expect(tintColor("0F9ED5", 0.6)).toBe("#96dcf8");
  expect(tintColor("196B24", 0.8)).toBe("#c2f1c8");
  expect(tintColor("E8E8E8", -0.1)).toBe("#d1d1d1");
  expect(tintColor("FF0000", 0)).toBe("#ff0000");
  expect(tintColor("FF0000", -1)).toBe("#000000");
  expect(tintColor("FF0000", 1)).toBe("#ffffff");
});
