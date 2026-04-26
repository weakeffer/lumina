import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from '../../../shared/context/ThemeContext';
import {
  Brain, TrendingUp, Tag, ChevronRight, ChevronDown,
  Loader, RefreshCw, BarChart2, Zap, Eye, EyeOff
} from 'lucide-react';

// ── Константы ──────────────────────────────────────────────────────────

const EMOTION_META = {
  joy:       { label: 'Радость',      emoji: '😊', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  interest:  { label: 'Интерес',      emoji: '🤔', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  surprise:  { label: 'Удивление',    emoji: '😲', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  pride:     { label: 'Гордость',     emoji: '💪', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  gratitude: { label: 'Благодарность',emoji: '🙏', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  neutral:   { label: 'Нейтрально',   emoji: '😐', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  fatigue:   { label: 'Усталость',    emoji: '😴', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  fear:      { label: 'Тревога',      emoji: '😨', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  sadness:   { label: 'Грусть',       emoji: '😢', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  anger:     { label: 'Злость',       emoji: '😠', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

const SENTIMENT_META = {
  positive: { label: 'Позитивный',  color: '#22c55e', bar: 'from-green-400 to-emerald-500' },
  neutral:  { label: 'Нейтральный', color: '#94a3b8', bar: 'from-slate-400 to-slate-500' },
  negative: { label: 'Напряжённый', color: '#ef4444', bar: 'from-red-400 to-rose-500' },
};

// ── Хук для получения анализа ──────────────────────────────────────────

const POLL_INTERVAL = 3000; // 3 секунды

function useNoteAnalysis(noteId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);

  const fetchAnalysis = useCallback(async (silent = false) => {
    if (!noteId) return;
    if (!silent) setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:8000/api/notes/${noteId}/analysis/`,
        { headers: { Authorization: `Token ${token}` } }
      );
      const json = await res.json();
      setData(json);

      // Если анализ не готов — запускаем polling
      if (!json.is_analyzed) {
        setPolling(true);
      } else {
        setPolling(false);
      }
    } catch {
      // Тихо проглатываем — панель опциональна
    } finally {
      if (!silent) setLoading(false);
    }
  }, [noteId]);

  // Запускаем анализ вручную
  const triggerAnalysis = useCallback(async () => {
    if (!noteId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:8000/api/notes/${noteId}/analyze/`, {
        method: 'POST',
        headers: { Authorization: `Token ${token}` },
      });
      setPolling(true);
    } catch {}
    setLoading(false);
  }, [noteId]);

  // Начальная загрузка при смене заметки
  useEffect(() => {
    setData(null);
    setPolling(false);
    if (noteId) fetchAnalysis();
  }, [noteId]);

  // Polling пока анализ не готов
  useEffect(() => {
    if (!polling) return;
    const id = setInterval(() => fetchAnalysis(true), POLL_INTERVAL);
    return () => clearInterval(id);
  }, [polling, fetchAnalysis]);

  return { data, loading, triggerAnalysis, refetch: () => fetchAnalysis() };
}

// ── Компоненты ─────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const { themeClasses } = useTheme();

  return (
    <div className={`border-b ${themeClasses.colors.border.primary} last:border-0`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3
          hover:${themeClasses.colors.bg.secondary} transition-colors`}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-indigo-500" />
          <span className={`text-xs font-semibold uppercase tracking-wider ${themeClasses.colors.text.tertiary}`}>
            {title}
          </span>
        </div>
        {open
          ? <ChevronDown className={`w-3.5 h-3.5 ${themeClasses.colors.text.tertiary}`} />
          : <ChevronRight className={`w-3.5 h-3.5 ${themeClasses.colors.text.tertiary}`} />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function SentimentBar({ sentiment, score }) {
  const meta = SENTIMENT_META[sentiment] || SENTIMENT_META.neutral;
  const pct = Math.round((sentiment === 'positive'
    ? 0.5 + score * 0.5
    : sentiment === 'negative'
      ? 0.5 - score * 0.5
      : 0.5) * 100);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium" style={{ color: meta.color }}>
          {meta.label}
        </span>
        <span className="text-xs text-slate-400">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full bg-linear-to-r ${meta.bar} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function EmotionChips({ emotions }) {
  const sorted = Object.entries(emotions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="flex flex-wrap gap-1.5">
      {sorted.map(([emotion, score]) => {
        const meta = EMOTION_META[emotion] || EMOTION_META.neutral;
        const pct = Math.round(score * 100);
        return (
          <div
            key={emotion}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}30` }}
            title={`${meta.label}: ${pct}%`}
          >
            <span style={{ fontSize: 13 }}>{meta.emoji}</span>
            <span>{meta.label}</span>
            <span style={{ opacity: 0.6 }}>{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

function KeywordPills({ keywords }) {
  const { themeClasses } = useTheme();
  if (!keywords?.length) return (
    <p className={`text-xs ${themeClasses.colors.text.tertiary} italic`}>Нет ключевых слов</p>
  );
  return (
    <div className="flex flex-wrap gap-1.5">
      {keywords.map((kw) => (
        <span
          key={kw}
          className={`px-2.5 py-1 rounded-full text-xs ${themeClasses.colors.bg.tertiary} ${themeClasses.colors.text.secondary}`}
        >
          {kw}
        </span>
      ))}
    </div>
  );
}

function EntityList({ entities }) {
  const { themeClasses } = useTheme();
  const types = { PER: 'Люди', ORG: 'Организации', LOC: 'Места' };
  const hasAny = Object.values(entities || {}).some((v) => v?.length > 0);

  if (!hasAny) return (
    <p className={`text-xs ${themeClasses.colors.text.tertiary} italic`}>Не обнаружено</p>
  );

  return (
    <div className="space-y-2">
      {Object.entries(types).map(([key, label]) => {
        const vals = entities?.[key];
        if (!vals?.length) return null;
        return (
          <div key={key}>
            <p className={`text-xs ${themeClasses.colors.text.tertiary} mb-1`}>{label}</p>
            <div className="flex flex-wrap gap-1">
              {vals.map((v) => (
                <span
                  key={v}
                  className="px-2 py-0.5 rounded text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TextStats({ stats }) {
  const { themeClasses } = useTheme();
  const items = [
    { label: 'Слов', value: stats?.word_count ?? '—' },
    { label: 'Символов', value: stats?.char_count ?? '—' },
    { label: 'Предложений', value: stats?.sentence_count ?? '—' },
    {
      label: 'Ср. длина предл.',
      value: stats?.avg_sentence_length ? `${Math.round(stats.avg_sentence_length)} сл.` : '—',
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(({ label, value }) => (
        <div
          key={label}
          className={`rounded-lg p-2.5 ${themeClasses.colors.bg.secondary}`}
        >
          <p className={`text-xs ${themeClasses.colors.text.tertiary}`}>{label}</p>
          <p className={`text-sm font-semibold ${themeClasses.colors.text.primary}`}>{value}</p>
        </div>
      ))}
    </div>
  );
}

function NarrativeBlock({ narrative }) {
  const { themeClasses } = useTheme();
  if (!narrative) return null;
  return (
    <p className={`text-xs leading-relaxed ${themeClasses.colors.text.secondary} italic`}>
      "{narrative}"
    </p>
  );
}

const NoteAnalysisPanel = ({ noteId, visible, onClose }) => {
  const { themeClasses } = useTheme();
  const { data, loading, triggerAnalysis } = useNoteAnalysis(noteId);

  if (!visible) return null;

  const isAnalyzed = data?.is_analyzed;
  const isPolling = data && !isAnalyzed;

  return (
    <aside
      className={`
        w-72 shrink-0 h-full overflow-y-auto
        border-l ${themeClasses.colors.border.primary}
        ${themeClasses.colors.bg.primary}
        flex flex-col
        animate-slide-in
      `}
    >
      {/* Header */}
      <div
        className={`
          flex items-center justify-between px-4 py-3 sticky top-0
          border-b ${themeClasses.colors.border.primary}
          ${themeClasses.colors.bg.primary} z-10
        `}
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-indigo-500" />
          <span className={`text-sm font-semibold ${themeClasses.colors.text.primary}`}>
            Анализ
          </span>
          {isPolling && (
            <span className="flex items-center gap-1 text-xs text-amber-500">
              <Loader className="w-3 h-3 animate-spin" />
              обработка…
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={triggerAnalysis}
            className={`p-1.5 rounded-lg hover:${themeClasses.colors.bg.secondary} transition-colors`}
            title="Перезапустить анализ"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg hover:${themeClasses.colors.bg.secondary} transition-colors`}
            title="Скрыть панель"
          >
            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Загрузка */}
      {loading && !data && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 p-8 text-center">
          <Loader className="w-6 h-6 animate-spin text-indigo-400" />
          <p className={`text-xs ${themeClasses.colors.text.tertiary}`}>
            Загружаем анализ…
          </p>
        </div>
      )}

      {/* Анализ ещё не готов */}
      {!loading && data && !isAnalyzed && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
            <Brain className="w-6 h-6 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <p className={`text-sm font-medium ${themeClasses.colors.text.primary} mb-1`}>
              Анализируем заметку
            </p>
            <p className={`text-xs ${themeClasses.colors.text.tertiary}`}>
              Модели обрабатывают текст.<br />Обычно занимает 5–15 секунд.
            </p>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Нет заметки */}
      {!noteId && (
        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
          <p className={`text-xs ${themeClasses.colors.text.tertiary}`}>
            Выберите заметку для анализа
          </p>
        </div>
      )}

      {/* Контент анализа */}
      {isAnalyzed && (
        <div className="flex-1">
          {/* Нарратив */}
          {data.narrative && (
            <div className={`px-4 py-3 border-b ${themeClasses.colors.border.primary} bg-indigo-500/5`}>
              <NarrativeBlock narrative={data.narrative} />
            </div>
          )}

          {/* Тональность */}
          <Section title="Тональность" icon={TrendingUp}>
            <SentimentBar
              sentiment={data.sentiment}
              score={data.sentiment_score}
            />
          </Section>

          {/* Эмоции */}
          {data.emotions && Object.keys(data.emotions).length > 0 && (
            <Section title="Эмоции" icon={BarChart2}>
              <EmotionChips emotions={data.emotions} />
            </Section>
          )}

          {/* Ключевые слова */}
          <Section title="Ключевые слова" icon={Tag}>
            <KeywordPills keywords={data.keywords} />
          </Section>

          {/* Упоминания */}
          <Section title="Упоминания" icon={Zap} defaultOpen={false}>
            <EntityList entities={data.entities} />
          </Section>

          {/* Статистика текста */}
          <Section title="Статистика" icon={BarChart2} defaultOpen={false}>
            <TextStats stats={data.text_stats} />
          </Section>
        </div>
      )}
    </aside>
  );
};

export default NoteAnalysisPanel;