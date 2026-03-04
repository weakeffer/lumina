import { useState, useCallback, useMemo } from 'react';

const initialUIState = {
  isModalOpen: false,
  modalMode: 'view',
  selectedNoteId: null,
  isSidebarOpen: true,
  isMobileMenuOpen: false,
  isStatisticsOpen: false,
  isSettingsOpen: false,
  isSearchFiltersOpen: false,
  isTagManagerOpen: false,
  isTrashOpen: false,
  isGroupManagerOpen: false,
  isDeleteConfirmOpen: false,
  noteToDelete: null,
  isMoveModalOpen: false,
  noteToMove: null,
  draggedNote: null,
  dragOverGroup: null,
  selectedNotes: new Set(),
  isBulkMode: false,
  notification: null,
  isOnline: navigator.onLine,
  selectedGroup: null,
  viewMode: 'split', // 'split' | 'full' | 'preview'
};

export const useNoteUI = () => {
  const [uiState, setUIState] = useState(() => {
    const savedViewMode = localStorage.getItem('viewMode');
    return {
      ...initialUIState,
      viewMode: savedViewMode || initialUIState.viewMode,
    };
  });

  const updateUI = useCallback((updates) => {
    setUIState(prev => {
      const newState = { ...prev, ...updates };

      if (updates.viewMode !== undefined) {
        localStorage.setItem('viewMode', updates.viewMode);
      }
      
      return newState;
    });
  }, []);

  const openNoteModal = useCallback((noteId = null, mode = 'view') => {
    updateUI({
      isModalOpen: true,
      modalMode: mode,
      selectedNoteId: noteId,
    });
  }, [updateUI]);

  const closeNoteModal = useCallback(() => {
    updateUI({
      isModalOpen: false,
      modalMode: 'view',
      selectedNoteId: null,
    });
  }, [updateUI]);

  const toggleSidebar = useCallback(() => {
    updateUI({ isSidebarOpen: !uiState.isSidebarOpen });
  }, [uiState.isSidebarOpen, updateUI]);

  const toggleMobileMenu = useCallback(() => {
    updateUI({ isMobileMenuOpen: !uiState.isMobileMenuOpen });
  }, [uiState.isMobileMenuOpen, updateUI]);

  const closeMobileMenu = useCallback(() => {
    updateUI({ isMobileMenuOpen: false });
  }, [updateUI]);

  const toggleStatistics = useCallback(() => {
    updateUI({ isStatisticsOpen: !uiState.isStatisticsOpen });
  }, [uiState.isStatisticsOpen, updateUI]);

  const toggleSettings = useCallback(() => {
    updateUI({ isSettingsOpen: !uiState.isSettingsOpen });
  }, [uiState.isSettingsOpen, updateUI]);

  const toggleSearchFilters = useCallback(() => {
    updateUI({ isSearchFiltersOpen: !uiState.isSearchFiltersOpen });
  }, [uiState.isSearchFiltersOpen, updateUI]);

  const toggleTagManager = useCallback(() => {
    updateUI({ isTagManagerOpen: !uiState.isTagManagerOpen });
  }, [uiState.isTagManagerOpen, updateUI]);

  const toggleTrash = useCallback(() => {
    updateUI({ isTrashOpen: !uiState.isTrashOpen });
  }, [uiState.isTrashOpen, updateUI]);

  const toggleGroupManager = useCallback(() => {
    updateUI({ isGroupManagerOpen: !uiState.isGroupManagerOpen });
  }, [uiState.isGroupManagerOpen, updateUI]);

  const openDeleteModal = useCallback((note) => {
    updateUI({
      isDeleteConfirmOpen: true,
      noteToDelete: note,
    });
  }, [updateUI]);

  const closeDeleteModal = useCallback(() => {
    updateUI({
      isDeleteConfirmOpen: false,
      noteToDelete: null,
    });
  }, [updateUI]);

  const openMoveModal = useCallback((note) => {
    updateUI({
      isMoveModalOpen: true,
      noteToMove: note,
    });
  }, [updateUI]);

  const closeMoveModal = useCallback(() => {
    updateUI({
      isMoveModalOpen: false,
      noteToMove: null,
    });
  }, [updateUI]);

  const setDraggedNote = useCallback((note) => {
    updateUI({ draggedNote: note });
  }, [updateUI]);

  const setDragOverGroup = useCallback((groupId) => {
    updateUI({ dragOverGroup: groupId });
  }, [updateUI]);

  const clearDragState = useCallback(() => {
    updateUI({
      draggedNote: null,
      dragOverGroup: null,
    });
  }, [updateUI]);

  const toggleNoteSelection = useCallback((noteId) => {
    setUIState(prev => {
      const newSelection = new Set(prev.selectedNotes);
      if (newSelection.has(noteId)) {
        newSelection.delete(noteId);
      } else {
        newSelection.add(noteId);
      }
      return {
        ...prev,
        selectedNotes: newSelection,
        isBulkMode: newSelection.size > 0,
      };
    });
  }, []);

  const clearSelection = useCallback(() => {
    updateUI({
      selectedNotes: new Set(),
      isBulkMode: false,
    });
  }, [updateUI]);

  const selectAll = useCallback((noteIds) => {
    updateUI({
      selectedNotes: new Set(noteIds),
      isBulkMode: true,
    });
  }, [updateUI]);

  const showNotification = useCallback((message, type = 'info') => {
    updateUI({
      notification: { message, type, id: Date.now() }
    });

    setTimeout(() => {
      updateUI({ notification: null });
    }, 3000);
  }, [updateUI]);

  const hideNotification = useCallback(() => {
    updateUI({ notification: null });
  }, [updateUI]);

  const setSelectedGroup = useCallback((groupId) => {
    updateUI({ selectedGroup: groupId });
  }, [updateUI]);

  const setOnlineStatus = useCallback((isOnline) => {
    updateUI({ isOnline });
    
    if (isOnline) {
      showNotification('Соединение восстановлено', 'success');
    } else {
      showNotification('Работа в оффлайн режиме', 'warning');
    }
  }, [updateUI, showNotification]);

  const activeModalsCount = useMemo(() => {
    let count = 0;
    if (uiState.isModalOpen) count++;
    if (uiState.isDeleteConfirmOpen) count++;
    if (uiState.isMoveModalOpen) count++;
    if (uiState.isStatisticsOpen) count++;
    if (uiState.isSettingsOpen) count++;
    if (uiState.isSearchFiltersOpen) count++;
    if (uiState.isTagManagerOpen) count++;
    if (uiState.isTrashOpen) count++;
    if (uiState.isGroupManagerOpen) count++;
    return count;
  }, [uiState]);

  return {
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
    hideNotification,
    setSelectedGroup,
    setOnlineStatus,
    activeModalsCount,
  };
};