import { api } from '../../../api/api';

export const notesApi = {
  getAll: async ({ filters = {} } = {}) => {
    try {
      const notes = await api.getNotes();
      
      // Применяем фильтры на клиенте
      let filteredNotes = [...notes];
      
      if (filters.group) {
        filteredNotes = filteredNotes.filter(note => 
          String(note.group) === String(filters.group)
        );
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredNotes = filteredNotes.filter(note => 
          note.title?.toLowerCase().includes(searchLower) ||
          note.text?.toLowerCase().includes(searchLower)
        );
      }
      
      if (filters.tags?.length) {
        filteredNotes = filteredNotes.filter(note =>
          filters.tags.every(tag => note.tags?.includes(tag))
        );
      }
      
      if (filters.archived === 'true') {
        filteredNotes = filteredNotes.filter(note => note.is_archived);
      }
      
      // Сортировка
      if (filters.ordering) {
        const orderField = filters.ordering.replace('-', '');
        const orderDesc = filters.ordering.startsWith('-');
        
        filteredNotes.sort((a, b) => {
          let aVal = a[orderField];
          let bVal = b[orderField];
          
          if (orderField === 'favorites') {
            aVal = a.isFavorite ? 1 : 0;
            bVal = b.isFavorite ? 1 : 0;
          }
          
          if (orderDesc) {
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
          }
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        });
      }
      
      return {
        results: filteredNotes,
        count: filteredNotes.length,
        next: null,
        previous: null
      };
    } catch (error) {
      console.error('notesApi.getAll error:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const notes = await api.getNotes();
      const note = notes.find(n => n.id === parseInt(id));
      if (!note) throw new Error('Note not found');
      return note;
    } catch (error) {
      console.error(`notesApi.getById ${id} error:`, error);
      throw error;
    }
  },

  create: async (noteData) => {
    try {
      const newNote = await api.createNote(noteData);
      return newNote;
    } catch (error) {
      console.error('notesApi.create error:', error);
      throw error;
    }
  },

  update: async ({ id, ...noteData }) => {
    try {
      const updatedNote = await api.updateNote(id, noteData);
      return updatedNote;
    } catch (error) {
      console.error(`notesApi.update ${id} error:`, error);
      throw error;
    }
  },

  softDelete: async (id) => {
    try {
      await api.deleteNote(id);
      return { success: true, id };
    } catch (error) {
      console.error(`notesApi.softDelete ${id} error:`, error);
      throw error;
    }
  },

  permanentDelete: async (id) => {
    try {
      await api.deleteNotePermanently(id);
      return { success: true, id };
    } catch (error) {
      console.error(`notesApi.permanentDelete ${id} error:`, error);
      throw error;
    }
  },

  restore: async (id) => {
    try {
      const restored = await api.restoreNote(id);
      return restored;
    } catch (error) {
      console.error(`notesApi.restore ${id} error:`, error);
      throw error;
    }
  },

  getDeleted: async () => {
    try {
      const deleted = await api.getDeletedNotes();
      return {
        results: deleted,
        count: deleted.length
      };
    } catch (error) {
      console.error('notesApi.getDeleted error:', error);
      throw error;
    }
  },

  moveToGroup: async (noteId, groupId) => {
    try {
      const result = await api.moveNoteToGroup(noteId, groupId);
      return result;
    } catch (error) {
      console.error(`notesApi.moveToGroup ${noteId} error:`, error);
      throw error;
    }
  },

  getByGroups: async () => {
    try {
      const data = await api.getNotesByGroups();
      return data;
    } catch (error) {
      console.error('notesApi.getByGroups error:', error);
      throw error;
    }
  },

  search: async (query) => {
    try {
      const notes = await api.getNotes();
      const searchLower = query.toLowerCase();
      const results = notes.filter(note => 
        note.title?.toLowerCase().includes(searchLower) ||
        note.text?.toLowerCase().includes(searchLower)
      );
      return {
        results,
        count: results.length
      };
    } catch (error) {
      console.error('notesApi.search error:', error);
      throw error;
    }
  }
};