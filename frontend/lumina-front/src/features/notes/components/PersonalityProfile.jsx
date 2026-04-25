import React, { useState } from 'react';
import { X, Brain, TrendingUp, Heart, Zap, Star, Calendar, Clock } from 'lucide-react';
import { usePersonalityProfile } from '../hooks/usePersonalityProfile';
import { useTheme } from '../../../shared/context/ThemeContext';

const EMOTION_EMOJI = {
    joy: '😊', sadness: '😢', anger: '😠', fear: '😨',
    surprise: '😲', fatigue: '😴', interest: '🤔', neutral: '😐',
};

const EMOTION_LABELS = {
    joy: 'Радость', sadness: 'Грусть', anger: 'Злость',
    fear: 'Тревога', surprise: 'Удивление', fatigue: 'Усталость',
    interest: 'Интерес', neutral: 'Нейтральность',
};

const SENTIMENT_COLORS = {
    positive: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    neutral:  'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    negative: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
};

export default function PersonalityProfile({ onClose }) {
    const { themeClasses } = useTheme();
    const { data: profile, isLoading } = usePersonalityProfile();
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Обзор', icon: Brain },
        { id: 'mood', label: 'Настроение', icon: TrendingUp },
        { id: 'topics', label: 'Темы', icon: Zap },
        { id: 'traits', label: 'Черты', icon: Star },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-4xl rounded-2xl shadow-2xl
                ${themeClasses.colors.bg.primary} border ${themeClasses.colors.border.primary}
                max-h-[90vh] flex flex-col`}>

                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b ${themeClasses.colors.border.primary} shrink-0`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-linear-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className={`text-xl font-bold ${themeClasses.colors.text.primary}`}>
                                Карта личности
                            </h2>
                            <p className={`text-sm ${themeClasses.colors.text.tertiary}`}>
                                Построена на основе твоих записей
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-lg hover:${themeClasses.colors.bg.secondary}`}>
                        <X className={`w-5 h-5 ${themeClasses.colors.text.tertiary}`} />
                    </button>
                </div>

                {/* Tabs */}
                <div className={`flex border-b ${themeClasses.colors.border.primary} shrink-0`}>
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all relative
                                    ${activeTab === tab.id
                                        ? `text-indigo-500 ${themeClasses.colors.text.primary}`
                                        : themeClasses.colors.text.tertiary
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading && (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {!isLoading && !profile?.has_data && (
                        <div className="text-center py-20">
                            <Brain className={`w-16 h-16 mx-auto mb-4 opacity-20 ${themeClasses.colors.text.tertiary}`} />
                            <p className={`text-lg font-medium ${themeClasses.colors.text.primary}`}>
                                Пока недостаточно данных
                            </p>
                            <p className={`text-sm mt-2 ${themeClasses.colors.text.tertiary}`}>
                                Напиши несколько заметок — карта личности появится автоматически
                            </p>
                        </div>
                    )}

                    {!isLoading && profile?.has_data && (
                        <>
                            {activeTab === 'overview' && (
                                <OverviewTab profile={profile} themeClasses={themeClasses} />
                            )}
                            {activeTab === 'mood' && (
                                <MoodTab profile={profile} themeClasses={themeClasses} />
                            )}
                            {activeTab === 'topics' && (
                                <TopicsTab profile={profile} themeClasses={themeClasses} />
                            )}
                            {activeTab === 'traits' && (
                                <TraitsTab profile={profile} themeClasses={themeClasses} />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Вкладка Обзор ─────────────────────────────────────────────────────────

function OverviewTab({ profile, themeClasses }) {
    const { stats, emotions_summary } = profile;

    const moodScore = Math.round(stats.avg_sentiment * 100);
    const moodLabel = moodScore > 65 ? 'Позитивное' : moodScore < 40 ? 'Сложное' : 'Нейтральное';
    const moodColor = moodScore > 65 ? 'text-green-500' : moodScore < 40 ? 'text-red-500' : 'text-gray-400';

    const activeHour = stats.most_active_hour;
    const timeOfDay = activeHour < 6 ? 'Ночью' : activeHour < 12 ? 'Утром'
        : activeHour < 18 ? 'Днём' : 'Вечером';

    return (
        <div className="space-y-6">
            {/* Ключевые метрики */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                    icon={<Calendar className="w-5 h-5" />}
                    value={stats.total_analyzed}
                    label="Проанализировано"
                    color="from-indigo-500 to-indigo-600"
                    themeClasses={themeClasses}
                />
                <MetricCard
                    icon={<Zap className="w-5 h-5" />}
                    value={`${stats.streak_days}д`}
                    label="Серия дней"
                    color="from-amber-500 to-orange-500"
                    themeClasses={themeClasses}
                />
                <MetricCard
                    icon={<TrendingUp className="w-5 h-5" />}
                    value={`${moodScore}%`}
                    label={moodLabel}
                    color={moodScore > 65 ? 'from-green-500 to-emerald-500' : moodScore < 40 ? 'from-red-500 to-rose-500' : 'from-gray-500 to-gray-600'}
                    themeClasses={themeClasses}
                />
                <MetricCard
                    icon={<Clock className="w-5 h-5" />}
                    value={timeOfDay}
                    label={`~${activeHour}:00`}
                    color="from-purple-500 to-violet-500"
                    themeClasses={themeClasses}
                />
            </div>

            {/* Топ эмоции */}
            <div>
                <h3 className={`text-sm font-semibold ${themeClasses.colors.text.secondary} mb-4 flex items-center gap-2`}>
                    <Heart className="w-4 h-4 text-red-400" />
                    Эмоциональный портрет
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {emotions_summary.slice(0, 6).map(({ emotion, score }) => (
                        <div key={emotion} className="flex items-center gap-3">
                            <span className="text-xl w-8">{EMOTION_EMOJI[emotion] || '•'}</span>
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span className={`text-sm ${themeClasses.colors.text.secondary}`}>
                                        {EMOTION_LABELS[emotion] || emotion}
                                    </span>
                                    <span className={`text-xs ${themeClasses.colors.text.tertiary}`}>
                                        {Math.round(score * 100)}%
                                    </span>
                                </div>
                                <div className={`h-2 rounded-full ${themeClasses.colors.bg.tertiary}`}>
                                    <div
                                        className="h-2 rounded-full bg-linear-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                                        style={{ width: `${Math.round(score * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Вкладка Настроение ────────────────────────────────────────────────────

function MoodTab({ profile, themeClasses }) {
    const { mood_timeline } = profile;

    if (!mood_timeline?.length) {
        return <EmptyState text="Недостаточно данных для графика" />;
    }

    const recent = mood_timeline.slice(-30);
    const maxCount = Math.max(...recent.map(d => d.count), 1);

    return (
        <div className="space-y-6">
            <div>
                <h3 className={`text-sm font-semibold ${themeClasses.colors.text.secondary} mb-4`}>
                    Настроение за последние 30 дней
                </h3>

                {/* График */}
                <div className={`p-4 rounded-xl ${themeClasses.colors.bg.secondary}`}>
                    <div className="flex items-end gap-1 h-32">
                        {recent.map((day, i) => {
                            const height = Math.round(day.score * 100);
                            const color = height > 65 ? 'bg-green-400'
                                : height < 40 ? 'bg-red-400' : 'bg-indigo-400';
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                                    <div
                                        className={`w-full rounded-t-sm ${color} transition-all duration-300 hover:opacity-80`}
                                        style={{ height: `${height}%`, minHeight: '4px' }}
                                    />
                                    {/* Подсказка */}
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2
                                        bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap
                                        opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                        {day.date.slice(5)} · {day.count} зап.
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {/* Метки оси */}
                    <div className="flex justify-between mt-2">
                        <span className={`text-xs ${themeClasses.colors.text.tertiary}`}>
                            {recent[0]?.date.slice(5)}
                        </span>
                        <span className={`text-xs ${themeClasses.colors.text.tertiary}`}>
                            {recent[recent.length - 1]?.date.slice(5)}
                        </span>
                    </div>
                </div>

                {/* Легенда */}
                <div className="flex gap-4 mt-3">
                    {[
                        { color: 'bg-green-400', label: 'Позитивный' },
                        { color: 'bg-indigo-400', label: 'Нейтральный' },
                        { color: 'bg-red-400', label: 'Сложный' },
                    ].map(({ color, label }) => (
                        <div key={label} className="flex items-center gap-1.5">
                            <div className={`w-3 h-3 rounded-sm ${color}`} />
                            <span className={`text-xs ${themeClasses.colors.text.tertiary}`}>{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Вкладка Темы ──────────────────────────────────────────────────────────

function TopicsTab({ profile, themeClasses }) {
    const { tag_cloud, topics_dynamics } = profile;

    if (!tag_cloud?.length) {
        return <EmptyState text="Недостаточно данных" />;
    }

    return (
        <div className="space-y-8">
            {/* Облако тегов */}
            <div>
                <h3 className={`text-sm font-semibold ${themeClasses.colors.text.secondary} mb-4`}>
                    Облако тем
                </h3>
                <div className={`p-6 rounded-xl ${themeClasses.colors.bg.secondary} flex flex-wrap gap-2`}>
                    {tag_cloud.map(({ topic, weight, count, dominant_sentiment }) => {
                        const fontSize = 12 + Math.round(weight * 16);
                        const opacityClass = weight > 0.6 ? 'opacity-100'
                            : weight > 0.3 ? 'opacity-80' : 'opacity-60';
                        const sentimentClass = SENTIMENT_COLORS[dominant_sentiment] || SENTIMENT_COLORS.neutral;

                        return (
                            <span
                                key={topic}
                                className={`px-3 py-1.5 rounded-full font-medium cursor-default
                                    transition-all hover:scale-110 ${sentimentClass} ${opacityClass}`}
                                style={{ fontSize: `${fontSize}px` }}
                                title={`Встречается ${count} раз`}
                            >
                                {topic}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Динамика по неделям */}
            {topics_dynamics?.length > 0 && (
                <div>
                    <h3 className={`text-sm font-semibold ${themeClasses.colors.text.secondary} mb-4`}>
                        Динамика тем по неделям
                    </h3>
                    <div className="space-y-3">
                        {topics_dynamics.slice(-8).reverse().map(({ week, topics }) => (
                            <div key={week} className="flex items-start gap-4">
                                <span className={`text-xs ${themeClasses.colors.text.tertiary} w-20 shrink-0 pt-1`}>
                                    {week.slice(5)}
                                </span>
                                <div className="flex flex-wrap gap-1.5 flex-1">
                                    {topics.map(({ topic, count }) => (
                                        <span
                                            key={topic}
                                            className={`px-2 py-0.5 rounded-full text-xs
                                                ${themeClasses.colors.bg.tertiary} ${themeClasses.colors.text.secondary}`}
                                        >
                                            {topic} {count > 1 && <span className="opacity-60">×{count}</span>}
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

// ── Вкладка Черты ─────────────────────────────────────────────────────────

function TraitsTab({ profile, themeClasses }) {
    const { traits } = profile;

    if (!traits?.length) {
        return <EmptyState text="Недостаточно данных" />;
    }

    return (
        <div className="space-y-4">
            <p className={`text-sm ${themeClasses.colors.text.tertiary} mb-6`}>
                Черты личности рассчитаны автоматически на основе паттернов твоих записей.
                Они обновляются с каждой новой заметкой.
            </p>
            {traits.map(({ name, score, description }) => {
                const percent = Math.round(score * 100);
                const color = percent > 70 ? 'from-green-500 to-emerald-400'
                    : percent > 40 ? 'from-indigo-500 to-purple-400'
                    : 'from-gray-400 to-gray-500';

                return (
                    <div key={name} className={`p-4 rounded-xl ${themeClasses.colors.bg.secondary}`}>
                        <div className="flex justify-between items-center mb-2">
                            <span className={`font-medium ${themeClasses.colors.text.primary}`}>
                                {name}
                            </span>
                            <span className={`text-sm font-semibold ${themeClasses.colors.text.secondary}`}>
                                {percent}%
                            </span>
                        </div>
                        <div className={`h-2.5 rounded-full ${themeClasses.colors.bg.tertiary} mb-2`}>
                            <div
                                className={`h-2.5 rounded-full bg-linear-to-r ${color} transition-all duration-700`}
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                        <p className={`text-xs ${themeClasses.colors.text.tertiary}`}>
                            {description}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}

// ── Утилиты ───────────────────────────────────────────────────────────────

function MetricCard({ icon, value, label, color, themeClasses }) {
    return (
        <div className={`p-4 rounded-xl bg-linear-to-br ${color} text-white`}>
            <div className="flex items-center gap-2 mb-2 opacity-80">
                {icon}
                <span className="text-xs">{label}</span>
            </div>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    );
}

function EmptyState({ text }) {
    return (
        <div className="text-center py-16 text-gray-400">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{text}</p>
        </div>
    );
}