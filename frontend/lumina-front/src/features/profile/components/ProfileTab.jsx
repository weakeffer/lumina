import React from 'react';
import { User, Save, X, Zap, ChevronRight } from 'lucide-react';

const ProfileTab = ({
  editMode,
  formData,
  user,
  recentNotes,
  loading,
  onInputChange,
  onSave,
  onCancel,
  onNoteClick,
  themeClasses,
  formatNoteDate
}) => {
  if (editMode) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-medium ${themeClasses.colors.text.secondary} mb-2`}>
              Имя
            </label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={onInputChange}
              className={`w-full px-4 py-3 rounded-xl border ${themeClasses.colors.border.primary}
                ${themeClasses.colors.bg.primary} ${themeClasses.colors.text.primary}
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                transition-all duration-200`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium ${themeClasses.colors.text.secondary} mb-2`}>
              Фамилия
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={onInputChange}
              className={`w-full px-4 py-3 rounded-xl border ${themeClasses.colors.border.primary}
                ${themeClasses.colors.bg.primary} ${themeClasses.colors.text.primary}
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                transition-all duration-200`}
            />
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium ${themeClasses.colors.text.secondary} mb-2`}>
            О себе
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={onInputChange}
            rows="4"
            className={`w-full px-4 py-3 rounded-xl border ${themeClasses.colors.border.primary}
              ${themeClasses.colors.bg.primary} ${themeClasses.colors.text.primary}
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              transition-all duration-200 resize-none`}
            placeholder="Расскажите о себе..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-medium ${themeClasses.colors.text.secondary} mb-2`}>
              Telegram (без @)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">@</span>
              <input
                type="text"
                name="telegram"
                value={formData.telegram}
                onChange={onInputChange}
                className={`w-full pl-8 pr-4 py-3 rounded-xl border ${themeClasses.colors.border.primary}
                  ${themeClasses.colors.bg.primary} ${themeClasses.colors.text.primary}
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  transition-all duration-200`}
                placeholder="username"
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeClasses.colors.text.secondary} mb-2`}>
              GitHub
            </label>
            <input
              type="text"
              name="github"
              value={formData.github}
              onChange={onInputChange}
              className={`w-full px-4 py-3 rounded-xl border ${themeClasses.colors.border.primary}
                ${themeClasses.colors.bg.primary} ${themeClasses.colors.text.primary}
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                transition-all duration-200`}
              placeholder="username"
            />
          </div>

          <div className="md:col-span-2">
            <label className={`block text-sm font-medium ${themeClasses.colors.text.secondary} mb-2`}>
              Сайт
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={onInputChange}
              className={`w-full px-4 py-3 rounded-xl border ${themeClasses.colors.border.primary}
                ${themeClasses.colors.bg.primary} ${themeClasses.colors.text.primary}
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                transition-all duration-200`}
              placeholder="https://example.com"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            onClick={onCancel}
            className={`px-6 py-3 rounded-xl border ${themeClasses.colors.border.primary}
              ${themeClasses.colors.text.secondary} hover:${themeClasses.colors.bg.secondary}
              transition-all duration-200 transform hover:scale-105 active:scale-95`}
          >
            Отмена
          </button>
          <button
            onClick={onSave}
            disabled={loading}
            className={`px-6 py-3 rounded-xl bg-linear-to-r ${themeClasses.gradient.primary}
              text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/30
              transition-all duration-200 transform hover:scale-105 active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
          >
            <Save className="w-4 h-4" />
            <span>Сохранить изменения</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {user?.bio && (
        <div className="mb-8">
          <h3 className={`text-lg font-semibold ${themeClasses.colors.text.primary} mb-3 flex items-center`}>
            <User className="w-5 h-5 mr-2 text-indigo-500" />
            О себе
          </h3>
          <div className={`p-4 rounded-xl ${themeClasses.colors.bg.secondary}`}>
            <p className={`${themeClasses.colors.text.secondary}`}>{user.bio}</p>
          </div>
        </div>
      )}

      {/* Недавние заметки */}
      {recentNotes.length > 0 && (
        <div>
          <h3 className={`text-lg font-semibold ${themeClasses.colors.text.primary} mb-3 flex items-center`}>
            <Zap className="w-5 h-5 mr-2 text-indigo-500" />
            Недавние заметки
          </h3>
          <div className="space-y-3">
            {recentNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => onNoteClick(note.id)}
                className={`p-4 rounded-xl ${themeClasses.colors.bg.secondary} 
                  hover:${themeClasses.colors.bg.tertiary} cursor-pointer
                  transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg
                  border ${themeClasses.colors.border.primary} group`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className={`font-medium ${themeClasses.colors.text.primary} mb-1`}>
                      {note.title || 'Без названия'}
                    </h4>
                    <p className={`text-sm ${themeClasses.colors.text.tertiary} line-clamp-2`}>
                      {note.text || 'Пустая заметка'}
                    </p>
                    <p className={`text-xs ${themeClasses.colors.text.tertiary} mt-2`}>
                      {formatNoteDate(note.created_at)}
                    </p>
                  </div>
                  <ChevronRight className={`w-5 h-5 ${themeClasses.colors.text.tertiary} 
                    group-hover:translate-x-1 transition-transform`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileTab;