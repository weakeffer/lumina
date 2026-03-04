import { useQuery } from '@tanstack/react-query';
import { notesApi } from '../api/notesApi';
import { QUERY_KEYS } from '../../../shared/constants/queryKeys';

export const useNotes = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.notes.list(filters),
    queryFn: () => notesApi.getAll({ filters }),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    select: (data) => data.results, 
    ...options
  });
};

export const useNote = (id, options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.notes.detail(id),
    queryFn: () => notesApi.getById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    ...options
  });
};

export const useTrashNotes = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.notes.trash,
    queryFn: () => notesApi.getDeleted(),
    staleTime: 30 * 1000,
    select: (data) => data.results,
    ...options
  });
};

export const useSearchNotes = (query, options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.notes.search(query),
    queryFn: () => notesApi.search(query),
    enabled: query?.length >= 2,
    staleTime: 0,
    select: (data) => data.results,
    ...options
  });
};

export const useNotesByGroups = () => {
  return useQuery({
    queryKey: ['notes', 'byGroups'],
    queryFn: notesApi.getByGroups,
    staleTime: 2 * 60 * 1000,
  });
};