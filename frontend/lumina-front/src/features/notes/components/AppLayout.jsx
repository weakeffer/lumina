import React from 'react';
import { useTheme } from '../../../shared/context/ThemeContext';
import { useViewMode } from '../../../shared/context/ViewModeContext';
import ResizableSidebarLayout from './ResizableSidebarLayout';
import ParticleBackground from "../../../shared/ui/ParticleBackground";
import { VIEW_MODES } from "../../profile/constants";

const AppLayout = ({
  children,
  sidebar,
  header,
  footer,
  rightPanel,
  sidebarCollapsed,
  isMobile
}) => {
  const { themeClasses } = useTheme();
  const { viewMode } = useViewMode();
  
  const isSidebarMode = viewMode === VIEW_MODES.SIDEBAR;
  const actualSidebar = isSidebarMode ? sidebar : null;

  return (
    <div className="h-screen flex flex-col overflow-hidden relative">
      <ParticleBackground />
      <div className={`
        relative z-10 flex flex-col h-full
        ${themeClasses.colors.bg.primary} bg-opacity-90 backdrop-blur-sm
        ${themeClasses.colors.text.primary}
      `}>
        {header && <div className="shrink-0">{header}</div>}

        <div className="flex-1 min-h-0 overflow-hidden">
          <ResizableSidebarLayout
            sidebar={actualSidebar}
            rightPanel={rightPanel}
            min={240}
            max={520}
            collapsedWidth={72}
            defaultWidth={320}
            isMobile={isMobile}
            sidebarCollapsed={sidebarCollapsed}
            onToggleCollapse={() => {
              // Пустой коллбэк, так как состояние управляется через props
            }}
          >
            {children}
          </ResizableSidebarLayout>
        </div>

        {footer && <div className="shrink-0">{footer}</div>}
      </div>
    </div>
  );
};

export default AppLayout;