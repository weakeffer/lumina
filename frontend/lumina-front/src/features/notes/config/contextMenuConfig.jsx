import {
  Star,
  Trash2,
  Folder,
  Edit2,
  Copy,
  Scissors,
  Clipboard,
  Link,
  Tag,
  Archive,
  Download,
  Plus,
  Settings,
  X,
  Move,
  Globe,
  List,
  Grid,
  CheckSquare,
  Bold,
  Italic,
  ArrowUpDown
} from 'lucide-react';

// Меню для заметки
export const getNoteMenuItems = ({
  note,
  isFavorite,
  onToggleFavorite,
  onEdit,
  onDelete,
  onMoveToGroup,
  onAddTag,
  onDuplicate,
  onCopyLink,
  onArchive,
  groups = [],
  tags = []
}) => {
  const groupsList = groups.map(group => ({
    label: group.name,
    icon: Folder,
    onClick: () => onMoveToGroup?.(note.id, group.id)
  }));

  const tagsList = tags.map(tag => ({
    label: tag.name,
    icon: Tag,
    onClick: () => onAddTag?.(note.id, tag.id)
  }));

  return [
    {
      label: 'Редактировать',
      icon: Edit2,
      onClick: onEdit,
      shortcut: 'Enter'
    },
    {
      label: isFavorite ? 'Убрать из избранного' : 'В избранное',
      icon: Star,
      onClick: () => onToggleFavorite?.(note.id),
      shortcut: 'Ctrl+F'
    },
    {
      type: 'divider'
    },
    {
      label: 'Переместить в группу',
      icon: Folder,
      type: 'submenu',
      children: [
        ...groupsList,
        {
          label: 'Без группы',
          icon: X,
          onClick: () => onMoveToGroup?.(note.id, null)
        }
      ]
    },
    {
      label: 'Добавить тег',
      icon: Tag,
      type: 'submenu',
      children: tagsList,
      disabled: tagsList.length === 0
    },
    {
      type: 'divider'
    },
    {
      label: 'Копировать ссылку',
      icon: Link,
      onClick: onCopyLink,
      shortcut: 'Ctrl+C'
    },
    {
      label: 'Дублировать',
      icon: Copy,
      onClick: onDuplicate,
      shortcut: 'Ctrl+D'
    },
    {
      type: 'divider'
    },
    {
      label: 'Архивировать',
      icon: Archive,
      onClick: onArchive
    },
    {
      label: 'Удалить',
      icon: Trash2,
      onClick: onDelete,
      danger: true,
      shortcut: 'Del'
    }
  ];
};

// Меню для группы - ЭТА ФУНКЦИЯ ДОЛЖНА БЫТЬ ЭКСПОРТИРОВАНА
export const getGroupMenuItems = ({
  group,
  onRename,
  onChangeColor,
  onCreateNoteInGroup,
  onDelete,
  onMoveNotes
}) => {
  const colors = [
    { label: 'Синий', value: 'blue' },
    { label: 'Зеленый', value: 'green' },
    { label: 'Желтый', value: 'yellow' },
    { label: 'Красный', value: 'red' },
    { label: 'Фиолетовый', value: 'purple' },
    { label: 'Серый', value: 'gray' }
  ];

  return [
    {
      label: 'Переименовать',
      icon: Edit2,
      onClick: onRename
    },
    {
      label: 'Изменить цвет',
      icon: Settings,
      type: 'submenu',
      children: colors.map(color => ({
        label: color.label,
        onClick: () => onChangeColor?.(group.id, color.value)
      }))
    },
    {
      type: 'divider'
    },
    {
      label: 'Создать заметку',
      icon: Plus,
      onClick: () => onCreateNoteInGroup?.(group.id)
    },
    {
      label: 'Переместить заметки сюда',
      icon: Move,
      onClick: onMoveNotes
    },
    {
      type: 'divider'
    },
    {
      label: 'Удалить группу',
      icon: Trash2,
      onClick: onDelete,
      danger: true
    }
  ];
};

// Меню для пустого места
export const getEmptyMenuItems = ({
  onCreateNote,
  onCreateGroup,
  onImport,
  onSync,
  onToggleViewMode,
  currentViewMode,
  onSortBy
}) => {
  return [
    {
      label: 'Создать заметку',
      icon: Plus,
      onClick: onCreateNote,
      shortcut: 'Ctrl+N'
    },
    {
      label: 'Создать группу',
      icon: Folder,
      onClick: onCreateGroup
    },
    {
      type: 'divider'
    },
    {
      label: 'Вид',
      icon: currentViewMode === 'grid' ? Grid : List,
      type: 'submenu',
      children: [
        {
          label: 'Сетка',
          icon: Grid,
          onClick: () => onToggleViewMode?.('grid')
        },
        {
          label: 'Список',
          icon: List,
          onClick: () => onToggleViewMode?.('list')
        }
      ]
    },
    {
      label: 'Сортировка',
      icon: ArrowUpDown,
      type: 'submenu',
      children: [
        { label: 'По дате', onClick: () => onSortBy?.('date') },
        { label: 'По названию', onClick: () => onSortBy?.('title') },
        { label: 'По группе', onClick: () => onSortBy?.('group') }
      ]
    },
    {
      type: 'divider'
    },
    {
      label: 'Импорт',
      icon: Download,
      onClick: onImport
    },
    {
      label: 'Синхронизировать',
      icon: Globe,
      onClick: onSync
    }
  ];
};

// Меню для текста
export const getTextMenuItems = ({
  onCopy,
  onCut,
  onPaste,
  onBold,
  onItalic,
  onLink
}) => {
  return [
    {
      label: 'Копировать',
      icon: Copy,
      onClick: onCopy,
      shortcut: 'Ctrl+C'
    },
    {
      label: 'Вырезать',
      icon: Scissors,
      onClick: onCut,
      shortcut: 'Ctrl+X'
    },
    {
      label: 'Вставить',
      icon: Clipboard,
      onClick: onPaste,
      shortcut: 'Ctrl+V'
    },
    {
      type: 'divider'
    },
    {
      label: 'Жирный',
      icon: Bold,
      onClick: onBold,
      shortcut: 'Ctrl+B'
    },
    {
      label: 'Курсив',
      icon: Italic,
      onClick: onItalic,
      shortcut: 'Ctrl+I'
    },
    {
      label: 'Ссылка',
      icon: Link,
      onClick: onLink,
      shortcut: 'Ctrl+K'
    }
  ];
};

// Меню для нескольких заметок
export const getBulkMenuItems = ({
  selectedCount,
  onDeleteSelected,
  onMoveSelectedToGroup,
  onFavoriteSelected,
  onArchiveSelected,
  groups = []
}) => {
  const groupsList = groups.map(group => ({
    label: group.name,
    icon: Folder,
    onClick: () => onMoveSelectedToGroup?.(group.id)
  }));

  return [
    {
      label: `Выбрано заметок: ${selectedCount}`,
      icon: CheckSquare,
      disabled: true
    },
    {
      type: 'divider'
    },
    {
      label: 'В избранное',
      icon: Star,
      onClick: onFavoriteSelected
    },
    {
      label: 'Переместить в группу',
      icon: Folder,
      type: 'submenu',
      children: [
        ...groupsList,
        {
          label: 'Без группы',
          icon: X,
          onClick: () => onMoveSelectedToGroup?.(null)
        }
      ]
    },
    {
      type: 'divider'
    },
    {
      label: 'Архивировать',
      icon: Archive,
      onClick: onArchiveSelected
    },
    {
      label: 'Удалить',
      icon: Trash2,
      onClick: onDeleteSelected,
      danger: true
    }
  ];
};