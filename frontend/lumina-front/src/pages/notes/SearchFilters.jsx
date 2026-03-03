import React, { useState } from 'react';
import { X, Tag, Star, Calendar, SortAsc, SortDesc, Filter } from 'lucide-react';
import { useTheme } from './ThemeContext';

const SearchFilters = ({
    selectedTags,
    setSelectedTags,
    favoriteOnly,
    setFavoriteOnly,
    dateRange,
    setDateRange,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    tags,
    onClose
}) => {
    const { themeClasses } = useTheme();
    const [showDatePicker, setShowDatePicker] = useState(false);

    const sortOptions = [
        { value: 'created_at', label: 'По дате создания' },
        { value: 'updated_at', label: 'По дате изменения' },
        { value: 'title', label: 'По названию' },
        { value: 'favorites', label: 'По избранному' }
    ];

    const handleTagToggle = (tag) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const clearAllFilters = () => {
        setSelectedTags([]);
        setFavoriteOnly(false);
        setDateRange({ from: null, to: null });
        setSortBy('created_at');
        setSortOrder('desc');
    };

    const hasActiveFilters = selectedTags.length > 0 || favoriteOnly || dateRange.from || dateRange.to;

    return (
        <div className={`absolute left-0 right-0 top-16 ${themeClasses.colors.bg.primary} border-b ${themeClasses.colors.border.primary} shadow-lg z-20 animate-slide-down`}>
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <Filter className="w-5 h-5 text-indigo-500" />
                        <h3 className={`text-lg font-semibold ${themeClasses.colors.text.primary}`}>
                            Фильтры
                        </h3>
                        {hasActiveFilters && (
                            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs rounded-full">
                                Активны
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        {hasActiveFilters && (
                            <button
                                onClick={clearAllFilters}
                                className={`text-sm ${themeClasses.colors.text.tertiary} hover:${themeClasses.colors.text.secondary}`}
                            >
                                Сбросить все
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className={`p-1 hover:${themeClasses.colors.bg.secondary} rounded-lg transition-colors`}
                        >
                            <X className={`w-5 h-5 ${themeClasses.colors.text.tertiary}`} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Теги */}
                    <div className="space-y-2">
                        <label className={`flex items-center space-x-2 text-sm font-medium ${themeClasses.colors.text.secondary}`}>
                            <Tag className="w-4 h-4" />
                            <span>Теги</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {tags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => handleTagToggle(tag)}
                                    className={`
                                        px-3 py-1.5 text-sm rounded-full transition-all
                                        ${selectedTags.includes(tag)
                                            ? 'bg-indigo-500 text-white shadow-md'
                                            : `${themeClasses.colors.bg.secondary} ${themeClasses.colors.text.secondary} hover:${themeClasses.colors.bg.tertiary}`
                                        }
                                    `}
                                >
                                    {tag}
                                </button>
                            ))}
                            {tags.length === 0 && (
                                <p className={`text-sm ${themeClasses.colors.text.tertiary}`}>Нет тегов</p>
                            )}
                        </div>
                    </div>

                    {/* Избранное */}
                    <div className="space-y-2">
                        <label className={`flex items-center space-x-2 text-sm font-medium ${themeClasses.colors.text.secondary}`}>
                            <Star className="w-4 h-4" />
                            <span>Избранное</span>
                        </label>
                        <button
                            onClick={() => setFavoriteOnly(!favoriteOnly)}
                            className={`
                                flex items-center space-x-2 px-4 py-2 rounded-lg transition-all
                                ${favoriteOnly
                                    ? 'bg-yellow-500 text-white'
                                    : `${themeClasses.colors.bg.secondary} ${themeClasses.colors.text.secondary} hover:${themeClasses.colors.bg.tertiary}`
                                }
                            `}
                        >
                            <Star className={`w-4 h-4 ${favoriteOnly ? 'fill-current' : ''}`} />
                            <span>Только избранные</span>
                        </button>
                    </div>

                    {/* Дата */}
                    <div className="space-y-2">
                        <label className={`flex items-center space-x-2 text-sm font-medium ${themeClasses.colors.text.secondary}`}>
                            <Calendar className="w-4 h-4" />
                            <span>Дата</span>
                        </label>
                        <div className="space-y-2">
                            <input
                                type="date"
                                value={dateRange.from || ''}
                                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                className={`w-full px-3 py-2 ${themeClasses.colors.bg.secondary} border-0 rounded-lg text-sm
                                    ${themeClasses.colors.text.primary} focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                                placeholder="От"
                            />
                            <input
                                type="date"
                                value={dateRange.to || ''}
                                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                className={`w-full px-3 py-2 ${themeClasses.colors.bg.secondary} border-0 rounded-lg text-sm
                                    ${themeClasses.colors.text.primary} focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                                placeholder="До"
                            />
                        </div>
                    </div>

                    {/* Сортировка */}
                    <div className="space-y-2">
                        <label className={`flex items-center space-x-2 text-sm font-medium ${themeClasses.colors.text.secondary}`}>
                            <SortAsc className="w-4 h-4" />
                            <span>Сортировка</span>
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className={`w-full px-3 py-2 ${themeClasses.colors.bg.secondary} border-0 rounded-lg text-sm
                                ${themeClasses.colors.text.primary} focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                        >
                            {sortOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className={`flex items-center space-x-1 px-3 py-2 ${themeClasses.colors.bg.secondary} rounded-lg hover:${themeClasses.colors.bg.tertiary} transition-colors w-full justify-center`}
                        >
                            {sortOrder === 'asc' ? (
                                <>
                                    <SortAsc className="w-4 h-4" />
                                    <span className={`text-sm ${themeClasses.colors.text.secondary}`}>По возрастанию</span>
                                </>
                            ) : (
                                <>
                                    <SortDesc className="w-4 h-4" />
                                    <span className={`text-sm ${themeClasses.colors.text.secondary}`}>По убыванию</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchFilters;