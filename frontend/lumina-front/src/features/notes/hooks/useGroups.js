import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '../api/groupsApi';
import { QUERY_KEYS } from '../../../shared/lib/constants/queryKeys';

// Хук для получения групп без заметок
export const useGroups = () => {
  return useQuery({
    queryKey: QUERY_KEYS.groups.lists(),
    queryFn: () => groupsApi.getAll(),
    staleTime: 10 * 60 * 1000,
    select: (data) => data.results,
  });
};

// НОВЫЙ ХУК: для получения групп с заметками
export const useGroupsWithNotes = () => {
  return useQuery({
    queryKey: ['groups', 'withNotes'],
    queryFn: () => groupsApi.getAllWithNotes(),
    staleTime: 5 * 60 * 1000,
    select: (data) => data.results,
  });
};

// Хук для получения заметок конкретной группы
export const useGroupNotes = (groupId) => {
  return useQuery({
    queryKey: QUERY_KEYS.notes.byGroup(groupId),
    queryFn: () => groupsApi.getNotes(groupId),
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000,
  });
};

// Хук для мутаций групп
export const useGroupMutations = () => {
  const queryClient = useQueryClient();

  const invalidateGroups = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups.lists() });
    queryClient.invalidateQueries({ queryKey: ['groups', 'withNotes'] }); // Добавлено
    queryClient.invalidateQueries({ queryKey: ['notes', 'byGroups'] });
  };

  // Создание группы
  const createGroup = useMutation({
    mutationFn: groupsApi.create,
    onMutate: async (newGroup) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.groups.lists() });
      await queryClient.cancelQueries({ queryKey: ['groups', 'withNotes'] });
      
      const previousGroups = queryClient.getQueryData(QUERY_KEYS.groups.lists());
      const previousGroupsWithNotes = queryClient.getQueryData(['groups', 'withNotes']);

      // Оптимистичное обновление обычных групп
      queryClient.setQueryData(QUERY_KEYS.groups.lists(), (old = []) => {
        return [...old, newGroup];
      });

      return { previousGroups, previousGroupsWithNotes };
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

  // Обновление группы
  const updateGroup = useMutation({
    mutationFn: groupsApi.update,
    onMutate: async (updatedGroup) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.groups.lists() });
      await queryClient.cancelQueries({ queryKey: ['groups', 'withNotes'] });
      
      const previousGroups = queryClient.getQueryData(QUERY_KEYS.groups.lists());
      const previousGroupsWithNotes = queryClient.getQueryData(['groups', 'withNotes']);
      
      // Оптимистичное обновление обычных групп
      queryClient.setQueryData(QUERY_KEYS.groups.lists(), (old = []) => {
        return old.map(group => 
          group.id === updatedGroup.id ? { ...group, ...updatedGroup } : group
        );
      });

      return { previousGroups, previousGroupsWithNotes };
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

  // Удаление группы
  const deleteGroup = useMutation({
    mutationFn: groupsApi.delete,
    onMutate: async (groupId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.groups.lists() });
      await queryClient.cancelQueries({ queryKey: ['groups', 'withNotes'] });
      
      const previousGroups = queryClient.getQueryData(QUERY_KEYS.groups.lists());
      const previousGroupsWithNotes = queryClient.getQueryData(['groups', 'withNotes']);
      
      // Оптимистичное обновление обычных групп
      queryClient.setQueryData(QUERY_KEYS.groups.lists(), (old = []) => {
        return old.filter(group => group.id !== groupId);
      });

      return { previousGroups, previousGroupsWithNotes };
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

  // Добавление заметок в группу
  const addNotesToGroup = useMutation({
    mutationFn: ({ groupId, noteIds }) => 
      groupsApi.addNotes(groupId, noteIds),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.notes.byGroup(variables.groupId) 
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes.lists() });
      queryClient.invalidateQueries({ queryKey: ['groups', 'withNotes'] });
    }
  });

  // Удаление заметок из группы
  const removeNotesFromGroup = useMutation({
    mutationFn: ({ groupId, noteIds }) => 
      groupsApi.removeNotes(groupId, noteIds),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.notes.byGroup(variables.groupId) 
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes.lists() });
      queryClient.invalidateQueries({ queryKey: ['groups', 'withNotes'] });
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