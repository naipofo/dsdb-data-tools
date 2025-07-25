import React from "react";
import type { Component } from "../DsdbManager";

interface ComponentTileProps {
  component: Component;
  onSelect: (component: Component) => void;
}

const ComponentTile: React.FC<ComponentTileProps> = ({
  component,
  onSelect,
}) => {
  const { displayName, name, componentImage } = component;
  const imageUrl = componentImage?.imageUrl;

  return (
    <div
      onClick={() => onSelect(component)}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer group hover:shadow-lg hover:border-blue-400 transition-all duration-200 flex flex-col"
    >
      <div className="w-full h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`Image of ${displayName || name}`}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="text-gray-400 text-center p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="mt-2 text-xs block">No Image</span>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-200">
        <h3
          className="font-semibold text-gray-800 truncate"
          title={displayName || name}
        >
          {displayName || name}
        </h3>
      </div>
    </div>
  );
};

export default ComponentTile;
