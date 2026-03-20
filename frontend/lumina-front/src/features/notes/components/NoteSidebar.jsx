import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronRight as ChevronRightSmall,
  Folder,
  Star,
  Grid,
  Image as ImageIcon,
  FileText,
  Plus,
  Trash2,
  Heart,
  Settings,
  Tag
} from "lucide-react";
import { useTheme } from '../../../shared/context/ThemeContext';

const NoteSidebar = ({
  groupedNotes,
  selectedNote,
  onNoteSelect,
  onNoteDelete,
  onToggleFavorite,
  collapsed,
  onToggleCollapse,
  isMobile,
  mobileOpen,
  onMobileClose,
  favorites = [],
  tags = [],
  groups = [],
  selectedGroup,
  onGroupSelect,
  onOpenGroupManager,
  onCreateNote,
  onMoveNoteToGroup,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  dragOverGroup,
  draggedNote
}) => {
  const { themeClasses } = useTheme();
  const [expandedGroups, setExpandedGroups] = useState(["all"]);
  const [isHovering, setIsHovering] = useState(false);

  // Автоматически раскрывать группу при выборе
  useEffect(() => {
    if (selectedGroup && !expandedGroups.includes(selectedGroup)) {
      setExpandedGroups(prev => [...prev, selectedGroup]);
    }
  }, [selectedGroup]);

  const toggleGroup = (id) => {
    setExpandedGroups(prev =>
      prev.includes(id)
        ? prev.filter(g => g !== id)
        : [...prev, id]
    );
  };

  // Системные группы
  const systemGroups = [
    {
      id: "all",
      name: "Все заметки",
      icon: Grid,
      notes: groupedNotes["Все заметки"] || [],
      notes_count: groupedNotes["Все заметки"]?.length || 0
    },
    {
      id: "favorites",
      name: "Избранное",
      icon: Star,
      notes: groupedNotes["Все заметки"]?.filter(n => favorites.includes(n.id)) || [],
      notes_count: groupedNotes["Все заметки"]?.filter(n => favorites.includes(n.id)).length || 0
    },
    {
      id: "images",
      name: "С изображениями",
      icon: ImageIcon,
      notes: groupedNotes["Все заметки"]?.filter(n => n.images_count > 0) || [],
      notes_count: groupedNotes["Все заметки"]?.filter(n => n.images_count > 0).length || 0
    }
  ];

  // Пользовательские группы
  const userGroups = groups.map(group => {
    let groupNotes = [];
    
    if (group.notes && Array.isArray(group.notes)) {
      groupNotes = group.notes;
    } else {
      if (groupedNotes[`group_${group.id}`]) {
        groupNotes = groupedNotes[`group_${group.id}`];
      } 
      else if (groupedNotes[group.name]) {
        groupNotes = groupedNotes[group.name];
      } 
      else {
        for (const [key, notes] of Object.entries(groupedNotes)) {
          const hasNoteWithGroupId = notes.some(note => 
            note.group_id === group.id || note.group === group.id
          );
          if (hasNoteWithGroupId) {
            groupNotes = notes;
            break;
          }
        }
      }
    }
    
    return {
      id: String(group.id),
      name: group.name,
      icon: Folder,
      notes: groupNotes,
      notes_count: group.notes_count !== undefined 
        ? group.notes_count 
        : groupNotes.length,
      color: group.color,
      description: group.description
    };
  });

  // Заметки без группы
  const noGroupNotes = groupedNotes["Без группы"] || [];
  const noGroupNotesCount = noGroupNotes.length;

  if (isMobile && !mobileOpen) return null;

  return (
    <>
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`
        ${isMobile ? "fixed left-0 top-0 bottom-0 z-50" : "relative"}
        ${themeClasses.colors.sidebar.bg}
        border-r ${themeClasses.colors.border.primary}
        flex flex-col h-screen
        transition-all duration-300
      `}
        style={{ 
          width: isMobile 
            ? '20rem' // 320px для мобильных
            : collapsed 
              ? '5rem' // 80px для свернутого
              : '100%' // 100% от родителя для растягивания
        }}
        onMouseEnter={() => !isMobile && setIsHovering(true)}
        onMouseLeave={() => !isMobile && setIsHovering(false)}
      >
        {/* Заголовок */}
        <div
          className={`flex items-center justify-between p-4 border-b ${themeClasses.colors.border.primary}`}
        >
          {!collapsed && (
            <h2
              className={`text-sm font-medium ${themeClasses.colors.text.tertiary} uppercase`}
            >
              Навигация
            </h2>
          )}

          <div className="flex items-center gap-1 ml-auto">
            {!collapsed && (
              <button
                onClick={onCreateNote}
                className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors"
                title="Создать заметку"
              >
                <Plus className="w-4 h-4 text-green-500" />
              </button>
            )}

            {!isMobile && (
              <button
                onClick={onToggleCollapse}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={collapsed ? "Развернуть" : "Свернуть"}
              >
                {collapsed
                  ? <ChevronRight className="w-4 h-4" />
                  : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Подсказка для разворачивания в свернутом состоянии */}
        {collapsed && !isMobile && isHovering && (
          <div className="absolute inset-0 bg-indigo-500/5 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-indigo-500 text-white text-xs px-3 py-2 rounded-lg shadow-lg animate-pulse">
              Потяните вправо чтобы развернуть
            </div>
          </div>
        )}

        {/* Индикатор авто-сворачивания */}
        {!collapsed && !isMobile && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 
            bg-indigo-500 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap
            opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            Потяните до упора влево чтобы свернуть
          </div>
        )}

        {/* Иконки для свернутого состояния */}
        {collapsed && !isMobile && (
          <div className="flex flex-col items-center py-4 space-y-4">
            <button
              onClick={onCreateNote}
              className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors group relative"
              title="Создать заметку"
            >
              <Plus className="w-5 h-5 text-green-500" />
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded 
                opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                Создать заметку
              </span>
            </button>

            <button
              onClick={() => onGroupSelect("all")}
              className={`p-2 rounded-lg transition-colors group relative
                ${selectedGroup === "all" 
                  ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600" 
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"}`}
              title="Все заметки"
            >
              <Grid className="w-5 h-5" />
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded 
                opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                Все заметки
              </span>
            </button>

            <button
              onClick={() => onGroupSelect("favorites")}
              className={`p-2 rounded-lg transition-colors group relative
                ${selectedGroup === "favorites" 
                  ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600" 
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"}`}
              title="Избранное"
            >
              <Star className="w-5 h-5" />
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded 
                opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                Избранное
              </span>
            </button>

            <button
              onClick={() => onGroupSelect("images")}
              className={`p-2 rounded-lg transition-colors group relative
                ${selectedGroup === "images" 
                  ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600" 
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"}`}
              title="С изображениями"
            >
              <ImageIcon className="w-5 h-5" />
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded 
                opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                С изображениями
              </span>
            </button>

            <div className="w-8 border-t border-gray-200 dark:border-gray-700 my-2"></div>

            <button
              onClick={onOpenGroupManager}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group relative"
              title="Управление группами"
            >
              <Folder className="w-5 h-5 text-gray-500" />
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded 
                opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                Группы
              </span>
            </button>

            {tags.length > 0 && (
              <button
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group relative"
                title="Теги"
              >
                <Tag className="w-5 h-5 text-gray-500" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded 
                  opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  Теги
                </span>
              </button>
            )}

            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group relative"
              title="Настройки"
            >
              <Settings className="w-5 h-5 text-gray-500" />
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded 
                opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                Настройки
              </span>
            </button>
          </div>
        )}

        {/* Основной контент (показывается только когда не свернуто) */}
        {!collapsed && (
          <div className="flex-1 overflow-y-auto py-2">
            {/* Системные группы */}
            <SidebarSection title="Заметки">
              {systemGroups.map(group => (
                <SidebarGroup
                  key={group.id}
                  group={group}
                  notes={group.notes}
                  selectedGroup={selectedGroup}
                  expandedGroups={expandedGroups}
                  toggleGroup={toggleGroup}
                  onGroupSelect={onGroupSelect}
                  selectedNote={selectedNote}
                  onNoteSelect={onNoteSelect}
                  onNoteDelete={onNoteDelete}
                  onToggleFavorite={onToggleFavorite}
                  onMoveNoteToGroup={onMoveNoteToGroup}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  dragOverGroup={dragOverGroup}
                  favorites={favorites}
                />
              ))}
            </SidebarSection>

            {/* Пользовательские группы */}
            {userGroups.length > 0 && (
              <SidebarSection title="Группы">
                {userGroups.map(group => (
                  <SidebarGroup
                    key={group.id}
                    group={group}
                    notes={group.notes}
                    selectedGroup={selectedGroup}
                    expandedGroups={expandedGroups}
                    toggleGroup={toggleGroup}
                    onGroupSelect={onGroupSelect}
                    selectedNote={selectedNote}
                    onNoteSelect={onNoteSelect}
                    onNoteDelete={onNoteDelete}
                    onToggleFavorite={onToggleFavorite}
                    onMoveNoteToGroup={onMoveNoteToGroup}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    dragOverGroup={dragOverGroup}
                    favorites={favorites}
                  />
                ))}

                <button
                  onClick={onOpenGroupManager}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg w-full transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Новая группа
                </button>
              </SidebarSection>
            )}

            {/* Заметки без группы */}
            {noGroupNotes.length > 0 && (
              <SidebarSection title="Без группы">
                <SidebarGroup
                  group={{
                    id: "none",
                    name: "Без группы",
                    icon: FileText,
                    notes_count: noGroupNotesCount
                  }}
                  notes={noGroupNotes}
                  selectedGroup={selectedGroup}
                  expandedGroups={expandedGroups}
                  toggleGroup={toggleGroup}
                  onGroupSelect={onGroupSelect}
                  selectedNote={selectedNote}
                  onNoteSelect={onNoteSelect}
                  onNoteDelete={onNoteDelete}
                  onToggleFavorite={onToggleFavorite}
                  onMoveNoteToGroup={onMoveNoteToGroup}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  dragOverGroup={dragOverGroup}
                  favorites={favorites}
                />
              </SidebarSection>
            )}
          </div>
        )}
      </aside>
    </>
  );
};

