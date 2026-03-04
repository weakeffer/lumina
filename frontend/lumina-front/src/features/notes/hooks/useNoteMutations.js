import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notesApi } from '../api/notesApi';
import { QUERY_KEYS } from '../../../shared/constants/queryKeys';

export const useNoteMutations = () => {
  const queryClient = useQueryClient();

  const invalidateNotesLists = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes.lists() });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes.trash });
    queryClient.invalidateQueries({ queryKey: ['notes', 'byGroups'] });
  };

  const createNote = useMutation({
    mutationFn: notesApi.create,
    onMutate: async (newNote) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notes.lists() });

      const previousNotes = queryClient.getQueryData(QUERY_KEYS.notes.lists());

      queryClient.setQueryData(QUERY_KEYS.notes.lists(), (old) => {
        if (!old) return [newNote];
        return [newNote, ...old];
      });

      return { previousNotes };
    },
    onError: (err, newNote, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(QUERY_KEYS.notes.lists(), context.previousNotes);
      }
    },
    onSettled: () => {
      invalidateNotesLists();
    }
  });

  const updateNote = useMutation({
    mutationFn: notesApi.update,
    onMutate: async (updatedNote) => {
      await queryClient.cancelQueries({ 
        queryKey: QUERY_KEYS.notes.detail(updatedNote.id) 
      });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notes.lists() });

      const previousNote = queryClient.getQueryData(
        QUERY_KEYS.notes.detail(updatedNote.id)
      );
      const previousNotes = queryClient.getQueryData(QUERY_KEYS.notes.lists());

      queryClient.setQueryData(
        QUERY_KEYS.notes.detail(updatedNote.id), 
        updatedNote
      );

      queryClient.setQueryData(QUERY_KEYS.notes.lists(), (old = []) => {
        return old.map(note => 
          note.id === updatedNote.id ? { ...note, ...updatedNote } : note
        );
      });

      return { previousNote, previousNotes };
    },
    onError: (err, updatedNote, context) => {
      if (context?.previousNote) {
        queryClient.setQueryData(
          QUERY_KEYS.notes.detail(updatedNote.id),
          context.previousNote
        );
      }
      if (context?.previousNotes) {
        queryClient.setQueryData(QUERY_KEYS.notes.lists(), context.previousNotes);
      }
    },
    onSettled: (data) => {
      if (data?.id) {
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.notes.detail(data.id) 
        });
      }
      invalidateNotesLists();
    }
  });

  const softDeleteNote = useMutation({
    mutationFn: notesApi.softDelete,
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notes.lists() });

      const previousNotes = queryClient.getQueryData(QUERY_KEYS.notes.lists());

      queryClient.setQueryData(QUERY_KEYS.notes.lists(), (old = []) => {
        const deletedNote = old.find(n => n.id === noteId);
        if (deletedNote) {
          queryClient.setQueryData(['deleted-note', noteId], deletedNote);
        }
        return old.filter(n => n.id !== noteId);
      });

      return { previousNotes };
    },
    onError: (err, noteId, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(QUERY_KEYS.notes.lists(), context.previousNotes);
      }
    },
    onSettled: () => {
      invalidateNotesLists();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes.trash });
    }
  });

  const permanentDeleteNote = useMutation({
    mutationFn: notesApi.permanentDelete,
    onSuccess: () => {
      invalidateNotesLists();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes.trash });
    }
  });

  const restoreNote = useMutation({
    mutationFn: notesApi.restore,
    onSuccess: () => {
      invalidateNotesLists();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes.trash });
    }
  });

  const moveNoteToGroup = useMutation({
    mutationFn: ({ noteId, groupId }) => 
      notesApi.moveToGroup(noteId, groupId),
    onMutate: async ({ noteId, groupId }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notes.lists() });

      const previousNotes = queryClient.getQueryData(QUERY_KEYS.notes.lists());

      queryClient.setQueryData(QUERY_KEYS.notes.lists(), (old = []) => {
        return old.map(note => 
          note.id === noteId ? { ...note, group: groupId } : note
        );
      });

      return { previousNotes };
    },
    onError: (err, variables, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(QUERY_KEYS.notes.lists(), context.previousNotes);
      }
    },
    onSettled: () => {
      invalidateNotesLists();
      queryClient.invalidateQueries({ queryKey: ['notes', 'byGroups'] });
    }
  });

  return {
    createNote,
    updateNote,
    softDeleteNote,
    permanentDeleteNote,
    restoreNote,
    moveNoteToGroup
  };
};