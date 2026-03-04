import React, { useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../../../pages/notes/ThemeContext';
import AppLayout from '../../../../pages/notes/AppLayout';
import NoteSidebar from '../../../../pages/notes/NoteSideBar';
import NoteEditor from '../../../../pages/notes/NoteEditor';
import WelcomeScreen from '../../../../pages/notes/WelcomeScreen';
import SearchFilters from '../../../../pages/notes/SearchFilters';
import TagManager from '../../../../pages/notes/TagManager';
import TrashBin from '../../../../pages/notes/TrashBin';
import SettingsPanel from '../../../../pages/notes/SettingsPanel';
import GroupManager from '../../../../pages/notes/GroupManager';
import MiniStatistics from '../../../../pages/notes/MiniStatistics';
import DeleteConfirmModal from '../../../../pages/notes/DeleteConfirmModal';
import { useNotes, useTrashNotes, useNotesByGroups } from '../../hooks/useNotes';
import { useNoteMutations } from '../../hooks/useNoteMutations';
import { useGroups } from '../../hooks/useGroups';
import { useTags } from '../../hooks/useTags';
import { useNoteUI } from '../../hooks/useNoteUI';
import { useNoteFilters } from '../../hooks/useNoteFilters';
import NoteList from '../NoteList/NoteList';
import Header from '../Common/Header';
import Footer from '../Common/Footer';
import Notification from '../Common/Notification';

const NotesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { themeClasses, isMobile, theme, setTheme } = useTheme();
  const { data: notes = [], isLoading: notesLoading } = useNotes();
  const { data: groups = [] } = useGroups();
  const { data: tags = [] } = useTags();
  const { data: trashNotes = [] } = useTrashNotes();
  const { data: notesByGroups } = useNotesByGroups();
  const {
    createNote,
    updateNote,
    softDeleteNote,
    restoreNote,
    moveNoteToGroup,
  } = useNoteMutations();
  const {
    uiState,
    openNoteModal,
    closeNoteModal,
    toggleSidebar,
    toggleMobileMenu,
    closeMobileMenu,
    toggleStatistics,
    toggleSettings,
    toggleSearchFilters,
    toggleTagManager,
    toggleTrash,
    toggleGroupManager,
    openDeleteModal,
    closeDeleteModal,
    openMoveModal,
    closeMoveModal,
    setDraggedNote,
    setDragOverGroup,
    clearDragState,
    toggleNoteSelection,
    clearSelection,
    selectAll,
    showNotification,
    setSelectedGroup,
    setOnlineStatus,
  } = useNoteUI();
  const {
    filters,
    updateFilter,
    toggleTag,
    resetFilters,
    activeFiltersCount,
    filterAndSortNotes,
  } = useNoteFilters();

  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);

  useEffect(() => {
    if (id && notes.length > 0) {
      const note = notes.find(n => n.id === parseInt(id));
      if (note && uiState.selectedNoteId !== parseInt(id)) {
        openNoteModal(parseInt(id), 'view');
      }
    }
  }, [id, notes, uiState.selectedNoteId, openNoteModal]);

  const filteredNotes = useMemo(() => 
    filterAndSortNotes(notes),
    [notes, filterAndSortNotes]
  );

  const selectedNote = useMemo(() => 
    notes.find(n => n.id === uiState.selectedNoteId),
    [notes, uiState.selectedNoteId]
  );

  const handleNoteSelect = useCallback((note) => {
    openNoteModal(note.id, 'view');
    if (isMobile) closeMobileMenu();
  }, [openNoteModal, isMobile, closeMobileMenu]);

  const handleNoteCreate = useCallback(async (groupId = null) => {
    try {
      const newNote = await createNote.mutateAsync({
        title: 'Новая заметка',
        text: '',
        group: groupId || filters.selectedGroup
      });
      openNoteModal(newNote.id, 'edit');
      showNotification('Заметка создана', 'success');
    } catch (error) {
      showNotification('Ошибка при создании заметки', 'error');
    }
  }, [createNote, filters.selectedGroup, openNoteModal, showNotification]);

  const handleNoteUpdate = useCallback(async (id, updates) => {
    try {
      await updateNote.mutateAsync({ id, ...updates });
      showNotification('Заметка обновлена', 'success');
    } catch (error) {
      showNotification('Ошибка при обновлении заметки', 'error');
    }
  }, [updateNote, showNotification]);

  const handleNoteDelete = useCallback((note) => {
    openDeleteModal(note);
  }, [openDeleteModal]);

  const handleConfirmDelete = useCallback(async () => {
    if (!uiState.noteToDelete) return;
    
    try {
      await softDeleteNote.mutateAsync(uiState.noteToDelete.id);
      closeDeleteModal();
      
      if (uiState.selectedNoteId === uiState.noteToDelete.id) {
        const nextNote = filteredNotes.find(n => n.id !== uiState.noteToDelete.id);
        if (nextNote) {
          openNoteModal(nextNote.id, 'view');
        } else {
          closeNoteModal();
        }
      }
      
      showNotification('Заметка перемещена в корзину', 'success');
    } catch (error) {
      showNotification('Ошибка при удалении заметки', 'error');
    }
  }, [uiState.noteToDelete, uiState.selectedNoteId, filteredNotes, softDeleteNote, closeDeleteModal, openNoteModal, closeNoteModal, showNotification]);

  const handleToggleFavorite = useCallback(async (id) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    await handleNoteUpdate(id, { isFavorite: !note.isFavorite });
  }, [notes, handleNoteUpdate]);

  const handleGroupSelect = useCallback((groupId) => {
    setSelectedGroup(groupId);
    updateFilter('selectedGroup', groupId);
  }, [setSelectedGroup, updateFilter]);

  const handleMoveNote = useCallback(async (noteId, groupId) => {
    try {
      await moveNoteToGroup.mutateAsync({ noteId, groupId });
      closeMoveModal();
      showNotification('Заметка перемещена', 'success');
    } catch (error) {
      showNotification('Ошибка при перемещении', 'error');
    }
  }, [moveNoteToGroup, closeMoveModal, showNotification]);

  const handleRestoreNote = useCallback(async (id) => {
    try {
      await restoreNote.mutateAsync(id);
      showNotification('Заметка восстановлена', 'success');
    } catch (error) {
      showNotification('Ошибка при восстановлении', 'error');
    }
  }, [restoreNote, showNotification]);

  const handleDragStart = useCallback((e, note) => {
    setDraggedNote(note);
    e.dataTransfer.setData('text/plain', note.id);
    e.dataTransfer.effectAllowed = 'move';
  }, [setDraggedNote]);

  const handleDragEnd = useCallback(() => {
    clearDragState();
  }, [clearDragState]);

  const handleDragOver = useCallback((e, groupId) => {
    e.preventDefault();
    if (groupId && groups.some(g => g.id === groupId)) {
      setDragOverGroup(groupId);
    }
  }, [groups, setDragOverGroup]);

  const handleDrop = useCallback(async (e, targetGroupId) => {
    e.preventDefault();
    const noteId = e.dataTransfer.getData('text/plain');
    
    if (noteId && targetGroupId) {
      await handleMoveNote(parseInt(noteId), targetGroupId);
    }
    
    clearDragState();
  }, [handleMoveNote, clearDragState]);

  const groupedNotesForSidebar = useMemo(() => {
    const result = {};
    
    result["Все заметки"] = [...notes].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    
    result["Избранное"] = notes.filter(n => n.isFavorite);
    
    groups.forEach(group => {
      result[group.name] = notes.filter(
        note => String(note.group) === String(group.id)
      );
    });
    
    result["Без группы"] = notes.filter(note => !note.group);
    
    return result;
  }, [notes, groups]);

  if (notesLoading && notes.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка заметок...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Notification 
        notification={uiState.notification} 
        onClose={() => updateUI({ notification: null })}
      />
      
      <AppLayout
        sidebar={
          <NoteSidebar
            groupedNotes={groupedNotesForSidebar}
            selectedNote={selectedNote}
            onNoteSelect={handleNoteSelect}
            onNoteDelete={handleNoteDelete}
            onToggleFavorite={handleToggleFavorite}
            collapsed={!uiState.isSidebarOpen}
            onToggleCollapse={toggleSidebar}
            isMobile={isMobile}
            mobileOpen={uiState.isMobileMenuOpen}
            onMobileClose={closeMobileMenu}
            favorites={notes.filter(n => n.isFavorite).map(n => n.id)}
            tags={tags}
            groups={groups}
            selectedGroup={filters.selectedGroup}
            onGroupSelect={handleGroupSelect}
            onOpenGroupManager={toggleGroupManager}
            onCreateNote={() => handleNoteCreate()}
            onMoveNoteToGroup={(noteId) => {
              const note = notes.find(n => n.id === noteId);
              openMoveModal(note);
            }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            dragOverGroup={uiState.dragOverGroup}
            draggedNote={uiState.draggedNote}
          />
        }
        header={
          <Header
            isMobile={isMobile}
            isOnline={uiState.isOnline}
            searchQuery={filters.searchQuery}
            onSearchChange={(value) => updateFilter('searchQuery', value)}
            selectedGroup={filters.selectedGroup}
            groups={groups}
            onNoteCreate={handleNoteCreate}
            onToggleStatistics={toggleStatistics}
            onToggleFilters={toggleSearchFilters}
            onToggleTagManager={toggleTagManager}
            onToggleTrash={toggleTrash}
            deletedNotesCount={trashNotes.length}
            selectedTagsCount={filters.selectedTags.length}
            onToggleMobileMenu={toggleMobileMenu}
            themeClasses={themeClasses}
            navigate={navigate}
          />
        }
        footer={
          <Footer
            filteredNotesCount={filteredNotes.length}
            selectedGroup={filters.selectedGroup}
            groups={groups}
            selectedTags={filters.selectedTags}
            deletedNotesCount={trashNotes.length}
            onToggleTrash={toggleTrash}
            onToggleSettings={toggleSettings}
            themeClasses={themeClasses}
          />
        }
        rightPanel={uiState.isStatisticsOpen && (
          <MiniStatistics
            notes={notes}
            tags={tags}
            favorites={notes.filter(n => n.isFavorite).map(n => n.id)}
            groups={groups}
            deletedCount={trashNotes.length}
            onClose={toggleStatistics}
          />
        )}
        sidebarCollapsed={!uiState.isSidebarOpen}
        isMobile={isMobile}
      >
        {selectedNote ? (
          <NoteEditor
            key={selectedNote.id}
            note={selectedNote}
            onUpdate={handleNoteUpdate}
            autoSave={true}
            fontSize="medium"
            groups={groups}
            onMoveToGroup={(groupId) => handleMoveNote(selectedNote.id, groupId)}
          />
        ) : (
          <WelcomeScreen
            onNoteCreate={handleNoteCreate}
            notes={notes}
            recentNotes={filteredNotes.slice(0, 5)}
            selectedGroup={filters.selectedGroup}
            groups={groups}
          />
        )}

        {/* Модальные окна */}
        {uiState.isSearchFiltersOpen && (
          <SearchFilters
            selectedTags={filters.selectedTags}
            setSelectedTags={(tags) => updateFilter('selectedTags', tags)}
            favoriteOnly={filters.favoriteOnly}
            setFavoriteOnly={(value) => updateFilter('favoriteOnly', value)}
            dateRange={filters.dateRange}
            setDateRange={(from, to) => updateFilter('dateRange', { from, to })}
            sortBy={filters.sortBy}
            setSortBy={(value) => updateFilter('sortBy', value)}
            sortOrder={filters.sortOrder}
            setSortOrder={(value) => updateFilter('sortOrder', value)}
            tags={tags}
            groups={groups}
            selectedGroup={filters.selectedGroup}
            setSelectedGroup={(value) => updateFilter('selectedGroup', value)}
            onClose={toggleSearchFilters}
          />
        )}

        {uiState.isTagManagerOpen && (
          <TagManager
            tags={tags}
            notes={notes}
            onClose={toggleTagManager}
            onTagSelect={toggleTag}
            onTagDelete={(tag) => console.log('delete tag', tag)}
          />
        )}

        {uiState.isTrashOpen && (
          <TrashBin
            deletedNotes={trashNotes}
            onRestore={handleRestoreNote}
            onDeletePermanently={(id) => console.log('permanent delete', id)}
            onEmpty={() => console.log('empty trash')}
            onClose={toggleTrash}
            loading={notesLoading}
          />
        )}

        {uiState.isSettingsOpen && (
          <SettingsPanel
            theme={theme}
            onThemeChange={setTheme}
            viewMode={uiState.viewMode}
            onViewModeChange={(mode) => updateUI({ viewMode: mode })}
            autoSave={true}
            onAutoSaveToggle={() => {}}
            fontSize="medium"
            onFontSizeChange={() => {}}
            onClose={toggleSettings}
          />
        )}

        {uiState.isGroupManagerOpen && (
          <GroupManager
            isOpen={uiState.isGroupManagerOpen}
            onClose={toggleGroupManager}
            groups={groups}
            notes={notes}
            onGroupSelect={handleGroupSelect}
            selectedGroupId={filters.selectedGroup}
            onGroupCreated={(group) => {
              showNotification('Группа создана', 'success');
            }}
            onGroupUpdated={(group) => {
              showNotification('Группа обновлена', 'success');
            }}
            onGroupDeleted={(groupId) => {
              showNotification('Группа удалена', 'success');
            }}
          />
        )}

        <DeleteConfirmModal
          isOpen={uiState.isDeleteConfirmOpen}
          onClose={closeDeleteModal}
          onConfirm={handleConfirmDelete}
          noteTitle={uiState.noteToDelete?.title}
        />
      </AppLayout>
    </>
  );
};

export default NotesPage;