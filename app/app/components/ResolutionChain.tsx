import React, { useCallback } from "react";
import type {
  ContextualResolution,
  DSDBSystem,
  ResolvedValue,
  Token,
  Value,
} from "../utils/dsdb";
import { rgbToHex } from "../utils/dsdb";

// A small component to render the color swatch.
const ColorSwatch: React.FC<{ value: ResolvedValue | null }> = ({ value }) => {
  if (value && "color" in value && value.color) {
    const hex = rgbToHex(value.color.red, value.color.green, value.color.blue);
    return (
      <div
        className="w-4 h-4 rounded-full border border-gray-300 shadow-inner inline-block mr-2"
        style={{ backgroundColor: hex, opacity: value.color.alpha ?? 1 }}
      />
    );
  }
  // Return a placeholder for non-color values for alignment.
  return (
    <div className="w-4 h-4 rounded-full border border-gray-200 bg-gray-100 inline-block mr-2" />
  );
};

// Renders a single token in the resolution chain as a "chip".
const ChainNode: React.FC<{
  token: Token;
  finalValue: ResolvedValue | null;
}> = ({ token, finalValue }) => {
  const showSwatch = token.tokenValueType === "COLOR";

  return (
    <div className="flex items-center p-1.5 bg-gray-100 border border-gray-200 rounded-lg w-auto hover:bg-gray-200">
      {showSwatch && <ColorSwatch value={finalValue} />}
      {!showSwatch && (
        <div className="w-4 h-4 inline-block mr-2" /> // Placeholder for alignment
      )}
      <p className="font-mono text-xs text-gray-800">{token.tokenName}</p>
    </div>
  );
};

interface ResolutionChainProps {
  chain: ContextualResolution[];
  system: DSDBSystem | null;
  renderValueContent: (resolvedValue: ResolvedValue) => React.ReactNode;
}

// A compact, horizontal arrow.
const Arrow = () => (
  <div className="flex items-center justify-center mx-1.5">
    <svg
      className="w-4 h-4 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  </div>
);

// The main component to display the entire resolution chain.
const ResolutionChain: React.FC<ResolutionChainProps> = ({
  chain,
  system,
  renderValueContent,
}) => {
  const getTagName = useCallback(
    (tag: string) => {
      return system?.tags.find((e) => e.name === tag)?.displayName ?? tag;
    },
    [system]
  );

  if (!system || !chain || chain.length === 0) {
    return (
      <div className="mt-2">
        <h4 className="text-xs font-semibold text-gray-600 mb-1">
          Resolution Path
        </h4>
        <p className="text-gray-500 italic text-xs">
          No resolution information available for this token.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {chain.map((resolution, index) => {
        // Each `resolution` object corresponds to one context (e.g., light mode).
        const finalResolvedValue = resolution.resolvedValue;

        // The resolutionChain contains references. We need to find the corresponding
        // value and token objects in the DSDB system data.
        const resolvedChain = resolution.resolutionChain
          .map((ref) => {
            const value = system.values.find((v) => v.name === ref.name);
            // We only care about references that are tokens (aliases).
            // The final raw value is handled by `finalResolvedValue`.
            if (!value || !value.tokenName) {
              return null;
            }
            const token = system.tokens.find(
              (t) => t.tokenName === value.tokenName
            );
            if (!token) {
              return null;
            }
            return { value, token };
          })
          .filter((item): item is { value: Value; token: Token } => !!item);

        return (
          <div
            key={index}
            className="p-3 bg-gray-50/50 rounded-lg border border-gray-200"
          >
            {/* Display context tags if they exist */}
            {resolution.contextTags && resolution.contextTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {resolution.contextTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-mono bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full"
                  >
                    {getTagName(tag)}
                  </span>
                ))}
              </div>
            )}

            {/* Render the resolution path or just the final value */}
            {resolvedChain.length > 0 ? (
              <div className="flex flex-row items-center flex-wrap gap-y-2">
                {resolvedChain.map(({ value, token }, idx) => (
                  <React.Fragment key={value.name}>
                    <ChainNode token={token} finalValue={finalResolvedValue} />
                    {idx < resolvedChain.length - 1 && <Arrow />}
                  </React.Fragment>
                ))}
                {finalResolvedValue && (
                  <>
                    <Arrow />
                    <div className="flex items-center p-1.5 bg-blue-100 border border-blue-200 rounded-lg w-auto">
                      {renderValueContent(finalResolvedValue)}
                    </div>
                  </>
                )}
              </div>
            ) : finalResolvedValue ? (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-md w-full">
                {renderValueContent(finalResolvedValue)}
              </div>
            ) : (
              <p className="text-gray-500 italic text-xs">
                No value resolved for this context.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ResolutionChain;
