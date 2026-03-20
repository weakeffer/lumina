import { api } from '../../../shared/api/api';

export const tagsApi = {

  getAll: async () => {
    try {
      const notes = await api.getNotes();
      // Извлекаем уникальные теги из всех заметок
      const allTags = [...new Set(notes.flatMap(note => note.tags || []))];
      const tagsWithCount = allTags.map(tag => ({
        name: tag,
        count: notes.filter(note => note.tags?.includes(tag)).length
      }));
      
      return {
        results: tagsWithCount,
        count: tagsWithCount.length
      };
    } catch (error) {
      console.error('tagsApi.getAll error:', error);
      throw error;
    }
  },

  getPopular: async (limit = 10) => {
    try {
      const notes = await api.getNotes();
      const tagCounts = {};
      
      notes.forEach(note => {
        (note.tags || []).forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      
      const popularTags = Object.entries(tagCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
      
      return {
        results: popularTags,
        count: popularTags.length
      };
    } catch (error) {
      console.error('tagsApi.getPopular error:', error);
      throw error;
    }
  },

  create: async ({ tagName, noteIds }) => {
    try {
      // Добавляем тег к указанным заметкам
      const notes = await api.getNotes();
      const updates = notes
        .filter(note => noteIds.includes(note.id))
        .map(note => {
          const tags = [...(note.tags || []), tagName];
          return api.updateNote(note.id, { tags });
        });
      
      await Promise.all(updates);
      return { name: tagName, success: true };
    } catch (error) {
      console.error('tagsApi.create error:', error);
      throw error;
    }
  },

  delete: async (tagName) => {
    try {
      const notes = await api.getNotes();
      const updates = notes
        .filter(note => note.tags?.includes(tagName))
        .map(note => {
          const tags = note.tags.filter(t => t !== tagName);
          return api.updateNote(note.id, { tags });
        });
      
      await Promise.all(updates);
      return { name: tagName, success: true };
    } catch (error) {
      console.error(`tagsApi.delete ${tagName} error:`, error);
      throw error;
    }
  },

  update: async ({ oldName, newName }) => {
    try {
      const notes = await api.getNotes();
      const updates = notes
        .filter(note => note.tags?.includes(oldName))
        .map(note => {
          const tags = note.tags.map(t => t === oldName ? newName : t);
          return api.updateNote(note.id, { tags });
        });
      
      await Promise.all(updates);
      return { oldName, newName, success: true };
    } catch (error) {
      console.error(`tagsApi.update ${oldName} -> ${newName} error:`, error);
      throw error;
    }
  }
};