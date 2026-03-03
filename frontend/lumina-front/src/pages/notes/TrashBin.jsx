import React, { useState } from 'react';
import { X, Trash2, RefreshCw, AlertCircle, Search, Calendar, Clock, Loader } from 'lucide-react';
import { useTheme } from './ThemeContext';

const TrashBin = ({ 
    deletedNotes = [], 
    onRestore, 
    onDeletePermanently, 
    onEmpty, 
    onClose,
    loading = false 
}) => {
    const { themeClasses } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNotes, setSelectedNotes] = useState([]);

    const safeDeletedNotes = Array.isArray(deletedNotes) ? deletedNotes : [];

    const filteredNotes = safeDeletedNotes.filter(note => {
        if (!note || typeof note !== 'object') return false;
        const title = note.title || '';
        const text = note.text || '';
        return title.toLowerCase().includes(searchQuery.toLowerCase()) ||
               text.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleSelectAll = () => {
        if (selectedNotes.length === filteredNotes.length) {
            setSelectedNotes([]);
        } else {
            setSelectedNotes(filteredNotes.map(n => n.id));
        }
    };

    const handleRestoreSelected = () => {
        selectedNotes.forEach(id => {
            const note = safeDeletedNotes.find(n => n && n.id === id);
            if (note && onRestore) onRestore(id);
        });
        setSelectedNotes([]);
    };

    const handleDeleteSelected = () => {
        if (window.confirm(`Удалить ${selectedNotes.length} заметок навсегда?`)) {
            selectedNotes.forEach(id => {
                if (onDeletePermanently) onDeletePermanently(id);
            });
            setSelectedNotes([]);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Дата неизвестна';
        try {
            if (typeof dateString === 'string' && dateString.includes('.')) {
                return dateString;
            }
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Дата неизвестна';
            return date.toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Дата неизвестна';
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className={`fixed inset-0 ${themeClasses.colors.bg.primary} bg-opacity-50 backdrop-blur-xl`} onClick={onClose}></div>
            
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className={`relative ${themeClasses.colors.bg.primary} rounded-2xl shadow-2xl w-full max-w-4xl 
                    transform transition-all animate-slide-up border ${themeClasses.colors.border.primary}`}>
                    
                    {/* Заголовок */}
                    <div className={`flex items-center justify-between p-6 border-b ${themeClasses.colors.border.primary}`}>
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-linear-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-white" />
                            </div>
                            <h2 className={`text-2xl font-bold bg-linear-to-r from-red-600 to-orange-600 bg-clip-text text-transparent`}>
                                Корзина
                            </h2>
                            <span className={`px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full`}>
                                {safeDeletedNotes.length} заметок
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 hover:${themeClasses.colors.bg.secondary} rounded-lg transition-colors`}
                        >
                            <X className={`w-5 h-5 ${themeClasses.colors.text.tertiary}`} />
                        </button>
                    </div>

                    {/* Панель действий */}
                    <div className={`p-4 border-b ${themeClasses.colors.border.primary} ${themeClasses.colors.bg.secondary}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={handleSelectAll}
                                    disabled={filteredNotes.length === 0 || loading}
                                    className={`px-3 py-1.5 text-sm ${themeClasses.colors.bg.primary} border ${themeClasses.colors.border.primary} rounded-lg hover:${themeClasses.colors.bg.secondary} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {selectedNotes.length === filteredNotes.length ? 'Снять выделение' : 'Выбрать все'}
                                </button>
                                
                                {selectedNotes.length > 0 && (
                                    <>
                                        <button
                                            onClick={handleRestoreSelected}
                                            disabled={loading}
                                            className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            <span className="text-sm">Восстановить ({selectedNotes.length})</span>
                                        </button>
                                        <button
                                            onClick={handleDeleteSelected}
                                            disabled={loading}
                                            className="flex items-center space-x-1 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span className="text-sm">Удалить навсегда</span>
                                        </button>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={onEmpty}
                                disabled={safeDeletedNotes.length === 0 || loading}
                                className={`px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 
                                    dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                            >
                                {loading ? 'Очистка...' : 'Очистить корзину'}
                            </button>
                        </div>
                    </div>

                    {/* Поиск */}
                    <div className={`p-4 border-b ${themeClasses.colors.border.primary}`}>
                        <div className="relative">
                            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${themeClasses.colors.text.tertiary}`} />
                            <input
                                type="text"
                                placeholder="Поиск в корзине..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                disabled={loading}
                                className={`w-full pl-9 pr-4 py-2 ${themeClasses.colors.bg.secondary} border-0 rounded-lg
                                    ${themeClasses.colors.text.primary} focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50`}
                            />
                        </div>
                    </div>

                    {/* Список удаленных заметок */}
                    <div className="p-6 max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className={`w-16 h-16 ${themeClasses.colors.bg.secondary} rounded-full mx-auto mb-4 flex items-center justify-center`}>
                                    <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
                                </div>
                                <p className={themeClasses.colors.text.tertiary}>Загрузка корзины...</p>
                            </div>
                        ) : filteredNotes.length === 0 ? (
                            <div className="text-center py-12">
                                <div className={`w-16 h-16 ${themeClasses.colors.bg.secondary} rounded-full mx-auto mb-4 flex items-center justify-center`}>
                                    <Trash2 className={`w-8 h-8 ${themeClasses.colors.text.tertiary}`} />
                                </div>
                                <p className={themeClasses.colors.text.tertiary}>
                                    {searchQuery ? 'Ничего не найдено' : 'Корзина пуста'}
                                </p>
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="mt-2 text-sm text-indigo-500 hover:text-indigo-600"
                                    >
                                        Сбросить поиск
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredNotes.map((note, index) => (
                                    <div
                                        key={note?.id || `temp-${index}`}
                                        className={`p-4 border rounded-xl transition-all cursor-pointer ${
                                            selectedNotes.includes(note?.id)
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                : `${themeClasses.colors.border.primary} hover:border-gray-300 dark:hover:border-gray-600`
                                        }`}
                                        onClick={() => {
                                            if (note?.id) {
                                                setSelectedNotes(prev =>
                                                    prev.includes(note.id)
                                                        ? prev.filter(id => id !== note.id)
                                                        : [...prev, note.id]
                                                );
                                            }
                                        }}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className={`text-lg font-semibold ${themeClasses.colors.text.primary} mb-1`}>
                                                    {note?.title || 'Без названия'}
                                                </h3>
                                                <p className={`text-sm ${themeClasses.colors.text.tertiary} line-clamp-2 mb-2`}>
                                                    {note?.text || 'Пустая заметка'}
                                                </p>
                                                <div className="flex items-center space-x-3 text-xs text-gray-400">
                                                    <div className="flex items-center space-x-1">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>{formatDate(note?.created_at)}</span>
                                                    </div>
                                                    {note?.deletedAt && (
                                                        <div className="flex items-center space-x-1">
                                                            <Clock className="w-3 h-3" />
                                                            <span>Удалено: {formatDate(note.deletedAt)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center space-x-1 ml-4">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (note?.id && onRestore) onRestore(note.id);
                                                    }}
                                                    disabled={loading}
                                                    className={`p-2 hover:${themeClasses.colors.bg.secondary} rounded-lg transition-colors disabled:opacity-50`}
                                                    title="Восстановить"
                                                >
                                                    <RefreshCw className="w-4 h-4 text-indigo-500" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (note?.id && onDeletePermanently) onDeletePermanently(note.id);
                                                    }}
                                                    disabled={loading}
                                                    className={`p-2 hover:${themeClasses.colors.bg.secondary} rounded-lg transition-colors disabled:opacity-50`}
                                                    title="Удалить навсегда"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Информация */}
                    {filteredNotes.length > 0 && (
                        <div className={`p-4 border-t ${themeClasses.colors.border.primary} ${themeClasses.colors.bg.secondary}`}>
                            <div className={`flex items-center space-x-2 text-sm ${themeClasses.colors.text.tertiary}`}>
                                <AlertCircle className="w-4 h-4" />
                                <span>
                                    Заметки хранятся в корзине 30 дней, после чего удаляются автоматически
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrashBin;