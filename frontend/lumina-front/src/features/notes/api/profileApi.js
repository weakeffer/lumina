import { api } from '../../../api/api';

const API_URL = 'http://localhost:8000';

export const profileApi = {

  getProfile: async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/profile/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка получения профиля');
      }

      return data;
    } catch (error) {
      console.error('Profile API error:', error);
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await fetch(`${API_URL}/api/users/profile/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка обновления профиля');
      }

      return data;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch(`${API_URL}/api/users/upload_avatar/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Avatar upload error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/logout/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка выхода');
      }

      localStorage.removeItem('token');
      localStorage.removeItem('user');

      return data;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
};