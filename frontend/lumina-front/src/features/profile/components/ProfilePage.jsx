import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useProfile, useProfileMutations } from '../hooks/useProfile';
import { useNotes } from '../../notes/hooks/useNotes';
import { useProfileStats } from '../hooks/useProfileStats';
import { useTheme } from '../../../shared/context/ThemeContext';
import { useSettings } from '../../../shared/context/SettingsContext';
import ProfileSidebar from './ProfileSidebar';
import ProfileTabs from './ProfileTabs';
import ProfileTab from './ProfileTab';
import StatsTab from './StatsTab';
import SettingsTab from "./SettingsTab";

const getInitials = (user) => {
  if (user?.first_name && user?.last_name) {
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  }
  return user?.username?.[0]?.toUpperCase() || 'U';
};

import { Sun, Moon, Coffee, Feather, BookOpen } from 'lucide-react';

const getThemeIcon = (themeId) => {
  switch (themeId) {
    case 'dark': return Moon;
    case 'sepia': return Coffee;
    case 'ocean': return Feather;
    case 'forest': return BookOpen;
    default: return Sun;
  }
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { themeClasses, theme, setTheme } = useTheme();
  const { 
    autoSaveInterval, 
    setAutoSaveInterval,
    emailNotifications,
    setEmailNotifications,
    soundEffects,
    setSoundEffects,
    analyticsEnabled,
    setAnalyticsEnabled,
    exportSettings,
    importSettings
  } = useSettings();

  // Состояния
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Загрузка данных
  const { data: user, isLoading: profileLoading } = useProfile();
  const { data: notes = [], isLoading: notesLoading } = useNotes();
  const { 
    updateProfile, 
    uploadAvatar, 
    logout 
  } = useProfileMutations();

  // Статистика
  const { activityData, userStats, formatNoteDate, getUserLevel } = useProfileStats(notes, user);

  // Уровень пользователя
  const level = useMemo(() => 
    getUserLevel(user?.total_notes || 0),
    [user?.total_notes, getUserLevel]
  );

  // Недавние заметки
  const recentNotes = useMemo(() => 
    notes.slice(0, 3),
    [notes]
  );

  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('viewMode') || 'sidebar';
  });

  // Инициализация формы при загрузке пользователя
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        bio: user.bio || '',
        telegram: user.telegram || '',
        github: user.github || '',
        website: user.website || '',
        theme_preference: user.theme_preference || 'light',
        email_notifications: user.email_notifications ?? true,
        auto_save_interval: user.auto_save_interval || 1
      });
    }
  }, [user]);

  // Проверка авторизации
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  // Обработчики
  const handleLogout = useCallback(async () => {
    try {
      await logout.mutateAsync();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout, navigate]);

  const handleAvatarUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой. Максимальный размер 5MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      alert('Поддерживаются только JPG, PNG и GIF');
      return;
    }

    setUploading(true);
    try {
      await uploadAvatar.mutateAsync(file);
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert('Ошибка при загрузке аватарки');
    } finally {
      setUploading(false);
    }
  }, [uploadAvatar]);

  const handleSave = useCallback(async () => {
    try {
      await updateProfile.mutateAsync(formData);
      setEditMode(false);
      
      if (formData.theme_preference && formData.theme_preference !== theme) {
        setTheme(formData.theme_preference);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Ошибка при обновлении профиля');
    }
  }, [formData, theme, updateProfile, setTheme]);

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);

  const handleThemeChange = useCallback((themeId) => {
    setFormData(prev => ({ ...prev, theme_preference: themeId }));
    setTheme(themeId);
  }, [setTheme]);

  const handleExportData = useCallback(() => {
    const settings = exportSettings();
    const dataToExport = {
      user: {
        username: user?.username,
        email: user?.email,
        first_name: user?.first_name,
        last_name: user?.last_name,
        bio: user?.bio,
        telegram: user?.telegram,
        github: user?.github,
        website: user?.website
      },
      settings: settings,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumina-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [user, exportSettings]);

  const handleImportData = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.settings) {
          importSettings(data.settings);
          alert('Настройки успешно импортированы!');
        }
      } catch (error) {
        alert('Ошибка при импорте файла');
      }
    };
    reader.readAsText(file);
  }, [importSettings]);

  const handleNoteClick = useCallback((noteId) => {
    navigate(`/notes/${noteId}`);
  }, [navigate]);

  const loading = profileLoading || notesLoading;

  if (loading && !user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeClasses.colors.bg.primary}`}>
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          </div>
          <p className={`${themeClasses.colors.text.tertiary} animate-pulse`}>Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.colors.bg.primary} relative overflow-hidden flex`}>
      {/* Декоративные элементы */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Левая колонка - Профиль */}
      <ProfileSidebar
        user={user}
        uploading={uploading}
        editMode={editMode}
        onEditClick={() => setEditMode(true)}
        onAvatarClick={handleAvatarUpload}
        onLogout={handleLogout}
        themeClasses={themeClasses}
        level={level}
        getInitials={() => getInitials(user)}
        formatDate={formatNoteDate}
      />

      {/* Правая колонка - Основной контент */}
      <div className="flex-1 overflow-y-auto relative z-10">
        <div className="p-8">
          {/* Кнопка назад */}
          <button
            onClick={() => navigate('/notes')}
            className={`group flex items-center space-x-2 mb-6 px-4 py-2 rounded-xl 
              ${themeClasses.colors.bg.secondary} ${themeClasses.colors.text.secondary}
              hover:${themeClasses.colors.bg.tertiary} transition-all duration-300
              border ${themeClasses.colors.border.primary} backdrop-blur-sm`}
          >
            <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            <span>Вернуться к заметкам</span>
          </button>

          {/* Верхняя панель с приветствием */}
          <div className="mb-8">
            <h1 className={`text-4xl font-bold ${themeClasses.colors.text.primary} mb-2`}>
              Профиль
            </h1>
            <p className={`text-lg ${themeClasses.colors.text.secondary}`}>
              Управляйте своим аккаунтом и настройками
            </p>
          </div>

          {/* Табы навигации */}
          <ProfileTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            themeClasses={themeClasses}
          />

          {/* Контент табов */}
          <div className={`rounded-2xl ${themeClasses.colors.card.bg} 
            border ${themeClasses.colors.border.primary} p-6 backdrop-blur-sm
            shadow-xl`}>
            
            {activeTab === 'profile' && (
              <ProfileTab
                editMode={editMode}
                formData={formData}
                user={user}
                recentNotes={recentNotes}
                loading={profileLoading}
                onInputChange={handleInputChange}
                onSave={handleSave}
                onCancel={() => {
                  setEditMode(false);
                  setFormData({
                    first_name: user?.first_name || '',
                    last_name: user?.last_name || '',
                    email: user?.email || '',
                    bio: user?.bio || '',
                    telegram: user?.telegram || '',
                    github: user?.github || '',
                    website: user?.website || '',
                    theme_preference: user?.theme_preference || 'light',
                    email_notifications: user?.email_notifications ?? true,
                    auto_save_interval: user?.auto_save_interval || 1
                  });
                }}
                onNoteClick={handleNoteClick}
                themeClasses={themeClasses}
                formatNoteDate={formatNoteDate}
              />
            )}

            {activeTab === 'stats' && (
              <StatsTab
                user={user}
                userStats={userStats}
                activityData={activityData}
                themeClasses={themeClasses}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                formData={formData}
                emailNotifications={emailNotifications}
                soundEffects={soundEffects}
                analyticsEnabled={analyticsEnabled}
                autoSaveInterval={autoSaveInterval}
                loading={profileLoading}
                onThemeChange={handleThemeChange}
                onEmailNotificationsChange={(e) => {
                  setEmailNotifications(e.target.checked);
                  setFormData(prev => ({ ...prev, email_notifications: e.target.checked }));
                }}
                onSoundEffectsChange={(e) => setSoundEffects(e.target.checked)}
                onAnalyticsChange={(e) => setAnalyticsEnabled(e.target.checked)}
                onAutoSaveChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setAutoSaveInterval(value);
                  setFormData(prev => ({ ...prev, auto_save_interval: value }));
                }}
                onExportData={handleExportData}
                onImportData={handleImportData}
                onSave={handleSave}
                themeClasses={themeClasses}
                getThemeIcon={getThemeIcon}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;