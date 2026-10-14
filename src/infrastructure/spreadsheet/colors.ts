/** Excel applies tint to HSL lightness, rather than interpolating RGB channels. */
export function tintColor(rgb: string, tint: number): string {
  const [red, green, blue] = [0, 2, 4].map(offset => parseInt(rgb.slice(offset, offset + 2), 16) / 255);
  const maximum = Math.max(red, green, blue), minimum = Math.min(red, green, blue);
  const difference = maximum - minimum;
  const lightness = (maximum + minimum) / 2;
  const saturation = difference === 0 ? 0 : difference / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (difference) {
    hue = maximum === red ? ((green - blue) / difference) % 6
      : maximum === green ? (blue - red) / difference + 2 : (red - green) / difference + 4;
    hue = (hue + 6) % 6;
  }
  const adjustment = Number.isFinite(tint) ? Math.max(-1, Math.min(1, tint)) : 0;
  const light = adjustment < 0 ? lightness * (1 + adjustment) : lightness + (1 - lightness) * adjustment;
  const chroma = (1 - Math.abs(2 * light - 1)) * saturation;
  const secondary = chroma * (1 - Math.abs(hue % 2 - 1));
  const offset = light - chroma / 2;
  const channels = hue < 1 ? [chroma, secondary, 0] : hue < 2 ? [secondary, chroma, 0]
    : hue < 3 ? [0, chroma, secondary] : hue < 4 ? [0, secondary, chroma]
    : hue < 5 ? [secondary, 0, chroma] : [chroma, 0, secondary];
  return "#" + channels.map(value => Math.round((value + offset) * 255).toString(16).padStart(2, "0")).join("");
}
