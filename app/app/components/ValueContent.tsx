import React from "react";
import type { ResolvedValue } from "../utils/dsdb";
import { rgbToHex } from "../utils/dsdb";

interface ValueContentProps {
  value: ResolvedValue | null;
}

/**
 * Renders a visual representation of a resolved token value,
 * such as a color swatch for colors, or dimensions for lengths.
 */
const ValueContent: React.FC<ValueContentProps> = ({ value }) => {
  if (!value) {
    return <span className="text-gray-500">N/A</span>;
  }

  if (value.color) {
    const hexColor = rgbToHex(
      value.color.red,
      value.color.green,
      value.color.blue
    );
    return (
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-full border border-gray-300"
          style={{ backgroundColor: hexColor }}
        ></div>
        <span>
          {hexColor} (Alpha:{" "}
          {value.color.alpha !== undefined
            ? value.color.alpha.toFixed(2)
            : "N/A"}
          )
        </span>
      </div>
    );
  }

  if (value.length) {
    return (
      <span>
        {value.length.value}
        {value.length.unit}
      </span>
    );
  }

  if (typeof value.opacity === "number") {
    return <span>Opacity: {value.opacity.toFixed(2)}</span>;
  }

  // Handle other potential value types that might not be strictly typed yet.
  // This provides graceful degradation for complex or undocumented value types.
  if (Object.keys(value).length > 0) {
    return (
      <pre className="whitespace-pre-wrap break-words text-xs bg-gray-100 p-2 rounded border border-gray-200 mt-1">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return <span className="text-gray-500">Complex or unknown value</span>;
};

export default ValueContent;
