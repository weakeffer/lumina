import { useEffect, useRef } from 'react';
 
const POLL_MS = 4000;
const MAX_ATTEMPTS = 15; // ~60 сек максимум
 
const EMOTION_EMOJI = {
  joy: '😊', sadness: '😢', anger: '😠', fear: '😨',
  surprise: '😲', fatigue: '😴', interest: '🤔',
  pride: '💪', gratitude: '🙏', neutral: '😐',
};
 
export function useAnalysisToast(noteId, onReady) {
  const timerRef = useRef(null);
  const attemptsRef = useRef(0);
  const notifiedRef = useRef(null); // ID последней заметки, о которой уведомили
 
  useEffect(() => {
    if (!noteId) return;
 
    // Сбрасываем при смене заметки
    clearInterval(timerRef.current);
    attemptsRef.current = 0;
 
    const poll = async () => {
      attemptsRef.current += 1;
 
      // Прекращаем после MAX_ATTEMPTS
      if (attemptsRef.current > MAX_ATTEMPTS) {
        clearInterval(timerRef.current);
        return;
      }
 
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(
          `http://localhost:8000/api/notes/${noteId}/analysis/`,
          { headers: { Authorization: `Token ${token}` } }
        );
        const json = await res.json();
 
        if (json.is_analyzed && notifiedRef.current !== noteId) {
          notifiedRef.current = noteId;
          clearInterval(timerRef.current);
          onReady?.(json.dominant_emotion || 'neutral', json);
        }
      } catch {
        // Тихо игнорируем сетевые ошибки
      }
    };
 
    // Первый запрос через 3 сек (даём время фоновому анализу)
    const delay = setTimeout(() => {
      poll();
      timerRef.current = setInterval(poll, POLL_MS);
    }, 3000);
 
    return () => {
      clearTimeout(delay);
      clearInterval(timerRef.current);
    };
  }, [noteId]);
}
 
export { EMOTION_EMOJI };