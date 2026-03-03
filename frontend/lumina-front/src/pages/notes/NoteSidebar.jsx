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
  Plus
} from "lucide-react";
import { useTheme } from "./ThemeContext";

const NoteSidebar = ({
  groupedNotes,
  selectedNote,
  onNoteSelect,
  collapsed,
  onToggleCollapse,
  isMobile,
  mobileOpen,
  onMobileClose,
  favorites,
  groups,
  selectedGroup,
  onGroupSelect,
  onOpenGroupManager,
  onCreateNote,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  dragOverGroup
}) => {

  const { themeClasses } = useTheme();

  const [expandedGroups, setExpandedGroups] = useState(["all"]);

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

  const systemGroups = [
    {
      id: "all",
      name: "Все заметки",
      icon: Grid,
      notes: groupedNotes["Все заметки"] || []
    },
    {
      id: "favorites",
      name: "Избранное",
      icon: Star,
      notes: groupedNotes["Все заметки"]?.filter(n => favorites.includes(n.id)) || []
    },
    {
      id: "images",
      name: "С изображениями",
      icon: ImageIcon,
      notes: groupedNotes["Все заметки"]?.filter(n => n.images_count > 0) || []
    }
  ];
  const userGroups = groups.map(group => ({
    id: String(group.id),
    name: group.name,
    icon: Folder,
    notes: groupedNotes[group.name] || []
  }));

  const noGroupNotes = groupedNotes["Без группы"] || [];

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
        ${isMobile ? "fixed left-0 top-0 bottom-0 z-50 w-80" : "relative"}
        ${themeClasses.colors.sidebar.bg}
        border-r ${themeClasses.colors.border.primary}
        flex flex-col h-screen
        transition-all duration-300
        ${collapsed && !isMobile ? "w-20" : "w-80"}
      `}
      >
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
                className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20"
              >
                <Plus className="w-4 h-4 text-green-500" />
              </button>
            )}

            {!isMobile && (
              <button
                onClick={onToggleCollapse}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {collapsed
                  ? <ChevronRight className="w-4 h-4" />
                  : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}

          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">

          {!collapsed && (
            <SidebarSection title="Заметки">

              {systemGroups.map(group => (
                <SidebarGroup
                  key={group.id}
                  group={group}
                  selectedGroup={selectedGroup}
                  expandedGroups={expandedGroups}
                  toggleGroup={toggleGroup}
                  onGroupSelect={onGroupSelect}
                  notes={group.notes}
                  selectedNote={selectedNote}
                  onNoteSelect={onNoteSelect}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  dragOverGroup={dragOverGroup}
                />
              ))}

            </SidebarSection>
          )}

          {!collapsed && (
            <SidebarSection title="Группы">

              {userGroups.map(group => (
                <SidebarGroup
                  key={group.id}
                  group={group}
                  selectedGroup={selectedGroup}
                  expandedGroups={expandedGroups}
                  toggleGroup={toggleGroup}
                  onGroupSelect={onGroupSelect}
                  notes={group.notes}
                  selectedNote={selectedNote}
                  onNoteSelect={onNoteSelect}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  dragOverGroup={dragOverGroup}
                />
              ))}

              <button
                onClick={onOpenGroupManager}
                className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <Plus className="w-4 h-4" />
                Новая группа
              </button>

            </SidebarSection>
          )}

          {noGroupNotes.length > 0 && !collapsed && (
            <SidebarSection title="Без группы">

              <SidebarGroup
                group={{
                  id: "none",
                  name: "Без группы",
                  icon: FileText
                }}
                selectedGroup={selectedGroup}
                expandedGroups={expandedGroups}
                toggleGroup={toggleGroup}
                onGroupSelect={onGroupSelect}
                notes={noGroupNotes}
                selectedNote={selectedNote}
                onNoteSelect={onNoteSelect}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}
                onDrop={onDrop}
                dragOverGroup={dragOverGroup}
              />

            </SidebarSection>
          )}

        </div>

      </aside>
    </>
  );
};

export default NoteSidebar;

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
const SidebarGroup = ({
  group,
  notes,
  selectedGroup,
  expandedGroups,
  toggleGroup,
  onGroupSelect,
  selectedNote,
  onNoteSelect,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  dragOverGroup
}) => {

  const isExpanded = expandedGroups.includes(group.id);
  const isActive = String(selectedGroup) === String(group.id);

  const Icon = group.icon;

  return (
    <div>

      <div
        className={`
        flex items-center gap-2 px-4 py-2 cursor-pointer
        ${isActive ? "bg-indigo-50 dark:bg-indigo-900/20" : ""}
        hover:bg-gray-50 dark:hover:bg-gray-800
        ${dragOverGroup === group.id ? "ring-2 ring-indigo-500" : ""}
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
        >
          {isExpanded
            ? <ChevronDown className="w-3 h-3" />
            : <ChevronRightSmall className="w-3 h-3" />}
        </button>

        <Icon className="w-4 h-4" />

        <span className="text-sm flex-1 truncate">
          {group.name}
        </span>

        <span className="text-xs text-gray-400">
          {notes.length}
        </span>

      </div>

      {isExpanded && (
        <div className="ml-6 space-y-1">

          {notes.map(note => (
            <SidebarNote
              key={note.id}
              note={note}
              isSelected={selectedNote?.id === note.id}
              onSelect={() => onNoteSelect(note)}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))}

        </div>
      )}

    </div>
  );
};
const SidebarNote = ({
  note,
  isSelected,
  onSelect,
  onDragStart,
  onDragEnd
}) => {

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, note)}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      className={`
      px-3 py-2 text-sm rounded-lg cursor-pointer
      truncate
      ${isSelected ? "bg-indigo-100 dark:bg-indigo-900/30" : ""}
      hover:bg-gray-100 dark:hover:bg-gray-800
      `}
    >
      {note.title || "Без названия"}
    </div>
  );
};