import React, { createContext, useState, useContext, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved || 'light';
    });
    const [viewMode, setViewMode] = useState(() => {
        const saved = localStorage.getItem('viewMode');
        return saved || 'split';
    });
    
    const [autoSave, setAutoSave] = useState(() => {
        const saved = localStorage.getItem('autoSave');
        return saved ? JSON.parse(saved) : true;
    });
    
    const [fontSize, setFontSize] = useState(() => {
        const saved = localStorage.getItem('fontSize');
        return saved || 'medium';
    });

    const [autoSaveInterval, setAutoSaveInterval] = useState(() => {
        const saved = localStorage.getItem('autoSaveInterval');
        return saved ? parseFloat(saved) : 1;
    });
    const [emailNotifications, setEmailNotifications] = useState(() => {
        const saved = localStorage.getItem('emailNotifications');
        return saved ? JSON.parse(saved) : true;
    });

    const [soundEffects, setSoundEffects] = useState(() => {
        const saved = localStorage.getItem('soundEffects');
        return saved ? JSON.parse(saved) : false;
    });
    const [analyticsEnabled, setAnalyticsEnabled] = useState(() => {
        const saved = localStorage.getItem('analyticsEnabled');
        return saved ? JSON.parse(saved) : true;
    });
    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('viewMode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        localStorage.setItem('autoSave', JSON.stringify(autoSave));
    }, [autoSave]);

    useEffect(() => {
        localStorage.setItem('fontSize', fontSize);
    }, [fontSize]);

    useEffect(() => {
        localStorage.setItem('autoSaveInterval', autoSaveInterval.toString());
    }, [autoSaveInterval]);

    useEffect(() => {
        localStorage.setItem('emailNotifications', JSON.stringify(emailNotifications));
    }, [emailNotifications]);

    useEffect(() => {
        localStorage.setItem('soundEffects', JSON.stringify(soundEffects));
    }, [soundEffects]);

    useEffect(() => {
        localStorage.setItem('analyticsEnabled', JSON.stringify(analyticsEnabled));
    }, [analyticsEnabled]);
    const resetSettings = () => {
        setTheme('light');
        setViewMode('split');
        setAutoSave(true);
        setFontSize('medium');
        setAutoSaveInterval(1);
        setEmailNotifications(true);
        setSoundEffects(false);
        setAnalyticsEnabled(true);
    };
    const exportSettings = () => {
        return {
            theme,
            viewMode,
            autoSave,
            fontSize,
            autoSaveInterval,
            emailNotifications,
            soundEffects,
            analyticsEnabled
        };
    };
    const importSettings = (settings) => {
        if (settings.theme) setTheme(settings.theme);
        if (settings.viewMode) setViewMode(settings.viewMode);
        if (settings.autoSave !== undefined) setAutoSave(settings.autoSave);
        if (settings.fontSize) setFontSize(settings.fontSize);
        if (settings.autoSaveInterval) setAutoSaveInterval(settings.autoSaveInterval);
        if (settings.emailNotifications !== undefined) setEmailNotifications(settings.emailNotifications);
        if (settings.soundEffects !== undefined) setSoundEffects(settings.soundEffects);
        if (settings.analyticsEnabled !== undefined) setAnalyticsEnabled(settings.analyticsEnabled);
    };

    const value = {
        theme,
        setTheme,
        viewMode,
        setViewMode,
        autoSave,
        setAutoSave,
        fontSize,
        setFontSize,
        autoSaveInterval,
        setAutoSaveInterval,
        emailNotifications,
        setEmailNotifications,
        soundEffects,
        setSoundEffects,
        analyticsEnabled,
        setAnalyticsEnabled,
        resetSettings,
        exportSettings,
        importSettings
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};