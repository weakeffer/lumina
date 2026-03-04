import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '../api/groupsApi';
import { QUERY_KEYS } from '../../../shared/constants/queryKeys';

export const useGroups = () => {
  return useQuery({
    queryKey: QUERY_KEYS.groups.lists(),
    queryFn: () => groupsApi.getAll(),
    staleTime: 10 * 60 * 1000,
    select: (data) => data.results,
  });
};

export const useGroupNotes = (groupId) => {
  return useQuery({
    queryKey: QUERY_KEYS.notes.byGroup(groupId),
    queryFn: () => groupsApi.getNotes(groupId),
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useGroupMutations = () => {
  const queryClient = useQueryClient();

  const invalidateGroups = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups.lists() });
    queryClient.invalidateQueries({ queryKey: ['notes', 'byGroups'] });
  };

  const createGroup = useMutation({
    mutationFn: groupsApi.create,
    onMutate: async (newGroup) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.groups.lists() });
      
      const previousGroups = queryClient.getQueryData(QUERY_KEYS.groups.lists());

      queryClient.setQueryData(QUERY_KEYS.groups.lists(), (old = []) => {
        return [...old, newGroup];
      });

      return { previousGroups };
    },
    onError: (err, newGroup, context) => {
      if (context?.previousGroups) {
        queryClient.setQueryData(QUERY_KEYS.groups.lists(), context.previousGroups);
      }
    },
    onSettled: () => {
      invalidateGroups();
    }
  });

  const updateGroup = useMutation({
    mutationFn: groupsApi.update,
    onMutate: async (updatedGroup) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.groups.lists() });
      
      const previousGroups = queryClient.getQueryData(QUERY_KEYS.groups.lists());
      
      queryClient.setQueryData(QUERY_KEYS.groups.lists(), (old = []) => {
        return old.map(group => 
          group.id === updatedGroup.id ? { ...group, ...updatedGroup } : group
        );
      });

      return { previousGroups };
    },
    onError: (err, updatedGroup, context) => {
      if (context?.previousGroups) {
        queryClient.setQueryData(QUERY_KEYS.groups.lists(), context.previousGroups);
      }
    },
    onSettled: () => {
      invalidateGroups();
    }
  });

  const deleteGroup = useMutation({
    mutationFn: groupsApi.delete,
    onMutate: async (groupId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.groups.lists() });
      
      const previousGroups = queryClient.getQueryData(QUERY_KEYS.groups.lists());
      
      queryClient.setQueryData(QUERY_KEYS.groups.lists(), (old = []) => {
        return old.filter(group => group.id !== groupId);
      });

      return { previousGroups };
    },
    onError: (err, groupId, context) => {
      if (context?.previousGroups) {
        queryClient.setQueryData(QUERY_KEYS.groups.lists(), context.previousGroups);
      }
    },
    onSettled: () => {
      invalidateGroups();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes.lists() });
    }
  });

  const addNotesToGroup = useMutation({
    mutationFn: ({ groupId, noteIds }) => 
      groupsApi.addNotes(groupId, noteIds),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.notes.byGroup(variables.groupId) 
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes.lists() });
    }
  });

  const removeNotesFromGroup = useMutation({
    mutationFn: ({ groupId, noteIds }) => 
      groupsApi.removeNotes(groupId, noteIds),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.notes.byGroup(variables.groupId) 
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes.lists() });
    }
  });

  return {
    createGroup,
    updateGroup,
    deleteGroup,
    addNotesToGroup,
    removeNotesFromGroup
  };
};