import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../api/profileApi';

export const PROFILE_QUERY_KEYS = {
  profile: ['profile'],
  userNotes: ['userNotes'],
  userStats: ['userStats'],
};

export const useProfile = (options = {}) => {
  return useQuery({
    queryKey: PROFILE_QUERY_KEYS.profile,
    queryFn: profileApi.getProfile,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 1,
    ...options
  });
};

export const useProfileMutations = () => {
  const queryClient = useQueryClient();

  const updateProfile = useMutation({
    mutationFn: profileApi.updateProfile,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: PROFILE_QUERY_KEYS.profile });
      const previousProfile = queryClient.getQueryData(PROFILE_QUERY_KEYS.profile);
      
      queryClient.setQueryData(PROFILE_QUERY_KEYS.profile, (old) => ({
        ...old,
        ...newData
      }));

      return { previousProfile };
    },
    onError: (err, newData, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(PROFILE_QUERY_KEYS.profile, context.previousProfile);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.profile });
    }
  });

  const uploadAvatar = useMutation({
    mutationFn: profileApi.uploadAvatar,
    onSuccess: (data) => {
      queryClient.setQueryData(PROFILE_QUERY_KEYS.profile, (old) => ({
        ...old,
        avatar_url: data.avatar_url
      }));
    }
  });

  const logout = useMutation({
    mutationFn: profileApi.logout,
    onSuccess: () => {
      queryClient.clear();
    }
  });

  return {
    updateProfile,
    uploadAvatar,
    logout
  };
};