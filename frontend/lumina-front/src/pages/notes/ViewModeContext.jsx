import React, { createContext, useContext, useState, useEffect } from 'react';
import { VIEW_MODES } from '../../features/notes/components/Profile/ProfileConstants';

const ViewModeContext = createContext();

export const ViewModeProvider = ({ children }) => {
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('viewMode');
    return saved && Object.values(VIEW_MODES).includes(saved) 
      ? saved 
      : VIEW_MODES.SIDEBAR;
  });

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  const changeViewMode = (mode) => {
    if (Object.values(VIEW_MODES).includes(mode)) {
      setViewMode(mode);
    }
  };

  return (
    <ViewModeContext.Provider value={{ viewMode, changeViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
};

export const useViewMode = () => {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error('useViewMode must be used within ViewModeProvider');
  }
  return context;
};