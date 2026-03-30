// frontend/lumina-front/src/shared/lib/hooks/useContextMenu.js
import { useState, useCallback } from 'react';

export const useContextMenu = () => {
  const [menuState, setMenuState] = useState({
    visible: false,
    x: 0,
    y: 0,
    contextType: null,
    data: null
  });

  const showMenu = useCallback((e, contextType, data = null) => {
    e.preventDefault();
    e.stopPropagation();

    setMenuState({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      contextType,
      data
    });
  }, []);

  const hideMenu = useCallback(() => {
    setMenuState(prev => ({
      ...prev,
      visible: false
    }));
  }, []);

  return {
    menuState,
    showMenu,
    hideMenu
  };
};