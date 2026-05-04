// frontend/lumina-front/src/pages/insights/InsightsPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotes } from '../../features/notes/hooks/useNotes';
import { useTheme } from '../../shared/context/ThemeContext';
import { usePersonalityProfile } from '../../features/notes/hooks/usePersonalityProfile';
import { useTraitsTimeline } from '../../features/notes/hooks/useAnalysis';
import { useDailySummary } from '../../features/notes/hooks/useAnalysis';
import InsightsOnboarding from './InsightsOnboarding';
import TraitsTimeline from './TraitsTimeline';
import { api } from '../../shared/api/api';
import {
  Activity, ChevronLeft, Brain, TrendingUp, Calendar, Zap,
  Star, Heart, Clock, Sun, Cloud, CloudRain, Smile,
  Meh, Frown, ChevronRight, BarChart2
} from 'lucide-react';
import Chart from 'chart.js/auto';

// Импортируем d3-cloud для правильного облака тегов
import * as d3 from 'd3';
import cloud from 'd3-cloud';

// ── Константы ────────────────────────────────────────────────────────────

const MOODS = [
  { id: 1, icon: '😄', label: 'Отлично', color: '#22c55e', value: 1.0 },
  { id: 2, icon: '🙂', label: 'Хорошо',  color: '#84cc16', value: 0.75 },
  { id: 3, icon: '😐', label: 'Нейтрально', color: '#eab308', value: 0.5 },
  { id: 4, icon: '😔', label: 'Плохо',   color: '#f97316', value: 0.25 },
  { id: 5, icon: '😞', label: 'Ужасно',  color: '#ef4444', value: 0.0 },
];

const EMOTION_META = {
  joy:      { label: 'Радость',     color: '#22c55e', icon: '😊' },
  interest: { label: 'Интерес',     color: '#6366f1', icon: '🤔' },
  surprise: { label: 'Удивление',   color: '#8b5cf6', icon: '😲' },
  neutral:  { label: 'Спокойствие', color: '#94a3b8', icon: '😐' },
  fatigue:  { label: 'Усталость',   color: '#f59e0b', icon: '😴' },
  fear:     { label: 'Тревога',     color: '#f97316', icon: '😨' },
  sadness:  { label: 'Грусть',      color: '#3b82f6', icon: '😢' },
  anger:    { label: 'Злость',      color: '#ef4444', icon: '😠' },
};

