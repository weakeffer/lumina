import React from 'react';
import { Star, Trash2, Folder } from 'lucide-react';
import { useTheme } from './ThemeContext';

const NoteItem = ({ note, isSelected, onSelect, onDelete, onToggleFavorite }) => {
  const { themeClasses } = useTheme();

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onToggleFavorite(note.id);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(note.id);
  };

  const groupColors = {
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
  };

  return (
    <div
      onClick={() => onSelect(note)}
      className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800' 
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent'
      }`}
    >
      <div className="pr-16">
        <h3 className="font-medium truncate group-hover:text-indigo-500 transition-colors">
          {note.title || 'Без названия'}
        </h3>
        <p className={`text-sm ${themeClasses.colors.text.secondary} truncate`}>
          {note.text}
        </p>
        
        {/* Отображение группы */}
        {note.group_name && (
          <div className="flex items-center gap-1 mt-1">
            <span className={`text-xs px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
              groupColors[note.group_color] || groupColors.gray
            }`}>
              <Folder className="w-3 h-3" />
              {note.group_name}
            </span>
          </div>
        )}
        
        {/* Теги */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex gap-1 mt-1">
            {note.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                #{tag}
              </span>
            ))}
            {note.tags.length > 2 && (
              <span className="text-xs text-gray-500">+{note.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>
      
      {/* Действия */}
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-inherit rounded-lg p-1">
        <button 
          onClick={handleFavoriteClick}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
        >
          <Star className={`w-4 h-4 ${note.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
        </button>
        <button 
          onClick={handleDeleteClick}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors hover:text-red-500"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default NoteItem;