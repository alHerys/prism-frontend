import { it, expect, vi, afterEach } from "vitest";
import { createA5Intelligence, readCandidate } from "./a5-intelligence";
const field = (value: string | null) => ({ value, quote: value, page: 1 });
const payload = () => ({ sha256: "a".repeat(64), candidate: { vendor_name: "PT A", vendor_quote: "PT A", hpb: field("1000"), hpj: field("300"), knb: field("25"), tkdn_barang: field("0.4"), tkdn_jasa: field(null) }, warnings: ["Lengkapi TKDN jasa"] });
const file = { name: "Form A5.pdf", size: 5, arrayBuffer: async () => new ArrayBuffer(5) };
afterEach(() => vi.useRealTimers());
it("sends raw bytes to the configured backend without provider secrets and preserves missing fields", async () => {
  const request = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(payload()), { status: 200 }));
  const result = await createA5Intelligence("/api/", request).extract(file, "id");
  expect(request.mock.calls[0][0]).toBe("/api/form-a5/extractions");
  expect(request.mock.calls[0][1]?.headers).toEqual({ "Content-Type": "application/pdf", "X-Document-Filename": "Form%20A5.pdf" });
  expect(result.values.tkdn_jasa).toBe(""); expect(result.sources.find(s => s.field === "vendor_name")?.quote).toBe("PT A");
});
it("rejects malformed identities, decimals, page locations and missing contract fields", () => {
  expect(() => readCandidate({ ...payload(), sha256: "bad" })).toThrow();
  expect(() => readCandidate({ ...payload(), candidate: { ...payload().candidate, hpb: field("NaN") } })).toThrow();
  expect(() => readCandidate({ ...payload(), candidate: { ...payload().candidate, tkdn_barang: field("40") } })).toThrow();
  expect(() => readCandidate({ ...payload(), candidate: { ...payload().candidate, vendor_name: 123 } })).toThrow();
});
it("maps provider configuration errors and never fabricates a successful result", async () => {
  const request = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ error: { code: "PROVIDER_NOT_CONFIGURED" } }), { status: 503 }));
  await expect(createA5Intelligence("/api", request).extract(file, "id")).rejects.toThrow("belum dikonfigurasi");
});
it("times out and cancels requests through the infrastructure adapter", async () => {
  vi.useFakeTimers();
  const request = vi.fn<typeof fetch>((_, init) => new Promise((_, reject) => init!.signal!.addEventListener("abort", () => reject(new Error("Aborted")))));
  const adapter = createA5Intelligence("/api", request);
  const timeout = expect(adapter.extract(file, "timeout")).rejects.toThrow("batas waktu");
  await vi.advanceTimersByTimeAsync(60000); await timeout;
  const cancelled = expect(adapter.extract(file, "cancel")).rejects.toThrow();
  await vi.advanceTimersByTimeAsync(0); adapter.cancel("cancel"); await cancelled;
});
