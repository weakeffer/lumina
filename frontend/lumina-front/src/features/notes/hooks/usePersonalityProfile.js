import { useQuery } from '@tanstack/react-query';
import { api } from '../../../shared/api/api';

export const usePersonalityProfile = () => {
    return useQuery({
        queryKey: ['personality-profile'],
        queryFn: () => api.getPersonalityProfile(),
        staleTime: 10 * 60 * 1000,
    });
};