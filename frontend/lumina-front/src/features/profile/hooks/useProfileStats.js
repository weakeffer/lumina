import { useState, useEffect, useMemo } from 'react';

export const useProfileStats = (notes = [], user = null) => {
  const [activityData, setActivityData] = useState([]);
  const [userStats, setUserStats] = useState({
    streak: 0,
    totalTags: 0,
    achievements: 0
  });

  // Функция для безопасного парсинга даты
  const parseNoteDate = (dateString) => {
    if (!dateString) return null;
    
    try {
      // Если это уже объект Date
      if (dateString instanceof Date) {
        return dateString;
      }
      
      // Если строка
      if (typeof dateString === 'string') {
        // Формат ISO: "2026-03-21T23:30:38.123Z"
        if (dateString.includes('T')) {
          const date = new Date(dateString);
          if (!isNaN(date.getTime())) return date;
        }
        
        // Формат с точками: "21.03.2026 23:30:38"
        if (dateString.includes('.')) {
          const parts = dateString.split(' ');
          const dateParts = parts[0].split('.');
          const timeParts = parts[1]?.split(':') || ['0', '0', '0'];
          
          if (dateParts.length === 3) {
            const day = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1;
            const year = parseInt(dateParts[2]);
            const hours = parseInt(timeParts[0]);
            const minutes = parseInt(timeParts[1]);
            const seconds = parseInt(timeParts[2] || 0);
            
            const date = new Date(year, month, day, hours, minutes, seconds);
            if (!isNaN(date.getTime())) return date;
          }
        }
        
        // Формат с дефисами: "2026-03-21"
        if (dateString.includes('-')) {
          const date = new Date(dateString);
          if (!isNaN(date.getTime())) return date;
        }
      }
      
      // Пробуем стандартный парсинг
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) return date;
      
      return null;
    } catch (e) {
      console.error('Error parsing date:', dateString, e);
      return null;
    }
  };

  useEffect(() => {
    console.log('useProfileStats: computing stats for notes:', notes?.length || 0);
    
    // Создаем данные для последних 7 дней
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const days = [];
    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    
    // Создаем массив последних 7 дней
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      days.push({
        date: date,
        dayName: dayNames[date.getDay()],
        fullDate: date.toLocaleDateString('ru-RU'),
        count: 0
      });
    }
    
    // Если есть заметки, считаем активность
    if (notes && notes.length > 0) {
      notes.forEach(note => {
        const noteDate = parseNoteDate(note.created_at);
        if (!noteDate) return;
        
        // Приводим дату заметки к началу дня
        const noteDay = new Date(noteDate);
        noteDay.setHours(0, 0, 0, 0);
        
        // Ищем соответствующий день в нашем массиве
        const dayIndex = days.findIndex(day => 
          day.date.getTime() === noteDay.getTime()
        );
        
        if (dayIndex !== -1) {
          days[dayIndex].count++;
        }
      });
    }
    
    // Форматируем данные для отображения
    const formattedActivity = days.map(day => ({
      date: day.dayName,
      fullDate: day.fullDate,
      count: day.count
    }));
    
    console.log('Formatted activity data:', formattedActivity);
    setActivityData(formattedActivity);
    
    // Подсчет стрика (непрерывной активности)
    let currentStreak = 0;
    let maxStreak = 0;
    
    // Проверяем дни с сегодняшнего в обратном порядке
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].count > 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    // Подсчет уникальных тегов
    const allTags = new Set();
    notes.forEach(note => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach(tag => {
          if (tag && typeof tag === 'string') {
            allTags.add(tag);
          }
        });
      }
    });
    
    console.log('User stats:', {
      streak: currentStreak,
      totalTags: allTags.size,
      achievements: Math.floor(maxStreak / 7)
    });
    
    setUserStats({
      streak: currentStreak,
      totalTags: allTags.size,
      achievements: Math.floor(maxStreak / 7)
    });
    
  }, [notes]); // Зависимость от notes

  const formatNoteDate = (dateString) => {
    const date = parseNoteDate(dateString);
    if (!date) return 'Только что';
    
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserLevel = (totalNotes = 0) => {
    if (totalNotes > 100) return { label: 'Мастер мыслей', color: 'from-purple-500 to-pink-500' };
    if (totalNotes > 50) return { label: 'Опытный автор', color: 'from-indigo-500 to-purple-500' };
    if (totalNotes > 20) return { label: 'Активный', color: 'from-blue-500 to-indigo-500' };
    if (totalNotes > 5) return { label: 'Новичок', color: 'from-green-500 to-emerald-500' };
    return { label: 'Начинающий', color: 'from-gray-500 to-gray-600' };
  };

  return {
    activityData,
    userStats,
    formatNoteDate,
    getUserLevel
  };
};