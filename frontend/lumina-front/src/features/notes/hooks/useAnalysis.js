import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../shared/api/api';

export const useNoteAnalysis = (noteId) => {
    return useQuery({
        queryKey: ['analysis', noteId],
        queryFn: () => api.getNoteAnalysis(noteId),
        enabled: !!noteId,
        refetchInterval: (data) => {
            // Обновляем каждые 3 сек пока анализ не готов
            return data?.is_analyzed ? false : 3000;
        },
        staleTime: 60_000,
    });
};

export const useDailySummary = (date) => {
    return useQuery({
        queryKey: ['daily-summary', date],
        queryFn: () => api.getDailySummary(date),
        enabled: !!date,
        staleTime: 5 * 60_000,
    });
};

export const useAnalyzeNote = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (noteId) => api.analyzeNote(noteId),
        onSuccess: (_, noteId) => {
            // Начинаем polling
            queryClient.invalidateQueries({ queryKey: ['analysis', noteId] });
        },
    });
};

export const useTraitsTimeline = () => {
  return useQuery({
    queryKey: ['traits-timeline'],
    queryFn: () => api.getTraitsTimeline(),
    staleTime: 10 * 60_000,
  });
};