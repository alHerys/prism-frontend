import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask, TextLayer } from "pdfjs-dist";
import { CaretLeft } from "@phosphor-icons/react/dist/csr/CaretLeft";
import { CaretRight } from "@phosphor-icons/react/dist/csr/CaretRight";
import { Minus } from "@phosphor-icons/react/dist/csr/Minus";
import { Plus } from "@phosphor-icons/react/dist/csr/Plus";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import "./pdf-preview.css";

// Keep the renderer out of the application's initial bundle. The worker and
// document stay on this origin; this preview never supplies extracted values.
function engine() {
  return import("pdfjs-dist").then(pdf => {
    pdf.GlobalWorkerOptions.workerSrc = workerUrl;
    return pdf;
  });
}

export function PdfPreview({ url, name }: { url: string; name: string }) {
  const [document, setDocument] = useState<PDFDocumentProxy>();
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const viewport = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = viewport.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    // Observe the outer box, not the content width changed by its scrollbar.
    // Otherwise hiding the page while rendering can cause a resize/render loop.
    const observer = new ResizeObserver(([entry]) => setWidth(entry.borderBoxSize[0]?.inlineSize ?? element.getBoundingClientRect().width));
    observer.observe(element, { box: "border-box" });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    let task: ReturnType<typeof import("pdfjs-dist")["getDocument"]> | undefined;
    setDocument(undefined);
    setLoading(true);
    setError(false);
    setPage(1);
    setZoom(1);
    // jsdom has no layout/canvas. Rendering is verified with the real browser.
    if (typeof ResizeObserver === "undefined") return;
    void engine().then(pdf => {
      if (!active) return;
      task = pdf.getDocument({ url });
      return task.promise;
    }).then(pdf => { if (active && pdf) setDocument(pdf); }).catch(() => {
      if (active) { setError(true); setLoading(false); }
    });
    return () => { active = false; void task?.destroy(); };
  }, [url, attempt]);

  useEffect(() => {
    if (!document || !width || !surface.current) return;
    let active = true;
    let rendering: RenderTask | undefined;
    let text: TextLayer | undefined;
    const container = surface.current;
    setLoading(true);
    setError(false);
    container.replaceChildren();
    void Promise.all([document.getPage(page), engine()]).then(async ([pdfPage, pdf]) => {
      if (!active) return;
      const natural = pdfPage.getViewport({ scale: 1 });
      const scale = Math.min(1.25, Math.max(100, width - 56) / natural.width) * zoom;
      const pageViewport = pdfPage.getViewport({ scale });
      const canvas = window.document.createElement("canvas");
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(pageViewport.width * ratio);
      canvas.height = Math.ceil(pageViewport.height * ratio);
      canvas.style.width = `${pageViewport.width}px`;
      canvas.style.height = `${pageViewport.height}px`;
      canvas.setAttribute("aria-hidden", "true");
      container.style.width = `${pageViewport.width}px`;
      container.style.height = `${pageViewport.height}px`;
      container.style.setProperty("--total-scale-factor", String(scale));
      container.append(canvas);
      rendering = pdfPage.render({ canvas, viewport: pageViewport, transform: [ratio, 0, 0, ratio, 0, 0] });
      await rendering.promise;
      if (!active) return;
      const layer = window.document.createElement("div");
      layer.className = "pdf-text-layer";
      container.append(layer);
      text = new pdf.TextLayer({ container: layer, viewport: pageViewport, textContentSource: pdfPage.streamTextContent() });
      await text.render();
      if (active) setLoading(false);
    }).catch(() => { if (active) { setError(true); setLoading(false); } });
    return () => { active = false; rendering?.cancel(); text?.cancel(); };
  }, [document, page, width, zoom]);

  return (
    <div className="review-pdf-preview pdf-preview" data-source-url={url} aria-label={`Preview PDF ${name}`}>
      <div className="pdf-preview-toolbar" role="toolbar" aria-label="Kontrol PDF">
        <button type="button" aria-label="Halaman sebelumnya" disabled={!document || page === 1} onClick={() => setPage(page - 1)}><CaretLeft /></button>
        <span>Halaman {page} / {document?.numPages ?? "…"}</span>
        <button type="button" aria-label="Halaman berikutnya" disabled={!document || page === document.numPages} onClick={() => setPage(page + 1)}><CaretRight /></button>
        <span className="pdf-toolbar-divider" aria-hidden="true" />
        <button type="button" aria-label="Perkecil PDF" disabled={!document || zoom <= .5} onClick={() => setZoom(Math.max(.5, zoom - .25))}><Minus /></button>
        <button type="button" className="pdf-fit" title="Sesuaikan lebar" disabled={!document} onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
        <button type="button" aria-label="Perbesar PDF" disabled={!document || zoom >= 2.5} onClick={() => setZoom(Math.min(2.5, zoom + .25))}><Plus /></button>
      </div>
      <div className="pdf-preview-viewport" ref={viewport} tabIndex={0} aria-label="Halaman PDF" aria-busy={loading}>
        {loading && !error && <p className="pdf-preview-status" role="status">Memuat PDF…</p>}
        {error && <div className="pdf-preview-status" role="alert"><p>PDF belum dapat ditampilkan.</p><button type="button" onClick={() => setAttempt(attempt + 1)}>Coba lagi</button> <a href={url} target="_blank" rel="noreferrer">Buka berkas</a></div>}
        <div className="pdf-preview-page" ref={surface} hidden={loading || error} data-rendered={!loading && !error} />
      </div>
    </div>
  );
}
