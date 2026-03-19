import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Menu,
  BarChart2,
  Filter,
  Trash2,
  User,
  Zap,
  WifiOff
} from 'lucide-react';
import ActionButton from '../../../../pages/notes/ActionButton';
import QuickActions from '../../../../pages/notes/QuickActions';

/**
 * Компонент заголовка
 */
const Header = ({
  isMobile,
  isOnline,
  searchQuery,
  onSearchChange,
  selectedGroup,
  groups,
  onNoteCreate,
  onToggleStatistics,
  onToggleFilters,
  onToggleTagManager,
  onToggleTrash,
  deletedNotesCount,
  selectedTagsCount,
  onToggleMobileMenu,
  themeClasses,
  navigate,
  children, // 👈 ДОБАВИТЬ ЭТУ СТРОКУ
}) => {
  return (
    <div className={`flex items-center justify-between px-4 h-16 border-b ${themeClasses.colors.border.primary} backdrop-blur-sm bg-opacity-90 sticky top-0 z-10`}>
      <div className="flex items-center gap-3">
        {isMobile && (
          <button 
            onClick={onToggleMobileMenu} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all hover:scale-110 active:scale-95"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
          <div className="relative">
            <Zap className="text-indigo-500 group-hover:animate-pulse" />
            <div className="absolute -inset-1 bg-indigo-500/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h1 className="font-bold text-lg bg-linear-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Lumina Notes
          </h1>
          {!isOnline && (
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-xs rounded-full animate-pulse">
              <WifiOff className="w-3 h-3" />
              <span>Оффлайн</span>
            </div>
          )}
        </div>
      </div>
            
      {!isMobile && (
        <div className="flex-1 max-w-xl mx-6 relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all group-focus-within:shadow-lg"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      )}

      <div className="flex items-center gap-1">
        {isMobile && selectedGroup && (
          <div className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs rounded-full mr-1">
            {groups?.find(g => g.id === selectedGroup)?.name || 'Группа'}
          </div>
        )}
        
        {/* 👇 ВОТ СЮДА ДОБАВЛЯЕМ children */}
        {children}
        
        <ActionButton 
          icon={Plus} 
          onClick={() => onNoteCreate()}
          tooltip="Новая заметка"
          className="text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
        />
        
        <ActionButton 
          icon={BarChart2} 
          onClick={onToggleStatistics}
          tooltip="Статистика"
        />
        
        <ActionButton 
          icon={Filter} 
          onClick={onToggleFilters}
          tooltip="Фильтры"
          badge={selectedTagsCount > 0 ? selectedTagsCount : null}
          badgeColor="indigo"
        />
        
        <ActionButton 
          icon={() => <span className="text-sm font-medium">#</span>} 
          onClick={onToggleTagManager}
          tooltip="Управление тегами"
        />
        
        <ActionButton 
          icon={Trash2} 
          onClick={onToggleTrash}
          tooltip="Корзина"
          badge={deletedNotesCount > 0 ? deletedNotesCount : null}
          badgeColor="red"
        />
          
        <ActionButton 
          icon={User} 
          onClick={() => navigate('/profile')}
          tooltip="Профиль"
        />
          
        <QuickActions
          onNewNote={onNoteCreate}
          onSearch={onToggleFilters}
          groups={groups}
          onGroupSelect={(groupId) => console.log('select group', groupId)}
          selectedGroup={selectedGroup}
        />
      </div>
    </div>
  );
};

export default Header;