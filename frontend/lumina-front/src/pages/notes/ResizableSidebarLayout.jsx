import React, { useState, useRef, useEffect } from 'react';

const STORAGE_KEY = 'app_sidebar_width';

const ResizableSidebarLayout = ({
  sidebar,
  children,
  rightPanel,
  min = 240,
  max = 520,
  collapsedWidth = 72,
  defaultWidth = 320,
  isMobile = false,
  onToggleCollapse
}) => {
  const saved = parseInt(localStorage.getItem(STORAGE_KEY));
  const [width, setWidth] = useState(saved || defaultWidth);
  const [collapsed, setCollapsed] = useState(false);
  const [resizing, setResizing] = useState(false);

  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = (e) => {
    setResizing(true);
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.userSelect = 'none';
  };
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!resizing) return;

      const dx = e.clientX - startX.current;
      let newWidth = startWidth.current + dx;

      newWidth = Math.max(min, Math.min(max, newWidth));

      setWidth(newWidth);
      localStorage.setItem(STORAGE_KEY, newWidth);
    };

    const onUp = () => {
      setResizing(false);
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [resizing, min, max]);

  const effectiveWidth = collapsed ? collapsedWidth : width;
  const sidebarWithProps = React.isValidElement(sidebar) 
    ? React.cloneElement(sidebar, { 
        collapsed, 
        onToggleCollapse: toggleCollapse 
      })
    : sidebar;

  if (isMobile) {
    return (
      <div className="flex flex-1 min-h-0">
        {sidebarWithProps}
        <main className="flex-1 min-w-0 overflow-hidden">
          {children}
        </main>
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
        {!collapsed && (
          <div
            onMouseDown={onMouseDown}
            className="absolute top-0 right-0 w-2 h-full cursor-col-resize group z-50"
          >
            <div className={`
              absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5
              bg-gray-400 opacity-0 group-hover:opacity-100
              ${resizing ? 'opacity-100 bg-indigo-500 w-1' : ''}
              transition
            `}/>
          </div>
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