import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Zap, TrendingUp, Tag, ChevronRight, Star } from 'lucide-react';
import { useTheme } from '../../shared/context/ThemeContext';
 
const STEPS = [
  {
    icon: '✍️',
    title: 'Пишите заметки',
    desc: 'Любые мысли, события, идеи — чем больше текста, тем точнее анализ.',
    threshold: 0,
  },
  {
    icon: '🧠',
    title: 'ИИ анализирует',
    desc: 'После каждой записи модель автоматически определяет эмоции, темы и тональность.',
    threshold: 1,
  },
  {
    icon: '🗺️',
    title: 'Карта личности',
    desc: 'После 5+ заметок появится ваш психологический профиль с динамикой по времени.',
    threshold: 5,
  },
];
 
export default function InsightsOnboarding({ notesCount = 0 }) {
  const { themeClasses } = useTheme();
  const navigate = useNavigate();
  const [animIn, setAnimIn] = useState(false);
 
  useEffect(() => {
    const t = setTimeout(() => setAnimIn(true), 50);
    return () => clearTimeout(t);
  }, []);
 
  const progress = Math.min(notesCount / 5, 1);
  const pct = Math.round(progress * 100);
 
  return (
    <div
      className={`max-w-2xl mx-auto py-16 px-6 transition-all duration-700 ${
        animIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="relative inline-block mb-6">
          <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-indigo-500 to-purple-600
            flex items-center justify-center shadow-xl shadow-indigo-500/25 mx-auto">
            <Brain className="w-10 h-10 text-white" />
          </div>
          {/* Пульсирующий ring */}
          <div className="absolute inset-0 rounded-3xl border-2 border-indigo-400/40
            animate-ping" style={{ animationDuration: '2s' }} />
        </div>
 
        <h1 className={`text-3xl font-bold ${themeClasses.colors.text.primary} mb-3`}>
          Ваш дневник ещё пуст
        </h1>
        <p className={`text-base ${themeClasses.colors.text.secondary} max-w-md mx-auto leading-relaxed`}>
          Начните писать — и система автоматически построит карту вашей личности
          на основе тем, эмоций и паттернов в текстах.
        </p>
      </div>
 
      {/* Прогресс */}
      <div className={`rounded-2xl border ${themeClasses.colors.border.primary}
        ${themeClasses.colors.bg.secondary} p-6 mb-8`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-sm font-medium ${themeClasses.colors.text.primary}`}>
            Прогресс до первого профиля
          </span>
          <span className="text-sm font-bold text-indigo-500">
            {notesCount} / 5 заметок
          </span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-linear-to-r from-indigo-500 to-purple-500
              transition-all duration-1000 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        {notesCount > 0 && (
          <p className={`text-xs mt-2 ${themeClasses.colors.text.tertiary}`}>
            {5 - notesCount} заметок до активации карты личности
          </p>
        )}
      </div>
 
      {/* Шаги */}
      <div className="space-y-4 mb-10">
        {STEPS.map((step, i) => {
          const done = notesCount >= step.threshold && i < 2
            ? true
            : notesCount >= step.threshold;
          return (
            <div
              key={i}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-300 ${
                done
                  ? `border-indigo-500/30 bg-indigo-500/5`
                  : `${themeClasses.colors.border.primary} ${themeClasses.colors.bg.primary} opacity-50`
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                done ? 'bg-indigo-500/15' : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                {step.icon}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold mb-0.5 ${
                  done ? themeClasses.colors.text.primary : themeClasses.colors.text.tertiary
                }`}>
                  {step.title}
                </p>
                <p className={`text-xs ${themeClasses.colors.text.tertiary} leading-relaxed`}>
                  {step.desc}
                </p>
              </div>
              {done && (
                <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center
                  justify-center shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3}
                      d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
 
      {/* CTA */}
      <div className="text-center">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-8 py-3.5
            bg-linear-to-r from-indigo-500 to-purple-600 text-white font-semibold
            rounded-2xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40
            hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <Zap className="w-5 h-5" />
          Написать первую заметку
          <ChevronRight className="w-4 h-4" />
        </button>
        <p className={`text-xs mt-3 ${themeClasses.colors.text.tertiary}`}>
          Анализ запускается автоматически после сохранения
        </p>
      </div>
    </div>
  );
}