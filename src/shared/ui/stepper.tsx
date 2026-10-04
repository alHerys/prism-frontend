import { Check } from "@phosphor-icons/react/dist/csr/Check";

export function Stepper({ stage }: { stage: number }) {
  return (
    <nav className="stepper" aria-label="Progres evaluasi">
      {["Dokumen", "Review", "Konfirmasi", "Evaluasi", "Hasil"].map((x, i) => (
        <div
          key={x}
          className={`step ${i < stage ? "done" : i === stage ? "current" : ""}`}
          aria-current={i === stage ? "step" : undefined}
        >
          <i>{i < stage ? <Check size={13} /> : i + 1}</i>
          {x}
        </div>
      ))}
    </nav>
  );
}
