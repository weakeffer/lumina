import React, { useState } from 'react';
import { X, Tag, Plus, Edit2, Trash2, Check, Search } from 'lucide-react';

const TagManager = ({ tags, notes, onClose, onTagSelect, onTagDelete }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [editingTag, setEditingTag] = useState(null);
    const [newTagName, setNewTagName] = useState('');
    const [showNewTagInput, setShowNewTagInput] = useState(false);
    const tagUsage = tags.reduce((acc, tag) => {
        acc[tag] = notes.filter(note => note.tags?.includes(tag)).length;
        return acc;
    }, {});

    const filteredTags = tags.filter(tag => 
        tag.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateTag = () => {
        if (newTagName.trim() && !tags.includes(newTagName.trim())) {
            onTagSelect(newTagName.trim());
            setNewTagName('');
            setShowNewTagInput(false);
        }
    };

    const handleEditTag = async (oldTag, newTag) => {
        if (newTag && newTag !== oldTag && !tags.includes(newTag)) {
            try {
                const notesWithTag = notes.filter(n => n.tags?.includes(oldTag));
                for (const note of notesWithTag) {
                    const updatedTags = note.tags.map(t => t === oldTag ? newTag : t);
                    await api.updateNote(note.id, { tags: updatedTags });
                }
                setEditingTag(null);
                onTagDelete?.(oldTag);
                onTagSelect?.(newTag);
                
            } catch (error) {
                console.error('Failed to edit tag:', error);
                alert('Ошибка при редактировании тега');
            }
        } else {
            setEditingTag(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl 
                    transform transition-all animate-slide-up">
                    
                    {/* Заголовок */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                                <Tag className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Управление тегами
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Поиск тегов */}
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Поиск тегов..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border-0 rounded-lg
                                    focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                    </div>

                    {/* Список тегов */}
                    <div className="p-6 max-h-96 overflow-y-auto">
                        {showNewTagInput && (
                            <div className="mb-4 flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                    placeholder="Название тега"
                                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border rounded-lg
                                        focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    autoFocus
                                    onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
                                />
                                <button
                                    onClick={handleCreateTag}
                                    className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setShowNewTagInput(false)}
                                    className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        <div className="space-y-2">
                            {filteredTags.map(tag => (
                                <div
                                    key={tag}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                >
                                    {editingTag === tag ? (
                                        <div className="flex-1 flex items-center space-x-2">
                                            <input
                                                type="text"
                                                defaultValue={tag}
                                                className="flex-1 px-2 py-1 bg-white dark:bg-gray-800 border rounded"
                                                autoFocus
                                                onBlur={(e) => handleEditTag(tag, e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleEditTag(tag, e.target.value)}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center space-x-3">
                                                <Tag className="w-4 h-4 text-indigo-500" />
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {tag}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {tagUsage[tag] || 0} заметок
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onTagSelect(tag)}
                                                    className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded transition-colors"
                                                    title="Использовать в фильтре"
                                                >
                                                    <Search className="w-4 h-4 text-indigo-500" />
                                                </button>
                                                <button
                                                    onClick={() => setEditingTag(tag)}
                                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4 text-gray-500" />
                                                </button>
                                                <button
                                                    onClick={() => onTagDelete(tag)}
                                                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Нижняя панель */}
                    <div className="flex items-center justify-between p-6 border-t border-gray-100 dark:border-gray-700">
                        <button
                            onClick={() => setShowNewTagInput(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm font-medium">Создать тег</span>
                        </button>
                        
                        <div className="text-sm text-gray-500">
                            Всего тегов: {tags.length}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TagManager;