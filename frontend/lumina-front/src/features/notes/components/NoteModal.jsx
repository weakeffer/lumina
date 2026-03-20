import React, { useState, useEffect } from 'react';
import { X, Save, Type, AlignLeft, Hash, Image, Paperclip } from 'lucide-react';

const NoteModal = ({ isOpen, onClose, onSave, note }) => {
    const [formData, setFormData] = useState({
        title: '',
        text: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [charCount, setCharCount] = useState(0);

    useEffect(() => {
        if (note) {
            setFormData({
                title: note.title || '',
                text: note.text || ''
            });
        } else {
            setFormData({
                title: '',
                text: ''
            });
        }
    }, [note, isOpen]);

    useEffect(() => {
        setCharCount(formData.text.length);
    }, [formData.text]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        
        try {
            await onSave(formData);
        } catch (error) {
            console.error('Save error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl 
                    transform transition-all animate-slide-up">
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        <h2 className="text-2xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            {note ? 'Редактировать заметку' : 'Новая заметка'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center space-x-2">
                                    <Type className="w-4 h-4 text-indigo-500" />
                                    <span>Заголовок</span>
                                </div>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Введите заголовок заметки..."
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                                    transition-all duration-200"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center space-x-2">
                                    <AlignLeft className="w-4 h-4 text-indigo-500" />
                                    <span>Содержимое</span>
                                </div>
                            </label>
                            <div className="relative">
                                <textarea
                                    name="text"
                                    value={formData.text}
                                    onChange={handleChange}
                                    placeholder="Что у вас нового?..."
                                    rows="8"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                                        transition-all duration-200 resize-none"
                                />
                                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                                    {charCount} символов
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 text-sm text-gray-500">
                            <button
                                type="button"
                                className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <Image className="w-4 h-4" />
                                <span>Изображение</span>
                            </button>
                            <button
                                type="button"
                                className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <Paperclip className="w-4 h-4" />
                                <span>Вложение</span>
                            </button>
                            <button
                                type="button"
                                className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <Hash className="w-4 h-4" />
                                <span>Теги</span>
                            </button>
                        </div>
                        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-700
                                    hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                                    transition-all duration-200"
                            >
                                Отмена
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex items-center space-x-2 px-6 py-2.5 bg-linear-to-r from-indigo-600 to-purple-600
                                    text-white rounded-xl hover:from-indigo-700 hover:to-purple-700
                                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    transform transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Сохранение...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        <span>Сохранить</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default NoteModal;