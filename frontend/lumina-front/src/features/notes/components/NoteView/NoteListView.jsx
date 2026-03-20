import React from 'react';
import { Star, Trash2, Folder, Calendar } from 'lucide-react';
import { useTheme } from '../../../../pages/notes/ThemeContext';

const NoteListView = ({ 
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
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {notes.map(note => (
        <div
          key={note.id}
          className={`
            group flex items-center p-3 hover:${themeClasses?.colors?.bg?.secondary || 'bg-gray-50 dark:bg-gray-800/50'}
            transition-colors duration-200 cursor-pointer
          `}
          onClick={() => onNoteSelect(note)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className={`font-medium text-sm truncate ${themeClasses?.colors?.text?.primary || 'text-gray-900 dark:text-gray-100'}`}>
                {note.title || 'Без названия'}
              </h3>
              {note.isFavorite && (
                <Star className="w-3 h-3 text-yellow-500 shrink-0" fill="currentColor" />
              )}
            </div>
            
            <p className={`text-xs ${themeClasses?.colors?.text?.secondary || 'text-gray-600 dark:text-gray-400'} truncate mt-0.5`}>
              {note.text || note.content || 'Нет содержимого'}
            </p>

            <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Folder className="w-3 h-3" />
                <span className="truncate max-w-25">{getGroupName(note.group || note.group_id)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span className="text-xs">
                  {new Date(note.updated_at || note.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(note.id);
              }}
              className={`p-1.5 rounded-full ${
                note.isFavorite 
                  ? 'text-yellow-500' 
                  : 'text-gray-400 hover:text-yellow-500'
              }`}
            >
              <Star className="w-3.5 h-3.5" fill={note.isFavorite ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNoteDelete(note);
              }}
              className="p-1.5 rounded-full text-gray-400 hover:text-red-500"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NoteListView;