export const QUERY_KEYS = {
  notes: {
    all: ['notes'],
    lists: () => [...QUERY_KEYS.notes.all, 'list'],
    list: (filters) => [...QUERY_KEYS.notes.lists(), { filters }],
    details: () => [...QUERY_KEYS.notes.all, 'detail'],
    detail: (id) => [...QUERY_KEYS.notes.details(), id],
    trash: ['notes', 'trash'],
    search: (query) => ['notes', 'search', query],
    byGroup: (groupId) => ['notes', 'byGroup', groupId],
  },
  groups: {
    all: ['groups'],
    lists: () => [...QUERY_KEYS.groups.all, 'list'],
    list: (filters) => [...QUERY_KEYS.groups.lists(), { filters }],
    withNotes: ['groups', 'withNotes'], // ДОБАВЛЕНО
  },
  tags: {
    all: ['tags'],
    lists: () => [...QUERY_KEYS.tags.all, 'list'],
    list: (filters) => [...QUERY_KEYS.tags.lists(), { filters }],
    popular: (limit) => ['tags', 'popular', limit],
  }
};