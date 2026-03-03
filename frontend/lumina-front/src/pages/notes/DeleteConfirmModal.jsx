import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, noteTitle }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setIsDeleting(true);
        try {
            await onConfirm();
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            ></div>
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md 
                    transform transition-all animate-slide-up">
                    <div className="p-6">
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>
                        </div>
                        
                        <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                            Удалить заметку?
                        </h3>
                        
                        <p className="text-center text-gray-500 mb-6">
                            Вы уверены, что хотите удалить заметку "{noteTitle}"? 
                            Это действие нельзя отменить.
                        </p>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={onClose}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700
                                    hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                                    transition-all duration-200 disabled:opacity-50"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl
                                    hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                                    transform transition-all duration-200 hover:scale-105 active:scale-95
                                    disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    'Удалить'
                                )}
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;