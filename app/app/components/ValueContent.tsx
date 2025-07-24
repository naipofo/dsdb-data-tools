import React from "react";
import type { Length, ResolvedValue } from "../utils/dsdb";
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

  // Helper to render Length-based values
  const renderLength = (val: Length, label?: string) => (
    <span className="text-sm">
      {label && (
        <strong className="font-medium text-gray-700">{label}: </strong>
      )}
      <span className="font-mono text-blue-600">
        {val.value.toFixed(2)} {val.unit}
      </span>
    </span>
  );

  // Type guard for Color
  if ("color" in value && value.color) {
    const hexColor = rgbToHex(
      value.color.red,
      value.color.green,
      value.color.blue
    );
    const alpha = value.color.alpha ?? 1;
    return (
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-md border border-gray-300 shadow-inner"
          style={{ backgroundColor: hexColor, opacity: alpha }}
        ></div>
        <div className="text-sm">
          <span className="font-mono font-medium">{hexColor}</span>
          <span className="text-gray-600 ml-2">
            (Alpha: {alpha.toFixed(2)})
          </span>
        </div>
      </div>
    );
  }

  // Type guards for Length-based values
  if ("length" in value && value.length) return renderLength(value.length);
  if ("fontSize" in value && value.fontSize)
    return renderLength(value.fontSize, "Font Size");
  if ("fontTracking" in value && value.fontTracking)
    return renderLength(value.fontTracking, "Tracking");
  if ("lineHeight" in value && value.lineHeight)
    return renderLength(value.lineHeight, "Line Ht");
  if ("elevation" in value && value.elevation)
    return renderLength(value.elevation, "Elevation");

  // Type guards for simple numeric values
  if ("opacity" in value && typeof value.opacity === "number") {
    return <span className="text-sm">Opacity: {value.opacity.toFixed(2)}</span>;
  }
  if ("numeric" in value && typeof value.numeric === "number") {
    return <span className="text-sm">Value: {value.numeric}</span>;
  }
  if ("fontWeight" in value && typeof value.fontWeight === "number") {
    return <span className="text-sm">Font Weight: {value.fontWeight}</span>;
  }

  // Type guard for font names
  if ("fontNames" in value && value.fontNames) {
    return (
      <div className="text-sm">
        <strong className="font-medium text-gray-700">Font Names:</strong>
        <ul className="list-disc list-inside pl-2 font-mono">
          {value.fontNames.values.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </div>
    );
  }

  if ("undefined" in value) {
    return <span className="text-gray-500 italic">Undefined Value</span>;
  }

  // Fallback for other potential value types.
  // This provides graceful degradation for complex or unhandled types like Shape, Type, etc.
  return (
    <pre className="whitespace-pre-wrap break-words text-xs bg-gray-100 p-2 rounded border border-gray-200 mt-1">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
};

export default ValueContent;
