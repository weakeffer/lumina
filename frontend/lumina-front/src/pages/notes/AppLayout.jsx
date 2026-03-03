import React from 'react';
import { useTheme } from './ThemeContext';
import ResizableSidebarLayout from './ResizableSidebarLayout';
import ParticleBackground from './ParticleBackground';

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
            sidebar={sidebar}
            rightPanel={rightPanel}
            collapsed={sidebarCollapsed}
            isMobile={isMobile}
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