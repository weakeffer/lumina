import React from 'react';
import { Star, Trash2, Folder } from 'lucide-react';
import { useTheme } from '../../../../pages/notes/ThemeContext';

const NoteGridView = ({ 
  notes, 
  onNoteSelect, 
  onToggleFavorite, 
  onNoteDelete,
  groups = [] 
}) => {
  const { themeClasses } = useTheme();

  const getGroupName = (groupId) => {
    const group = groups.find(g => g.id === groupId || g.id === parseInt(groupId));
    return group?.name || 'Без группы';
  };

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 p-4">
        <p className="text-lg">Нет заметок для отображения</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {notes.map(note => (
        <div
          key={note.id}
          className={`
            group relative rounded-xl overflow-hidden
            ${themeClasses?.colors?.bg?.secondary || 'bg-white dark:bg-gray-800'}
            border ${themeClasses?.colors?.border?.primary || 'border-gray-200 dark:border-gray-700'}
            hover:shadow-lg transition-all duration-300
            transform hover:-translate-y-1 cursor-pointer
          `}
          onClick={() => onNoteSelect(note)}
        >
          <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(note.id);
              }}
              className={`p-2 rounded-full ${
                note.isFavorite 
                  ? 'text-yellow-500 bg-yellow-500/10' 
                  : 'text-gray-400 bg-gray-500/10 hover:text-yellow-500'
              }`}
            >
              <Star className="w-4 h-4" fill={note.isFavorite ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNoteDelete(note);
              }}
              className="p-2 rounded-full text-gray-400 bg-gray-500/10 hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3">
            <h3 className={`font-semibold text-base mb-1 truncate ${themeClasses?.colors?.text?.primary || 'text-gray-900 dark:text-gray-100'}`}>
              {note.title || 'Без названия'}
            </h3>
            
            <p className={`text-sm ${themeClasses?.colors?.text?.secondary || 'text-gray-600 dark:text-gray-400'} line-clamp-2 mb-2`}>
              {note.text || note.content || 'Нет содержимого'}
            </p>

            <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Folder className="w-3 h-3" />
                <span className="truncate max-w-30">{getGroupName(note.group || note.group_id)}</span>
              </div>
              <span className="text-xs">
                {new Date(note.updated_at || note.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NoteGridView;