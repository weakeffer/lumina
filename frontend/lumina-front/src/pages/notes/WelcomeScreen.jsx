import React from 'react';
import { Zap, Sparkles, Plus, Clock, Tag, Star } from 'lucide-react';
import { useTheme } from './ThemeContext';

const WelcomeScreen = ({ onNoteCreate, notes = [] }) => {
  const { themeClasses } = useTheme();

  const uniqueTags = [...new Set(notes.flatMap(n => n.tags || []))];

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <div className="max-w-4xl mx-auto">
        {/* Приветственный блок */}
        <div className={`mb-8 p-8 rounded-2xl ${themeClasses?.colors?.background?.secondary || 'bg-gray-50 dark:bg-gray-800'} bg-linear-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm animate-fadeIn`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-indigo-500/20 rounded-xl">
              <Sparkles className="w-8 h-8 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Добро пожаловать в Lumina Notes</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Ваше пространство для идей, мыслей и вдохновения
              </p>
            </div>
          </div>

          <button
            onClick={onNoteCreate}
            className="group flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all transform hover:scale-105 shadow-lg hover:shadow-indigo-500/25"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            Создать первую заметку
          </button>
        </div>

        {/* Быстрая статистика */}
        {notes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={Zap}
              value={notes.length}
              label="Всего заметок"
              color="indigo"
            />
            <StatCard
              icon={Star}
              value={notes.filter(n => n.isFavorite).length}
              label="Избранное"
              color="yellow"
            />
            <StatCard
              icon={Tag}
              value={uniqueTags.length}
              label="Теги"
              color="green"
            />
            <StatCard
              icon={Clock}
              value={notes.length > 0 ? new Date(notes[0]?.created_at).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short'
              }) : '—'}
              label="Последнее обновление"
              color="purple"
            />
          </div>
        )}

        {/* Недавние заметки */}
        {notes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Недавние заметки</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.slice(0, 4).map(note => (
                <RecentNoteCard key={note.id} note={note} />
              ))}
            </div>
          </div>
        )}

        {/* Советы по использованию */}
        <TipsSection notesCount={notes.length} />
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, value, label, color }) => {
  const colors = {
    indigo: 'bg-indigo-500/10 text-indigo-500',
    yellow: 'bg-yellow-500/10 text-yellow-500',
    green: 'bg-green-500/10 text-green-500',
    purple: 'bg-purple-500/10 text-purple-500',
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all hover:scale-105">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors[color] || colors.indigo}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
        </div>
      </div>
    </div>
  );
};

const RecentNoteCard = ({ note }) => {
  return (
    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-500/30 hover:shadow-md transition-all cursor-pointer group bg-white dark:bg-gray-800">
      <h3 className="font-medium mb-2 group-hover:text-indigo-500 transition-colors">
        {note.title || 'Без названия'}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
        {note.text}
      </p>
      <div className="flex items-center gap-2 mt-3">
        {note.tags?.slice(0, 3).map(tag => (
          <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
            #{tag}
          </span>
        ))}
        <span className="text-xs text-gray-500 dark:text-gray-500">
          {new Date(note.created_at).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short'
          })}
        </span>
      </div>
    </div>
  );
};

const TipsSection = ({ notesCount }) => (
  <div className="p-6 bg-linear-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-800 rounded-xl">
    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <Sparkles className="w-5 h-5 text-amber-500" />
      {notesCount === 0 ? 'Начните работу' : 'Советы по использованию'}
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <TipItem
        number="1"
        title="Используйте теги"
        description="Организуйте заметки с помощью тегов для быстрого поиска"
      />
      <TipItem
        number="2"
        title="Избранное"
        description="Помечайте важные заметки звездочкой"
      />
      <TipItem
        number="3"
        title="Поиск и фильтры"
        description="Находите нужные заметки за секунды"
      />
    </div>
  </div>
);

const TipItem = ({ number, title, description }) => (
  <div className="flex gap-3">
    <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
      {number}
    </div>
    <div>
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  </div>
);

export default WelcomeScreen;