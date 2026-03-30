import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Eye,
  Download,
  Share2,
  Plus,
  Settings,
  Pin,
  Heart,
  X,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ContextMenu = ({
  x,
  y,
  items,
  onClose,
  contextType = 'default'
}) => {
  const { themeClasses } = useTheme();
  const menuRef = useRef(null);
  const [position, setPosition] = React.useState({ x, y });

  // Адаптация позиции, чтобы меню не выходило за пределы экрана
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = x;
      let newY = y;

      if (x + rect.width > viewportWidth) {
        newX = viewportWidth - rect.width - 10;
      }
      if (y + rect.height > viewportHeight) {
        newY = viewportHeight - rect.height - 10;
      }

      setPosition({ x: newX, y: newY });
    }
  }, [x, y]);

  // Закрытие при клике вне меню
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const renderMenuItem = (item, index) => {
    if (item.type === 'divider') {
      return (
        <div
          key={index}
          className={`my-1 border-t ${themeClasses.colors.border.primary}`}
        />
      );
    }

    if (item.type === 'submenu') {
      return (
        <SubMenuItem
          key={index}
          item={item}
          themeClasses={themeClasses}
          onClose={onClose}
        />
      );
    }

    return (
      <button
        key={index}
        onClick={(e) => {
          e.stopPropagation();
          if (item.onClick) {
            item.onClick();
          }
          onClose();
        }}
        className={`
          w-full flex items-center gap-3 px-4 py-2 text-sm
          hover:bg-gray-100 dark:hover:bg-gray-800
          transition-colors duration-150
          ${item.danger ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : ''}
          ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        disabled={item.disabled}
      >
        {item.icon && (
          <item.icon className={`w-4 h-4 ${item.danger ? 'text-red-500' : ''}`} />
        )}
        <span className="flex-1 text-left">{item.label}</span>
        {item.shortcut && (
          <span className="text-xs text-gray-400">{item.shortcut}</span>
        )}
      </button>
    );
  };

  const SubMenuItem = ({ item, themeClasses, onClose }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const submenuRef = useRef(null);
    const buttonRef = useRef(null);
    const [subPosition, setSubPosition] = React.useState({ x: 0, y: 0 });

    const handleMouseEnter = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setSubPosition({
          x: rect.right,
          y: rect.top
        });
        setIsOpen(true);
      }
    };

    const handleMouseLeave = () => {
      setTimeout(() => {
        if (!submenuRef.current?.matches(':hover')) {
          setIsOpen(false);
        }
      }, 100);
    };

    return (
      <div
        ref={buttonRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative"
      >
        <button
          className={`
            w-full flex items-center gap-3 px-4 py-2 text-sm
            hover:bg-gray-100 dark:hover:bg-gray-800
            transition-colors duration-150
          `}
        >
          {item.icon && <item.icon className="w-4 h-4" />}
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronRight className="w-3 h-3 text-gray-400" />
        </button>

        {isOpen && (
          <div
            ref={submenuRef}
            className="fixed z-250"
            style={{
              left: subPosition.x,
              top: subPosition.y,
              minWidth: '200px'
            }}
          >
            <div className={`
              rounded-lg shadow-lg py-1
              ${themeClasses.colors.bg.primary}
              border ${themeClasses.colors.border.primary}
            `}>
              {item.children.map((child, idx) => renderMenuItem(child, idx))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-250"
      style={{
        left: position.x,
        top: position.y,
        minWidth: '220px'
      }}
    >
      <div className={`
        rounded-lg shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100
        ${themeClasses.colors.bg.primary}
        border ${themeClasses.colors.border.primary}
      `}>
        {items.map((item, index) => renderMenuItem(item, index))}
      </div>
    </div>,
    document.body
  );
};

export default ContextMenu;