import { api } from '../../../shared/api/api';

export const groupsApi = {
  // Получение всех групп (без заметок) - для администрирования групп
  getAll: async () => {
    try {
      const groups = await api.getGroups();
      return {
        results: groups,
        count: groups.length
      };
    } catch (error) {
      console.error('groupsApi.getAll error:', error);
      throw error;
    }
  },

  // Получение групп с заметками и количеством - для отображения в боковом меню
  getAllWithNotes: async () => {
    try {
      // Используем эндпоинт /notes/by-groups/ из NotesViewSet
      const groupsWithNotes = await api.getNotesByGroups();
      return {
        results: groupsWithNotes,
        count: groupsWithNotes.length
      };
    } catch (error) {
      console.error('groupsApi.getAllWithNotes error:', error);
      throw error;
    }
  },

  // Создание группы
  create: async (groupData) => {
    try {
      const newGroup = await api.createGroup(groupData);
      return newGroup;
    } catch (error) {
      console.error('groupsApi.create error:', error);
      throw error;
    }
  },

  // Обновление группы
  update: async ({ id, ...groupData }) => {
    try {
      const updatedGroup = await api.updateGroup(id, groupData);
      return updatedGroup;
    } catch (error) {
      console.error(`groupsApi.update ${id} error:`, error);
      throw error;
    }
  },

  // Удаление группы
  delete: async (id) => {
    try {
      await api.deleteGroup(id);
      return { success: true, id };
    } catch (error) {
      console.error(`groupsApi.delete ${id} error:`, error);
      throw error;
    }
  },

  // Получение заметок группы
  getNotes: async (groupId) => {
    try {
      const notes = await api.getGroupNotes(groupId);
      return notes;
    } catch (error) {
      console.error(`groupsApi.getNotes ${groupId} error:`, error);
      throw error;
    }
  },

  // Добавление заметок в группу
  addNotes: async (groupId, noteIds) => {
    try {
      const result = await api.addNotesToGroup(groupId, noteIds);
      return result;
    } catch (error) {
      console.error(`groupsApi.addNotes ${groupId} error:`, error);
      throw error;
    }
  },

  // Удаление заметок из группы
  removeNotes: async (groupId, noteIds) => {
    try {
      const result = await api.removeNotesFromGroup(groupId, noteIds);
      return result;
    } catch (error) {
      console.error(`groupsApi.removeNotes ${groupId} error:`, error);
      throw error;
    }
  }
};