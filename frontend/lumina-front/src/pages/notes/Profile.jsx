import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeContext';
import { useSettings } from './SettingsContext';
import { api } from '../../api/api';
import { 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  FileText, 
  BookOpen,
  Edit2,
  Camera,
  Github,
  Globe,
  Send,
  Save,
  X,
  LogOut,
  Zap,
  Award,
  TrendingUp,
  Settings,
  ChevronRight,
  Moon,
  Sun,
  Coffee,
  Feather,
  Bell,
  Download,
  Upload,
  Hash,
  Star,
  Activity,
  Target,
  Layers,
  Sparkles,
  Shield
} from 'lucide-react';

const Profile = () => {
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
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [recentNotes, setRecentNotes] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [userStats, setUserStats] = useState({
    streak: 0,
    totalTags: 0,
    achievements: 0
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadProfile();
  }, [navigate]);

  const loadProfile = async () => {
    try {
      const userData = await api.getProfile();
      console.log('Profile data:', userData);

      setUser(userData);
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        bio: userData.bio || '',
        telegram: userData.telegram || '',
        github: userData.github || '',
        website: userData.website || '',
        theme_preference: userData.theme_preference || 'light',
        email_notifications: userData.email_notifications ?? true,
        auto_save_interval: userData.auto_save_interval || 1
      });

      if (userData.email_notifications !== undefined) {
        setEmailNotifications(userData.email_notifications);
      }
      if (userData.auto_save_interval) {
        setAutoSaveInterval(userData.auto_save_interval);
      }

      await loadRecentNotes();

    } catch (error) {
      console.error('Failed to load profile:', error);
      if (error.message.includes('авторизации')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadRecentNotes = async () => {
    try {
      const notes = await api.getNotes();
      console.log('All notes for stats:', notes);
      
      setRecentNotes(notes.slice(0, 3));
      
      const activity = [];
      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);
        
        const count = notes.filter(note => {
          if (!note.created_at) return false;
          
          try {
            let noteDate;
            if (typeof note.created_at === 'string' && note.created_at.includes('.')) {
              const [datePart, timePart] = note.created_at.split(' ');
              const [day, month, year] = datePart.split('.');
              const [hours, minutes] = timePart.split(':');
              noteDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
            } else {
              noteDate = new Date(note.created_at);
            }
            
            if (isNaN(noteDate.getTime())) return false;
            
            const noteDateStart = new Date(noteDate);
            noteDateStart.setHours(0, 0, 0, 0);
            
            return noteDateStart >= date && noteDateStart < nextDate;
          } catch (e) {
            console.warn('Error parsing date:', note.created_at, e);
            return false;
          }
        }).length;
        
        activity.push({
          date: date.toLocaleDateString('ru-RU', { weekday: 'short' }),
          fullDate: date.toLocaleDateString('ru-RU'),
          count: count
        });
        
        if (count > 0) {
          currentStreak++;
        } else {
          currentStreak = 0;
        }
      }
      
      setActivityData(activity);
      
      const allTags = new Set();
      notes.forEach(note => {
        if (note.tags && Array.isArray(note.tags)) {
          note.tags.forEach(tag => allTags.add(tag));
        }
      });
      
      setUserStats({
        streak: currentStreak,
        totalTags: allTags.size,
        achievements: Math.floor(currentStreak / 7)
      });
      
    } catch (error) {
      console.error('Failed to load recent notes:', error);
    }
  };
  
  const formatNoteDate = (dateString) => {
    if (!dateString) return 'Дата неизвестна';

    try {
      let date;

      if (typeof dateString === 'string' && dateString.includes('.')) {
        const [datePart, timePart] = dateString.split(' ');
        const [day, month, year] = datePart.split('.');
        const [hours, minutes] = timePart.split(':');

        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
      }
      else if (typeof dateString === 'string' && dateString.includes('T')) {
        date = new Date(dateString);
      }
      else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) {
        console.error('Invalid date after parsing:', dateString);
        return 'Только что';
      }

      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });

    } catch (e) {
      console.error('Date formatting error:', e, 'for date:', dateString);
      return 'Только что';
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
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

    const formData = new FormData();
    formData.append('avatar', file);

    setUploading(true);
    try {
      const response = await fetch('http://localhost:8000/api/users/upload_avatar/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setUser(prev => ({
        ...prev,
        avatar_url: data.avatar_url
      }));
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert('Ошибка при загрузке аватарки');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/users/profile/', {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Update failed');

      const updatedUser = await response.json();
      setUser(updatedUser);
      setEditMode(false);
      
      if (formData.theme_preference && formData.theme_preference !== theme) {
        setTheme(formData.theme_preference);
      }
      if (formData.email_notifications !== undefined) {
        setEmailNotifications(formData.email_notifications);
      }
      if (formData.auto_save_interval) {
        setAutoSaveInterval(formData.auto_save_interval);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Ошибка при обновлении профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getThemeIcon = (themeId) => {
    switch (themeId) {
      case 'dark': return Moon;
      case 'sepia': return Coffee;
      case 'ocean': return Feather;
      case 'forest': return BookOpen;
      default: return Sun;
    }
  };

  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user?.username?.[0]?.toUpperCase() || 'U';
  };

  const getUserLevel = () => {
    const total = user?.total_notes || 0;
    if (total > 100) return { label: 'Мастер мыслей', color: 'from-purple-500 to-pink-500' };
    if (total > 50) return { label: 'Опытный автор', color: 'from-indigo-500 to-purple-500' };
    if (total > 20) return { label: 'Активный', color: 'from-blue-500 to-indigo-500' };
    if (total > 5) return { label: 'Новичок', color: 'from-green-500 to-emerald-500' };
    return { label: 'Начинающий', color: 'from-gray-500 to-gray-600' };
  };

  const handleExportData = () => {
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
  };

  const handleImportData = (e) => {
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
  };

  if (loading && !user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeClasses.colors.bg.primary}`}>
        <div className="text-center">
          <div className="relative">
            <Zap className="w-16 h-16 text-indigo-500 mx-auto mb-4 animate-pulse" />
            <div className="absolute inset-0 animate-ping">
              <Zap className="w-16 h-16 text-indigo-300 mx-auto opacity-20" />
            </div>
          </div>
          <p className={`${themeClasses.colors.text.tertiary} animate-pulse`}>Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  const level = getUserLevel();

  return (
    <div className={`min-h-screen ${themeClasses.colors.bg.primary} relative overflow-hidden flex`}>
      {/* Декоративные элементы */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-linear-to-r from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Левая колонка - Профиль */}
      <div className="w-96 shrink-0 overflow-y-auto relative z-10">
        <div className="p-6">
          <div className={`rounded-2xl ${themeClasses.colors.card.bg} 
            border ${themeClasses.colors.border.primary} overflow-hidden backdrop-blur-sm
            shadow-xl hover:shadow-2xl transition-all duration-300`}>
            
            {/* Градиентная шапка */}
            <div className={`h-32 bg-linear-to-r ${themeClasses.gradient.primary} relative`}>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="absolute top-4 right-4 p-2.5 bg-white/20 backdrop-blur-md 
                    rounded-xl text-white hover:bg-white/30 transition-all duration-300
                    transform hover:scale-110 active:scale-95"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Аватар */}
            <div className="px-6 pb-6">
              <div className="relative -mt-16 mb-4 flex justify-center">
                <div className="relative group">
                  <div className={`w-28 h-28 rounded-full border-4 ${themeClasses.colors.card.bg} 
                    overflow-hidden bg-linear-to-br from-indigo-500 to-purple-500
                    ring-4 ring-offset-2 ring-indigo-500/20`}>
                    {user?.avatar_url ? (
                      <img 
                        src={`http://localhost:8000${user.avatar_url}`} 
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white">
                        {getInitials()}
                      </div>
                    )}
                  </div>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/jpeg,image/png,image/gif"
                    className="hidden"
                  />
                  
                  <button
                    onClick={handleAvatarClick}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 p-2 bg-indigo-500 text-white rounded-full 
                      hover:bg-indigo-600 transition-all duration-300 transform hover:scale-110
                      disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {uploading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>

                  <div className="absolute bottom-2 left-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white"></div>
                </div>
              </div>

              <div className="text-center mb-6">
                <h2 className={`text-2xl font-bold ${themeClasses.colors.text.primary} mb-1`}>
                  {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
                </h2>
                <p className={`${themeClasses.colors.text.tertiary} flex items-center justify-center space-x-1`}>
                  <span>@{user?.username}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span className={`text-xs px-2 py-0.5 bg-linear-to-r ${level.color} text-white rounded-full`}>
                    {level.label}
                  </span>
                </p>
              </div>

              {/* Быстрая статистика */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className={`p-3 rounded-xl ${themeClasses.colors.bg.secondary} text-center`}>
                  <FileText className={`w-5 h-5 mx-auto mb-1 ${themeClasses.colors.text.tertiary}`} />
                  <p className={`text-xl font-bold ${themeClasses.colors.text.primary}`}>
                    {user?.total_notes || 0}
                  </p>
                  <p className={`text-xs ${themeClasses.colors.text.tertiary}`}>Заметок</p>
                </div>
                <div className={`p-3 rounded-xl ${themeClasses.colors.bg.secondary} text-center`}>
                  <BookOpen className={`w-5 h-5 mx-auto mb-1 ${themeClasses.colors.text.tertiary}`} />
                  <p className={`text-xl font-bold ${themeClasses.colors.text.primary}`}>
                    {user?.total_words || 0}
                  </p>
                  <p className={`text-xs ${themeClasses.colors.text.tertiary}`}>Слов</p>
                </div>
                <div className={`p-3 rounded-xl ${themeClasses.colors.bg.secondary} text-center`}>
                  <Star className={`w-5 h-5 mx-auto mb-1 ${themeClasses.colors.text.tertiary}`} />
                  <p className={`text-xl font-bold ${themeClasses.colors.text.primary}`}>
                    {user?.total_notes ? Math.round(user.total_words / user.total_notes) : 0}
                  </p>
                  <p className={`text-xs ${themeClasses.colors.text.tertiary}`}>Ср. слов</p>
                </div>
              </div>

              {/* Контактная информация */}
              <div className={`space-y-3 p-4 rounded-xl ${themeClasses.colors.bg.secondary} mb-6`}>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div>
                    <p className={`text-xs ${themeClasses.colors.text.tertiary}`}>Email</p>
                    <p className={`text-sm font-medium ${themeClasses.colors.text.primary}`}>{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className={`text-xs ${themeClasses.colors.text.tertiary}`}>Присоединился</p>
                    <p className={`text-sm font-medium ${themeClasses.colors.text.primary}`}>{user?.joined_date}</p>
                  </div>
                </div>
                {user?.last_login_formatted && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-purple-500" />
                    </div>
                    <div>
                      <p className={`text-xs ${themeClasses.colors.text.tertiary}`}>Последний визит</p>
                      <p className={`text-sm font-medium ${themeClasses.colors.text.primary}`}>{user.last_login_formatted}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Социальные ссылки */}
              {(user?.telegram || user?.github || user?.website) && (
                <div className={`flex justify-center space-x-3 mb-6`}>
                  {user.telegram && (
                    <a 
                      href={`https://t.me/${user.telegram}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-10 h-10 rounded-xl ${themeClasses.colors.bg.secondary} 
                        flex items-center justify-center hover:bg-indigo-500 hover:text-white
                        transition-all duration-300 transform hover:scale-110`}
                    >
                      <Send className="w-5 h-5" />
                    </a>
                  )}
                  {user.github && (
                    <a 
                      href={`https://github.com/${user.github}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-10 h-10 rounded-xl ${themeClasses.colors.bg.secondary} 
                        flex items-center justify-center hover:bg-gray-800 hover:text-white
                        transition-all duration-300 transform hover:scale-110`}
                    >
                      <Github className="w-5 h-5" />
                    </a>
                  )}
                  {user.website && (
                    <a 
                      href={user.website} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-10 h-10 rounded-xl ${themeClasses.colors.bg.secondary} 
                        flex items-center justify-center hover:bg-green-500 hover:text-white
                        transition-all duration-300 transform hover:scale-110`}
                    >
                      <Globe className="w-5 h-5" />
                    </a>
                  )}
                </div>
              )}

              {/* Кнопка выхода */}
              <button
                onClick={handleLogout}
                className={`w-full py-3 px-4 bg-linear-to-r from-red-500 to-red-600
                  text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700
                  transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                  flex items-center justify-center space-x-2 shadow-lg shadow-red-500/20`}
              >
                <LogOut className="w-5 h-5" />
                <span>Выйти из аккаунта</span>
              </button>
            </div>
          </div>
        </div>
      </div>

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
          <div className={`flex space-x-1 p-1 rounded-2xl ${themeClasses.colors.bg.secondary} 
            border ${themeClasses.colors.border.primary} backdrop-blur-sm mb-6`}>
            {[
              { id: 'profile', icon: User, label: 'Профиль' },
              { id: 'stats', icon: TrendingUp, label: 'Статистика' },
              { id: 'settings', icon: Settings, label: 'Настройки' }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 
                    rounded-xl transition-all duration-300
                    ${activeTab === tab.id 
                      ? `${themeClasses.colors.accent.primary} text-white shadow-lg` 
                      : `${themeClasses.colors.text.secondary} hover:${themeClasses.colors.bg.tertiary}`
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Контент табов */}
          <div className={`rounded-2xl ${themeClasses.colors.card.bg} 
            border ${themeClasses.colors.border.primary} p-6 backdrop-blur-sm
            shadow-xl`}>
            
            {/* Таб Профиля */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {editMode ? (
                  // Режим редактирования
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={`block text-sm font-medium ${themeClasses.colors.text.secondary} mb-2`}>
                          Имя
                        </label>
                        <input
                          type="text"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleChange}
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
                          onChange={handleChange}
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
                        onChange={handleChange}
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
                            onChange={handleChange}
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
                          onChange={handleChange}
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
                          onChange={handleChange}
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
                        onClick={() => setEditMode(false)}
                        className={`px-6 py-3 rounded-xl border ${themeClasses.colors.border.primary}
                          ${themeClasses.colors.text.secondary} hover:${themeClasses.colors.bg.secondary}
                          transition-all duration-200 transform hover:scale-105 active:scale-95`}
                      >
                        Отмена
                      </button>
                      <button
                        onClick={handleSave}
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
                  </>
                ) : (
                  // Просмотр профиля
                  <>
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
                              onClick={() => navigate(`/notes/${note.id}`)}
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
                  </>
                )}
              </div>
            )}

            {/* Таб Статистики */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                {/* Основные метрики */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-6 rounded-xl bg-linear-to-br from-indigo-500 to-indigo-600 text-white`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-indigo-100 text-sm">Всего заметок</p>
                        <p className="text-4xl font-bold mt-1">{user?.total_notes || 0}</p>
                      </div>
                      <div className="p-3 bg-white/20 rounded-xl">
                        <FileText className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="flex items-center text-indigo-100 text-sm">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span>
                        {user?.total_notes > 0 
                          ? `+${Math.round(user.total_notes / 30 * 100) / 100} в день` 
                          : 'Нет активности'}
                      </span>
                    </div>
                  </div>

                  <div className={`p-6 rounded-xl bg-linear-to-br from-purple-500 to-purple-600 text-white`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-purple-100 text-sm">Всего слов</p>
                        <p className="text-4xl font-bold mt-1">{user?.total_words || 0}</p>
                      </div>
                      <div className="p-3 bg-white/20 rounded-xl">
                        <BookOpen className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="flex items-center text-purple-100 text-sm">
                      <Activity className="w-4 h-4 mr-1" />
                      <span>Средняя длина: {user?.total_notes ? Math.round(user.total_words / user.total_notes) : 0} слов</span>
                    </div>
                  </div>
                </div>

                {/* Детальная статистика */}
                <div className="grid grid-cols-3 gap-4">
                  <div className={`p-4 rounded-xl ${themeClasses.colors.bg.secondary} text-center`}>
                    <Target className="w-6 h-6 mx-auto mb-2 text-green-500" />
                    <p className={`text-2xl font-bold ${themeClasses.colors.text.primary}`}>
                      {userStats?.streak || 0}
                    </p>
                    <p className={`text-xs ${themeClasses.colors.text.tertiary}`}>Дней подряд</p>
                  </div>
                  <div className={`p-4 rounded-xl ${themeClasses.colors.bg.secondary} text-center`}>
                    <Layers className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                    <p className={`text-2xl font-bold ${themeClasses.colors.text.primary}`}>
                      {userStats?.totalTags || 0}
                    </p>
                    <p className={`text-xs ${themeClasses.colors.text.tertiary}`}>Тегов</p>
                  </div>
                  <div className={`p-4 rounded-xl ${themeClasses.colors.bg.secondary} text-center`}>
                    <Award className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                    <p className={`text-2xl font-bold ${themeClasses.colors.text.primary}`}>
                      {userStats?.achievements || 0}
                    </p>
                    <p className={`text-xs ${themeClasses.colors.text.tertiary}`}>Достижения</p>
                  </div>
                </div>

                {/* График активности */}
                {activityData.length > 0 && (
                  <div>
                    <h3 className={`text-lg font-semibold ${themeClasses.colors.text.primary} mb-4 flex items-center`}>
                      <Activity className="w-5 h-5 mr-2 text-indigo-500" />
                      Активность за неделю
                    </h3>
                    <div className={`p-6 rounded-xl ${themeClasses.colors.bg.secondary}`}>
                      <div className="flex items-end justify-between h-32">
                        {activityData.map((day, idx) => (
                          <div key={idx} className="flex flex-col items-center w-1/7">
                            <div className="relative w-full flex justify-center mb-2 group">
                              <div 
                                className="w-8 bg-indigo-500 rounded-t-lg transition-all duration-500 hover:bg-indigo-600 cursor-pointer relative"
                                style={{ height: `${Math.max(4, day.count * 8)}px` }}
                              >
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                                  px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 
                                  group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                  {day.count} заметок
                                </div>
                              </div>
                            </div>
                            <span className={`text-xs ${themeClasses.colors.text.tertiary}`}>{day.date}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-between mt-4 text-xs text-gray-400">
                        <span>Пн</span>
                        <span>Вт</span>
                        <span>Ср</span>
                        <span>Чт</span>
                        <span>Пт</span>
                        <span>Сб</span>
                        <span>Вс</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Общая статистика */}
                <div className={`p-4 rounded-xl ${themeClasses.colors.bg.secondary}`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-sm ${themeClasses.colors.text.tertiary}`}>Всего символов</p>
                      <p className={`text-xl font-bold ${themeClasses.colors.text.primary}`}>
                        {(user?.total_words || 0) * 5}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${themeClasses.colors.text.tertiary}`}>Средняя длина</p>
                      <p className={`text-xl font-bold ${themeClasses.colors.text.primary}`}>
                        {user?.total_notes ? Math.round(user.total_words / user.total_notes) : 0} слов
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Таб Настроек */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Тема оформления */}
                <div>
                  <h3 className={`text-lg font-semibold ${themeClasses.colors.text.primary} mb-3 flex items-center`}>
                    <Sparkles className="w-5 h-5 mr-2 text-indigo-500" />
                    Тема оформления
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {['light', 'dark', 'sepia', 'ocean', 'forest'].map(themeId => {
                      const ThemeIcon = getThemeIcon(themeId);
                      const themeNames = {
                        light: 'Светлая',
                        dark: 'Тёмная',
                        sepia: 'Сепия',
                        ocean: 'Океан',
                        forest: 'Лес'
                      };
                      
                      return (
                        <button
                          key={themeId}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, theme_preference: themeId }));
                            setTheme(themeId);
                          }}
                          className={`p-4 rounded-xl border-2 transition-all duration-300
                            ${formData.theme_preference === themeId
                              ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20'
                              : `border-transparent ${themeClasses.colors.bg.secondary} hover:border-gray-300`
                            }`}
                        >
                          <ThemeIcon className={`w-6 h-6 mx-auto mb-2 ${
                            formData.theme_preference === themeId 
                              ? 'text-indigo-500' 
                              : themeClasses.colors.text.tertiary
                          }`} />
                          <span className={`text-xs font-medium ${
                            formData.theme_preference === themeId 
                              ? 'text-indigo-500' 
                              : themeClasses.colors.text.secondary
                          }`}>
                            {themeNames[themeId]}
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
                      onChange={(e) => {
                        setEmailNotifications(e.target.checked);
                        setFormData(prev => ({ ...prev, email_notifications: e.target.checked }));
                      }}
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
                      onChange={(e) => setSoundEffects(e.target.checked)}
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
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setAutoSaveInterval(value);
                      setFormData(prev => ({ ...prev, auto_save_interval: value }));
                    }}
                    className={`w-full px-4 py-3 rounded-xl border ${themeClasses.colors.border.primary}
                      ${themeClasses.colors.bg.primary} ${themeClasses.colors.text.primary}
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                      transition-all duration-200 cursor-pointer`}
                  >
                    <option value="0.5">Каждые 30 секунд</option>
                    <option value="1">Каждую минуту</option>
                    <option value="2">Каждые 2 минуты</option>
                    <option value="5">Каждые 5 минут</option>
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
                      onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                      className="w-5 h-5 rounded text-green-500 focus:ring-green-500"
                    />
                  </label>
                </div>

                {/* Экспорт/Импорт */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button 
                    onClick={handleExportData}
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
                      onChange={handleImportData}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Кнопка сохранения настроек */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleSave}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;