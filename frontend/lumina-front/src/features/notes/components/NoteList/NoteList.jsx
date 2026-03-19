import React, { memo, useMemo } from 'react';
import NoteItem from '../../../../pages/notes/NoteItem';
import { NoteItemSkeleton } from './NoteItemSkeleton';

const NoteList = memo(({
  notes = [],
  selectedNote,
  onNoteSelect,
  onNoteDelete,
  onToggleFavorite,
  loading = false,
  viewMode = 'grid', // 'grid', 'list', 'compact'
  selectedNotes = new Set(),
  onToggleSelection,
  isBulkMode = false,
  onDragStart,
  onDragEnd,
  draggedNote,
  groups = [], // Добавляем группы для передачи в NoteItem
}) => {
  // Мемоизируем скелетоны для избежания лишних ререндеров
  const skeletons = useMemo(() => {
    return Array(viewMode === 'grid' ? 6 : 4).fill(0).map((_, i) => (
      <NoteItemSkeleton key={`skeleton-${i}`} viewMode={viewMode} />
    ));
  }, [viewMode]);

  // Определяем классы для контейнера в зависимости от режима
  const containerClasses = useMemo(() => {
    switch(viewMode) {
      case 'grid':
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4";
      case 'list':
        return "space-y-3 p-4";
      case 'compact':
        return "flex flex-col p-2 space-y-0.5";
      default:
        return "p-4";
    }
  }, [viewMode]);

  if (loading) {
    return (
      <div className={containerClasses}>
        {skeletons}
      </div>
    );
  }

  if (!notes.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p className="text-lg">Нет заметок</p>
        <p className="text-sm">Создайте первую заметку</p>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {notes.map((note) => (
        <div
          key={note.id}
          draggable={!isBulkMode}
          onDragStart={(e) => onDragStart?.(e, note)}
          onDragEnd={onDragEnd}
          className={draggedNote?.id === note.id ? 'opacity-50' : ''}
        >
          <NoteItem
            note={note}
            isSelected={selectedNote?.id === note.id}
            onSelect={onNoteSelect}
            onDelete={onNoteDelete}
            onToggleFavorite={onToggleFavorite}
            viewMode={viewMode}
            isSelectedForBulk={selectedNotes.has(note.id)}
            onToggleSelection={onToggleSelection}
            isBulkMode={isBulkMode}
            groups={groups}
          />
        </div>
      ))}
    </div>
  );
});

NoteList.displayName = 'NoteList';

export default NoteList;