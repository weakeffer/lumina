/** Подсчёты по массиву заметок для панелей статистики (без дублирования логики). */

const WEEKDAY_LABELS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

/**
 * Активность по дню недели создания заметки (0 = вс).
 * @returns {{ label: string, count: number, key: string }[]}
 */
export function getActivityCountsByWeekday(notes) {
  const activity = new Array(7).fill(0);
  for (const note of notes) {
    if (!note?.created_at) continue;
    const day = new Date(note.created_at).getDay();
    if (Number.isNaN(day)) continue;
    activity[day]++;
  }
  return WEEKDAY_LABELS.map((label, index) => ({
    key: label,
    label,
    count: activity[index],
  }));
}

/**
 * Теги по частоте в теле заметок.
 * @returns {{ tag: string, count: number }[]}
 */
export function getPopularTagsFromNotes(notes, limit = 5) {
  const tagCount = {};
  for (const note of notes) {
    for (const tag of note.tags || []) {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    }
  }
  return Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}

/**
 * Слова / символы / среднее / дата последнего изменения.
 */
export function computeWritingMetricsFromNotes(notes) {
  const totalNotes = notes.length;
  let totalWords = 0;
  let totalChars = 0;
  let lastMs = 0;

  for (const note of notes) {
    totalWords += note.text?.split(/\s+/).filter(Boolean).length || 0;
    totalChars += note.text?.length || 0;
    const dateStr = note.updated_at || note.created_at;
    if (!dateStr) continue;
    const t = new Date(dateStr).getTime();
    if (!Number.isNaN(t)) lastMs = Math.max(lastMs, t);
  }

  const avgWordsPerNote = totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0;
  const lastEdited = lastMs > 0 ? new Date(lastMs) : null;

  return { totalNotes, totalWords, totalChars, avgWordsPerNote, lastEdited };
}
