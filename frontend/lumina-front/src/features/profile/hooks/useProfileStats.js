import { useState, useMemo } from 'react';

export const useProfileStats = (notes = [], user = null) => {
  const [activityData, setActivityData] = useState([]);
  const [userStats, setUserStats] = useState({
    streak: 0,
    totalTags: 0,
    achievements: 0
  });

  useMemo(() => {
    if (!notes.length) return;

    const activity = [];
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      
      const count = notes.filter(note => {
        if (!note.created_at) return false;
        
        try {
          let noteDate;
          if (typeof note.created_at === 'string' && note.created_at.includes('.')) {
            const [datePart, timePart] = note.created_at.split(' ');
            const [day, month, year] = datePart.split('.');
            const [hours, minutes] = timePart.split(':');
            noteDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
          } else {
            noteDate = new Date(note.created_at);
          }
          
          if (isNaN(noteDate.getTime())) return false;
          
          const noteDateStart = new Date(noteDate);
          noteDateStart.setHours(0, 0, 0, 0);
          
          return noteDateStart >= date && noteDateStart < nextDate;
        } catch (e) {
          return false;
        }
      }).length;
      
      activity.push({
        date: date.toLocaleDateString('ru-RU', { weekday: 'short' }),
        fullDate: date.toLocaleDateString('ru-RU'),
        count: count
      });
      
      if (count > 0) {
        currentStreak++;
      } else {
        currentStreak = 0;
      }
    }
    
    setActivityData(activity);

    const allTags = new Set();
    notes.forEach(note => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach(tag => allTags.add(tag));
      }
    });
    
    setUserStats({
      streak: currentStreak,
      totalTags: allTags.size,
      achievements: Math.floor(currentStreak / 7)
    });
  }, [notes]);

  const formatNoteDate = (dateString) => {
    if (!dateString) return 'Дата неизвестна';

    try {
      let date;

      if (typeof dateString === 'string' && dateString.includes('.')) {
        const [datePart, timePart] = dateString.split(' ');
        const [day, month, year] = datePart.split('.');
        const [hours, minutes] = timePart.split(':');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
      } else if (typeof dateString === 'string' && dateString.includes('T')) {
        date = new Date(dateString);
      } else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) return 'Только что';

      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Только что';
    }
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