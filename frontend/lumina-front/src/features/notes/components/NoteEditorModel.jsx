import React from 'react';
import { X } from 'lucide-react';
import NoteEditor from './NoteEditor';
import { useTheme } from '../../../shared/context/ThemeContext';

const NoteEditorModal = ({ isOpen, onClose, note, onUpdate, groups, onMoveToGroup }) => {
  const { themeClasses } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className={`relative w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden
          ${themeClasses.colors.bg.primary} border ${themeClasses.colors.border.primary}`}
        >
          {/* Заголовок с кнопкой закрытия */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className={`text-lg font-semibold ${themeClasses.colors.text.primary}`}>
              Редактирование заметки
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${themeClasses.colors.bg.secondary} hover:${themeClasses.colors.bg.tertiary} transition-colors`}
            >
              <X className={`w-5 h-5 ${themeClasses.colors.text.secondary}`} />
            </button>
          </div>

          {/* Редактор заметки */}
          <div className="p-4 max-h-[calc(100vh-120px)] overflow-y-auto">
            <NoteEditor
              note={note}
              onUpdate={onUpdate}
              autoSave={true}
              fontSize="medium"
              groups={groups}
              onMoveToGroup={onMoveToGroup}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteEditorModal;