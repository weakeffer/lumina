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
  viewMode = 'grid',
  selectedNotes = new Set(),
  onToggleSelection,
  isBulkMode = false,
  onDragStart,
  onDragEnd,
  draggedNote,
}) => {
  // Мемоизируем скелетоны для избежания лишних ререндеров
  const skeletons = useMemo(() => {
    return Array(6).fill(0).map((_, i) => (
      <NoteItemSkeleton key={`skeleton-${i}`} viewMode={viewMode} />
    ));
  }, [viewMode]);

  if (loading) {
    return (
      <div className={viewMode === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4"
        : "space-y-2 p-4"
      }>
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
    <div className={viewMode === 'grid' 
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4"
      : viewMode === 'list'
      ? "space-y-2 p-4"
      : "flex flex-col p-4" // compact mode
    }>
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
            onSelect={() => onNoteSelect(note)}
            onDelete={() => onNoteDelete(note.id)}
            onToggleFavorite={() => onToggleFavorite(note.id)}
            viewMode={viewMode}
            isSelectedForBulk={selectedNotes.has(note.id)}
            onToggleSelection={() => onToggleSelection?.(note.id)}
            isBulkMode={isBulkMode}
          />
        </div>
      ))}
    </div>
  );
});

NoteList.displayName = 'NoteList';

export default NoteList;