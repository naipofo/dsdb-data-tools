import type { ContextTagGroup, Tag } from "../DsdbManager";

interface ContextSelectorProps {
  contextTagGroups: ContextTagGroup[];
  tags: Tag[];
  selectedContext: Record<string, string>;
  onContextChange: (groupName: string, tagName: string) => void;
}

export default function ContextSelector({
  contextTagGroups,
  tags,
  selectedContext,
  onContextChange,
}: ContextSelectorProps) {
  const tagsByGroup = contextTagGroups.map((group) => {
    const groupTags = tags
      .filter((tag) => tag.name.startsWith(group.name + "/tags/"))
      .sort((a, b) => parseInt(a.tagOrder) - parseInt(b.tagOrder));
    return { ...group, tags: groupTags };
  });

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
      <h2 className="text-lg font-semibold mb-2">See more values</h2>
      <p className="text-sm text-gray-600 mb-4">
        Compare token values by selecting another context
      </p>
      <div className="space-y-4">
        {tagsByGroup.map((group) => (
          <div key={group.name}>
            <h3 className="font-semibold text-gray-700 mb-2">
              {group.displayName}
            </h3>
            <div className="inline-flex items-center p-1 bg-purple-100 rounded-full">
              {group.tags.map((tag) => {
                const isSelected = selectedContext[group.name] === tag.name;
                return (
                  <button
                    key={tag.name}
                    onClick={() => onContextChange(group.name, tag.name)}
                    className={`px-4 py-1.5 text-sm rounded-full font-medium transition-colors flex items-center focus:outline-none ${
                      isSelected
                        ? "bg-purple-600 text-white shadow"
                        : "text-purple-700 hover:bg-purple-200"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="w-4 h-4 mr-1.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                    )}
                    {tag.displayName}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
