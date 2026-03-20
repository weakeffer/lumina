import { 
  Sun, Moon, Coffee, Feather, BookOpen, Layout, Grid, List 
} from 'lucide-react';

export const THEMES = [
  { id: 'light', icon: Sun, name: 'Светлая' },
  { id: 'dark', icon: Moon, name: 'Тёмная' },
  { id: 'sepia', icon: Coffee, name: 'Сепия' },
  { id: 'ocean', icon: Feather, name: 'Океан' },
  { id: 'forest', icon: BookOpen, name: 'Лес' }
];

export const AUTO_SAVE_OPTIONS = [
  { value: 0.5, label: 'Каждые 30 секунд' },
  { value: 1, label: 'Каждую минуту' },
  { value: 2, label: 'Каждые 2 минуты' },
  { value: 5, label: 'Каждые 5 минут' }
];

export const TABS = [
  { id: 'profile', icon: 'User', label: 'Профиль' },
  { id: 'stats', icon: 'TrendingUp', label: 'Статистика' },
  { id: 'settings', icon: 'Settings', label: 'Настройки' }
];

export const VIEW_MODES = {
  SIDEBAR: 'sidebar',
  GRID: 'grid',
  LIST: 'list',
  COMPACT: 'compact' // Добавлен компактный режим
};

export const VIEW_MODE_LABELS = {
  [VIEW_MODES.SIDEBAR]: 'Сайдбар',
  [VIEW_MODES.GRID]: 'Сетка',
  [VIEW_MODES.LIST]: 'Список',
  [VIEW_MODES.COMPACT]: 'Компактный' // Добавлена метка
};

export const VIEW_MODE_ICONS = {
  [VIEW_MODES.SIDEBAR]: Layout,
  [VIEW_MODES.GRID]: Grid,
  [VIEW_MODES.LIST]: List
};