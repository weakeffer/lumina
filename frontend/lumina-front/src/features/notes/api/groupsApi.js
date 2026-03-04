import { api } from '../../../api/api';

export const groupsApi = {

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

  create: async (groupData) => {
    try {
      const newGroup = await api.createGroup(groupData);
      return newGroup;
    } catch (error) {
      console.error('groupsApi.create error:', error);
      throw error;
    }
  },

  update: async ({ id, ...groupData }) => {
    try {
      const updatedGroup = await api.updateGroup(id, groupData);
      return updatedGroup;
    } catch (error) {
      console.error(`groupsApi.update ${id} error:`, error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      await api.deleteGroup(id);
      return { success: true, id };
    } catch (error) {
      console.error(`groupsApi.delete ${id} error:`, error);
      throw error;
    }
  },

  getNotes: async (groupId) => {
    try {
      const notes = await api.getGroupNotes(groupId);
      return notes;
    } catch (error) {
      console.error(`groupsApi.getNotes ${groupId} error:`, error);
      throw error;
    }
  },

  addNotes: async (groupId, noteIds) => {
    try {
      const result = await api.addNotesToGroup(groupId, noteIds);
      return result;
    } catch (error) {
      console.error(`groupsApi.addNotes ${groupId} error:`, error);
      throw error;
    }
  },

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