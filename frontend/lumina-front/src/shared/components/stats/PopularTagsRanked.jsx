import React from 'react';

/**
 * Теги с горизонтальными полосками частоты.
 * @param {{ tag: string, count: number }[]} rankedTags
 */
export function PopularTagsRanked({ rankedTags, barClassName = 'bg-indigo-500' }) {
  if (!rankedTags?.length) return null;
  const maxC = Math.max(...rankedTags.map((t) => t.count), 1);

  return (
    <div className="space-y-2">
      {rankedTags.map(({ tag, count }) => (
        <div key={tag} className="flex items-center gap-2">
          <span className="text-sm flex-1 truncate">#{tag}</span>
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${barClassName} rounded-full`}
                style={{ width: `${(count / maxC) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{count}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
