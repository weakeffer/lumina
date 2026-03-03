import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const themes = {
    light: {
        id: 'light',
        name: 'Светлая',
        colors: {
            bg: {
                primary: 'bg-white',
                secondary: 'bg-gray-50',
                tertiary: 'bg-gray-100',
                hover: 'hover:bg-gray-100',
                active: 'bg-indigo-50'
            },
            text: {
                primary: 'text-gray-900',
                secondary: 'text-gray-600',
                tertiary: 'text-gray-400',
                inverse: 'text-white'
            },
            border: {
                primary: 'border-gray-200',
                secondary: 'border-gray-100',
                focus: 'focus:border-indigo-500'
            },
            accent: {
                primary: 'bg-indigo-500',
                secondary: 'bg-purple-500',
                hover: 'hover:bg-indigo-600',
                light: 'bg-indigo-100',
                text: 'text-indigo-600'
            },
            sidebar: {
                bg: 'bg-white',
                border: 'border-gray-200',
                hover: 'hover:bg-gray-100',
                active: 'bg-indigo-50'
            },
            editor: {
                bg: 'bg-white',
                text: 'text-gray-900',
                placeholder: 'placeholder-gray-400'
            },
            card: {
                bg: 'bg-white',
                hover: 'hover:shadow-xl',
                border: 'border-gray-200'
            },
            button: {
                primary: 'bg-indigo-500 hover:bg-indigo-600 text-white',
                secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
                danger: 'bg-red-500 hover:bg-red-600 text-white'
            },
            status: {
                success: 'text-green-600 bg-green-100',
                error: 'text-red-600 bg-red-100',
                warning: 'text-yellow-600 bg-yellow-100',
                info: 'text-blue-600 bg-blue-100'
            }
        },
        gradient: {
            primary: 'from-indigo-500 to-purple-500',
            secondary: 'from-gray-500 to-gray-600',
            accent: 'from-indigo-400 to-purple-400'
        },
        shadow: {
            sm: 'shadow-sm',
            md: 'shadow-md',
            lg: 'shadow-lg',
            xl: 'shadow-xl',
            accent: 'shadow-indigo-200'
        }
    },
    
    dark: {
        id: 'dark',
        name: 'Тёмная',
        colors: {
            bg: {
                primary: 'bg-gray-900',
                secondary: 'bg-gray-800',
                tertiary: 'bg-gray-700',
                hover: 'hover:bg-gray-700',
                active: 'bg-indigo-900/30'
            },
            text: {
                primary: 'text-gray-100',
                secondary: 'text-gray-300',
                tertiary: 'text-gray-500',
                inverse: 'text-gray-900'
            },
            border: {
                primary: 'border-gray-700',
                secondary: 'border-gray-800',
                focus: 'focus:border-indigo-400'
            },
            accent: {
                primary: 'bg-indigo-600',
                secondary: 'bg-purple-600',
                hover: 'hover:bg-indigo-700',
                light: 'bg-indigo-900/30',
                text: 'text-indigo-400'
            },
            sidebar: {
                bg: 'bg-gray-800',
                border: 'border-gray-700',
                hover: 'hover:bg-gray-700',
                active: 'bg-indigo-900/30'
            },
            editor: {
                bg: 'bg-gray-900',
                text: 'text-gray-100',
                placeholder: 'placeholder-gray-600'
            },
            card: {
                bg: 'bg-gray-800',
                hover: 'hover:shadow-2xl',
                border: 'border-gray-700'
            },
            button: {
                primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
                secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-200',
                danger: 'bg-red-600 hover:bg-red-700 text-white'
            },
            status: {
                success: 'text-green-400 bg-green-900/30',
                error: 'text-red-400 bg-red-900/30',
                warning: 'text-yellow-400 bg-yellow-900/30',
                info: 'text-blue-400 bg-blue-900/30'
            }
        },
        gradient: {
            primary: 'from-indigo-600 to-purple-600',
            secondary: 'from-gray-700 to-gray-800',
            accent: 'from-indigo-500 to-purple-500'
        },
        shadow: {
            sm: 'shadow-sm shadow-gray-900',
            md: 'shadow-md shadow-gray-900',
            lg: 'shadow-lg shadow-gray-900',
            xl: 'shadow-xl shadow-gray-900',
            accent: 'shadow-indigo-900/30'
        }
    },
    
    sepia: {
        id: 'sepia',
        name: 'Сепия',
        colors: {
            bg: {
                primary: 'bg-amber-50',
                secondary: 'bg-amber-100',
                tertiary: 'bg-amber-200',
                hover: 'hover:bg-amber-200',
                active: 'bg-amber-200'
            },
            text: {
                primary: 'text-amber-900',
                secondary: 'text-amber-800',
                tertiary: 'text-amber-600',
                inverse: 'text-amber-50'
            },
            border: {
                primary: 'border-amber-300',
                secondary: 'border-amber-200',
                focus: 'focus:border-amber-700'
            },
            accent: {
                primary: 'bg-amber-700',
                secondary: 'bg-amber-800',
                hover: 'hover:bg-amber-800',
                light: 'bg-amber-200',
                text: 'text-amber-800'
            },
            sidebar: {
                bg: 'bg-amber-100',
                border: 'border-amber-300',
                hover: 'hover:bg-amber-200',
                active: 'bg-amber-200'
            },
            editor: {
                bg: 'bg-amber-50',
                text: 'text-amber-900',
                placeholder: 'placeholder-amber-400'
            },
            card: {
                bg: 'bg-amber-100',
                hover: 'hover:shadow-xl',
                border: 'border-amber-300'
            },
            button: {
                primary: 'bg-amber-700 hover:bg-amber-800 text-amber-50',
                secondary: 'bg-amber-200 hover:bg-amber-300 text-amber-900',
                danger: 'bg-red-700 hover:bg-red-800 text-white'
            },
            status: {
                success: 'text-green-800 bg-green-200',
                error: 'text-red-800 bg-red-200',
                warning: 'text-yellow-800 bg-yellow-200',
                info: 'text-blue-800 bg-blue-200'
            }
        },
        gradient: {
            primary: 'from-amber-700 to-amber-800',
            secondary: 'from-amber-500 to-amber-600',
            accent: 'from-amber-600 to-amber-700'
        },
        shadow: {
            sm: 'shadow-sm shadow-amber-900/20',
            md: 'shadow-md shadow-amber-900/20',
            lg: 'shadow-lg shadow-amber-900/20',
            xl: 'shadow-xl shadow-amber-900/20',
            accent: 'shadow-amber-900/30'
        }
    },
    
    ocean: {
        id: 'ocean',
        name: 'Океан',
        colors: {
            bg: {
                primary: 'bg-blue-50',
                secondary: 'bg-blue-100',
                tertiary: 'bg-blue-200',
                hover: 'hover:bg-blue-200',
                active: 'bg-blue-200'
            },
            text: {
                primary: 'text-blue-900',
                secondary: 'text-blue-800',
                tertiary: 'text-blue-600',
                inverse: 'text-white'
            },
            border: {
                primary: 'border-blue-300',
                secondary: 'border-blue-200',
                focus: 'focus:border-blue-600'
            },
            accent: {
                primary: 'bg-blue-600',
                secondary: 'bg-cyan-600',
                hover: 'hover:bg-blue-700',
                light: 'bg-blue-200',
                text: 'text-blue-700'
            },
            sidebar: {
                bg: 'bg-blue-100',
                border: 'border-blue-300',
                hover: 'hover:bg-blue-200',
                active: 'bg-blue-200'
            },
            editor: {
                bg: 'bg-blue-50',
                text: 'text-blue-900',
                placeholder: 'placeholder-blue-400'
            },
            card: {
                bg: 'bg-blue-100',
                hover: 'hover:shadow-xl',
                border: 'border-blue-300'
            },
            button: {
                primary: 'bg-blue-600 hover:bg-blue-700 text-white',
                secondary: 'bg-blue-200 hover:bg-blue-300 text-blue-900',
                danger: 'bg-red-600 hover:bg-red-700 text-white'
            },
            status: {
                success: 'text-green-700 bg-green-200',
                error: 'text-red-700 bg-red-200',
                warning: 'text-yellow-700 bg-yellow-200',
                info: 'text-blue-700 bg-blue-200'
            }
        },
        gradient: {
            primary: 'from-blue-600 to-cyan-600',
            secondary: 'from-blue-400 to-cyan-400',
            accent: 'from-blue-500 to-cyan-500'
        },
        shadow: {
            sm: 'shadow-sm shadow-blue-900/20',
            md: 'shadow-md shadow-blue-900/20',
            lg: 'shadow-lg shadow-blue-900/20',
            xl: 'shadow-xl shadow-blue-900/20',
            accent: 'shadow-blue-600/30'
        }
    },
    
    forest: {
        id: 'forest',
        name: 'Лес',
        colors: {
            bg: {
                primary: 'bg-green-50',
                secondary: 'bg-green-100',
                tertiary: 'bg-green-200',
                hover: 'hover:bg-green-200',
                active: 'bg-green-200'
            },
            text: {
                primary: 'text-green-900',
                secondary: 'text-green-800',
                tertiary: 'text-green-600',
                inverse: 'text-white'
            },
            border: {
                primary: 'border-green-300',
                secondary: 'border-green-200',
                focus: 'focus:border-green-600'
            },
            accent: {
                primary: 'bg-green-600',
                secondary: 'bg-emerald-600',
                hover: 'hover:bg-green-700',
                light: 'bg-green-200',
                text: 'text-green-700'
            },
            sidebar: {
                bg: 'bg-green-100',
                border: 'border-green-300',
                hover: 'hover:bg-green-200',
                active: 'bg-green-200'
            },
            editor: {
                bg: 'bg-green-50',
                text: 'text-green-900',
                placeholder: 'placeholder-green-400'
            },
            card: {
                bg: 'bg-green-100',
                hover: 'hover:shadow-xl',
                border: 'border-green-300'
            },
            button: {
                primary: 'bg-green-600 hover:bg-green-700 text-white',
                secondary: 'bg-green-200 hover:bg-green-300 text-green-900',
                danger: 'bg-red-600 hover:bg-red-700 text-white'
            },
            status: {
                success: 'text-emerald-700 bg-emerald-200',
                error: 'text-red-700 bg-red-200',
                warning: 'text-yellow-700 bg-yellow-200',
                info: 'text-blue-700 bg-blue-200'
            }
        },
        gradient: {
            primary: 'from-green-600 to-emerald-600',
            secondary: 'from-green-400 to-emerald-400',
            accent: 'from-green-500 to-emerald-500'
        },
        shadow: {
            sm: 'shadow-sm shadow-green-900/20',
            md: 'shadow-md shadow-green-900/20',
            lg: 'shadow-lg shadow-green-900/20',
            xl: 'shadow-xl shadow-green-900/20',
            accent: 'shadow-green-600/30'
        }
    }
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme && themes[savedTheme] ? savedTheme : 'light';
    });

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setWindowWidth(width);
            setIsMobile(width < 768);
            setIsTablet(width >= 768 && width < 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const themeClasses = themes[theme] || themes.light;

    return (
        <ThemeContext.Provider value={{ 
            theme, 
            setTheme, 
            themeClasses,
            isMobile,
            isTablet,
            windowWidth
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};