import React, { useState, useEffect, useRef } from 'react';
import {
    Plus,
    Search,
    Sun,
    Moon,
    Coffee,
    Feather,
    BookOpen,
    Command,
    FileText,
    Star,
    Tag,
    User,
    LogOut,
    HelpCircle,
    Keyboard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeContext';
import { useSettings } from './SettingsContext';

const QuickActions = ({ onNewNote, onSearch }) => {
    const navigate = useNavigate();
    const { theme, setTheme, themeClasses } = useTheme();
    const { viewMode, setViewMode } = useSettings();
    
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef(null);
    const inputRef = useRef(null);

    const getThemeIcon = () => {
        switch (theme) {
            case 'dark': return Moon;
            case 'sepia': return Coffee;
            case 'ocean': return Feather;
            case 'forest': return BookOpen;
            default: return Sun;
        }
    };

    const ThemeIcon = getThemeIcon();

    const actions = [
        {
            category: 'Заметки',
            items: [
                { icon: Plus, label: 'Новая заметка', shortcut: '⌘N', action: onNewNote },
                { icon: FileText, label: 'Все заметки', shortcut: '⌘⇧A', action: () => navigate('/notes') },
                { icon: Star, label: 'Избранное', shortcut: '⌘⇧F', action: () => {} },
                { icon: Tag, label: 'Управление тегами', shortcut: '⌘⇧T', action: () => {} }
            ]
        },
        {
            category: 'Вид',
            items: [
                { 
                    icon: ThemeIcon, 
                    label: 'Сменить тему', 
                    shortcut: '⌘⇧L', 
                    action: () => {
                        const themes = ['light', 'dark', 'sepia', 'ocean', 'forest'];
                        const next = themes[(themes.indexOf(theme) + 1) % themes.length];
                        setTheme(next);
                    }
                },
                { 
                    icon: viewMode === 'split' ? FileText : Command, 
                    label: `Режим: ${viewMode === 'split' ? 'Разделенный' : 'На весь экран'}`, 
                    shortcut: '⌘⇧V',
                    action: () => setViewMode(viewMode === 'split' ? 'full' : 'split')
                }
            ]
        },
        {
            category: 'Навигация',
            items: [
                { icon: User, label: 'Профиль', shortcut: '⌘⇧P', action: () => navigate('/profile') },
                { icon: HelpCircle, label: 'Помощь', shortcut: '⌘?', action: () => {} },
                { icon: Keyboard, label: 'Горячие клавиши', shortcut: '⌘K', action: () => {} }
            ]
        }
    ];

    const flattenedItems = actions.flatMap(category => category.items);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
                setTimeout(() => inputRef.current?.focus(), 100);
            }

            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }

            if (isOpen) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev + 1) % flattenedItems.length);
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev - 1 + flattenedItems.length) % flattenedItems.length);
                }
                if (e.key === 'Enter' && flattenedItems[selectedIndex]) {
                    e.preventDefault();
                    flattenedItems[selectedIndex].action();
                    setIsOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, selectedIndex, flattenedItems, onNewNote, setTheme, viewMode, setViewMode, navigate]);

    const filteredActions = actions.map(category => ({
        ...category,
        items: category.items.filter(item =>
            item.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(category => category.items.length > 0);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center space-x-2 px-3 py-2 ${themeClasses.colors.bg.secondary} rounded-lg
                    hover:${themeClasses.colors.bg.tertiary} transition-colors group`}
            >
                <Command className={`w-4 h-4 ${themeClasses.colors.text.tertiary}`} />
                <span className={`text-sm ${themeClasses.colors.text.secondary}`}>Меню</span>
                <kbd className={`px-1.5 py-0.5 ${themeClasses.colors.bg.primary} rounded text-xs ${themeClasses.colors.text.tertiary}`}>
                    ⌘K
                </kbd>
            </button>

            {isOpen && (
                <div className={`absolute right-0 top-12 w-80 ${themeClasses.colors.bg.primary} rounded-xl shadow-2xl 
                    border ${themeClasses.colors.border.primary} overflow-hidden animate-slide-down z-50`}>
                    
                    <div className={`p-3 border-b ${themeClasses.colors.border.primary}`}>
                        <div className="relative">
                            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${themeClasses.colors.text.tertiary}`} />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Поиск действий..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full pl-9 pr-4 py-2 ${themeClasses.colors.bg.secondary} border-0 rounded-lg
                                    ${themeClasses.colors.text.primary} focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm`}
                            />
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto p-2">
                        {filteredActions.length > 0 ? (
                            filteredActions.map((category, catIdx) => (
                                <div key={catIdx} className="mb-2">
                                    <p className={`text-xs font-medium ${themeClasses.colors.text.tertiary} uppercase tracking-wider px-2 py-1`}>
                                        {category.category}
                                    </p>
                                    {category.items.map((item, itemIdx) => {
                                        const Icon = item.icon;
                                        const isSelected = flattenedItems.findIndex(i => i.label === item.label) === selectedIndex;
                                        
                                        return (
                                            <button
                                                key={itemIdx}
                                                onClick={() => {
                                                    item.action();
                                                    setIsOpen(false);
                                                }}
                                                className={`
                                                    w-full flex items-center justify-between px-3 py-2 rounded-lg
                                                    transition-colors
                                                    ${isSelected 
                                                        ? 'bg-indigo-50 dark:bg-indigo-900/30' 
                                                        : `hover:${themeClasses.colors.bg.secondary}`
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <Icon className={`w-4 h-4 ${themeClasses.colors.text.tertiary}`} />
                                                    <span className={`text-sm ${themeClasses.colors.text.primary}`}>
                                                        {item.label}
                                                    </span>
                                                </div>
                                                {item.shortcut && (
                                                    <kbd className={`px-1.5 py-0.5 ${themeClasses.colors.bg.secondary} rounded text-xs ${themeClasses.colors.text.tertiary}`}>
                                                        {item.shortcut}
                                                    </kbd>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <Command className={`w-8 h-8 ${themeClasses.colors.text.tertiary} mx-auto mb-2`} />
                                <p className={`text-sm ${themeClasses.colors.text.tertiary}`}>Ничего не найдено</p>
                            </div>
                        )}
                    </div>

                    <div className={`p-3 border-t ${themeClasses.colors.border.primary} ${themeClasses.colors.bg.secondary}`}>
                        <div className={`flex items-center justify-between text-xs ${themeClasses.colors.text.tertiary}`}>
                            <div className="flex items-center space-x-3">
                                <span>↑↓ навигация</span>
                                <span>↵ выбор</span>
                            </div>
                            <span>esc закрыть</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuickActions;