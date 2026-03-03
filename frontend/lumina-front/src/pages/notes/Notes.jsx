import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from './ThemeContext';
import AppLayout from './AppLayout';
import Profile from './Profile';
import NoteSidebar from './NoteSideBar';
import NoteEditor from './NoteEditor';
import StatisticsPanel from './StatisticsPanel';
import SearchFilters from './SearchFilters';
import TagManager from './TagManager';
import TrashBin from './TrashBin';
import SettingsPanel from './SettingsPanel';
import QuickActions from './QuickActions';
import DeleteConfirmModal from './DeleteConfirmModal';
import WelcomeScreen from './WelcomeScreen';
import MiniStatistics from './MiniStatistics';
import ActionButton from './ActionButton';
import NoteItem from './NoteItem';
import GroupManager from './GroupManager';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Menu,
  Settings,
  BarChart2,
  Zap,
  Filter,
  Trash2,
  WifiOff,
  User,
  Folder as FolderIcon,
  Move,
  Check,
  X
} from 'lucide-react';
import { api } from '../../api/api';

const Notes = () => {
  const { id } = useParams();
  const { themeClasses, isMobile, theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletedNotes, setDeletedNotes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [tags, setTags] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [notesByGroups, setNotesByGroups] = useState([]);
  const [editingGroupInSidebar, setEditingGroupInSidebar] = useState(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [noteToMove, setNoteToMove] = useState(null);
  const [draggedNote, setDraggedNote] = useState(null);
  const [dragOverGroup, setDragOverGroup] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('viewMode');
    return saved || 'split';
  });
  const [autoSave, setAutoSave] = useState(() => {
    const saved = localStorage.getItem('autoSave');
    return saved ? JSON.parse(saved) : true;
  });
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('fontSize');
    return saved || 'medium';
  });
  const [notification, setNotification] = useState(null);

  const initialLoadDone = useRef(false);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      loadNotes();
      loadDeletedNotes();
      loadGroups();
      loadNotesByGroups();
      showNotification('Соединение восстановлено', 'success');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      showNotification('Работа в оффлайн режиме', 'warning');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      if (isOnline) {
        loadNotes();
        loadDeletedNotes();
        loadGroups();
        loadNotesByGroups();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isOnline]);

  useEffect(() => {
    if (!initialLoadDone.current) {
      loadNotes();
      loadDeletedNotes();
      loadGroups();
      loadNotesByGroups();
      initialLoadDone.current = true;
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('autoSave', JSON.stringify(autoSave));
  }, [autoSave]);

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    if (id && notes.length > 0) {
      const note = notes.find(n => n.id === parseInt(id));
      if (note) {
        setSelectedNote(note);
      }
    }
  }, [id, notes]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const data = await api.getNotes();
      console.log('📝 Заметки загружены:', data);
      setNotes(data);

      if (data.length > 0 && !selectedNote) {
        setSelectedNote(data[0]);
      }

      const favs = data.filter(n => n.isFavorite).map(n => n.id);
      setFavorites(favs);

      const allTags = [...new Set(data.flatMap(n => n.tags || []))];
      setTags(allTags);
    } catch (e) {
      console.error('Failed to load notes:', e);
      showNotification('Ошибка загрузки заметок', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDeletedNotes = async () => {
    try {
      const deleted = await api.getDeletedNotes();
      setDeletedNotes(deleted);
    } catch (error) {
      console.error('Failed to load deleted notes:', error);
      setDeletedNotes([]);
    }
  };

  const loadGroups = async () => {
    try {
      const loadedGroups = await api.getGroups();
      console.log('Группы загружены:', loadedGroups);
      setGroups(loadedGroups);
    } catch (error) {
      console.error('Failed to load groups:', error);
      showNotification('Ошибка загрузки групп', 'error');
    }
  };

  const loadNotesByGroups = async () => {
    try {
      const data = await api.getNotesByGroups();
      console.log('Заметки по группам:', data);
      setNotesByGroups(data);
    } catch (error) {
      console.error('Failed to load notes by groups:', error);
    }
  };

  const handleNoteSelect = (note) => {
    setSelectedNote(note);
    if (isMobile) setMobileMenuOpen(false);
  };

  const handleNoteCreate = async (groupId = null) => {
    try {
      const newNote = {
        title: 'Новая заметка',
        text: '',
        tags: [],
        isFavorite: false,
        group: groupId !== null ? groupId : selectedGroup
      };

      const created = await api.createNote(newNote);
      setNotes(prev => [created, ...prev]);
      setSelectedNote(created);
      loadNotesByGroups();
      showNotification('Заметка создана', 'success');
    } catch (error) {
      console.error('Failed to create note:', error);
      showNotification('Ошибка при создании заметки', 'error');
    }
  };

  const handleNoteUpdate = async (id, updates) => {
    // Оптимистичное обновление
    setNotes(prev =>
      prev.map(n => (n.id === id ? { ...n, ...updates } : n))
    );

    if (selectedNote?.id === id) {
      setSelectedNote(prev => ({ ...prev, ...updates }));
    }

    if (!isOnline) {
      const pendingUpdates = JSON.parse(localStorage.getItem('pendingUpdates') || '[]');
      pendingUpdates.push({ id, updates, timestamp: Date.now() });
      localStorage.setItem('pendingUpdates', JSON.stringify(pendingUpdates));
      showNotification('Изменения сохранены локально', 'info');
      return;
    }

    try {
      await api.updateNote(id, updates);
      if (updates.group !== undefined) {
        loadNotesByGroups();
      }
      showNotification('Заметка обновлена', 'success');
    } catch (error) {
      console.error('Failed to update note:', error);
      showNotification('Ошибка при обновлении заметки', 'error');
      loadNotes();
    }
  };

  const handleNoteDelete = async (id) => {
    try {
      const note = notes.find(n => n.id === id);
      if (!note) return;

      setNoteToDelete({ id, title: note.title });
      setShowDeleteConfirm(true);
    } catch (error) {
      console.error('Error preparing delete:', error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    
    try {
      const { id } = noteToDelete;
      
      await api.deleteNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
      await loadDeletedNotes();
      loadNotesByGroups();
      
      if (selectedNote?.id === id) {

        const remainingNotes = notes.filter(n => n.id !== id);
            
        const nextNote = remainingNotes.find(n =>
          selectedGroup
            ? String(n.group) === String(selectedGroup)
            : true
        );
      
        setSelectedNote(nextNote || null);
      }
      
      showNotification('Заметка перемещена в корзину', 'success');
    } catch (error) {
      console.error('Failed to delete note:', error);
      showNotification('Ошибка при удалении заметки', 'error');
    } finally {
      setShowDeleteConfirm(false);
      setNoteToDelete(null);
    }
  };

  const handleToggleFavorite = async (id) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    const newFavoriteState = !note.isFavorite;
    setNotes(prev =>
      prev.map(n => n.id === id ? { ...n, isFavorite: newFavoriteState } : n)
    );

    setFavorites(prev =>
      newFavoriteState ? [...prev, id] : prev.filter(f => f !== id)
    );

    try {
      await api.updateNote(id, { isFavorite: newFavoriteState });
      showNotification(newFavoriteState ? 'Добавлено в избранное' : 'Убрано из избранного', 'success');
    } catch (error) {
      console.error('Failed to toggle favorite:', error);

      setNotes(prev =>
        prev.map(n => n.id === id ? { ...n, isFavorite: !newFavoriteState } : n)
      );
      
      setFavorites(prev =>
        !newFavoriteState ? [...prev, id] : prev.filter(f => f !== id)
      );
      
      showNotification('Ошибка при изменении избранного', 'error');
    }
  };

  const handleGroupSelect = (groupId) => {
    setSelectedGroup(groupId);

    const groupNotes = notes.filter(
      note => String(note.group) === String(groupId)
    );

    if (groupNotes.length > 0) {
      setSelectedNote(groupNotes[0]);
    } else {
      setSelectedNote(null);
    }
  };

  const handleMoveNoteToGroup = async (noteId, groupId) => {
    try {
      await api.moveNoteToGroup(noteId, groupId);

      setNotes(prev =>
        prev.map(note => 
          note.id === noteId 
            ? { ...note, group: groupId } 
            : note
        )
      );
      
      loadNotesByGroups();
      
      if (selectedNote?.id === noteId) {
        setSelectedNote(prev => ({ ...prev, group: groupId }));
      }

      const groupName = groupId ? groups.find(g => g.id === groupId)?.name : 'Без группы';
      showNotification(`Заметка перемещена в "${groupName}"`, 'success');
    } catch (error) {
      console.error('Failed to move note:', error);
      showNotification('Ошибка при перемещении заметки', 'error');
    } finally {
      setShowMoveModal(false);
      setNoteToMove(null);
    }
  };

  const handleDragStart = (e, note) => {
    setDraggedNote(note);
    e.dataTransfer.setData('text/plain', note.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedNote(null);
    setDragOverGroup(null);
  };

  const handleDragOver = (e, groupId) => {
    e.preventDefault();
    if (groupId !== 'favorites' && groups.some(g => g.id === groupId)) {
      setDragOverGroup(groupId);
    }
  };

  const handleDrop = async (e, targetGroupId) => {
    e.preventDefault();
    const noteId = e.dataTransfer.getData('text/plain');
    
    if (noteId && targetGroupId && targetGroupId !== 'favorites') {
      await handleMoveNoteToGroup(parseInt(noteId), targetGroupId);
    }
    
    setDragOverGroup(null);
    setDraggedNote(null);
  };

  const handleGroupCreated = (newGroup) => {
    setGroups(prev => [...prev, newGroup]);
    loadNotesByGroups();
    showNotification('Группа создана', 'success');
  };

  const handleGroupUpdated = (updatedGroup) => {
    setGroups(prev =>
      prev.map(g => g.id === updatedGroup.id ? updatedGroup : g)
    );
    loadNotesByGroups();
    showNotification('Группа обновлена', 'success');
  };

  const handleGroupDeleted = (deletedGroupId) => {
    setGroups(prev => prev.filter(g => g.id !== deletedGroupId));
    
    if (selectedGroup === deletedGroupId) {
      setSelectedGroup(null);
    }
    
    setNotes(prev =>
      prev.map(note =>
        note.group === deletedGroupId
          ? { ...note, group: null }
          : note
      )
    );
    
    loadNotesByGroups();
    showNotification('Группа удалена', 'success');
  };

  const handleRestoreNote = async (id) => {
    try {
      const restored = await api.restoreNote(id);
      setDeletedNotes(prev => prev.filter(n => n.id !== id));
      setNotes(prev => {
        if (prev.some(n => n.id === restored.id)) {
          return prev;
        }
        return [restored, ...prev];
      });
      
      loadNotesByGroups();
      showNotification('Заметка восстановлена', 'success');
    } catch (error) {
      console.error('Failed to restore note:', error);
      showNotification('Ошибка при восстановлении заметки', 'error');
    }
  };

  const handleDeletePermanently = async (id) => {
    if (!window.confirm('Удалить заметку навсегда? Это действие нельзя отменить.')) {
      return;
    }
    
    try {
      await api.deleteNotePermanently(id);
      setDeletedNotes(prev => prev.filter(n => n.id !== id));
      loadNotesByGroups();
      showNotification('Заметка удалена навсегда', 'success');
    } catch (error) {
      console.error('Failed to delete permanently:', error);
      showNotification('Ошибка при полном удалении заметки', 'error');
    }
  };

  const handleEmptyTrash = async () => {
    if (!window.confirm('Очистить корзину? Это действие нельзя отменить.')) {
      return;
    }
    
    try {
      await api.emptyTrash();
      setDeletedNotes([]);
      showNotification('Корзина очищена', 'success');
    } catch (error) {
      console.error('Failed to empty trash:', error);
      showNotification('Ошибка при очистке корзины', 'error');
    }
  };

  const handleTagSelect = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleTagDelete = async (tag) => {
    if (window.confirm(`Удалить тег "${tag}" из всех заметок?`)) {
      try {
        const notesWithTag = notes.filter(n => n.tags?.includes(tag));
        
        for (const note of notesWithTag) {
          const updatedTags = note.tags.filter(t => t !== tag);
          await api.updateNote(note.id, { tags: updatedTags });
        }
        
        setNotes(prev => prev.map(note => ({
          ...note,
          tags: note.tags?.filter(t => t !== tag) || []
        })));
        
        setTags(prev => prev.filter(t => t !== tag));
        showNotification(`Тег "${tag}" удален`, 'success');
      } catch (error) {
        console.error('Failed to delete tag:', error);
        showNotification('Ошибка при удалении тега', 'error');
      }
    }
  };

  const filteredNotes = notes.filter(note => {
    
    const title = note.title || "";
    const text = note.text || "";
    
    const matchesSearch =
      searchQuery === "" ||
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      text.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFavorite = !favoriteOnly || favorites.includes(note.id);
    
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.every(tag => note.tags?.includes(tag));
    
    let matchesGroup = true;

    if (selectedGroup === "favorites") {
      matchesGroup = note.isFavorite;
    }
    else if (selectedGroup === "images") {
      matchesGroup = note.images_count > 0;
    }
    else if (selectedGroup && selectedGroup !== "all") {
      matchesGroup = String(note.group) === String(selectedGroup);
    }
    
    let matchesDate = true;
    
    if (dateRange.from) {
      matchesDate = new Date(note.created_at) >= new Date(dateRange.from);
    }
  
    if (dateRange.to && matchesDate) {
      matchesDate = new Date(note.created_at) <= new Date(dateRange.to);
    }
  
    return matchesSearch && matchesFavorite && matchesTags && matchesDate && matchesGroup;
  
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    if (sortBy === 'favorites') {
      aVal = favorites.includes(a.id) ? 1 : 0;
      bVal = favorites.includes(b.id) ? 1 : 0;
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  useEffect(() => {

    if (!selectedNote && sortedNotes.length > 0) {
      setSelectedNote(sortedNotes[0]);
    }

  }, [sortedNotes]);

  const getGroupedNotesForSidebar = () => {

    const result = {};

    result["Все заметки"] = [...notes].sort(
      (a,b)=>new Date(b.created_at)-new Date(a.created_at)
    );

    // Избранное
    result["Избранное"] = notes.filter(n => n.isFavorite);

    // Пользовательские группы
    groups.forEach(group => {

      const groupNotes = notes.filter(
        note => String(note.group) === String(group.id)
      );

      result[group.name] = groupNotes;

    });

    // Без группы
    const noGroupNotes = notes.filter(
      note => !note.group
    );

    result["Без группы"] = noGroupNotes;

    return result;
  };
  const Notification = () => {
    if (!notification) return null;

    const bgColor = notification.type === 'success' ? 'bg-green-500' :
                    notification.type === 'error' ? 'bg-red-500' :
                    notification.type === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500';

    return (
      <div className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg animate-slideIn`}>
        {notification.message}
      </div>
    );
  };
  const Header = () => (
    <div className={`flex items-center justify-between px-4 h-16 border-b ${themeClasses.colors.border.primary} backdrop-blur-sm bg-opacity-90 sticky top-0 z-10`}>
      <div className="flex items-center gap-3">
        {isMobile && (
          <button 
            onClick={() => setMobileMenuOpen(true)} 
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
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      <div className="flex items-center gap-1">
        {isMobile && selectedGroup !== null && (
          <div className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs rounded-full mr-1">
            {groups.find(g => g.id === selectedGroup)?.name || 'Группа'}
          </div>
        )}
        
        <ActionButton 
          icon={Plus} 
          onClick={() => handleNoteCreate()}
          tooltip="Новая заметка"
          className="text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
        />
        
        <ActionButton 
          icon={BarChart2} 
          onClick={() => setShowStatistics(!showStatistics)}
          tooltip="Статистика"
          active={showStatistics}
        />
        
        <ActionButton 
          icon={Filter} 
          onClick={() => setShowSearchFilters(true)}
          tooltip="Фильтры"
          badge={selectedTags.length > 0 ? selectedTags.length : null}
          badgeColor="indigo"
        />
        
        <ActionButton 
          icon={() => <span className="text-sm font-medium">#</span>} 
          onClick={() => setShowTagManager(true)}
          tooltip="Управление тегами"
        />
        
        <ActionButton 
          icon={Trash2} 
          onClick={() => setShowTrash(true)}
          tooltip="Корзина"
          badge={deletedNotes.length > 0 ? deletedNotes.length : null}
          badgeColor="red"
        />
          
        <ActionButton 
          icon={User} 
          onClick={() => navigate('/profile')}
          tooltip="Профиль"
        />
          
        <QuickActions
          onNewNote={handleNoteCreate}
          onSearch={() => setShowSearchFilters(true)}
          groups={groups}
          onGroupSelect={handleGroupSelect}
          selectedGroup={selectedGroup}
        />
      </div>
    </div>
  );

  const Footer = () => (
    <div className={`border-t px-4 py-2 text-xs flex justify-between items-center ${themeClasses.colors.text.tertiary}`}>
      <div className="flex items-center gap-2">
        <span>{filteredNotes.length} заметок</span>
        {selectedGroup !== null && (
          <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full">
            {groups.find(g => g.id === selectedGroup)?.name || 'Группа'}
          </span>
        )}
        {selectedTags.length > 0 && (
          <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full">
            {selectedTags.length} тега
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        {deletedNotes.length > 0 && (
          <button
            onClick={() => setShowTrash(true)}
            className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors hover:scale-105"
          >
            <Trash2 className="w-3 h-3" />
            <span>{deletedNotes.length} в корзине</span>
          </button>
        )}
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <Settings className="w-3 h-3" />
          <span>Настройки</span>
        </button>
      </div>
    </div>
  );

  console.log('Рендер Notes.jsx');
  console.log('filteredNotes:', filteredNotes.length);
  console.log('groups:', groups);
  console.log('groupedNotes:', getGroupedNotesForSidebar());

  if (loading && notes.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Zap className="animate-pulse w-10 h-10 text-indigo-500 mx-auto mb-4" />
          <p className="text-gray-500">Загрузка заметок...</p>
        </div>
      </div>
    );
  }
  return (
    <>
      <Notification />
      
      <AppLayout
        sidebar={
          <NoteSidebar
            groupedNotes={getGroupedNotesForSidebar()}
            selectedNote={selectedNote}
            onNoteSelect={handleNoteSelect}
            onNoteDelete={handleNoteDelete}
            onToggleFavorite={handleToggleFavorite}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            isMobile={isMobile}
            mobileOpen={mobileMenuOpen}
            onMobileClose={() => setMobileMenuOpen(false)}
            favorites={favorites}
            tags={tags}
            groups={groups}
            selectedGroup={selectedGroup}
            onGroupSelect={handleGroupSelect}
            onOpenGroupManager={() => setShowGroupManager(true)}
            onCreateNote={() => handleNoteCreate()}
            onMoveNoteToGroup={(noteId, groupId) => {
              setNoteToMove(notes.find(n => n.id === noteId));
              setShowMoveModal(true);
            }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            dragOverGroup={dragOverGroup}
            draggedNote={draggedNote}
          />
        }
        header={<Header />}
        footer={<Footer />}
        rightPanel={showStatistics && (
          <MiniStatistics
            notes={notes}
            tags={tags}
            favorites={favorites}
            groups={groups}
            deletedCount={deletedNotes.length}
            onClose={() => setShowStatistics(false)}
          />
        )}
        sidebarCollapsed={sidebarCollapsed}
        isMobile={isMobile}
      >
        {selectedNote ? (
          <NoteEditor
            key={selectedNote.id}
            note={selectedNote}
            onUpdate={handleNoteUpdate}
            autoSave={autoSave}
            fontSize={fontSize}
            groups={groups}
            onMoveToGroup={(groupId) => handleMoveNoteToGroup(selectedNote.id, groupId)}
          />
        ) : (
          <WelcomeScreen
            onNoteCreate={handleNoteCreate}
            notes={notes}
            recentNotes={sortedNotes.slice(0, 5)}
            selectedGroup={selectedGroup}
            groups={groups}
          />
        )}

        {showSearchFilters && (
          <SearchFilters
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
            favoriteOnly={favoriteOnly}
            setFavoriteOnly={setFavoriteOnly}
            dateRange={dateRange}
            setDateRange={setDateRange}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            tags={tags}
            groups={groups}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
            onClose={() => setShowSearchFilters(false)}
          />
        )}

        {showTagManager && (
          <TagManager
            tags={tags}
            notes={notes}
            onClose={() => setShowTagManager(false)}
            onTagSelect={handleTagSelect}
            onTagDelete={handleTagDelete}
          />
        )}

        {showTrash && (
          <TrashBin
            deletedNotes={deletedNotes}
            onRestore={handleRestoreNote}
            onDeletePermanently={handleDeletePermanently}
            onEmpty={handleEmptyTrash}
            onClose={() => setShowTrash(false)}
            loading={loading}
          />
        )}

        {showSettings && (
          <SettingsPanel
            theme={theme}
            onThemeChange={setTheme}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            autoSave={autoSave}
            onAutoSaveToggle={() => setAutoSave(!autoSave)}
            fontSize={fontSize}
            onFontSizeChange={setFontSize}
            onClose={() => setShowSettings(false)}
          />
        )}

        {showGroupManager && (
          <GroupManager
            isOpen={showGroupManager}
            onClose={() => setShowGroupManager(false)}
            groups={groups}
            notes={notes}
            onGroupSelect={handleGroupSelect}
            selectedGroupId={selectedGroup}
            onGroupCreated={handleGroupCreated}
            onGroupUpdated={handleGroupUpdated}
            onGroupDeleted={handleGroupDeleted}
          />
        )}

        {/* Модалка перемещения заметки */}
        {showMoveModal && noteToMove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMoveModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full m-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Move className="w-5 h-5 text-indigo-500" />
                  Переместить заметку
                </h3>
                <button
                  onClick={() => setShowMoveModal(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Выберите группу для заметки "{noteToMove.title}"
              </p>
              
              <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                <button
                  onClick={() => handleMoveNoteToGroup(noteToMove.id, null)}
                  className="w-full p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors group"
                >
                  <div className="p-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg group-hover:bg-gray-300 dark:group-hover:bg-gray-600 transition-colors">
                    <FolderIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">Без группы</span>
                    <p className="text-xs text-gray-500">Заметки без группы</p>
                  </div>
                  {noteToMove.group === null && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                </button>
                
                {groups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => handleMoveNoteToGroup(noteToMove.id, group.id)}
                    className="w-full p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors group"
                  >
                    <div className={`p-1.5 rounded-lg ${getGroupColorClass(group.color)}`}>
                      <FolderIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{group.name}</span>
                      {group.description && (
                        <p className="text-xs text-gray-500 truncate">{group.description}</p>
                      )}
                    </div>
                    {noteToMove.group === group.id && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                  </button>
                ))}
              </div>
              
              <div className="flex justify-end gap-2 pt-2 border-t dark:border-gray-700">
                <button
                  onClick={() => setShowMoveModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setNoteToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          noteTitle={noteToDelete?.title}
        />
      </AppLayout>
    </>
  );
};

const getGroupColorClass = (color) => {
  const colors = {
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  };
  return colors[color] || colors.indigo;
};

export default Notes;