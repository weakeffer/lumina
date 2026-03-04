import React from 'react';
import { Trash2, Settings } from 'lucide-react';

const Footer = ({
  filteredNotesCount,
  selectedGroup,
  groups,
  selectedTags,
  deletedNotesCount,
  onToggleTrash,
  onToggleSettings,
  themeClasses,
}) => {
  return (
    <div className={`border-t px-4 py-2 text-xs flex justify-between items-center ${themeClasses.colors.text.tertiary}`}>
      <div className="flex items-center gap-2">
        <span>{filteredNotesCount} заметок</span>
        {selectedGroup && (
          <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full">
            {groups?.find(g => g.id === selectedGroup)?.name || 'Группа'}
          </span>
        )}
        {selectedTags?.length > 0 && (
          <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full">
            {selectedTags.length} тега
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        {deletedNotesCount > 0 && (
          <button
            onClick={onToggleTrash}
            className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors hover:scale-105"
          >
            <Trash2 className="w-3 h-3" />
            <span>{deletedNotesCount} в корзине</span>
          </button>
        )}
        <button
          onClick={onToggleSettings}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <Settings className="w-3 h-3" />
          <span>Настройки</span>
        </button>
      </div>
    </div>
  );
};

export default Footer;