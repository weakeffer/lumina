import React, { useState, useRef, useEffect } from 'react';
import { useViewMode } from './ViewModeContext';
import { VIEW_MODES } from '../../features/notes/components/Profile/ProfileConstants';

const STORAGE_KEY = 'app_sidebar_width';
const AUTO_COLLAPSE_THRESHOLD = 200; // Порог для автоматического сворачивания

const ResizableSidebarLayout = ({
  sidebar,
  children,
  rightPanel,
  min = 240, // Минимальная ширина до сворачивания
  max = 520,
  collapsedWidth = 72,
  defaultWidth = 320,
  isMobile = false,
  sidebarCollapsed: externalCollapsed,
  onToggleCollapse
}) => {
  const { viewMode } = useViewMode();
  const saved = parseInt(localStorage.getItem(STORAGE_KEY));
  const [width, setWidth] = useState(saved || defaultWidth);
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [resizing, setResizing] = useState(false);

  const startX = useRef(0);
  const startWidth = useRef(0);
  const prevWidth = useRef(width);

  console.log('🔄 ResizableSidebarLayout render:', {
    viewMode,
    hasSidebar: !!sidebar,
    externalCollapsed,
    internalCollapsed,
    collapsed: internalCollapsed,
    width,
    resizing
  });

  const hasSidebar = sidebar && viewMode === VIEW_MODES.SIDEBAR;

  const onMouseDown = (e) => {
    console.log('🐭 Mouse down on resize handle', {
      hasSidebar,
      collapsed: internalCollapsed,
      currentWidth: width
    });
    
    if (!hasSidebar) {
      console.log('⛔ Resize blocked: no sidebar');
      return;
    }
    
    setResizing(true);
    startX.current = e.clientX;
    
    // Если сайдбар свернут, используем предыдущую ширину для ресайза
    if (internalCollapsed) {
      console.log('↩️ Expanding collapsed sidebar for resize');
      startWidth.current = prevWidth.current;
      setInternalCollapsed(false);
      if (onToggleCollapse) {
        onToggleCollapse(false);
      }
    } else {
      startWidth.current = width;
    }
    
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  const toggleCollapse = () => {
    console.log('🔘 toggleCollapse called', { 
      currentCollapsed: internalCollapsed,
      externalCollapsed,
      currentWidth: width,
      prevWidth: prevWidth.current
    });

    const newCollapsedState = !internalCollapsed;
    
    if (newCollapsedState) {
      // Сворачиваем
      console.log('⬅️ Collapsing from width:', width);
      prevWidth.current = width;
      setInternalCollapsed(true);
    } else {
      // Разворачиваем
      console.log('➡️ Expanding to width:', prevWidth.current);
      setWidth(prevWidth.current);
      setInternalCollapsed(false);
      localStorage.setItem(STORAGE_KEY, prevWidth.current);
    }
    
    // Уведомляем родителя об изменении
    if (onToggleCollapse) {
      onToggleCollapse(newCollapsedState);
    }
  };

  useEffect(() => {
    console.log('📏 Setting up resize listeners, resizing:', resizing);

    const onMove = (e) => {
      if (!resizing || !hasSidebar) {
        console.log('⏭️ onMove skipped:', { resizing, hasSidebar });
        return;
      }

      const dx = e.clientX - startX.current;
      let newWidth = startWidth.current + dx;
      
      // Если ширина становится меньше порога автосворачивания
      if (newWidth <= AUTO_COLLAPSE_THRESHOLD && !internalCollapsed) {
        console.log('🎯 AUTO-COLLAPSE triggered at width:', newWidth);
        prevWidth.current = min;
        setInternalCollapsed(true);
        setResizing(false);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        
        if (onToggleCollapse) {
          onToggleCollapse(true);
        }
        return;
      }
      
      // Ограничиваем ширину только если не свернуто
      if (!internalCollapsed) {
        newWidth = Math.max(min, Math.min(max, newWidth));
        console.log('📐 Resizing:', { newWidth, dx, startWidth: startWidth.current });
        setWidth(newWidth);
        localStorage.setItem(STORAGE_KEY, newWidth);
      }
    };

    const onUp = () => {
      console.log('🖱️ Mouse up, stopping resize');
      setResizing(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    if (resizing) {
      console.log('➕ Adding resize listeners');
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }

    return () => {
      if (resizing) {
        console.log('➖ Removing resize listeners');
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      }
    };
  }, [resizing, min, max, hasSidebar, internalCollapsed, onToggleCollapse]);

  // Синхронизация с externalCollapsed
  useEffect(() => {
    console.log('🔄 Syncing with externalCollapsed:', {
      externalCollapsed,
      internalCollapsed,
      width,
      prevWidth: prevWidth.current
    });

    if (externalCollapsed !== undefined && externalCollapsed !== internalCollapsed) {
      if (externalCollapsed) {
        // Внешнее сворачивание
        prevWidth.current = width;
        setInternalCollapsed(true);
      } else {
        // Внешнее разворачивание
        setWidth(prevWidth.current);
        setInternalCollapsed(false);
      }
    }
  }, [externalCollapsed]);

  const effectiveWidth = internalCollapsed ? collapsedWidth : width;
  
  const sidebarWithProps = hasSidebar && React.isValidElement(sidebar) 
    ? React.cloneElement(sidebar, { 
        collapsed: internalCollapsed, 
        onToggleCollapse: toggleCollapse 
      })
    : null;

  if (isMobile) {
    return (
      <div className="flex flex-1 min-h-0">
        {hasSidebar && sidebarWithProps}
        <main className="flex-1 min-w-0 overflow-hidden">
          {children}
        </main>
        {rightPanel && (
          <div className="h-full shrink-0">
            {rightPanel}
          </div>
        )}
      </div>
    );
  }

  if (!hasSidebar) {
    return (
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <main className="flex-1 min-w-0 overflow-hidden">
          {children}
        </main>
        {rightPanel && (
          <div className="h-full shrink-0">
            {rightPanel}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <div
        style={{ width: effectiveWidth }}
        className="h-full shrink-0 relative flex"
      >
        {sidebarWithProps}
        
        {/* Ручка для ресайза - всегда доступна */}
        <div
          onMouseDown={onMouseDown}
          className="absolute top-0 right-0 w-4 h-full cursor-col-resize group z-50"
        >
          <div className={`
            absolute inset-y-0 left-1/2 -translate-x-1/2 w-1
            bg-gray-400 opacity-0 group-hover:opacity-50
            ${resizing ? 'opacity-100 bg-indigo-500 w-1.5' : ''}
            transition-all
          `}/>
        </div>

        {/* Индикатор для свернутого состояния */}
        {internalCollapsed && (
          <div className="absolute inset-y-0 left-0 w-1 bg-indigo-500/30" />
        )}
      </div>

      <main className="flex-1 min-w-0 overflow-hidden">
        {children}
      </main>

      {rightPanel && (
        <div className="h-full shrink-0">
          {rightPanel}
        </div>
      )}
    </div>
  );
};

export default ResizableSidebarLayout;