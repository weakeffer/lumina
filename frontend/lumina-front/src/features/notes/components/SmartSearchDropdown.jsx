import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Tag, Star, Calendar, Folder, ChevronRight, Filter, Zap } from 'lucide-react';
import { useTheme } from '../../../shared/context/ThemeContext';

const SmartSearchDropdown = ({
  searchQuery,
  onSearchChange,
  filteredNotes,
  tags,
  groups,
  selectedTags,
  onTagToggle,
  favoriteOnly,
  setFavoriteOnly,
  onNoteSelect,
  onClose,
  isOpen,
  onToggleFilters, // Для открытия расширенных фильтров
  activeFiltersCount, // Количество активных фильтров
  className = ""
}) => {
  const { themeClasses } = useTheme();
  const dropdownRef = useRef(null);
  const [activeTab, setActiveTab] = useState('notes'); // 'notes', 'tags', 'groups'
  
  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Группировка результатов поиска
  const groupedResults = useMemo(() => {
    if (!searchQuery.trim()) return null;

    const results = {
      exactMatches: [],
      titleMatches: [],
      contentMatches: [],
      tagMatches: []
    };

    filteredNotes.forEach(note => {
      const titleLower = note.title?.toLowerCase() || '';
      const textLower = note.text?.toLowerCase() || '';
      const queryLower = searchQuery.toLowerCase();

      if (titleLower === queryLower) {
        results.exactMatches.push(note);
      } else if (titleLower.includes(queryLower)) {
        results.titleMatches.push(note);
      } else if (textLower.includes(queryLower)) {
        results.contentMatches.push(note);
      }

      if (note.tags?.some(tag => tag.toLowerCase().includes(queryLower))) {
        results.tagMatches.push(note);
      }
    });

    return results;
  }, [filteredNotes, searchQuery]);

  // Фильтрованные теги по поиску
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return tags;
    return tags.filter(tag => 
      tag.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tags, searchQuery]);

  // Фильтрованные группы по поиску
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    return groups.filter(group => 
      group.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [groups, searchQuery]);

  // Подсветка текста
  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? 
        <span key={i} className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded px-0.5 font-medium">
          {part}
        </span> : 
        part
    );
  };

  const getTotalResults = () => {
    if (!searchQuery.trim()) return 0;
    return filteredNotes.length;
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className={`absolute top-full left-0 right-0 mt-2 ${themeClasses.colors.bg.primary} rounded-xl shadow-2xl border ${themeClasses.colors.border.primary} z-50 overflow-hidden animate-slide-down`}
      style={{ maxHeight: '70vh' }}
    >
      {/* Поле поиска с кнопкой фильтров */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Поиск заметок, тегов, групп..."
              className={`w-full pl-9 pr-8 py-2.5 ${themeClasses.colors.bg.secondary} border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${themeClasses.colors.text.primary}`}
              autoComplete="off"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            )}
          </div>
          
          {/* Кнопка расширенных фильтров */}
          <button
            onClick={onToggleFilters}
            className={`px-3 py-2 rounded-lg transition-all relative ${
              activeFiltersCount > 0 
                ? 'bg-indigo-500 text-white shadow-md' 
                : `${themeClasses.colors.bg.secondary} ${themeClasses.colors.text.secondary} hover:${themeClasses.colors.bg.tertiary}`
            }`}
            title="Расширенные фильтры"
          >
            <Filter className="w-4 h-4" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Быстрые фильтры */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => setFavoriteOnly(!favoriteOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
              favoriteOnly 
                ? 'bg-yellow-500 text-white shadow-md' 
                : `${themeClasses.colors.bg.secondary} ${themeClasses.colors.text.secondary} hover:${themeClasses.colors.bg.tertiary}`
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favoriteOnly ? 'fill-current' : ''}`} />
            <span>Избранное</span>
          </button>
          
          {activeFiltersCount > 0 && (
            <span className={`text-xs ${themeClasses.colors.text.tertiary}`}>
              Активно фильтров: {activeFiltersCount}
            </span>
          )}
        </div>
      </div>

      {/* Табы для навигации */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 px-4">
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 text-sm font-medium transition-all relative ${
            activeTab === 'notes'
              ? `text-indigo-500 ${themeClasses.colors.text.primary}`
              : themeClasses.colors.text.secondary
          }`}
        >
          Заметки
          {getTotalResults() > 0 && activeTab === 'notes' && (
            <span className="ml-1 text-xs text-indigo-400">({getTotalResults()})</span>
          )}
          {activeTab === 'notes' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('tags')}
          className={`px-4 py-2 text-sm font-medium transition-all relative ${
            activeTab === 'tags'
              ? `text-indigo-500 ${themeClasses.colors.text.primary}`
              : themeClasses.colors.text.secondary
          }`}
        >
          Теги
          {filteredTags.length > 0 && activeTab === 'tags' && (
            <span className="ml-1 text-xs text-indigo-400">({filteredTags.length})</span>
          )}
          {activeTab === 'tags' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`px-4 py-2 text-sm font-medium transition-all relative ${
            activeTab === 'groups'
              ? `text-indigo-500 ${themeClasses.colors.text.primary}`
              : themeClasses.colors.text.secondary
          }`}
        >
          Группы
          {filteredGroups.length > 0 && activeTab === 'groups' && (
            <span className="ml-1 text-xs text-indigo-400">({filteredGroups.length})</span>
          )}
          {activeTab === 'groups' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
          )}
        </button>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 140px)' }}>
        {/* Вкладка Заметки */}
        {activeTab === 'notes' && (
          <>
            {!searchQuery.trim() ? (
              <div className="p-8 text-center">
                <Zap className={`w-12 h-12 mx-auto mb-3 ${themeClasses.colors.text.tertiary}`} />
                <p className={`${themeClasses.colors.text.secondary} font-medium`}>
                  Начните вводить текст для поиска
                </p>
                <p className={`text-sm ${themeClasses.colors.text.tertiary} mt-1`}>
                  Будут найдены заметки по названию, содержимому и тегам
                </p>
              </div>
            ) : getTotalResults() === 0 ? (
              <div className="p-8 text-center">
                <Search className={`w-12 h-12 mx-auto mb-3 ${themeClasses.colors.text.tertiary}`} />
                <p className={`${themeClasses.colors.text.secondary} font-medium`}>
                  Ничего не найдено
                </p>
                <p className={`text-sm ${themeClasses.colors.text.tertiary} mt-1`}>
                  Попробуйте изменить поисковый запрос
                </p>
              </div>
            ) : (
              <div>
                {groupedResults.exactMatches.length > 0 && (
                  <div className="mb-4">
                    <h4 className={`text-xs font-medium ${themeClasses.colors.text.tertiary} px-4 pt-3 pb-2 uppercase tracking-wider flex items-center gap-2`}>
                      <Star className="w-3 h-3" />
                      Точные совпадения
                    </h4>
                    {groupedResults.exactMatches.map(note => (
                      <SearchResultItem
                        key={note.id}
                        note={note}
                        query={searchQuery}
                        onSelect={() => {
                          onNoteSelect(note);
                          onClose();
                        }}
                        highlightText={highlightText}
                        themeClasses={themeClasses}
                      />
                    ))}
                  </div>
                )}

                {groupedResults.titleMatches.length > 0 && (
                  <div className="mb-4">
                    <h4 className={`text-xs font-medium ${themeClasses.colors.text.tertiary} px-4 pt-3 pb-2 uppercase tracking-wider`}>
                      В названиях
                    </h4>
                    {groupedResults.titleMatches.map(note => (
                      <SearchResultItem
                        key={note.id}
                        note={note}
                        query={searchQuery}
                        onSelect={() => {
                          onNoteSelect(note);
                          onClose();
                        }}
                        highlightText={highlightText}
                        themeClasses={themeClasses}
                      />
                    ))}
                  </div>
                )}

                {groupedResults.contentMatches.length > 0 && (
                  <div className="mb-4">
                    <h4 className={`text-xs font-medium ${themeClasses.colors.text.tertiary} px-4 pt-3 pb-2 uppercase tracking-wider`}>
                      В содержимом
                    </h4>
                    {groupedResults.contentMatches.slice(0, 10).map(note => (
                      <SearchResultItem
                        key={note.id}
                        note={note}
                        query={searchQuery}
                        onSelect={() => {
                          onNoteSelect(note);
                          onClose();
                        }}
                        highlightText={highlightText}
                        themeClasses={themeClasses}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Вкладка Теги */}
        {activeTab === 'tags' && (
          <div className="p-4">
            {filteredTags.length === 0 ? (
              <div className="text-center py-8">
                <Tag className={`w-12 h-12 mx-auto mb-3 ${themeClasses.colors.text.tertiary}`} />
                <p className={`${themeClasses.colors.text.secondary}`}>
                  {searchQuery ? 'Теги не найдены' : 'Нет тегов'}
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filteredTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      onTagToggle(tag);
                      onSearchChange(searchQuery ? searchQuery : tag);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-indigo-500 text-white shadow-md'
                        : `${themeClasses.colors.bg.secondary} ${themeClasses.colors.text.secondary} hover:${themeClasses.colors.bg.tertiary}`
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5" />
                      {highlightText(tag, searchQuery)}
                      {selectedTags.includes(tag) && (
                        <X className="w-3 h-3 ml-1" />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Вкладка Группы */}
        {activeTab === 'groups' && (
          <div className="p-4">
            {filteredGroups.length === 0 ? (
              <div className="text-center py-8">
                <Folder className={`w-12 h-12 mx-auto mb-3 ${themeClasses.colors.text.tertiary}`} />
                <p className={`${themeClasses.colors.text.secondary}`}>
                  {searchQuery ? 'Группы не найдены' : 'Нет групп'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredGroups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => {
                      onSearchChange(`group:${group.name}`);
                      setActiveTab('notes');
                    }}
                    className={`w-full px-4 py-3 rounded-lg transition-all text-left flex items-center justify-between ${
                      themeClasses.colors.bg.secondary
                    } hover:${themeClasses.colors.bg.tertiary}`}
                  >
                    <div className="flex items-center gap-3">
                      <Folder className="w-4 h-4 text-indigo-500" />
                      <span className={themeClasses.colors.text.primary}>
                        {highlightText(group.name, searchQuery)}
                      </span>
                      <span className={`text-xs ${themeClasses.colors.text.tertiary}`}>
                        {group.note_count || 0} заметок
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${themeClasses.colors.text.tertiary}`} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Компонент для отображения результата поиска
const SearchResultItem = ({ note, query, onSelect, highlightText, themeClasses }) => {
  const getPreview = (text, query) => {
    if (!text) return '';
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text.slice(0, 60);
    
    const start = Math.max(0, index - 30);
    const end = Math.min(text.length, index + query.length + 30);
    let preview = text.slice(start, end);
    
    if (start > 0) preview = '...' + preview;
    if (end < text.length) preview = preview + '...';
    
    return preview;
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full px-4 py-3 flex items-start gap-3 hover:${themeClasses.colors.bg.secondary} transition-colors text-left border-b border-gray-100 dark:border-gray-800 last:border-0`}
    >
      <div className="mt-0.5">
        {note.isFavorite ? (
          <Star className="w-4 h-4 text-yellow-500 fill-current" />
        ) : (
          <div className="w-4 h-4 rounded-full bg-linear-to-r from-indigo-500 to-purple-500 opacity-60" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${themeClasses.colors.text.primary} mb-1`}>
          {highlightText(note.title, query)}
        </div>
        {note.text && (
          <div className={`text-xs ${themeClasses.colors.text.tertiary} line-clamp-1`}>
            {highlightText(getPreview(note.text, query), query)}
          </div>
        )}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {note.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <ChevronRight className={`w-4 h-4 ${themeClasses.colors.text.tertiary} shrink-0`} />
    </button>
  );
};

export default SmartSearchDropdown;