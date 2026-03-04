import React, { useRef } from 'react';
import { 
  User, Mail, Calendar, Clock, FileText, BookOpen, Star,
  Edit2, Camera, Send, Github, Globe, LogOut, Zap
} from 'lucide-react';

const ProfileSidebar = ({
  user,
  uploading,
  editMode,
  onEditClick,
  onAvatarClick,
  onLogout,
  themeClasses,
  level,
  getInitials,
  formatDate
}) => {
  const fileInputRef = useRef(null);

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-96 shrink-0 overflow-y-auto relative z-10">
      <div className="p-6">
        <div className={`rounded-2xl ${themeClasses.colors.card.bg} 
          border ${themeClasses.colors.border.primary} overflow-hidden backdrop-blur-sm
          shadow-xl hover:shadow-2xl transition-all duration-300`}>
          
          {/* Градиентная шапка */}
          <div className={`h-32 bg-linear-to-r ${themeClasses.gradient.primary} relative`}>
            {!editMode && (
              <button
                onClick={onEditClick}
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
                  onChange={onAvatarClick}
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
              onClick={onLogout}
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
  );
};

export default ProfileSidebar;