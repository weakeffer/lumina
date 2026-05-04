import React, { useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_URL } from '../../shared/config';
import { Activity, TrendingUp, TrendingDown, Minus, Loader } from 'lucide-react';
import Chart from 'chart.js/auto';

const TRAIT_COLORS = {
  'Открытость':      { line: '#6366f1', fill: 'rgba(99,102,241,0.08)' },
  'Позитивность':    { line: '#22c55e', fill: 'rgba(34,197,94,0.08)' },
  'Рефлексивность':  { line: '#f59e0b', fill: 'rgba(245,158,11,0.08)' },
  'Эмоциональность': { line: '#ec4899', fill: 'rgba(236,72,153,0.08)' },
  'Регулярность':    { line: '#14b8a6', fill: 'rgba(20,184,166,0.08)' },
};

const TRAIT_ICONS = {
  'Открытость':      '🌟',
  'Позитивность':    '😊',
  'Рефлексивность':  '🤔',
  'Эмоциональность': '💖',
  'Регулярность':    '📅',
};

// Форматируем "2025-11" → "Ноя 2025"
const MONTHS_RU = ['Янв','Фев','Мар','Апр','Май','Июн',
                   'Июл','Авг','Сен','Окт','Ноя','Дек'];
function fmtMonth(key) {
  const [y, m] = key.split('-');
  return `${MONTHS_RU[parseInt(m) - 1]} ${y}`;
}

// Считаем тренд последних 3 точек
function getTrend(values) {
  if (!values || values.length < 2) return 'stable';
  const last = values.slice(-3);
  const delta = last[last.length - 1] - last[0];
  if (delta > 0.08) return 'up';
  if (delta < -0.08) return 'down';
  return 'stable';
}

function TrendBadge({ trend, value }) {
  const cfg = {
    up:     { icon: TrendingUp,   color: 'text-green-500',  bg: 'bg-green-500/10',  label: 'растёт' },
    down:   { icon: TrendingDown, color: 'text-red-400',    bg: 'bg-red-400/10',    label: 'снижается' },
    stable: { icon: Minus,        color: 'text-slate-400',  bg: 'bg-slate-400/10',  label: 'стабильно' },
  }[trend];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function TraitCard({ name, values, months, isDark }) {
  const chartRef = useRef(null);
  const instRef  = useRef(null);
  const color    = TRAIT_COLORS[name] || { line: '#94a3b8', fill: 'rgba(148,163,184,0.08)' };
  const trend    = getTrend(values);
  const current  = values?.[values.length - 1] ?? 0;
  const pct      = Math.round(current * 100);

  useEffect(() => {
    if (!chartRef.current || !values?.length) return;
    instRef.current?.destroy();

    instRef.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: months.map(fmtMonth),
        datasets: [{
          data: values.map(v => Math.round(v * 100)),
          borderColor: color.line,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: color.line,
          fill: true,
          backgroundColor: color.fill,
          tension: 0.4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#fff',
          titleColor: isDark ? '#e2e8f0' : '#0f172a',
          bodyColor: isDark ? '#94a3b8' : '#475569',
          borderWidth: 1,
          borderColor: isDark ? '#334155' : '#e2e8f0',
          callbacks: { label: ctx => `${ctx.parsed.y}%` },
        }},
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: isDark ? '#64748b' : '#94a3b8',
              font: { size: 10 },
              maxTicksLimit: 6,
            },
          },
          y: {
            min: 0, max: 100,
            grid: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
            ticks: {
              color: isDark ? '#64748b' : '#94a3b8',
              font: { size: 10 },
              callback: v => `${v}%`,
              maxTicksLimit: 4,
            },
          },
        },
      },
    });

    return () => instRef.current?.destroy();
  }, [values, months, isDark]);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700
      bg-white dark:bg-slate-800/60 p-5 hover:shadow-lg transition-shadow duration-200">

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{TRAIT_ICONS[name] || '•'}</span>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {name}
            </p>
            <TrendBadge trend={trend} value={pct} />
          </div>
        </div>
        {/* Текущее значение */}
        <div className="text-right">
          <p className="text-2xl font-bold" style={{ color: color.line }}>
            {pct}%
          </p>
          <p className="text-xs text-slate-400">сейчас</p>
        </div>
      </div>

      {/* Mini progress bar */}
      <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-700 mb-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color.line }}
        />
      </div>

      {/* Chart */}
      <div style={{ height: 100 }}>
        <canvas
          ref={chartRef}
          role="img"
          aria-label={`Динамика черты ${name}`}
        />
      </div>
    </div>
  );
}

export default function TraitsTimeline({ isDark, themeClasses }) {
  const { data, isLoading } = useQuery({
    queryKey: ['traits-timeline'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/notes/traits-timeline/`, {
        headers: { Authorization: `Token ${token}` },
      });
      return res.json();
    },
    staleTime: 10 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!data?.has_data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Activity className={`w-12 h-12 mb-4 opacity-20 ${themeClasses.colors.text.tertiary}`} />
        <p className={`text-base font-medium ${themeClasses.colors.text.primary} mb-1`}>
          Нет данных для динамики
        </p>
        <p className={`text-sm ${themeClasses.colors.text.tertiary}`}>
          Нужны заметки минимум за 2 разных месяца
        </p>
      </div>
    );
  }

  const { months, traits } = data;

  // Считаем общий тренд за всё время
  const overallTrend = Object.entries(traits).reduce((acc, [name, values]) => {
    if (values.length >= 2) {
      acc.push(values[values.length - 1] - values[0]);
    }
    return acc;
  }, []);
  const avgDelta = overallTrend.length
    ? overallTrend.reduce((a, b) => a + b, 0) / overallTrend.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary banner */}
      <div className={`rounded-2xl p-5 border
        ${avgDelta > 0.05
          ? 'border-green-500/20 bg-green-500/5'
          : avgDelta < -0.05
          ? 'border-red-400/20 bg-red-400/5'
          : `${themeClasses.colors.border.primary} ${themeClasses.colors.bg.secondary}`
        }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl
            ${avgDelta > 0.05 ? 'bg-green-500/15' : avgDelta < -0.05 ? 'bg-red-400/15' : 'bg-indigo-500/10'}`}>
            {avgDelta > 0.05 ? '📈' : avgDelta < -0.05 ? '📉' : '📊'}
          </div>
          <div>
            <p className={`text-sm font-semibold ${themeClasses.colors.text.primary}`}>
              {avgDelta > 0.05
                ? 'Общая динамика положительная'
                : avgDelta < -0.05
                ? 'Есть области для роста'
                : 'Стабильный профиль'}
            </p>
            <p className={`text-xs ${themeClasses.colors.text.tertiary}`}>
              {months.length} месяцев данных · {Object.keys(traits).length} черт отслеживается
            </p>
          </div>
        </div>
      </div>

      {/* Grid карточек */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Object.entries(traits).map(([name, values]) => (
          <TraitCard
            key={name}
            name={name}
            values={values}
            months={months}
            isDark={isDark}
          />
        ))}
      </div>

      {/* Footnote */}
      <p className={`text-xs text-center ${themeClasses.colors.text.tertiary} pb-2`}>
        Данные рассчитываются автоматически на основе ваших записей.
        Обновляются при добавлении новых заметок.
      </p>
    </div>
  );
}