export default function InsightsPage() {
  const navigate = useNavigate();
  const { data: notes = [] } = useNotes();
  const { themeClasses, theme } = useTheme();
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [userMood, setUserMood] = useState(null);
  const [moodHistory, setMoodHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('moodHistory') || '{}'); }
    catch { return {}; }
  });

  const { data: profile, isLoading: profileLoading } = usePersonalityProfile();
  const { data: summary, isLoading: summaryLoading } = useDailySummary(selectedDate);

  const isDark = theme === 'dark';

  // Сохраняем настроение
  const saveMood = (mood) => {
    const updated = { ...moodHistory, [selectedDate]: mood.id };
    setMoodHistory(updated);
    setUserMood(mood);
    localStorage.setItem('moodHistory', JSON.stringify(updated));
  };

  // Восстанавливаем настроение при смене дня
  useEffect(() => {
    const saved = moodHistory[selectedDate];
    setUserMood(saved ? MOODS.find(m => m.id === saved) || null : null);
  }, [selectedDate]);

  const sections = [
    { id: 'overview',  label: 'Обзор',      icon: Brain },
    { id: 'day',       label: 'День',        icon: Calendar },
    { id: 'mood',      label: 'Настроение',  icon: TrendingUp },
    { id: 'topics',    label: 'Темы',        icon: Zap },
    { id: 'traits',    label: 'Черты',       icon: Star },
    { id: 'dynamics', label: 'Динамика', icon: Activity },
  ];

  return (
    <div className={`min-h-screen ${themeClasses.colors.bg.primary}`}>
      {/* Hero header */}
      <div className={`relative overflow-hidden border-b ${themeClasses.colors.border.primary}`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-purple-500/5 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 py-8">
          <button
            onClick={() => navigate('/notes')}
            className={`group flex items-center gap-2 mb-6 text-sm
              ${themeClasses.colors.text.tertiary} hover:${themeClasses.colors.text.primary}
              transition-colors`}
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            К заметкам
          </button>
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <h1 className={`text-3xl font-bold ${themeClasses.colors.text.primary}`}>
                  Insights
                </h1>
              </div>
              <p className={`text-base ${themeClasses.colors.text.secondary}`}>
                Твой психологический портрет на основе записей
              </p>
            </div>
            {profile?.has_data && (
              <div className="hidden md:flex items-center gap-6">
                <StatPill label="Записей" value={profile.stats.total_analyzed} color="indigo" />
                <StatPill label="Серия" value={`${profile.stats.streak_days}д`} color="amber" />
                <StatPill label="Настроение" value={`${Math.round(profile.stats.avg_sentiment * 100)}%`} color="green" />
              </div>
            )}
          </div>
        </div>

        {/* Nav tabs */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1">
            {sections.map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative
                    ${activeSection === s.id
                      ? `${themeClasses.colors.text.primary}`
                      : `${themeClasses.colors.text.tertiary} hover:${themeClasses.colors.text.secondary}`
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {s.label}
                  {activeSection === s.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-indigo-500 to-purple-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {profileLoading && <LoadingState />}
        {!profileLoading && !profile?.has_data && (
          <EmptyState notesCount={notes.length} />
        )}
        {!profileLoading && profile?.has_data && (
          <>
            {activeSection === 'overview' && (
              <OverviewSection profile={profile} themeClasses={themeClasses} isDark={isDark} />
            )}
            {activeSection === 'day' && (
              <DaySection
                summary={summary}
                summaryLoading={summaryLoading}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                userMood={userMood}
                onMoodSelect={saveMood}
                themeClasses={themeClasses}
                isDark={isDark}
              />
            )}
            {activeSection === 'mood' && (
              <MoodSection
                profile={profile}
                moodHistory={moodHistory}
                themeClasses={themeClasses}
                isDark={isDark}
              />
            )}
            {activeSection === 'topics' && (
              <TopicsSection profile={profile} themeClasses={themeClasses} isDark={isDark} />
            )}
            {activeSection === 'traits' && (
              <TraitsSection profile={profile} themeClasses={themeClasses} />
            )}
            {activeSection === 'dynamics' && (
              <TraitsTimeline isDark={isDark} themeClasses={themeClasses} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Секция: Обзор (без изменений)
// ─────────────────────────────────────────────────────────────────────────

function OverviewSection({ profile, themeClasses, isDark }) {
  const moodChartRef = useRef(null);
  const emotionChartRef = useRef(null);
  const chartInstances = useRef({});

  useEffect(() => {
    // График настроения
    if (moodChartRef.current && profile.mood_timeline?.length > 1) {
      if (chartInstances.current.mood) chartInstances.current.mood.destroy();
      const recent = profile.mood_timeline.slice(-30);
      const ctx = moodChartRef.current.getContext('2d');
      chartInstances.current.mood = new Chart(ctx, {
        type: 'line',
        data: {
          labels: recent.map(d => d.date.slice(5)),
          datasets: [{
            label: 'Настроение',
            data: recent.map(d => Math.round(d.score * 100)),
            borderColor: '#6366f1',
            borderWidth: 2,
            pointBackgroundColor: recent.map(d => {
              const s = d.score;
              return s > 0.65 ? '#22c55e' : s < 0.4 ? '#ef4444' : '#6366f1';
            }),
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
            backgroundColor: isDark
              ? 'rgba(99,102,241,0.08)'
              : 'rgba(99,102,241,0.06)',
            tension: 0.4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: isDark ? '#1e1b4b' : '#fff',
              titleColor: isDark ? '#c7d2fe' : '#3730a3',
              bodyColor: isDark ? '#a5b4fc' : '#4338ca',
              borderColor: '#6366f1',
              borderWidth: 1,
              callbacks: {
                label: ctx => `Настроение: ${ctx.parsed.y}%`,
              }
            }
          },
          scales: {
            x: {
              grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
              ticks: {
                color: isDark ? '#94a3b8' : '#64748b',
                font: { size: 11 },
                maxTicksLimit: 8,
              }
            },
            y: {
              min: 0, max: 100,
              grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
              ticks: {
                color: isDark ? '#94a3b8' : '#64748b',
                font: { size: 11 },
                callback: v => `${v}%`,
              }
            }
          }
        }
      });
    }

    // Radar эмоций
    if (emotionChartRef.current && profile.emotions_summary?.length) {
      if (chartInstances.current.emotion) chartInstances.current.emotion.destroy();
      const top = profile.emotions_summary.slice(0, 6);
      const ctx = emotionChartRef.current.getContext('2d');
      chartInstances.current.emotion = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: top.map(e => EMOTION_META[e.emotion]?.label || e.emotion),
          datasets: [{
            data: top.map(e => Math.round(e.score * 100)),
            backgroundColor: 'rgba(99,102,241,0.15)',
            borderColor: '#6366f1',
            borderWidth: 2,
            pointBackgroundColor: top.map(e => EMOTION_META[e.emotion]?.color || '#6366f1'),
            pointRadius: 5,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            r: {
              min: 0, max: 100,
              grid: { color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
              angleLines: { color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
              pointLabels: {
                color: isDark ? '#94a3b8' : '#64748b',
                font: { size: 12 },
              },
              ticks: { display: false }
            }
          }
        }
      });
    }

    return () => {
      Object.values(chartInstances.current).forEach(c => c?.destroy());
    };
  }, [profile, isDark]);

  const { stats } = profile;
  const moodScore = Math.round(stats.avg_sentiment * 100);
  const activeHour = stats.most_active_hour;
  const timeLabel = activeHour < 6 ? 'Ночью' : activeHour < 12 ? 'Утром'
    : activeHour < 18 ? 'Днём' : 'Вечером';

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Проанализировано', value: stats.total_analyzed, sub: 'записей', accent: '#6366f1' },
          { label: 'Серия дней',       value: `${stats.streak_days}д`, sub: 'подряд', accent: '#f59e0b' },
          { label: 'Общее настроение', value: `${moodScore}%`, sub: moodScore > 65 ? 'позитивное' : moodScore < 40 ? 'сложное' : 'нейтральное', accent: moodScore > 65 ? '#22c55e' : moodScore < 40 ? '#ef4444' : '#94a3b8' },
          { label: 'Пик активности',  value: timeLabel, sub: `~${activeHour}:00`, accent: '#8b5cf6' },
        ].map(({ label, value, sub, accent }) => (
          <div
            key={label}
            className={`rounded-2xl p-5 border ${themeClasses.colors.border.primary} ${themeClasses.colors.bg.secondary}`}
            style={{ borderLeft: `3px solid ${accent}` }}
          >
            <p className={`text-xs font-medium mb-2 ${themeClasses.colors.text.tertiary} uppercase tracking-wider`}>
              {label}
            </p>
            <p className={`text-2xl font-bold ${themeClasses.colors.text.primary}`}>{value}</p>
            <p className={`text-xs mt-1 ${themeClasses.colors.text.tertiary}`}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mood timeline */}
        <div className={`rounded-2xl border ${themeClasses.colors.border.primary} ${themeClasses.colors.bg.secondary} p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <h3 className={`text-sm font-semibold ${themeClasses.colors.text.primary}`}>
              Динамика настроения
            </h3>
          </div>
          <div style={{ height: 200 }}>
            <canvas
              ref={moodChartRef}
              role="img"
              aria-label="График изменения настроения по дням"
            >
              Динамика настроения за последние 30 дней
            </canvas>
          </div>
          <div className="flex items-center gap-4 mt-3">
            {[
              { color: '#22c55e', label: 'Позитивный' },
              { color: '#6366f1', label: 'Нейтральный' },
              { color: '#ef4444', label: 'Сложный' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className={`text-xs ${themeClasses.colors.text.tertiary}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Emotion radar */}
        <div className={`rounded-2xl border ${themeClasses.colors.border.primary} ${themeClasses.colors.bg.secondary} p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4 text-pink-500" />
            <h3 className={`text-sm font-semibold ${themeClasses.colors.text.primary}`}>
              Эмоциональный профиль
            </h3>
          </div>
          <div style={{ height: 200 }}>
            <canvas
              ref={emotionChartRef}
              role="img"
              aria-label="Радарный график эмоций"
            >
              Распределение эмоций в записях
            </canvas>
          </div>
        </div>
      </div>

      {/* Top emotions strip */}
      <div className={`rounded-2xl border ${themeClasses.colors.border.primary} ${themeClasses.colors.bg.secondary} p-5`}>
        <h3 className={`text-sm font-semibold ${themeClasses.colors.text.primary} mb-4`}>
          Топ эмоций за всё время
        </h3>
        <div className="space-y-3">
          {profile.emotions_summary.slice(0, 5).map(({ emotion, score }) => {
            const meta = EMOTION_META[emotion] || { label: emotion, color: '#94a3b8', icon: '•' };
            const pct = Math.round(score * 100);
            return (
              <div key={emotion} className="flex items-center gap-3">
                <span className="text-lg w-7 text-center" style={{ fontSize: 18 }}>{meta.icon}</span>
                <span className={`text-sm w-28 ${themeClasses.colors.text.secondary}`}>{meta.label}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: meta.color }}
                  />
                </div>
                <span className={`text-xs w-10 text-right font-medium ${themeClasses.colors.text.tertiary}`}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Секция: День (без изменений)
// ─────────────────────────────────────────────────────────────────────────

function DaySection({ summary, summaryLoading, selectedDate, onDateChange, userMood, onMoodSelect, themeClasses, isDark }) {
  const emotionChartRef = useRef(null);
  const chartInst = useRef(null);

  useEffect(() => {
    if (!emotionChartRef.current || !summary?.emotions) return;
    if (chartInst.current) chartInst.current.destroy();

    const entries = Object.entries(summary.emotions).slice(0, 6);
    if (!entries.length) return;

    chartInst.current = new Chart(emotionChartRef.current, {
      type: 'doughnut',
      data: {
        labels: entries.map(([e]) => EMOTION_META[e]?.label || e),
        datasets: [{
          data: entries.map(([, v]) => Math.round(v * 100)),
          backgroundColor: entries.map(([e]) => EMOTION_META[e]?.color || '#94a3b8'),
          borderWidth: 0,
          hoverOffset: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? '#1e293b' : '#fff',
            titleColor: isDark ? '#e2e8f0' : '#0f172a',
            bodyColor: isDark ? '#94a3b8' : '#475569',
            borderWidth: 1,
            borderColor: isDark ? '#334155' : '#e2e8f0',
          }
        }
      }
    });
    return () => chartInst.current?.destroy();
  }, [summary, isDark]);

  const moodFromAI = summary?.day_mood;
  const aiMoodMap = { positive: MOODS[0], neutral: MOODS[2], negative: MOODS[4] };
  const aiMood = aiMoodMap[moodFromAI];

  return (
    <div className="space-y-6">
      {/* Date picker + mood input */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date */}
        <div className={`rounded-2xl border ${themeClasses.colors.border.primary} ${themeClasses.colors.bg.secondary} p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <h3 className={`text-sm font-semibold ${themeClasses.colors.text.primary}`}>Выбор дня</h3>
          </div>
          <input
            type="date"
            value={selectedDate}
            max={new Date().toISOString().split('T')[0]}
            onChange={e => onDateChange(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border ${themeClasses.colors.border.primary}
              ${themeClasses.colors.bg.primary} ${themeClasses.colors.text.primary}
              focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm`}
          />
          {summary && !summaryLoading && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: 'Записей', value: summary.notes_count },
                { label: 'Слов',    value: summary.total_words },
                { label: 'Тем',     value: Object.keys(summary.top_topics || {}).length },
              ].map(({ label, value }) => (
                <div key={label} className={`text-center p-2 rounded-xl ${themeClasses.colors.bg.tertiary}`}>
                  <p className={`text-lg font-bold ${themeClasses.colors.text.primary}`}>{value}</p>
                  <p className={`text-xs ${themeClasses.colors.text.tertiary}`}>{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mood picker */}
        <div className={`rounded-2xl border ${themeClasses.colors.border.primary} ${themeClasses.colors.bg.secondary} p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <Smile className="w-4 h-4 text-amber-500" />
            <h3 className={`text-sm font-semibold ${themeClasses.colors.text.primary}`}>Твоё настроение</h3>
          </div>
          <div className="flex justify-between gap-2">
            {MOODS.map(mood => (
              <button
                key={mood.id}
                onClick={() => onMoodSelect(mood)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all
                  ${userMood?.id === mood.id
                    ? 'border-2 scale-105 shadow-lg'
                    : `border ${themeClasses.colors.border.primary} hover:scale-105`
                  }`}
                style={userMood?.id === mood.id
                  ? { borderColor: mood.color, background: mood.color + '18' }
                  : {}
                }
              >
                <span style={{ fontSize: 22 }}>{mood.icon}</span>
                <span className={`text-xs ${themeClasses.colors.text.tertiary}`}>{mood.label}</span>
              </button>
            ))}
          </div>

          {/* AI vs User comparison */}
          {userMood && aiMood && (
            <div className={`mt-4 p-3 rounded-xl ${themeClasses.colors.bg.tertiary} flex items-center justify-around`}>
              <div className="text-center">
                <span style={{ fontSize: 20 }}>{userMood.icon}</span>
                <p className={`text-xs mt-1 ${themeClasses.colors.text.tertiary}`}>Ты сказал</p>
              </div>
              <div className={`text-xs ${themeClasses.colors.text.tertiary}`}>vs</div>
              <div className="text-center">
                <span style={{ fontSize: 20 }}>{aiMood.icon}</span>
                <p className={`text-xs mt-1 ${themeClasses.colors.text.tertiary}`}>ИИ считает</p>
              </div>
              <div className={`text-xs px-2 py-1 rounded-lg font-medium ${
                userMood.id === aiMood.id
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
              }`}>
                {userMood.id === aiMood.id ? 'Совпало!' : 'Расходится'}
              </div>
            </div>
          )}
        </div>
      </div>

      {summaryLoading && <LoadingState />}

      {!summaryLoading && summary?.notes_count === 0 && (
        <div className={`rounded-2xl border ${themeClasses.colors.border.primary} ${themeClasses.colors.bg.secondary} p-12 text-center`}>
          <Calendar className={`w-12 h-12 mx-auto mb-3 ${themeClasses.colors.text.tertiary} opacity-30`} />
          <p className={`${themeClasses.colors.text.secondary}`}>Нет записей за этот день</p>
        </div>
      )}

      {!summaryLoading && summary?.notes_count > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Emotions donut */}
          <div className={`rounded-2xl border ${themeClasses.colors.border.primary} ${themeClasses.colors.bg.secondary} p-5`}>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-4 h-4 text-pink-500" />
              <h3 className={`text-sm font-semibold ${themeClasses.colors.text.primary}`}>Эмоции дня</h3>
            </div>
            <div className="flex items-center gap-6">
              <div style={{ width: 160, height: 160, flexShrink: 0 }}>
                <canvas
                  ref={emotionChartRef}
                  role="img"
                  aria-label="Круговая диаграмма эмоций дня"
                >
                  Распределение эмоций за день
                </canvas>
              </div>
              <div className="space-y-2 flex-1">
                {Object.entries(summary.emotions || {}).slice(0, 5).map(([emotion, score]) => {
                  const meta = EMOTION_META[emotion] || { label: emotion, color: '#94a3b8', icon: '•' };
                  return (
                    <div key={emotion} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: meta.color }} />
                      <span className={`text-xs ${themeClasses.colors.text.secondary} flex-1`}>{meta.label}</span>
                      <span className={`text-xs font-medium ${themeClasses.colors.text.tertiary}`}>
                        {Math.round(score * 100)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Topics of the day */}
          <div className={`rounded-2xl border ${themeClasses.colors.border.primary} ${themeClasses.colors.bg.secondary} p-5`}>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-indigo-500" />
              <h3 className={`text-sm font-semibold ${themeClasses.colors.text.primary}`}>Темы дня</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.top_topics || {}).map(([topic, count]) => {
                const max = Math.max(...Object.values(summary.top_topics));
                const weight = count / max;
                const fontSize = 11 + Math.round(weight * 8);
                return (
                  <span
                    key={topic}
                    className="px-3 py-1.5 rounded-full font-medium transition-all hover:scale-105 cursor-default"
                    style={{
                      fontSize,
                      background: `rgba(99,102,241,${0.08 + weight * 0.18})`,
                      color: isDark ? '#a5b4fc' : '#4338ca',
                      border: `1px solid rgba(99,102,241,${0.15 + weight * 0.2})`,
                    }}
                  >
                    {topic}
                    {count > 1 && (
                      <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.6 }}>×{count}</span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Notes list */}
          <div className={`md:col-span-2 rounded-2xl border ${themeClasses.colors.border.primary} ${themeClasses.colors.bg.secondary} p-5`}>
            <h3 className={`text-sm font-semibold ${themeClasses.colors.text.primary} mb-4`}>
              Записи за {selectedDate}
            </h3>
            <div className="space-y-3">
              {summary.notes?.map(note => (
                <div
                  key={note.id}
                  className={`p-4 rounded-xl border ${themeClasses.colors.border.primary} ${themeClasses.colors.bg.primary} hover:border-indigo-500/30 transition-colors`}
                >
                  <p className={`text-sm font-medium ${themeClasses.colors.text.primary}`}>
                    {note.title || 'Без названия'}
                  </p>
                  <p className={`text-xs mt-1 ${themeClasses.colors.text.tertiary}`}>{note.preview}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Секция: Настроение (без изменений)
// ─────────────────────────────────────────────────────────────────────────

function MoodSection({ profile, moodHistory, themeClasses, isDark }) {
  const compareChartRef = useRef(null);
  const chartInst = useRef(null);

  useEffect(() => {
    if (!compareChartRef.current || !profile.mood_timeline?.length) return;
    if (chartInst.current) chartInst.current.destroy();

    const timeline = profile.mood_timeline.slice(-30);
    const userMoodData = timeline.map(d => {
      const saved = moodHistory[d.date];
      if (!saved) return null;
      return Math.round((MOODS.find(m => m.id === saved)?.value || 0.5) * 100);
    });

    chartInst.current = new Chart(compareChartRef.current, {
      type: 'line',
      data: {
        labels: timeline.map(d => d.date.slice(5)),
        datasets: [
          {
            label: 'ИИ',
            data: timeline.map(d => Math.round(d.score * 100)),
            borderColor: '#6366f1',
            borderWidth: 2,
            borderDash: [],
            pointRadius: 3,
            fill: false,
            tension: 0.4,
          },
          {
            label: 'Ты',
            data: userMoodData,
            borderColor: '#f59e0b',
            borderWidth: 2,
            borderDash: [5, 3],
            pointRadius: 5,
            pointBackgroundColor: '#f59e0b',
            fill: false,
            tension: 0.3,
            spanGaps: true,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? '#1e293b' : '#fff',
            titleColor: isDark ? '#e2e8f0' : '#0f172a',
            bodyColor: isDark ? '#94a3b8' : '#475569',
            borderWidth: 1,
            borderColor: isDark ? '#334155' : '#e2e8f0',
          }
        },
        scales: {
          x: {
            grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
            ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 11 }, maxTicksLimit: 8 }
          },
          y: {
            min: 0, max: 100,
            grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
            ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 11 }, callback: v => `${v}%` }
          }
        }
      }
    });
    return () => chartInst.current?.destroy();
  }, [profile, moodHistory, isDark]);

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border ${themeClasses.colors.border.primary} ${themeClasses.colors.bg.secondary} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-500" />
            <h3 className={`text-sm font-semibold ${themeClasses.colors.text.primary}`}>
              ИИ vs твоя самооценка
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs">
            {[
              { color: '#6366f1', label: 'ИИ', dash: false },
              { color: '#f59e0b', label: 'Ты', dash: true },
            ].map(({ color, label, dash }) => (
              <div key={label} className="flex items-center gap-1.5">
                <svg width="20" height="8">
                  <line
                    x1="0" y1="4" x2="20" y2="4"
                    stroke={color}
                    strokeWidth="2"
                    strokeDasharray={dash ? '4 2' : '0'}
                  />
                </svg>
                <span className={themeClasses.colors.text.tertiary}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: 260 }}>
          <canvas
            ref={compareChartRef}
            role="img"
            aria-label="Сравнение настроения от ИИ и пользователя"
          >
            Сравнение оценок настроения
          </canvas>
        </div>
        <p className={`text-xs mt-3 ${themeClasses.colors.text.tertiary}`}>
          Отмечай своё настроение на вкладке «День» — оно появится на этом графике
        </p>
      </div>

      {/* Mood calendar */}
      <MoodCalendar
        moodHistory={moodHistory}
        profile={profile}
        themeClasses={themeClasses}
        isDark={isDark}
      />
    </div>
  );
}

function MoodCalendar({ moodHistory, profile, themeClasses, isDark }) {
  const today = new Date();
  const days = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 34 + i);
    return d.toISOString().split('T')[0];
  });

  const aiScores = Object.fromEntries(
    (profile.mood_timeline || []).map(d => [d.date, d.score])
  );

  return (
    <div className={`rounded-2xl border ${themeClasses.colors.border.primary} ${themeClasses.colors.bg.secondary} p-5`}>
      <h3 className={`text-sm font-semibold ${themeClasses.colors.text.primary} mb-4`}>
        Календарь настроения (последние 35 дней)
      </h3>
      <div className="grid grid-cols-7 gap-1.5">
        {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => (
          <div key={d} className={`text-center text-xs pb-1 ${themeClasses.colors.text.tertiary}`}>{d}</div>
        ))}
        {days.map(date => {
          const userMoodId = moodHistory[date];
          const userColor = userMoodId ? MOODS.find(m => m.id === userMoodId)?.color : null;
          const aiScore = aiScores[date];
          const aiColor = aiScore != null
            ? (aiScore > 0.65 ? '#22c55e' : aiScore < 0.4 ? '#ef4444' : '#6366f1')
            : null;

          return (
            <div
              key={date}
              className="aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 relative"
              style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
              title={date}
            >
              <span className={`text-xs ${themeClasses.colors.text.tertiary}`} style={{ fontSize: 10 }}>
                {date.slice(8)}
              </span>
              <div className="flex gap-0.5">
                {aiColor && (
                  <div className="w-2 h-2 rounded-full" style={{ background: aiColor }} />
                )}
                {userColor && (
                  <div
                    className="w-2 h-2 rounded-full border"
                    style={{ background: userColor, borderColor: 'rgba(255,255,255,0.4)' }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className={themeClasses.colors.text.tertiary}>ИИ</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full border bg-amber-400" style={{ borderColor: 'rgba(255,255,255,0.4)' }} />
          <span className={themeClasses.colors.text.tertiary}>Ты</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Секция: Темы — ИСПРАВЛЕНО с d3-cloud
// ─────────────────────────────────────────────────────────────────────────

function TopicsSection({ profile, themeClasses, isDark }) {
  const cloudRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    const container = cloudRef.current;
    if (!container || !profile.tag_cloud?.length) return;

    // Удаляем предыдущий SVG
    if (svgRef.current) {
      svgRef.current.remove();
      svgRef.current = null;
    }

    const W = container.clientWidth || 800;
    const H = 440;

    // Цвет по тональности темы
    const getColor = (sentiment) => {
      if (sentiment === 'positive') return isDark ? '#4ade80' : '#16a34a';
      if (sentiment === 'negative') return isDark ? '#f87171' : '#dc2626';
      return isDark ? '#818cf8' : '#4338ca';
    };

    const words = profile.tag_cloud.slice(0, 60).map((item) => ({
      text: item.topic,
      size: Math.round(13 + Math.pow(item.weight, 0.6) * 44),
      sentiment: item.dominant_sentiment,
      count: item.count,
      weight: item.weight,
    }));

    cloud()
      .size([W, H])
      .words(words)
      .padding(6)
      .rotate(() => (Math.random() > 0.75 ? 90 : 0))
      .font('system-ui, -apple-system, sans-serif')
      .fontSize((d) => d.size)
      .on('end', (placed) => {
        const svg = d3
          .select(container)
          .append('svg')
          .attr('width', W)
          .attr('height', H)
          .attr('viewBox', `0 0 ${W} ${H}`)
          .style('overflow', 'visible');

        svgRef.current = svg.node();

        const g = svg
          .append('g')
          .attr('transform', `translate(${W / 2},${H / 2})`);

        g.selectAll('text')
          .data(placed)
          .enter()
          .append('text')
          .style('font-size', (d) => `${d.size}px`)
          .style('font-family', 'system-ui, -apple-system, sans-serif')
          .style('font-weight', (d) => (d.weight > 0.6 ? '600' : '400'))
          .style('fill', (d) => getColor(d.sentiment))
          .style('opacity', (d) => 0.55 + d.weight * 0.45)
          .style('cursor', 'default')
          .style('transition', 'opacity 0.2s, font-size 0.2s')
          .attr('text-anchor', 'middle')
          .attr('transform', (d) => `translate(${d.x},${d.y}) rotate(${d.rotate})`)
          .text((d) => d.text)
          .append('title')  // Tooltip
          .text((d) => `${d.text} · ${d.count} упоминаний`);

        // Hover-эффект
        g.selectAll('text')
          .on('mouseenter', function (event, d) {
            d3.select(this)
              .style('opacity', 1)
              .style('font-size', `${d.size * 1.1}px`);
          })
          .on('mouseleave', function (event, d) {
            d3.select(this)
              .style('opacity', 0.55 + d.weight * 0.45)
              .style('font-size', `${d.size}px`);
          });
      })
      .start();

    // Cleanup при unmount
    return () => {
      if (svgRef.current) {
        svgRef.current.remove();
        svgRef.current = null;
      }
    };
  }, [profile.tag_cloud, isDark]);

  return (
    <div className="space-y-6">
      {/* Word cloud */}
      <div
        className={`rounded-2xl border ${themeClasses.colors.border.primary} ${themeClasses.colors.bg.secondary} p-6`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-sm font-semibold ${themeClasses.colors.text.primary}`}>
              Облако тем
            </h3>
            <p className={`text-xs ${themeClasses.colors.text.tertiary} mt-0.5`}>
              Размер = частота · Цвет = тональность
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {[
              { color: isDark ? '#4ade80' : '#16a34a', label: 'Позитивные' },
              { color: isDark ? '#818cf8' : '#4338ca', label: 'Нейтральные' },
              { color: isDark ? '#f87171' : '#dc2626', label: 'Сложные' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className={themeClasses.colors.text.tertiary}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Контейнер для d3-cloud */}
        <div
          ref={cloudRef}
          style={{ minHeight: 440, width: '100%' }}
          className="overflow-hidden"
        />

        {profile.tag_cloud?.length === 0 && (
          <p className={`text-center py-16 text-sm ${themeClasses.colors.text.tertiary}`}>
            Напишите несколько заметок — темы появятся здесь
          </p>
        )}
      </div>

      {/* Weekly dynamics — без изменений */}
      {profile.topics_dynamics?.length > 0 && (
        <div
          className={`rounded-2xl border ${themeClasses.colors.border.primary} ${themeClasses.colors.bg.secondary} p-5`}
        >
          <h3 className={`text-sm font-semibold ${themeClasses.colors.text.primary} mb-5`}>
            Динамика тем по неделям
          </h3>
          <div className="space-y-4">
            {profile.topics_dynamics.slice(-8).reverse().map(({ week, topics }) => (
              <div key={week} className="flex items-start gap-4">
                <span
                  className={`text-xs ${themeClasses.colors.text.tertiary} w-16 shrink-0 pt-1.5 font-mono`}
                >
                  {week.slice(5)}
                </span>
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {topics.map(({ topic, count }) => (
                    <span
                      key={topic}
                      className="px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: isDark
                          ? 'rgba(99,102,241,0.15)'
                          : 'rgba(99,102,241,0.08)',
                        color: isDark ? '#a5b4fc' : '#4338ca',
                        border: '1px solid rgba(99,102,241,0.2)',
                      }}
                    >
                      {topic}
                      {count > 1 && (
                        <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.55 }}>
                          ×{count}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────
// Секция: Черты личности (без изменений)
// ─────────────────────────────────────────────────────────────────────────

function TraitsSection({ profile, themeClasses }) {
  const radarRef = useRef(null);
  const chartInst = useRef(null);

  useEffect(() => {
    if (!radarRef.current || !profile.traits?.length) return;
    if (chartInst.current) chartInst.current.destroy();

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    chartInst.current = new Chart(radarRef.current, {
      type: 'radar',
      data: {
        labels: profile.traits.map(t => t.name),
        datasets: [{
          data: profile.traits.map(t => Math.round(t.score * 100)),
          backgroundColor: 'rgba(99,102,241,0.12)',
          borderColor: '#6366f1',
          borderWidth: 2,
          pointBackgroundColor: '#6366f1',
          pointRadius: 5,
          pointHoverRadius: 7,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          r: {
            min: 0, max: 100,
            grid: { color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
            angleLines: { color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
            pointLabels: {
              color: isDark ? '#94a3b8' : '#475569',
              font: { size: 13 },
            },
            ticks: { display: false, stepSize: 25 }
          }
        }
      }
    });
    return () => chartInst.current?.destroy();
  }, [profile]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Radar */}
        <div className={`rounded-2xl border ${themeClasses.colors.border.primary} ${themeClasses.colors.bg.secondary} p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-amber-500" />
            <h3 className={`text-sm font-semibold ${themeClasses.colors.text.primary}`}>
              Профиль черт
            </h3>
          </div>
          <div style={{ height: 280 }}>
            <canvas
              ref={radarRef}
              role="img"
              aria-label="Радарный график черт личности"
            >
              Профиль черт личности
            </canvas>
          </div>
        </div>

        {/* Bars */}
        <div className={`rounded-2xl border ${themeClasses.colors.border.primary} ${themeClasses.colors.bg.secondary} p-5`}>
          <h3 className={`text-sm font-semibold ${themeClasses.colors.text.primary} mb-4`}>
            Детальный разбор
          </h3>
          <p className={`text-xs ${themeClasses.colors.text.tertiary} mb-5`}>
            Рассчитано автоматически. Обновляется с каждой записью.
          </p>
          <div className="space-y-5">
            {profile.traits.map(({ name, score, description }) => {
              const pct = Math.round(score * 100);
              const color = pct > 70 ? '#22c55e'
                : pct > 40 ? '#6366f1' : '#94a3b8';
              return (
                <div key={name}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-sm font-medium ${themeClasses.colors.text.primary}`}>{name}</span>
                    <span className="text-sm font-semibold" style={{ color }}>{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.1)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                  <p className={`text-xs mt-1 ${themeClasses.colors.text.tertiary}`}>{description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Утилиты
// ─────────────────────────────────────────────────────────────────────────

function StatPill({ label, value, color }) {
  const colors = {
    indigo: { bg: 'rgba(99,102,241,0.1)', text: '#818cf8', border: 'rgba(99,102,241,0.2)' },
    amber:  { bg: 'rgba(245,158,11,0.1)', text: '#fbbf24', border: 'rgba(245,158,11,0.2)' },
    green:  { bg: 'rgba(34,197,94,0.1)',  text: '#4ade80', border: 'rgba(34,197,94,0.2)' },
  };
  const c = colors[color];
  return (
    <div className="text-center px-4 py-2 rounded-xl" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <p className="text-xs mb-0.5" style={{ color: c.text }}>{label}</p>
      <p className="text-lg font-bold" style={{ color: c.text }}>{value}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-400">Строим твой профиль...</p>
      </div>
    </div>
  );
}

function EmptyState({ notesCount = 0 }) {
  return <InsightsOnboarding notesCount={notesCount} />;
}