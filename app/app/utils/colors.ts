/**
 * Converts RGB color components to a hex color string.
 * @param r - Red component (0-1)
 * @param g - Green component (0-1)
 * @param b - Blue component (0-1)
 * @returns The hex color string (e.g., "#RRGGBB").
 */
export const rgbToHex = (r?: number, g?: number, b?: number): string => {
  if (r === undefined || g === undefined || b === undefined) return "#000000";
  const toHex = (c: number): string => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};
