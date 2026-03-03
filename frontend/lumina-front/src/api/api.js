const API_URL = 'http://localhost:8000';

export const api = {
    async register(userData) {
        try {
            const response = await fetch(`${API_URL}/api/users/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Ошибка регистрации');
            }
            
            return data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    async login(credentials) {
        try {
            const response = await fetch(`${API_URL}/api/users/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Ошибка входа');
            }
            
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    async logout() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/users/logout/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
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
    },

    async getProfile() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/users/profile/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Ошибка получения профиля');
            }
            
            return data;
        } catch (error) {
            console.error('Profile error:', error);
            throw error;
        }
    },

    async getNotes() {
        try {
            const token = localStorage.getItem('token');
            console.log('📡 Запрос к /api/notes/');

            const response = await fetch(`${API_URL}/api/notes/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            console.log('Статус ответа:', response.status);

            const data = await response.json();
            console.log('Данные от сервера (сырые):', data);

            if (!response.ok) {
                throw new Error(data.error || 'Ошибка получения заметок');
            }

            const mappedData = data.map(note => {
                return {
                    id: note.id,
                    title: note.title || '',
                    text: note.text || '',
                    preview: note.preview || note.text?.substring(0, 100) + '...' || '',
                    created_at: note.created_at_formatted || note.created_at,
                    updated_at: note.updated_at_formatted || note.created_at_formatted || note.created_at,
                    user: note.user,
                    isFavorite: note.is_favorite || false,
                    tags: note.tags || [],
                    images_count: note.images_count || 0,
                    first_image: note.first_image || null,
                    group: note.group || null,
                    group_name: note.group_name || null,
                    group_color: note.group_color || null
                };
            });

            console.log('Преобразованные данные:', mappedData);
            return mappedData;

        } catch (error) {
            console.error('Get notes error:', error);
            return [];
        }
    },

    async getDeletedNotes() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/notes/deleted/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ошибка получения удаленных заметок');
            }

            return data.map(note => ({
                id: note.id,
                title: note.title || 'Без названия',
                text: note.text || '',
                created_at: note.created_at_formatted,
                deletedAt: note.deleted_at_formatted,
                user: note.user
            }));

        } catch (error) {
            console.error('Get deleted notes error:', error);
            return [];
        }
    },

    async createNote(noteData) {
        try {
            const token = localStorage.getItem('token');

            const cleanData = {
                title: noteData.title || '',
                text: noteData.text || '',
                group: noteData.group || null
            };

            const response = await fetch(`${API_URL}/api/notes/create_note/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(cleanData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Ошибка создания заметки');
            }

            const now = new Date();
            const formattedDate = now.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).replace(',', '');

            return {
                id: data.id,
                title: data.title,
                text: data.text,
                created_at: data.created_at_formatted || formattedDate,
                updated_at: data.created_at_formatted || formattedDate,
                isFavorite: false,
                tags: [],
                group: noteData.group || null
            };

        } catch (error) {
            console.error('Create note error:', error);
            throw error;
        }
    },

    async updateNote(id, noteData) {
        try {
            const token = localStorage.getItem('token');

            const cleanData = {
                title: noteData.title || '',
                text: noteData.text || '',
                images: noteData.images || [],
                group: noteData.group !== undefined ? noteData.group : null
            };

            const response = await fetch(`${API_URL}/api/notes/${id}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(cleanData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'Ошибка обновления заметки');
            }

            const data = await response.json();

            const now = new Date();
            const formattedDate = now.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).replace(',', '');

            return {
                id: data.id,
                title: data.title,
                text: data.text,
                created_at: data.created_at_formatted || data.created_at,
                updated_at: data.updated_at_formatted || formattedDate,
                isFavorite: data.is_favorite || false,
                tags: data.tags || [],
                images: data.images || [],
                images_with_details: data.images_with_details || [],
                group: data.group || null
            };

        } catch (error) {
            console.error('Update note error:', error);
            throw error;
        }
    },

    async deleteNote(id) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/notes/${id}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Ошибка удаления заметки');
            }
            
            return { success: true };
        } catch (error) {
            console.error('Delete note error:', error);
            throw error;
        }
    },

    async restoreNote(id) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/notes/${id}/restore/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Ошибка восстановления заметки');
            }
            
            return {
                id: data.note.id,
                title: data.note.title,
                text: data.note.text,
                created_at: data.note.created_at_formatted || data.note.created_at,
                updated_at: data.note.updated_at_formatted || data.note.created_at_formatted || data.note.created_at,
                isFavorite: data.note.is_favorite || false,
                tags: data.note.tags || []
            };
        } catch (error) {
            console.error('Restore note error:', error);
            throw error;
        }
    },

    async deleteNotePermanently(id) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/notes/${id}/delete_permanently/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Ошибка полного удаления заметки');
            }
            
            return { success: true };
        } catch (error) {
            console.error('Permanent delete error:', error);
            throw error;
        }
    },

    async emptyTrash() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/notes/empty_trash/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Ошибка очистки корзины');
            }
            
            return data;
        } catch (error) {
            console.error('Empty trash error:', error);
            throw error;
        }
    },

    async uploadAvatar(formData) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/users/upload_avatar/`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${token}`,
            },
            body: formData,
        });
        
        if (!response.ok) {
            throw new Error('Upload failed');
        }
        
        return response.json();
    },
    
    async updateProfile(profileData) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/users/profile/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(profileData),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Update failed');
        }
        
        return data;
    },

    async refreshProfileStats() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/users/refresh_stats/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Ошибка обновления статистики');
            }
            
            return data;
        } catch (error) {
            console.error('Refresh stats error:', error);
            throw error;
        }
    },

    async getNotesStatistics() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/notes/statistics/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Ошибка получения статистики');
            }
            
            return {
                total_notes: data.total_notes,
                last_created: data.last_created,
                deleted_count: data.deleted_count || 0
            };
        } catch (error) {
            console.error('Get statistics error:', error);
            return {
                total_notes: 0,
                last_created: null,
                deleted_count: 0
            };
        }
    },

    async getGroups() {
        try {
            const token = localStorage.getItem('token');
            console.log('Запрос к /api/groups/');
            
            const response = await fetch(`${API_URL}/api/groups/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            });
        
            console.log('Статус ответа groups:', response.status);
        
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
        
            const data = await response.json();
            console.log('Группы получены:', data);
            return data;
        } catch (error) {
            console.error('Get groups error:', error);
            return [];
        }
    },
    
    async createGroup(groupData) {
        try {
            const token = localStorage.getItem('token');
            console.log('Создание группы:', groupData);
            
            const response = await fetch(`${API_URL}/api/groups/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(groupData),
            });
        
            console.log('📡 Статус создания группы:', response.status);
        
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error ${response.status}`);
            }
        
            const data = await response.json();
            console.log('Группа создана:', data);
            return data;
        } catch (error) {
            console.error('Create group error:', error);
            throw error;
        }
    },
    
    async updateGroup(groupId, groupData) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/groups/${groupId}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(groupData),
            });
        
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Ошибка обновления группы');
            }
        
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Update group error:', error);
            throw error;
        }
    },
    
    async deleteGroup(groupId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/groups/${groupId}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            });
        
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Ошибка удаления группы');
            }
        
            return { success: true };
        } catch (error) {
            console.error('Delete group error:', error);
            throw error;
        }
    },
    
    async getGroupNotes(groupId) {
        try {
            const token = localStorage.getItem('token');
            const url = groupId === 'none' 
                ? `${API_URL}/api/notes/?group=none`
                : `${API_URL}/api/notes/?group=${groupId}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            });
        
            const data = await response.json();
        
            if (!response.ok) {
                throw new Error(data.error || 'Ошибка получения заметок группы');
            }
        
            return data;
        } catch (error) {
            console.error('Get group notes error:', error);
            return [];
        }
    },
    
    async moveNoteToGroup(noteId, groupId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/notes/${noteId}/move-to-group/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    group_id: groupId
                }),
            });
        
            const data = await response.json();
        
            if (!response.ok) {
                throw new Error(data.error || 'Ошибка перемещения заметки');
            }
        
            return data;
        } catch (error) {
            console.error('Move note error:', error);
            throw error;
        }
    },
    
    async getNotesByGroups() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/notes/by-groups/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            });
        
            const data = await response.json();
        
            if (!response.ok) {
                throw new Error(data.error || 'Ошибка получения структуры групп');
            }
        
            return data;
        } catch (error) {
            console.error('Get notes by groups error:', error);
            return [];
        }
    },
    
    async addNotesToGroup(groupId, noteIds) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/groups/${groupId}/add-notes/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ note_ids: noteIds }),
            });
        
            const data = await response.json();
        
            if (!response.ok) {
                throw new Error(data.error || 'Ошибка добавления заметок в группу');
            }
        
            return data;
        } catch (error) {
            console.error('Add notes to group error:', error);
            throw error;
        }
    },
    
    async removeNotesFromGroup(groupId, noteIds) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/groups/${groupId}/remove-notes/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ note_ids: noteIds }),
            });
        
            const data = await response.json();
        
            if (!response.ok) {
                throw new Error(data.error || 'Ошибка удаления заметок из группы');
            }
        
            return data;
        } catch (error) {
            console.error('Remove notes from group error:', error);
            throw error;
        }
    },

    async uploadImage(file, noteId = null) {
        try {
            const token = localStorage.getItem('token');
            const base64 = await this.fileToBase64(file);
            const response = await fetch(`${API_URL}/api/notes/upload-image-base64/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: base64,
                    filename: file.name,
                    note_id: noteId
                }),
            });
        
            const data = await response.json();
            console.log('Ответ сервера uploadImage:', data);
        
            if (!response.ok) {
                throw new Error(data.error || 'Ошибка загрузки изображения');
            }
        
            return {
                url: data.url || data.image?.url || data,
                ...data
            };
        } catch (error) {
            console.error('Upload image error:', error);
            throw error;
        }
    },

    async uploadImageBase64(base64Data, filename = 'image.jpg', noteId = null) {
        try {
            const token = localStorage.getItem('token');
            console.log('Отправка base64, длина:', base64Data.length);

            const response = await fetch(`${API_URL}/api/notes/upload-image-base64/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: base64Data,
                    filename: filename,
                    note_id: noteId
                }),
            });

            console.log('Статус ответа:', response.status);
            const data = await response.json();
            console.log('Ответ сервера:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Ошибка загрузки изображения');
            }

            return data;
        } catch (error) {
            console.error('Upload base64 image error:', error);
            throw error;
        }
    },

    async addImageToNote(noteId, imageUrl, filename = null) {
        try {
            const token = localStorage.getItem('token');

            const requestBody = {
                image_url: imageUrl,
                filename: filename || 'image.jpg'
            };

            console.log('Отправка в add-image:', {
                url: `${API_URL}/api/notes/${noteId}/add-image/`,
                body: requestBody
            });

            const response = await fetch(`${API_URL}/api/notes/${noteId}/add-image/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();
            console.log('Ответ от add-image:', {
                status: response.status,
                data: data
            });

            if (!response.ok) {
                if (data.error && data.error.includes('already')) {
                    console.log('Изображение уже прикреплено к заметке');
                    return { success: true, already_exists: true };
                }
                throw new Error(data.error || data.message || `Ошибка ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Add image to note error:', error);
            throw error;
        }
    },

    async removeImageFromNote(noteId, imageUrl) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/notes/${noteId}/remove-image/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image_url: imageUrl
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ошибка удаления изображения');
            }

            return data;
        } catch (error) {
            console.error('Remove image from note error:', error);
            throw error;
        }
    },

    async getNoteImages(noteId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/notes/${noteId}/images/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ошибка получения изображений');
            }

            return data.images || [];
        } catch (error) {
            console.error('Get note images error:', error);
            return [];
        }
    },

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    },

    isImageFile(file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        return allowedTypes.includes(file.type);
    },

    isFileSizeValid(file, maxSizeMB = 5) {
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        return file.size <= maxSizeBytes;
    },

    getImageUrl(imageUrl) {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http')) {
            return imageUrl;
        }
        if (imageUrl.startsWith('/')) {
            return `${API_URL}${imageUrl}`;
        }
        return `${API_URL}/media/${imageUrl}`;
    }
};