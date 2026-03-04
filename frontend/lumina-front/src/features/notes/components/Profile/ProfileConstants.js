import { 
  Sun, Moon, Coffee, Feather, BookOpen 
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