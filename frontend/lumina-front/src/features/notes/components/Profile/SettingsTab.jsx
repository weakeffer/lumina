import React from 'react';
import { 
  Sparkles, Bell, Clock, Shield, Download, Upload, 
  Save, Globe, Zap 
} from 'lucide-react';
import { THEMES, AUTO_SAVE_OPTIONS } from './ProfileConstants';

const SettingsTab = ({
  formData,
  emailNotifications,
  soundEffects,
  analyticsEnabled,
  autoSaveInterval,
  loading,
  onThemeChange,
  onEmailNotificationsChange,
  onSoundEffectsChange,
  onAnalyticsChange,
  onAutoSaveChange,
  onExportData,
  onImportData,
  onSave,
  themeClasses,
  getThemeIcon
}) => {
  return (
    <div className="space-y-6">
      {/* Тема оформления */}
      <div>
        <h3 className={`text-lg font-semibold ${themeClasses.colors.text.primary} mb-3 flex items-center`}>
          <Sparkles className="w-5 h-5 mr-2 text-indigo-500" />
          Тема оформления
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {THEMES.map(theme => {
            const ThemeIcon = getThemeIcon(theme.id);
            return (
              <button
                key={theme.id}
                onClick={() => onThemeChange(theme.id)}
                className={`p-4 rounded-xl border-2 transition-all duration-300
                  ${formData.theme_preference === theme.id
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20'
                    : `border-transparent ${themeClasses.colors.bg.secondary} hover:border-gray-300`
                  }`}
              >
                <ThemeIcon className={`w-6 h-6 mx-auto mb-2 ${
                  formData.theme_preference === theme.id 
                    ? 'text-indigo-500' 
                    : themeClasses.colors.text.tertiary
                }`} />
                <span className={`text-xs font-medium ${
                  formData.theme_preference === theme.id 
                    ? 'text-indigo-500' 
                    : themeClasses.colors.text.secondary
                }`}>
                  {theme.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Уведомления */}
      <div>
        <h3 className={`text-lg font-semibold ${themeClasses.colors.text.primary} mb-3 flex items-center`}>
          <Bell className="w-5 h-5 mr-2 text-indigo-500" />
          Уведомления
        </h3>
        
        <label className={`flex items-center justify-between p-4 rounded-xl ${themeClasses.colors.bg.secondary} 
          border ${themeClasses.colors.border.primary} cursor-pointer hover:${themeClasses.colors.bg.tertiary}
          transition-all duration-200 mb-3`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <p className={`font-medium ${themeClasses.colors.text.primary}`}>Email уведомления</p>
              <p className={`text-sm ${themeClasses.colors.text.tertiary}`}>
                Получать уведомления на почту
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={onEmailNotificationsChange}
            className="w-5 h-5 rounded text-indigo-500 focus:ring-indigo-500"
          />
        </label>

        <label className={`flex items-center justify-between p-4 rounded-xl ${themeClasses.colors.bg.secondary} 
          border ${themeClasses.colors.border.primary} cursor-pointer hover:${themeClasses.colors.bg.tertiary}
          transition-all duration-200`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className={`font-medium ${themeClasses.colors.text.primary}`}>Звуковые эффекты</p>
              <p className={`text-sm ${themeClasses.colors.text.tertiary}`}>
                Воспроизводить звуки при действиях
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={soundEffects}
            onChange={onSoundEffectsChange}
            className="w-5 h-5 rounded text-purple-500 focus:ring-purple-500"
          />
        </label>
      </div>

      {/* Интервал автосохранения */}
      <div>
        <h3 className={`text-lg font-semibold ${themeClasses.colors.text.primary} mb-3 flex items-center`}>
          <Clock className="w-5 h-5 mr-2 text-indigo-500" />
          Автосохранение
        </h3>
        <select
          value={autoSaveInterval}
          onChange={onAutoSaveChange}
          className={`w-full px-4 py-3 rounded-xl border ${themeClasses.colors.border.primary}
            ${themeClasses.colors.bg.primary} ${themeClasses.colors.text.primary}
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            transition-all duration-200 cursor-pointer`}
        >
          {AUTO_SAVE_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Приватность */}
      <div>
        <h3 className={`text-lg font-semibold ${themeClasses.colors.text.primary} mb-3 flex items-center`}>
          <Shield className="w-5 h-5 mr-2 text-indigo-500" />
          Приватность
        </h3>
        
        <label className={`flex items-center justify-between p-4 rounded-xl ${themeClasses.colors.bg.secondary} 
          border ${themeClasses.colors.border.primary} cursor-pointer hover:${themeClasses.colors.bg.tertiary}
          transition-all duration-200`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className={`font-medium ${themeClasses.colors.text.primary}`}>Анонимная аналитика</p>
              <p className={`text-sm ${themeClasses.colors.text.tertiary}`}>
                Помогите улучшить приложение
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={analyticsEnabled}
            onChange={onAnalyticsChange}
            className="w-5 h-5 rounded text-green-500 focus:ring-green-500"
          />
        </label>
      </div>

      {/* Экспорт/Импорт */}
      <div className="grid grid-cols-2 gap-4 pt-4">
        <button 
          onClick={onExportData}
          className={`flex items-center justify-center space-x-2 px-4 py-3 
            bg-linear-to-r from-indigo-500 to-indigo-600 text-white rounded-xl
            hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300
            transform hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20`}
        >
          <Download className="w-5 h-5" />
          <span>Экспорт данных</span>
        </button>
        
        <label className={`flex items-center justify-center space-x-2 px-4 py-3 
          bg-linear-to-r from-green-500 to-green-600 text-white rounded-xl
          hover:from-green-600 hover:to-green-700 transition-all duration-300
          transform hover:scale-105 active:scale-95 shadow-lg shadow-green-500/20
          cursor-pointer`}>
          <Upload className="w-5 h-5" />
          <span>Импорт</span>
          <input
            type="file"
            accept=".json"
            onChange={onImportData}
            className="hidden"
          />
        </label>
      </div>

      {/* Кнопка сохранения настроек */}
      <div className="flex justify-end pt-4">
        <button
          onClick={onSave}
          disabled={loading}
          className={`px-6 py-3 rounded-xl bg-linear-to-r ${themeClasses.gradient.primary}
            text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/30
            transition-all duration-200 transform hover:scale-105 active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
        >
          <Save className="w-4 h-4" />
          <span>Сохранить настройки</span>
        </button>
      </div>
    </div>
  );
};

export default SettingsTab;