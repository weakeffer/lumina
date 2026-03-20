import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsApi } from '../api/tagsApi';
import { QUERY_KEYS } from '../../../shared/lib/constants/queryKeys';

export const useTags = () => {
  return useQuery({
    queryKey: QUERY_KEYS.tags.lists(),
    queryFn: () => tagsApi.getAll(),
    staleTime: 10 * 60 * 1000,
    select: (data) => data.results,
  });
};

export const usePopularTags = (limit = 10) => {
  return useQuery({
    queryKey: QUERY_KEYS.tags.popular(limit),
    queryFn: () => tagsApi.getPopular(limit),
    staleTime: 5 * 60 * 1000,
    select: (data) => data.results,
  });
};

export const useTagMutations = () => {
  const queryClient = useQueryClient();

  const invalidateTags = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.lists() });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.popular() });
  };

  const createTag = useMutation({
    mutationFn: tagsApi.create,
    onSuccess: () => {
      invalidateTags();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes.lists() });
    }
  });

  const updateTag = useMutation({
    mutationFn: tagsApi.update,
    onSuccess: () => {
      invalidateTags();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes.lists() });
    }
  });

  const deleteTag = useMutation({
    mutationFn: tagsApi.delete,
    onMutate: async (tagName) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tags.lists() });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notes.lists() });

      const previousTags = queryClient.getQueryData(QUERY_KEYS.tags.lists());
      const previousNotes = queryClient.getQueryData(QUERY_KEYS.notes.lists());

      queryClient.setQueryData(QUERY_KEYS.notes.lists(), (old = []) => {
        return old.map(note => ({
          ...note,
          tags: note.tags?.filter(t => t !== tagName) || []
        }));
      });

      return { previousTags, previousNotes };
    },
    onError: (err, tagName, context) => {
      if (context?.previousTags) {
        queryClient.setQueryData(QUERY_KEYS.tags.lists(), context.previousTags);
      }
      if (context?.previousNotes) {
        queryClient.setQueryData(QUERY_KEYS.notes.lists(), context.previousNotes);
      }
    },
    onSuccess: () => {
      invalidateTags();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes.lists() });
    }
  });

  return {
    createTag,
    updateTag,
    deleteTag
  };
};