// Компонент секции сайдбара
const SidebarSection = ({ title, children }) => {
  return (
    <div className="mb-4">
      <div className="px-4 mb-1 text-xs text-gray-400 uppercase tracking-wider">
        {title}
      </div>
      {children}
    </div>
  );
};

// Компонент группы в сайдбаре
const SidebarGroup = ({
  group,
  notes = [],
  selectedGroup,
  expandedGroups,
  toggleGroup,
  onGroupSelect,
  selectedNote,
  onNoteSelect,
  onNoteDelete,
  onToggleFavorite,
  onMoveNoteToGroup,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  dragOverGroup,
  favorites = []
}) => {
  const isExpanded = expandedGroups.includes(group.id);
  const isActive = String(selectedGroup) === String(group.id);
  const Icon = group.icon;
  const noteCount = group.notes_count !== undefined 
    ? group.notes_count 
    : notes.length;

  return (
    <div>
      {/* Заголовок группы */}
      <div
        className={`
        flex items-center gap-2 px-4 py-2 cursor-pointer
        ${isActive ? "bg-indigo-50 dark:bg-indigo-900/20" : ""}
        hover:bg-gray-50 dark:hover:bg-gray-800
        ${dragOverGroup === group.id ? "ring-2 ring-indigo-500" : ""}
        transition-colors
      `}
        onClick={() => onGroupSelect(group.id)}
        onDragOver={(e) => onDragOver?.(e, group.id)}
        onDrop={(e) => onDrop?.(e, group.id)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleGroup(group.id);
          }}
          className="focus:outline-none"
        >
          {isExpanded
            ? <ChevronDown className="w-3 h-3 text-gray-400" />
            : <ChevronRightSmall className="w-3 h-3 text-gray-400" />}
        </button>

        <Icon className="w-4 h-4 text-gray-500" />

        <span className="text-sm flex-1 truncate">
          {group.name}
        </span>

        <span className="text-xs text-gray-400">
          {noteCount}
        </span>
      </div>

      {/* Заметки в группе (раскрывающиеся) */}
      {isExpanded && (
        <div className="ml-6 space-y-1">
          {notes.map(note => (
            <SidebarNote
              key={note.id}
              note={note}
              isSelected={selectedNote?.id === note.id}
              isFavorite={favorites.includes(note.id)}
              onSelect={() => onNoteSelect(note)}
              onDelete={() => onNoteDelete?.(note)}
              onToggleFavorite={() => onToggleFavorite?.(note.id)}
              onMoveToGroup={() => onMoveNoteToGroup?.(note.id)}
              onDragStart={(e) => onDragStart?.(e, note)}
              onDragEnd={onDragEnd}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Компонент заметки в сайдбаре
const SidebarNote = ({
  note,
  isSelected,
  isFavorite,
  onSelect,
  onDelete,
  onToggleFavorite,
  onMoveToGroup,
  onDragStart,
  onDragEnd
}) => {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="group relative"
    >
      <div
        onClick={onSelect}
        className={`
        px-3 py-2 text-sm rounded-lg cursor-pointer
        truncate pr-16
        ${isSelected ? "bg-indigo-100 dark:bg-indigo-900/30" : ""}
        hover:bg-gray-100 dark:hover:bg-gray-800
        transition-colors
      `}
      >
        {note.title || "Без названия"}
      </div>

      {/* Кнопки действий при наведении */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-inherit">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.();
          }}
          className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
            isFavorite ? 'text-red-500' : 'text-gray-400'
          }`}
          title={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
        >
          <Heart className="w-3 h-3" fill={isFavorite ? "currentColor" : "none"} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveToGroup?.();
          }}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 transition-colors"
          title="Переместить в группу"
        >
          <Folder className="w-3 h-3" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 transition-colors"
          title="Удалить"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default NoteSidebar;