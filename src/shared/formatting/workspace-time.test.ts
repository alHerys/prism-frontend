import { expect, it } from "vitest";
import { dateTime, dateTimeParts, localDay } from "./display";
it("formats real timestamps in the selected zone without changing business dates",() => {
  const timestamp="2026-10-02T22:30:00Z";
  expect(dateTime(timestamp,"Asia/Jakarta")).toContain("WIB");
  expect(dateTime(timestamp,"Europe/London")).toContain("GMT+1");
  expect(dateTime(timestamp,"America/New_York")).toMatch(/18\.30 (EDT|GMT-4)/);
  expect(dateTime(timestamp,"Africa/Lagos")).toContain("GMT+1");
  expect(localDay(timestamp)).toBe("2026-10-03");
  expect(dateTime(timestamp)).not.toMatch(/WIB|GMT/);
});
it("separates upload date and time using the same selected time zone", () => {
  const timestamp = "2026-10-02T22:30:00Z";
  expect(dateTimeParts(timestamp, "Asia/Jakarta")).toEqual({ date: "3 Okt 2026", time: "05.30 WIB" });
  expect(dateTimeParts(timestamp, "America/New_York").date).toBe("2 Okt 2026");
});
