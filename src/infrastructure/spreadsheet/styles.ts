import { tintColor } from "./colors";
import type { CellStyle } from "./style-types";
import { child, elements } from "../owner-estimate/ooxml";

const builtins: Record<number, string> = { 2: "0.00", 4: "#,##0.00", 38: "#,##0.00", 40: "#,##0.00", 43: '#,##0.00;(#,##0.00);"-"', 44: '#,##0.00;(#,##0.00);"-"' };
// Excel's theme indices differ from the order of nodes in clrScheme.
const themeNames = ["lt1", "dk1", "lt2", "dk2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"];
function color(node: Element | undefined, theme?: Document): string | undefined {
  if (!node) return;
  let rgb = node.getAttribute("rgb")?.slice(-6);
  if (!rgb && theme) {
    const index = Number(node.getAttribute("theme"));
    const entry = elements(theme, themeNames[index] ?? "")[0]?.children[0];
    rgb = entry?.getAttribute("lastClr") ?? entry?.getAttribute("val") ?? undefined;
  }
  if (!rgb || !/^[0-9a-f]{6}$/i.test(rgb)) return;
  return tintColor(rgb, Number(node.getAttribute("tint") ?? 0));
}
export function readCellStyles(styles?: Document, theme?: Document): Map<number, CellStyle> {
  if (!styles) return new Map();
  const fonts = elements(styles, "fonts")[0]?.children;
  const fills = elements(styles, "fills")[0]?.children;
  const borders = elements(styles, "borders")[0]?.children;
  const custom = new Map(elements(styles, "numFmt").map(f => [Number(f.getAttribute("numFmtId")), f.getAttribute("formatCode") ?? ""]));
  return new Map([...elements(styles, "cellXfs")[0].children].map((xf, index) => {
    const font = fonts?.[Number(xf.getAttribute("fontId"))];
    const fill = fills?.[Number(xf.getAttribute("fillId"))];
    const border = borders?.[Number(xf.getAttribute("borderId"))];
    const bottom = border && child(border, "bottom")?.getAttribute("style");
    const numFmt = Number(xf.getAttribute("numFmtId"));
    const format = custom.get(numFmt) ?? builtins[numFmt] ?? "#,##0";
    return [index, {
      appearance: { background: fill && elements(fill, "patternFill")[0]?.getAttribute("patternType") === "solid" ? color(elements(fill, "fgColor")[0], theme) : undefined,
        bold: !!font && !!child(font, "b"), underline: !!font && !!child(font, "u"), borderBottom: bottom === "dotted" ? "dotted" : "solid" },
      numberFormat: { decimalPlaces: Math.min(20, /[0#]\.([0#?]+)/.exec(format)?.[1].length ?? 0), zeroAsDash: /"-"/.test(format) },
    }];
  }));
}
