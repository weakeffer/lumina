import React from 'react';
import { Star, Trash2, Folder, Calendar, MoreVertical, Pin, Tag } from 'lucide-react';
import { useTheme } from '../../../shared/context/ThemeContext';

const NoteItem = ({ 
  note, 
  isSelected, 
  onSelect, 
  onDelete, 
  onToggleFavorite,
  viewMode = 'grid', // 'grid', 'list', 'compact'
  isSelectedForBulk = false,
  onToggleSelection,
  isBulkMode = false,
  groups = []
}) => {
  const { themeClasses } = useTheme();

  const getGroupInfo = () => {
    const groupId = note.group || note.group_id;
    const group = groups.find(g => g.id === groupId || g.id === parseInt(groupId));
    return {
      name: group?.name || 'Без группы',
      color: group?.color || 'gray'
    };
  };

  const groupInfo = getGroupInfo();

  const groupColors = {
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800'
  };

  const handleClick = (e) => {
    if (isBulkMode) {
      onToggleSelection?.(note.id);
    } else {
      onSelect(note);
    }
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onToggleFavorite(note.id);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(note.id);
  };

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    onToggleSelection?.(note.id);
  };

  // Компактный режим для сайдбара
  if (viewMode === 'compact') {
    return (
      <div
        onClick={handleClick}
        className={`
          group flex items-center px-2 py-1.5 rounded-md cursor-pointer
          transition-all duration-200 text-sm
          ${isSelected 
            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-2 border-indigo-500' 
            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-2 border-transparent'
          }
          ${isSelectedForBulk ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}
        `}
      >
        {isBulkMode && (
          <input
            type="checkbox"
            checked={isSelectedForBulk}
            onChange={handleCheckboxClick}
            className="mr-2 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
        )}
        <div className="flex-1 min-w-0 flex items-center">
          {note.isFavorite && (
            <Star className="w-3 h-3 text-yellow-500 mr-1.5 shrink-0" fill="currentColor" />
          )}
          <span className="truncate font-medium">
            {note.title || 'Без названия'}
          </span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-0.5 ml-1">
          <button
            onClick={handleFavoriteClick}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <Star className={`w-3 h-3 ${note.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
          </button>
          <button
            onClick={handleDeleteClick}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded hover:text-red-500"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  // Сетка (grid view)
  if (viewMode === 'grid') {
    return (
      <div
        onClick={handleClick}
        className={`
          group relative rounded-xl overflow-hidden
          ${themeClasses?.colors?.bg?.secondary || 'bg-white dark:bg-gray-800'}
          border ${themeClasses?.colors?.border?.primary || 'border-gray-200 dark:border-gray-700'}
          hover:shadow-lg transition-all duration-300
          transform hover:-translate-y-1 cursor-pointer
          ${isSelected ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''}
          ${isSelectedForBulk ? 'ring-2 ring-indigo-300 dark:ring-indigo-600' : ''}
        `}
      >
        {isBulkMode && (
          <div className="absolute top-2 left-2 z-20">
            <input
              type="checkbox"
              checked={isSelectedForBulk}
              onChange={handleCheckboxClick}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Верхний градиент для избранного */}
        {note.isFavorite && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-yellow-400 to-yellow-500" />
        )}

        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={handleFavoriteClick}
            className={`p-2 rounded-full ${
              note.isFavorite 
                ? 'text-yellow-500 bg-yellow-500/10' 
                : 'text-gray-400 bg-gray-500/10 hover:text-yellow-500'
            }`}
          >
            <Star className="w-4 h-4" fill={note.isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={handleDeleteClick}
            className="p-2 rounded-full text-gray-400 bg-gray-500/10 hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <h3 className={`font-semibold text-lg mb-2 truncate pr-8 ${themeClasses?.colors?.text?.primary || 'text-gray-900 dark:text-gray-100'}`}>
            {note.title || 'Без названия'}
          </h3>
          
          <p className={`text-sm ${themeClasses?.colors?.text?.secondary || 'text-gray-600 dark:text-gray-400'} line-clamp-3 mb-3`}>
            {note.text || note.content || 'Нет содержимого'}
          </p>

          {/* Теги */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {note.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
              {note.tags.length > 3 && (
                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                  +{note.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Группа и дата */}
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className={`inline-flex items-center px-2 py-1 rounded-full ${groupColors[groupInfo.color] || groupColors.gray}`}>
              <Folder className="w-3 h-3 mr-1" />
              <span className="truncate max-w-24">{groupInfo.name}</span>
            </span>
            <span className="text-gray-500 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(note.updated_at || note.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Список (list view)
  return (
    <div
      onClick={handleClick}
      className={`
        group flex items-start p-4 rounded-lg
        border ${themeClasses?.colors?.border?.primary || 'border-gray-200 dark:border-gray-700'}
        ${themeClasses?.colors?.bg?.secondary || 'bg-white dark:bg-gray-800'}
        hover:shadow-md transition-all duration-200 cursor-pointer
        ${isSelected ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''}
        ${isSelectedForBulk ? 'ring-2 ring-indigo-300 dark:ring-indigo-600' : ''}
      `}
    >
      {isBulkMode && (
        <div className="mr-3 mt-1">
          <input
            type="checkbox"
            checked={isSelectedForBulk}
            onChange={handleCheckboxClick}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
        </div>
      )}

      {/* Индикатор избранного */}
      {note.isFavorite && !isBulkMode && (
        <div className="mr-3 mt-1">
          <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center mb-1">
          <h3 className={`font-semibold text-base truncate ${themeClasses?.colors?.text?.primary || 'text-gray-900 dark:text-gray-100'}`}>
            {note.title || 'Без названия'}
          </h3>
        </div>

        <p className={`text-sm ${themeClasses?.colors?.text?.secondary || 'text-gray-600 dark:text-gray-400'} line-clamp-2 mb-2`}>
          {note.text || note.content || 'Нет содержимого'}
        </p>

        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Группа */}
          <span className={`inline-flex items-center px-2 py-1 rounded-full ${groupColors[groupInfo.color] || groupColors.gray}`}>
            <Folder className="w-3 h-3 mr-1" />
            {groupInfo.name}
          </span>

          {/* Дата */}
          <span className="text-gray-500 flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {new Date(note.updated_at || note.created_at).toLocaleDateString()}
          </span>

          {/* Теги */}
          {note.tags && note.tags.length > 0 && (
            <span className="text-gray-500 flex items-center">
              <Tag className="w-3 h-3 mr-1" />
              {note.tags.length} {note.tags.length === 1 ? 'тег' : 'тегов'}
            </span>
          )}
        </div>
      </div>

      {/* Действия */}
      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
        <button
          onClick={handleFavoriteClick}
          className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${
            note.isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
          }`}
        >
          <Star className="w-4 h-4" fill={note.isFavorite ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={handleDeleteClick}
          className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-500"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default NoteItem;