import React from "react";
import type { DSDBSystem, ResolvedValue, Token, Value } from "../utils/dsdb";
import { rgbToHex } from "../utils/dsdb";

// A small component to render the color swatch if available, used for each step in a color token chain.
const ColorSwatch: React.FC<{ value: ResolvedValue | null }> = ({ value }) => {
  if (value && "color" in value && value.color) {
    const hex = rgbToHex(value.color.red, value.color.green, value.color.blue);
    return (
      <div
        className="w-5 h-5 rounded-md border border-gray-300 shadow-inner inline-block mr-3 flex-shrink-0"
        style={{ backgroundColor: hex, opacity: value.color.alpha ?? 1 }}
      />
    );
  }
  // Return a placeholder if not a color
  return (
    <div className="w-5 h-5 rounded-md border border-gray-200 bg-gray-100 inline-block mr-3 flex-shrink-0" />
  );
};

// Renders a single token in the resolution chain.
const ChainNode: React.FC<{
  token: Token;
  finalValue: ResolvedValue | null;
}> = ({ token, finalValue }) => {
  // If the token is a color token, show a swatch with the final resolved color.
  const showSwatch = token.tokenValueType === "COLOR";

  return (
    <div className="flex items-center p-2 bg-white border border-gray-200 rounded-md w-full hover:bg-gray-50">
      {showSwatch && <ColorSwatch value={finalValue} />}
      {!showSwatch && (
        <div className="w-5 h-5 inline-block mr-3 flex-shrink-0" /> // Placeholder for alignment
      )}
      <div>
        {/* Use the token's `tokenName` for display, which is the human-readable ID */}
        <p className="font-mono text-sm text-gray-800">{token.tokenName}</p>
      </div>
    </div>
  );
};

interface ResolutionChainProps {
  chain: string[]; // A list of Value object `name` properties (internal IDs)
  finalResolvedValue: ResolvedValue | null;
  system: DSDBSystem | null;
  renderValueContent: (resolvedValue: ResolvedValue) => React.ReactNode;
}

// A reusable arrow component for the visual chain.
const Arrow = () => (
  <div className="h-6 flex items-center justify-center w-full my-1">
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
        d="M12 5v14m0 0l-4-4m4 4l4-4"
      />
    </svg>
  </div>
);

// The main component to display the entire resolution chain for a token.
const ResolutionChain: React.FC<ResolutionChainProps> = ({
  chain,
  finalResolvedValue,
  system,
  renderValueContent,
}) => {
  // A simple view for when we just have a value but no chain.
  const FinalValueOnly = () => (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">
        Resolved Value
      </h4>
      {finalResolvedValue ? (
        <div className="p-2 bg-blue-50 border border-blue-200 rounded-md w-full">
          {renderValueContent(finalResolvedValue)}
        </div>
      ) : (
        <p className="text-gray-500 italic">No value resolved.</p>
      )}
    </div>
  );

  if (!system || !chain || chain.length === 0) {
    return <FinalValueOnly />;
  }

  // Core logic fix: Map each value ID in the chain to its corresponding
  // Value and Token objects. The link is between `value.tokenName` (the alias)
  // and `token.tokenName` (the token's unique alias).
  const resolvedChain = chain
    .map((valueId) => {
      const value = system.values.find((v) => v.name === valueId);
      // A value might not have a tokenName if it's a raw value (e.g. final hex color)
      if (!value || !value.tokenName) {
        return null;
      }
      // Find the token that this value is an alias for.
      const token = system.tokens.find((t) => t.tokenName === value.tokenName);
      if (!token) {
        return null;
      }
      return { value, token };
    })
    .filter(
      (item): item is { value: Value; token: Token } =>
        !!item && !!item.value && !!item.token
    );

  // If the chain only contained raw values with no token aliases, show the simple view.
  if (resolvedChain.length === 0) {
    return <FinalValueOnly />;
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">
        Resolution Path
      </h4>
      <div className="flex flex-col items-start">
        {resolvedChain.map(({ value, token }, index) => (
          <React.Fragment key={value.name}>
            <ChainNode token={token} finalValue={finalResolvedValue} />
            {/* Show arrow if not the last item in the chain */}
            {index < resolvedChain.length && <Arrow />}
          </React.Fragment>
        ))}

        {/* Display the final resolved value at the end of the chain */}
        {finalResolvedValue && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded-md w-full">
            {renderValueContent(finalResolvedValue)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResolutionChain;
