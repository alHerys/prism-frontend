import { bankMoney as money } from "../../../shared/formatting/display";
import type { BankPageModel } from "./view-models";

export function ReferencePriceChart({ statistics }: { statistics: NonNullable<BankPageModel["statistics"]> }) {
  const label = `Harga ${statistics.description.toLowerCase()}: ${statistics.observations.map((item) => `${item.period} ${money(item.price)}`).join(", ")}`;
  const phoneX = (x: number) => 80 + ((x - 80) / 570) * 260;

  return (
    <figure className="bank-figure" role="img" aria-label={label}>
      <svg className="bank-chart bank-chart-desktop" viewBox="0 0 720 220" aria-hidden="true">
        {statistics.chart.ticks.map((tick) => (
          <g key={tick.price}>
            <line x1="80" y1={tick.y} x2="650" y2={tick.y} />
            <text x="0" y={tick.y + 4}>{money(tick.price)}</text>
          </g>
        ))}
        <path d={statistics.chart.points.map((point, index) => `${index ? "L" : "M"}${point.x} ${point.y}`).join(" ")} />
        {statistics.chart.points.map((point) => (
          <g key={point.period}>
            <circle cx={point.x} cy={point.y} r="6" />
            <text x={point.x} y="208" textAnchor="middle">{point.period}</text>
          </g>
        ))}
      </svg>
      <svg className="bank-chart bank-chart-phone" viewBox="0 0 360 220" aria-hidden="true">
        {statistics.chart.ticks.map((tick) => (
          <g key={tick.price}>
            <line x1="80" y1={tick.y} x2="340" y2={tick.y} />
            <text x="0" y={tick.y + 4}>{money(tick.price)}</text>
          </g>
        ))}
        <path d={statistics.chart.points.map((point, index) => `${index ? "L" : "M"}${phoneX(point.x)} ${point.y}`).join(" ")} />
        {statistics.chart.points.map((point) => (
          <g key={point.period}>
            <circle cx={phoneX(point.x)} cy={point.y} r="6" />
            <text x={phoneX(point.x)} y="208" textAnchor="middle">{point.period}</text>
          </g>
        ))}
      </svg>
      <figcaption>{statistics.description} · rupiah per {statistics.unit}. Harga historis bukan penetapan harga pasar.</figcaption>
    </figure>
  );
}
