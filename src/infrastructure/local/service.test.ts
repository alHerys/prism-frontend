import { describe, expect, it } from "vitest";
import { A5_FIXTURES, FIXTURE_PREFERENCES } from "./fixtures";
import { createTestSession } from "./test-session";
async function confirmedHEA() {
  const service = createTestSession();
  for (const doc of service
    .getState()
    .documents.filter((d) => d.kind === "FORM_A5")) {
    const updated = await service.reviewDocument(
      doc.id,
      A5_FIXTURES[doc.fixtureId],
      doc.revision,
    );
    await service.confirmDocument(doc.id, updated.revision, true);
  }
  await service.setPreferences("proc-terminal", FIXTURE_PREFERENCES, 0);
  await service.confirmPreferences("proc-terminal", 1);
  return service;
}
describe("review and evaluation boundaries", () => {
  it("exposes immutable state and preserves no-op confirmation", async () => {
    const s = await confirmedHEA();
    const d = s.getState().documents.find((d) => d.fixtureId === "a5-nusa")!;
    expect(Object.isFrozen(s.getState())).toBe(true);
    expect(Object.isFrozen(d)).toBe(true);
    await s.reviewDocument(
      d.id,
      { ...A5_FIXTURES["a5-nusa"], tkdn_barang: "0.4000" },
      d.revision,
    );
    expect(s.getState().documents.find((x) => x.id === d.id)?.status).toBe(
      "CONFIRMED",
    );
    await s.setPreferences("proc-terminal", FIXTURE_PREFERENCES, 1);
    expect(
      s.getState().procurements.find((p) => p.id === "proc-terminal")
        ?.preferenceConfirmed,
    ).toBe(true);
  });
  it("keeps preferences empty until explicitly entered and confirmed", async () => {
    const s = createTestSession();
    expect(s.getState().procurements[0].preferences).toBeUndefined();
    await expect(s.evaluateHEA("proc-terminal", [])).rejects.toMatchObject({
      code: "PREFERENCES_REQUIRED",
    });
  });
  it("requires warning acknowledgement and rejects stale revisions", async () => {
    const s = createTestSession();
    const d = s.getState().documents.find((d) => d.fixtureId === "a5-borneo")!;
    await expect(s.confirmDocument(d.id, 1)).rejects.toMatchObject({
      code: "WARNING_REQUIRED",
    });
    await s.reviewDocument(d.id, { ...A5_FIXTURES["a5-borneo"], knb: "1" }, 1);
    await expect(s.confirmDocument(d.id, 1, true)).rejects.toMatchObject({
      code: "STALE_REVISION",
    });
  });
  it("invalidates confirmation on corrections without altering earlier snapshots", async () => {
    const s = await confirmedHEA();
    const docs = s.getState().documents.filter((d) => d.kind === "FORM_A5");
    const snap = await s.evaluateHEA(
      "proc-terminal",
      docs.map((d) => d.id),
    );
    expect(snap.status).toBe("COMPLETE");
    expect(snap.rows[0].hea).toBe(
      "1261794759.4224293029478248835170918485030216358352",
    );
    await s.reviewDocument(
      docs[0].id,
      { ...A5_FIXTURES["a5-nusa"], hpb: "1" },
      1,
    );
    expect(
      s.getState().documents.find((d) => d.id === docs[0].id)?.status,
    ).toBe("REVIEW_REQUIRED");
    await s.confirmDocument(docs[0].id, 2, true);
    await expect(
      s.evaluateHEA(
        "proc-terminal",
        docs.map((d) => d.id),
      ),
    ).rejects.toMatchObject({ code: "UNAVAILABLE" });
    expect(s.getState().snapshots[0]).toEqual(snap);
  });
  it("supports explicit partial selection and refuses duplicate vendor documents", async () => {
    const s = await confirmedHEA();
    const d = s.getState().documents.find((d) => d.fixtureId === "a5-nusa")!;
    const result = await s.evaluateHEA("proc-terminal", [d.id]);
    expect(result.status).toBe("PARTIAL");
    expect(result.excluded).toEqual(["PT Borneo Teknik Nusantara"]);
    const duplicate = await s.uploadRegisteredDocument({
      procurementId: "proc-terminal",
      vendorId: d.vendorId,
      fixtureId: "a5-nusa",
      kind: "FORM_A5",
      name: "same.pdf",
    });
    await s.confirmDocument(duplicate.id, 1, true);
    await expect(
      s.evaluateHEA("proc-terminal", [d.id, duplicate.id]),
    ).rejects.toMatchObject({ code: "DUPLICATE" });
  });
  it("unknown fixture and incorrect ownership do not create data/events", async () => {
    const s = createTestSession();
    const before = s.getState();
    await expect(
      s.uploadRegisteredDocument({
        procurementId: "proc-terminal",
        kind: "FORM_A5",
        fixtureId: "unknown",
        name: "test.pdf",
      }),
    ).rejects.toMatchObject({ code: "UNSUPPORTED" });
    await expect(
      s.uploadRegisteredDocument({
        procurementId: "proc-tank",
        vendorId: "vendor-nusa",
        kind: "FORM_A5",
        fixtureId: "a5-nusa",
        name: "test.pdf",
      }),
    ).rejects.toMatchObject({ code: "VENDOR_REQUIRED" });
    expect(s.getState()).toBe(before);
  });
});
describe("price deviation", () => {
  it("keeps OE and offer source price rows immutable through review corrections", async () => {
    const s = createTestSession();
    const oe = s.getState().documents.find((d) => d.kind === "OE")!;
    const offer = s.getState().documents.find((d) => d.kind === "OFFER")!;
    expect(oe.priceItems?.[0]).toMatchObject({
      oe: "100000",
      description: "Pipa baja 4 inci",
      source: "Harga · E5/F5",
    });
    expect(Object.isFrozen(oe.priceItems?.[0])).toBe(true);
    const original = structuredClone(offer.priceItems);
    await s.reviewPairs(
      offer.id,
      offer.pairs.map((pair) => ({
        ...pair,
        oe: "1",
        offer: "2",
        description: "Koreksi uraian",
      })),
      offer.revision,
    );
    expect(
      s.getState().documents.find((doc) => doc.id === offer.id)?.priceItems,
    ).toEqual(original);
    expect(
      s.getState().documents.find((doc) => doc.id === oe.id)?.priceItems,
    ).toEqual(oe.priceItems);
  });
  it("snapshots exact percentage against selected OE and rejects modified item identity", async () => {
    const s = createTestSession();
    let oe = s.getState().documents.find((d) => d.kind === "OE")!;
    let offer = s.getState().documents.find((d) => d.kind === "OFFER")!;
    oe = await s.selectGroup(oe.id, "Harga satuan material dan jasa", 1);
    await s.confirmDocument(oe.id, oe.revision, true);
    offer = await s.selectGroup(offer.id, "Harga satuan material dan jasa", 1);
    offer = await s.reviewPairs(
      offer.id,
      offer.pairs.map((pair) => ({ ...pair, matched: true })),
      offer.revision,
    );
    await s.confirmPairs(offer.id, offer.revision, true);
    const result = await s.evaluateDeviation("proc-terminal", oe.id, offer.id);
    expect(result.rows.map((row) => row.percentageAgainstOE)).toEqual([
      "1.25",
      "1.10",
      "0.80",
    ]);
    expect(result.rows[0].source).toContain(oe.name);
    expect(result.rows[0].source).toContain(offer.name);
    offer = s.getState().documents.find((d) => d.id === offer.id)!;
    offer = await s.reviewPairs(
      offer.id,
      offer.pairs.map((pair) => ({ ...pair, description: "Item berbeda" })),
      offer.revision,
    );
    await s.confirmPairs(offer.id, offer.revision, true);
    await expect(
      s.evaluateDeviation("proc-terminal", oe.id, offer.id),
    ).rejects.toMatchObject({ code: "UNAVAILABLE" });
    expect(s.getState().snapshots[0]).toEqual(result);
  });
  it("requires source groups, separates unresolved rows, and rejects free edits", async () => {
    const s = createTestSession();
    let oe = s.getState().documents.find((d) => d.kind === "OE")!;
    let offer = s.getState().documents.find((d) => d.kind === "OFFER")!;
    await expect(s.confirmPairs(offer.id, 1)).rejects.toMatchObject({
      code: "GROUP_REQUIRED",
    });
    oe = await s.selectGroup(oe.id, "Harga satuan material dan jasa", 1);
    await s.confirmDocument(oe.id, oe.revision, true);
    offer = await s.selectGroup(offer.id, "Harga satuan material dan jasa", 1);
    await s.confirmPairs(offer.id, offer.revision, true);
    const result = await s.evaluateDeviation("proc-terminal", oe.id, offer.id);
    expect(result.status).toBe("PARTIAL");
    expect(result.rows.map((r) => r.classification)).toEqual([
      "TIMPANG",
      "TIDAK_TIMPANG",
    ]);
    expect(result.excluded).toEqual(["Katup gate 4 inci"]);
    offer = s.getState().documents.find((d) => d.id === offer.id)!;
    offer = await s.reviewPairs(
      offer.id,
      offer.pairs.map((p) => ({ ...p, offer: "1" })),
      offer.revision,
    );
    await s.confirmPairs(offer.id, offer.revision, true);
    await expect(
      s.evaluateDeviation("proc-terminal", oe.id, offer.id),
    ).rejects.toMatchObject({ code: "UNAVAILABLE" });
  });
});
describe("historical references", () => {
  it("requires metadata and confirmation before publication", async () => {
    const s = createTestSession();
    const doc = await s.uploadRegisteredDocument({
      procurementId: "proc-tank",
      kind: "HISTORICAL_OE",
      fixtureId: "history-2024",
      name: "history.xlsx",
    });
    await expect(s.publishHistory(doc.id, 1)).rejects.toMatchObject({
      code: "CONFIRMATION_REQUIRED",
    });
    const updated = await s.setHistoricalMetadata(
      doc.id,
      { functionName: "Maintenance", period: "2024" },
      1,
    );
    await s.confirmDocument(doc.id, updated.revision);
    await s.publishHistory(doc.id, updated.revision);
    await expect(
      s.publishHistory(doc.id, updated.revision),
    ).rejects.toMatchObject({ code: "DUPLICATE" });
  });
  it("exposes historical source rows and prepared statistics through service only", async () => {
    const s = createTestSession();
    const doc = await s.uploadRegisteredDocument({
      procurementId: "proc-tank",
      kind: "HISTORICAL_OE",
      fixtureId: "history-2025",
      name: "renamed.xlsx",
    });
    expect(doc.period).toBe("2025");
    expect(doc.historicalItems?.[0]).toMatchObject({
      documentName: "renamed.xlsx",
      period: "2025",
      description: "Pengecatan tangki",
      unit: "m²",
      price: "90000",
      source: "Harga · E5",
    });
    const ids = s.getState().historicalItems.map((item) => item.id);
    expect(s.getPreparedStatistics(ids)).toBeUndefined();
    for (const id of ids) await s.setComparable(id, true);
    const stats = s.getPreparedStatistics(ids.slice().reverse());
    expect(stats?.observations.map((o) => o.period)).toEqual([
      "2024",
      "2025",
      "2026",
    ]);
    expect(stats?.chart.points.map((p) => p.price)).toEqual([
      "85000",
      "90000",
      "95000",
    ]);
    await s.setComparable(ids[0], false);
    expect(s.getPreparedStatistics(ids)).toBeUndefined();
  });
  it("exports prepared statistics only for complete matching references", async () => {
    const s = createTestSession();
    const ids = s.getState().historicalItems.map((i) => i.id);
    for (const id of ids) await s.setComparable(id, true);
    const complete = await s.createBankSnapshot(ids);
    expect(complete.inputs).toMatchObject({
      statistics: { min: "85000", median: "90000", max: "95000" },
    });
    const partial = await s.createBankSnapshot([ids[0]]);
    expect(partial.inputs).not.toHaveProperty("statistics");
  });
  it("estimates from all matching-unit references even when caller selection is incomplete", async () => {
    const s = createTestSession();
    const before = structuredClone(s.getState().historicalItems);
    const input = { description: "Kebutuhan baru", unit: "m²", quantity: "17", referenceIds: [] };
    const result = await s.estimate(input);
    expect(result).toMatchObject({ total: "1530000", referenceIds: before.map(item => item.id) });
    expect(s.getState().historicalItems).toEqual(before);
    await expect(s.estimate({ ...input, unit: "unit" })).rejects.toMatchObject({ code: "INSUFFICIENT_DATA" });
    expect(s.getState().estimates).toHaveLength(1);
  });
});
