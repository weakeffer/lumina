import React, { useState } from 'react';
import { 
    X, 
    Sun, 
    Moon, 
    Palette, 
    Type, 
    Save, 
    Bell, 
    Globe, 
    Shield, 
    Database,
    Download,
    Upload,
    RefreshCw,
    Check,
    ChevronRight,
    Monitor,
    Smartphone,
    Tablet,
    Eye,
    EyeOff,
    Clock,
    Cloud,
    HardDrive,
    Zap,
    Feather,
    Coffee,
    BookOpen
} from 'lucide-react';

const SettingsPanel = ({
    theme,
    onThemeChange,
    viewMode,
    onViewModeChange,
    autoSave,
    onAutoSaveToggle,
    fontSize,
    onFontSizeChange,
    onClose
}) => {
    const [activeTab, setActiveTab] = useState('appearance');
    const [showSuccess, setShowSuccess] = useState(false);

    const themes = [
        { id: 'light', name: 'Светлая', icon: Sun, color: 'bg-amber-100 text-amber-600' },
        { id: 'dark', name: 'Тёмная', icon: Moon, color: 'bg-indigo-100 text-indigo-600' },
        { id: 'sepia', name: 'Сепия', icon: Coffee, color: 'bg-amber-100 text-amber-800' },
        { id: 'ocean', name: 'Океан', icon: Feather, color: 'bg-blue-100 text-blue-600' },
        { id: 'forest', name: 'Лес', icon: BookOpen, color: 'bg-green-100 text-green-600' }
    ];

    const fontSizes = [
        { id: 'small', name: 'Маленький', size: '14px' },
        { id: 'medium', name: 'Средний', size: '16px' },
        { id: 'large', name: 'Большой', size: '18px' },
        { id: 'xlarge', name: 'Очень большой', size: '20px' }
    ];

    const viewModes = [
        { id: 'split', name: 'Разделенный', icon: Monitor, description: 'Список и редактор одновременно' },
        { id: 'editor-only', name: 'Только редактор', icon: Eye, description: 'Только область редактирования' },
        { id: 'sidebar-only', name: 'Только список', icon: ListIcon, description: 'Только список заметок' }
    ];

    const autoSaveIntervals = [
        { id: 0.5, name: '30 секунд' },
        { id: 1, name: '1 минута' },
        { id: 2, name: '2 минуты' },
        { id: 5, name: '5 минут' }
    ];

    const handleSaveSettings = () => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        const settings = {
            theme,
            viewMode,
            autoSave,
            fontSize,
            autoSaveInterval
        };
        localStorage.setItem('appSettings', JSON.stringify(settings));
        if (onAutoSaveIntervalChange) {
            const interval = document.getElementById('autoSaveInterval')?.value;
            if (interval) onAutoSaveIntervalChange(parseFloat(interval));
        }
    };

    const handleExportData = () => {
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
        
        const exportData = {
            notes,
            settings,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notes-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportData = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                console.log('Imported data:', data);
                alert('Данные успешно импортированы!');
            } catch (error) {
                alert('Ошибка при импорте файла');
            }
        };
        reader.readAsText(file);
    };

    const tabs = [
        { id: 'appearance', name: 'Внешний вид', icon: Palette },
        { id: 'editor', name: 'Редактор', icon: Type },
        { id: 'backup', name: 'Резервное копирование', icon: Database },
        { id: 'notifications', name: 'Уведомления', icon: Bell },
        { id: 'privacy', name: 'Приватность', icon: Shield }
    ];

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl 
                    transform transition-all animate-slide-up">
                    
                    {/* Заголовок */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                                <Palette className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Настройки
                            </h2>
                        </div>
                        <div className="flex items-center space-x-2">
                            {showSuccess && (
                                <div className="flex items-center space-x-1 text-green-500 text-sm">
                                    <Check className="w-4 h-4" />
                                    <span>Сохранено</span>
                                </div>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* Основной контент */}
                    <div className="flex">
                        {/* Боковое меню табов */}
                        <div className="w-48 border-r border-gray-100 dark:border-gray-700 p-4">
                            {tabs.map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            w-full flex items-center space-x-2 px-3 py-2 rounded-lg mb-1
                                            transition-all duration-200
                                            ${activeTab === tab.id
                                                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                                            }
                                        `}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="text-sm">{tab.name}</span>
                                        {activeTab === tab.id && (
                                            <ChevronRight className="w-4 h-4 ml-auto" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Контент таба */}
                        <div className="flex-1 p-6 max-h-150 overflow-y-auto">
                            {/* Внешний вид */}
                            {activeTab === 'appearance' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                            Тема оформления
                                        </h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            {themes.map(t => {
                                                const Icon = t.icon;
                                                return (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => onThemeChange(t.id)}
                                                        className={`
                                                            relative p-4 rounded-xl border-2 transition-all
                                                            ${theme === t.id
                                                                ? 'border-indigo-500 shadow-lg'
                                                                : 'border-transparent hover:border-gray-200'
                                                            }
                                                        `}
                                                    >
                                                        <div className={`${t.color} w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center`}>
                                                            <Icon className="w-6 h-6" />
                                                        </div>
                                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            {t.name}
                                                        </p>
                                                        {theme === t.id && (
                                                            <div className="absolute top-2 right-2 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                                                                <Check className="w-3 h-3 text-white" />
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                            Размер шрифта
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            {fontSizes.map(f => (
                                                <button
                                                    key={f.id}
                                                    onClick={() => onFontSizeChange(f.id)}
                                                    className={`
                                                        p-4 rounded-xl border-2 text-left transition-all
                                                        ${fontSize === f.id
                                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                        }
                                                    `}
                                                >
                                                    <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                                                        {f.name}
                                                    </p>
                                                    <p style={{ fontSize: f.size }} className="text-gray-600 dark:text-gray-400">
                                                        Пример текста
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                            Режим просмотра
                                        </h3>
                                        <div className="space-y-3">
                                            {viewModes.map(vm => {
                                                const Icon = vm.icon;
                                                return (
                                                    <button
                                                        key={vm.id}
                                                        onClick={() => onViewModeChange(vm.id)}
                                                        className={`
                                                            w-full p-4 rounded-xl border-2 text-left transition-all
                                                            ${viewMode === vm.id
                                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                                : 'border-gray-200 hover:border-gray-300'
                                                            }
                                                        `}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-3">
                                                                <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                                <div>
                                                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                                                        {vm.name}
                                                                    </p>
                                                                    <p className="text-sm text-gray-500">
                                                                        {vm.description}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {viewMode === vm.id && (
                                                                <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                                                                    <Check className="w-3 h-3 text-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Редактор */}
                            {activeTab === 'editor' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                            Автосохранение
                                        </h3>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                            <div className="flex items-center space-x-3">
                                                <Save className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                                        Автоматическое сохранение
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Сохранять изменения автоматически
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={onAutoSaveToggle}
                                                className={`
                                                    relative w-12 h-6 rounded-full transition-colors
                                                    ${autoSave ? 'bg-indigo-500' : 'bg-gray-300'}
                                                `}
                                            >
                                                <div
                                                    className={`
                                                        absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                                                        ${autoSave ? 'right-1' : 'left-1'}
                                                    `}
                                                />
                                            </button>
                                        </div>
                                        
                                        {autoSave && (
                                            <div className="mt-4">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Интервал автосохранения
                                                </label>
                                                <select
                                                    id="autoSaveInterval"
                                                    value={autoSaveInterval}
                                                    onChange={(e) => onAutoSaveIntervalChange?.(parseFloat(e.target.value))}
                                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border-0 rounded-lg
                                                        focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                >
                                                    {autoSaveIntervals.map(interval => (
                                                        <option key={interval.id} value={interval.id}>
                                                            {interval.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                            Форматирование
                                        </h3>
                                        <div className="space-y-3">
                                            <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                                <div className="flex items-center space-x-3">
                                                    <Type className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                                            Markdown поддержка
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            Использовать Markdown для форматирования
                                                        </p>
                                                    </div>
                                                </div>
                                                <input type="checkbox" className="rounded text-indigo-500" defaultChecked />
                                            </label>
                                            
                                            <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                                <div className="flex items-center space-x-3">
                                                    <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                                            Предпросмотр в реальном времени
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            Показывать предпросмотр при редактировании
                                                        </p>
                                                    </div>
                                                </div>
                                                <input type="checkbox" className="rounded text-indigo-500" defaultChecked />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'backup' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                            Экспорт данных
                                        </h3>
                                        <button
                                            onClick={handleExportData}
                                            className="w-full p-4 bg-linear-to-r from-indigo-500 to-purple-500 text-white rounded-xl
                                                hover:from-indigo-600 hover:to-purple-600 transition-all transform hover:scale-105
                                                flex items-center justify-center space-x-2"
                                        >
                                            <Download className="w-5 h-5" />
                                            <span>Скачать резервную копию</span>
                                        </button>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                            Импорт данных
                                        </h3>
                                        <label className="w-full p-4 bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 
                                            rounded-xl hover:border-indigo-500 transition-colors cursor-pointer
                                            flex flex-col items-center justify-center space-y-2"
                                        >
                                            <Upload className="w-8 h-8 text-gray-400" />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                Нажмите для выбора файла
                                            </span>
                                            <input
                                                type="file"
                                                accept=".json"
                                                onChange={handleImportData}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                            Автоматическое резервное копирование
                                        </h3>
                                        <div className="space-y-3">
                                            <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                                <div className="flex items-center space-x-3">
                                                    <Cloud className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                                            Облачное резервирование
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            Автоматически сохранять в облако
                                                        </p>
                                                    </div>
                                                </div>
                                                <input type="checkbox" className="rounded text-indigo-500" />
                                            </label>
                                            
                                            <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                                <div className="flex items-center space-x-3">
                                                    <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                                            Периодичность
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            Как часто создавать резервные копии
                                                        </p>
                                                    </div>
                                                </div>
                                                <select className="bg-transparent border-0 text-sm">
                                                    <option>Каждый день</option>
                                                    <option>Каждую неделю</option>
                                                    <option>Каждый месяц</option>
                                                </select>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Уведомления */}
                            {activeTab === 'notifications' && (
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                            <div className="flex items-center space-x-3">
                                                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                                        Уведомления о сохранении
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Показывать когда заметка сохранена
                                                    </p>
                                                </div>
                                            </div>
                                            <input type="checkbox" className="rounded text-indigo-500" defaultChecked />
                                        </label>
                                        
                                        <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                            <div className="flex items-center space-x-3">
                                                <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                                        Напоминания
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Напоминать о важных заметках
                                                    </p>
                                                </div>
                                            </div>
                                            <input type="checkbox" className="rounded text-indigo-500" />
                                        </label>
                                        
                                        <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                            <div className="flex items-center space-x-3">
                                                <Zap className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                                        Звуковые эффекты
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Воспроизводить звуки при действиях
                                                    </p>
                                                </div>
                                            </div>
                                            <input type="checkbox" className="rounded text-indigo-500" />
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Приватность */}
                            {activeTab === 'privacy' && (
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                            <div className="flex items-center space-x-3">
                                                <EyeOff className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                                        Блокировка приложения
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Запрашивать пароль при входе
                                                    </p>
                                                </div>
                                            </div>
                                            <input type="checkbox" className="rounded text-indigo-500" />
                                        </label>
                                        
                                        <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                            <div className="flex items-center space-x-3">
                                                <HardDrive className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                                        Локальное шифрование
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Шифровать заметки на устройстве
                                                    </p>
                                                </div>
                                            </div>
                                            <input type="checkbox" className="rounded text-indigo-500" />
                                        </label>
                                        
                                        <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                            <div className="flex items-center space-x-3">
                                                <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                                        Аналитика использования
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Отправлять анонимные данные об использовании
                                                    </p>
                                                </div>
                                            </div>
                                            <input type="checkbox" className="rounded text-indigo-500" />
                                        </label>
                                    </div>

                                    <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-900 rounded-xl p-4">
                                        <div className="flex items-start space-x-3">
                                            <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                                                    Ваши данные в безопасности
                                                </p>
                                                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                                                    Все заметки хранятся локально на вашем устройстве. 
                                                    Мы не собираем и не передаем ваши данные третьим лицам.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Нижняя панель */}
                    <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-100 dark:border-gray-700">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg
                                hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={handleSaveSettings}
                            className="px-4 py-2 bg-linear-to-r from-indigo-500 to-purple-500 text-white rounded-lg
                                hover:from-indigo-600 hover:to-purple-600 transition-all transform hover:scale-105
                                flex items-center space-x-2"
                        >
                            <Save className="w-4 h-4" />
                            <span>Сохранить изменения</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ListIcon = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
);

export default SettingsPanel;