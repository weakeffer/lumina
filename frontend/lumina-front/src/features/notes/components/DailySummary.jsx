import React, { useState } from 'react';
import { Calendar, BarChart2, Tag, Smile, Frown, Meh, X, Brain } from 'lucide-react';
import { useDailySummary } from '../hooks/useAnalysis';
import { useTheme } from '../../../shared/context/ThemeContext';

const EMOTION_EMOJI = {
    joy: '😊', sadness: '😢', anger: '😠', fear: '😨',
    surprise: '😲', fatigue: '😴', interest: '🤔', neutral: '😐',
};

const EMOTION_LABELS_RU = {
    joy: 'Радость', sadness: 'Грусть', anger: 'Злость',
    fear: 'Тревога', surprise: 'Удивление', fatigue: 'Усталость',
    interest: 'Интерес', neutral: 'Нейтрально',
};

const MOOD_CONFIG = {
    positive: { icon: Smile, color: 'text-green-500', label: 'Позитивный день' },
    negative: { icon: Frown, color: 'text-red-500', label: 'Сложный день' },
    neutral:  { icon: Meh,   color: 'text-gray-400', label: 'Обычный день' },
};

export default function DailySummary({ onClose }) {
    const { themeClasses } = useTheme();
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const { data: summary, isLoading } = useDailySummary(selectedDate);

    const MoodIcon = MOOD_CONFIG[summary?.day_mood]?.icon || Meh;
    const moodColor = MOOD_CONFIG[summary?.day_mood]?.color || 'text-gray-400';
    const moodLabel = MOOD_CONFIG[summary?.day_mood]?.label || 'Обычный день';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl
                ${themeClasses.colors.bg.primary} border ${themeClasses.colors.border.primary}
                max-h-[90vh] overflow-y-auto`}>

                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b ${themeClasses.colors.border.primary}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className={`text-xl font-bold ${themeClasses.colors.text.primary}`}>
                                Сводка дня
                            </h2>
                            <p className={`text-sm ${themeClasses.colors.text.tertiary}`}>
                                AI-анализ твоих записей
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-lg hover:${themeClasses.colors.bg.secondary}`}>
                        <X className={`w-5 h-5 ${themeClasses.colors.text.tertiary}`} />
                    </button>
                </div>

                {/* Date picker */}
                <div className="p-6 pb-0">
                    <div className="flex items-center gap-3">
                        <Calendar className={`w-4 h-4 ${themeClasses.colors.text.tertiary}`} />
                        <input
                            type="date"
                            value={selectedDate}
                            max={today}
                            onChange={e => setSelectedDate(e.target.value)}
                            className={`px-3 py-2 rounded-lg border ${themeClasses.colors.border.primary}
                                ${themeClasses.colors.bg.secondary} ${themeClasses.colors.text.primary}
                                focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                        />
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {isLoading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {!isLoading && summary?.notes_count === 0 && (
                        <div className={`text-center py-8 ${themeClasses.colors.text.tertiary}`}>
                            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>Нет записей за этот день</p>
                        </div>
                    )}

                    {!isLoading && summary?.notes_count > 0 && (
                        <>
                            {/* Mood card */}
                            <div className={`p-4 rounded-xl ${themeClasses.colors.bg.secondary} flex items-center gap-4`}>
                                <MoodIcon className={`w-10 h-10 ${moodColor}`} />
                                <div>
                                    <p className={`font-semibold text-lg ${themeClasses.colors.text.primary}`}>
                                        {moodLabel}
                                    </p>
                                    <p className={`text-sm ${themeClasses.colors.text.tertiary}`}>
                                        {summary.notes_count} {summary.notes_count === 1 ? 'запись' : 'записей'} · {summary.total_words} слов
                                    </p>
                                </div>
                                <div className="ml-auto text-right">
                                    <p className={`text-2xl`}>
                                        {EMOTION_EMOJI[summary.dominant_emotion] || '😐'}
                                    </p>
                                    <p className={`text-xs ${themeClasses.colors.text.tertiary}`}>
                                        {EMOTION_LABELS_RU[summary.dominant_emotion] || 'Нейтрально'}
                                    </p>
                                </div>
                            </div>

                            {/* Emotions chart */}
                            {Object.keys(summary.emotions || {}).length > 0 && (
                                <div>
                                    <h3 className={`text-sm font-semibold ${themeClasses.colors.text.secondary} mb-3 flex items-center gap-2`}>
                                        <BarChart2 className="w-4 h-4" /> Эмоции дня
                                    </h3>
                                    <div className="space-y-2">
                                        {Object.entries(summary.emotions).map(([emotion, score]) => (
                                            <div key={emotion} className="flex items-center gap-3">
                                                <span className="text-lg w-7">{EMOTION_EMOJI[emotion] || '•'}</span>
                                                <span className={`text-sm w-24 ${themeClasses.colors.text.secondary}`}>
                                                    {EMOTION_LABELS_RU[emotion] || emotion}
                                                </span>
                                                <div className={`flex-1 h-2 rounded-full ${themeClasses.colors.bg.tertiary}`}>
                                                    <div
                                                        className="h-2 rounded-full bg-indigo-500 transition-all duration-500"
                                                        style={{ width: `${Math.round(score * 100)}%` }}
                                                    />
                                                </div>
                                                <span className={`text-xs w-10 text-right ${themeClasses.colors.text.tertiary}`}>
                                                    {Math.round(score * 100)}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Topics cloud */}
                            {Object.keys(summary.top_topics || {}).length > 0 && (
                                <div>
                                    <h3 className={`text-sm font-semibold ${themeClasses.colors.text.secondary} mb-3 flex items-center gap-2`}>
                                        <Tag className="w-4 h-4" /> Главные темы
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(summary.top_topics).map(([topic, count]) => {
                                            const maxCount = Math.max(...Object.values(summary.top_topics));
                                            const weight = count / maxCount;
                                            const size = weight > 0.7 ? 'text-base' : weight > 0.4 ? 'text-sm' : 'text-xs';
                                            return (
                                                <span key={topic}
                                                    className={`px-3 py-1.5 rounded-full ${size} font-medium
                                                        bg-indigo-100 dark:bg-indigo-900/30
                                                        text-indigo-700 dark:text-indigo-300
                                                        transition-all hover:scale-105 cursor-default`}
                                                    style={{ opacity: 0.5 + weight * 0.5 }}>
                                                    {topic}
                                                    {count > 1 && <span className="ml-1 opacity-60">×{count}</span>}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Notes list */}
                            <div>
                                <h3 className={`text-sm font-semibold ${themeClasses.colors.text.secondary} mb-3`}>
                                    Записи за день
                                </h3>
                                <div className="space-y-2">
                                    {summary.notes?.map(note => (
                                        <div key={note.id}
                                            className={`p-3 rounded-lg ${themeClasses.colors.bg.secondary} border ${themeClasses.colors.border.secondary}`}>
                                            <p className={`text-sm font-medium ${themeClasses.colors.text.primary}`}>
                                                {note.title || 'Без названия'}
                                            </p>
                                            <p className={`text-xs ${themeClasses.colors.text.tertiary} mt-1`}>
                                                {note.preview}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}