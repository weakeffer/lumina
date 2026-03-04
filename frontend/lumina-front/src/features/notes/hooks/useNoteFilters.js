import { useState, useMemo, useCallback } from 'react';
import { useDebounce } from '../../../shared/hooks/useDebounce';

const initialFilters = {
  searchQuery: '',
  selectedGroup: null,
  selectedTags: [],
  favoriteOnly: false,
  dateRange: { from: null, to: null },
  sortBy: 'updated_at',
  sortOrder: 'desc',
  showArchived: false,
};

export const useNoteFilters = () => {
  const [filters, setFilters] = useState(() => {
    const savedSortBy = localStorage.getItem('sortBy');
    const savedSortOrder = localStorage.getItem('sortOrder');
    
    return {
      ...initialFilters,
      sortBy: savedSortBy || initialFilters.sortBy,
      sortOrder: savedSortOrder || initialFilters.sortOrder,
    };
  });

  const debouncedSearchQuery = useDebounce(filters.searchQuery, 300);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };

      if (key === 'sortBy') {
        localStorage.setItem('sortBy', value);
      }
      if (key === 'sortOrder') {
        localStorage.setItem('sortOrder', value);
      }
      
      return newFilters;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };

      if (newFilters.sortBy) {
        localStorage.setItem('sortBy', newFilters.sortBy);
      }
      if (newFilters.sortOrder) {
        localStorage.setItem('sortOrder', newFilters.sortOrder);
      }
      
      return updated;
    });
  }, []);

  const toggleTag = useCallback((tag) => {
    setFilters(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag]
    }));
  }, []);


  const clearTags = useCallback(() => {
    setFilters(prev => ({ ...prev, selectedTags: [] }));
  }, []);

  const setDateRange = useCallback((from, to) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { from, to }
    }));
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.selectedGroup) count++;
    if (filters.selectedTags.length > 0) count++;
    if (filters.favoriteOnly) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.showArchived) count++;
    return count;
  }, [filters]);

  const apiFilters = useMemo(() => ({
    search: debouncedSearchQuery || undefined,
    group: filters.selectedGroup,
    tags: filters.selectedTags,
    favorite: filters.favoriteOnly ? 'true' : undefined,
    ordering: `${filters.sortOrder === 'desc' ? '-' : ''}${filters.sortBy}`,
    archived: filters.showArchived ? 'true' : undefined,
    date_after: filters.dateRange.from,
    date_before: filters.dateRange.to,
  }), [debouncedSearchQuery, filters]);

  const filterAndSortNotes = useCallback((notes) => {
    if (!notes) return [];

    let filtered = [...notes];

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(note => 
        note.title?.toLowerCase().includes(query) ||
        note.text?.toLowerCase().includes(query)
      );
    }

    if (filters.selectedGroup) {
      if (filters.selectedGroup === 'favorites') {
        filtered = filtered.filter(note => note.isFavorite);
      } else {
        filtered = filtered.filter(note => 
          String(note.group) === String(filters.selectedGroup)
        );
      }
    }

    if (filters.selectedTags.length > 0) {
      filtered = filtered.filter(note =>
        filters.selectedTags.every(tag => note.tags?.includes(tag))
      );
    }

    if (filters.favoriteOnly) {
      filtered = filtered.filter(note => note.isFavorite);
    }

    if (filters.dateRange.from) {
      const fromDate = new Date(filters.dateRange.from).getTime();
      filtered = filtered.filter(note => 
        new Date(note.created_at).getTime() >= fromDate
      );
    }
    if (filters.dateRange.to) {
      const toDate = new Date(filters.dateRange.to).getTime();
      filtered = filtered.filter(note => 
        new Date(note.created_at).getTime() <= toDate
      );
    }

    filtered.sort((a, b) => {
      let aVal = a[filters.sortBy];
      let bVal = b[filters.sortBy];
      
      if (filters.sortBy === 'favorites') {
        aVal = a.isFavorite ? 1 : 0;
        bVal = b.isFavorite ? 1 : 0;
      }
      
      if (filters.sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    return filtered;
  }, [filters]);

  return {
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
    toggleTag,
    clearTags,
    setDateRange,
    activeFiltersCount,
    apiFilters,
    filterAndSortNotes,
    debouncedSearchQuery,
  };
};