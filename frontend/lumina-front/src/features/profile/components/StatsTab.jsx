import React, { useMemo } from 'react';
import {
  FileText,
  BookOpen,
  TrendingUp,
  Activity,
  Target,
  Layers,
  Award,
  Lock,
} from 'lucide-react';
import { HeroStatCard, MetricTile, ActivityBarRow } from '../../../shared/components/stats';

const StatsTab = ({ user, userStats, activityData, themeClasses, isOwnProfile = true }) => {
  const activityItems = useMemo(() => {
    if (!activityData?.length) return [];
    return activityData.map((day, idx) => ({
      key: `w-${idx}`,
      label: day.date,
      count: day.count,
    }));
  }, [activityData]);

  const hasActivity =
    isOwnProfile &&
    activityData?.length > 0 &&
    activityData.some((day) => day.count > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HeroStatCard
          gradientClass="from-indigo-500 to-indigo-600"
          label="Всего заметок"
          value={user?.total_notes || 0}
          icon={FileText}
          footerClassName="text-indigo-100"
          footer={
            <>
              <TrendingUp className="w-4 h-4 mr-1 shrink-0" />
              <span>
                {user?.total_notes > 0
                  ? `+${Math.round((user.total_notes / 30) * 100) / 100} в день`
                  : 'Нет активности'}
              </span>
            </>
          }
        />
        <HeroStatCard
          gradientClass="from-purple-500 to-purple-600"
          label="Всего слов"
          value={user?.total_words || 0}
          icon={BookOpen}
          footerClassName="text-purple-100"
          footer={
            <>
              <Activity className="w-4 h-4 mr-1 shrink-0" />
              <span>
                Средняя длина:{' '}
                {user?.total_notes ? Math.round(user.total_words / user.total_notes) : 0} слов
              </span>
            </>
          }
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricTile
          icon={Target}
          value={userStats?.streak || 0}
          label="Дней подряд"
          themeClasses={themeClasses}
          iconClassName="text-green-500"
          compact={false}
        />
        <MetricTile
          icon={Layers}
          value={userStats?.totalTags || 0}
          label="Тегов"
          themeClasses={themeClasses}
          iconClassName="text-blue-500"
          compact={false}
        />
        <MetricTile
          icon={Award}
          value={userStats?.achievements || 0}
          label="Достижения"
          themeClasses={themeClasses}
          iconClassName="text-yellow-500"
          compact={false}
        />
      </div>

      <div>
        <h3 className={`text-lg font-semibold ${themeClasses.colors.text.primary} mb-4 flex items-center`}>
          <Activity className="w-5 h-5 mr-2 text-indigo-500" />
          Активность за неделю
        </h3>
        <div className={`p-6 rounded-xl ${themeClasses.colors.bg.secondary}`}>
          {isOwnProfile ? (
            hasActivity ? (
              <>
                <ActivityBarRow
                  items={activityItems}
                  density="comfortable"
                  showTooltips
                  themeClasses={themeClasses}
                  narrowBars
                />
                <div className="flex justify-between mt-4 text-xs text-gray-400">
                  <span>Пн</span>
                  <span>Вт</span>
                  <span>Ср</span>
                  <span>Чт</span>
                  <span>Пт</span>
                  <span>Сб</span>
                  <span>Вс</span>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Activity className={`w-12 h-12 mx-auto mb-3 ${themeClasses.colors.text.tertiary}`} />
                <p className={themeClasses.colors.text.secondary}>Нет данных об активности</p>
                <p className={`text-sm ${themeClasses.colors.text.tertiary} mt-1`}>
                  Создайте заметки, чтобы увидеть график активности
                </p>
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <Lock className={`w-12 h-12 mx-auto mb-3 ${themeClasses.colors.text.tertiary}`} />
              <p className={themeClasses.colors.text.secondary}>Детальная активность скрыта</p>
              <p className={`text-sm ${themeClasses.colors.text.tertiary} mt-1`}>
                Публичная статистика: {user?.total_notes || 0} заметок, {user?.total_words || 0} слов
              </p>
            </div>
          )}
        </div>
      </div>

      <div className={`p-4 rounded-xl ${themeClasses.colors.bg.secondary}`}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className={`text-sm ${themeClasses.colors.text.tertiary}`}>Всего символов</p>
            <p className={`text-xl font-bold ${themeClasses.colors.text.primary}`}>
              {(user?.total_words || 0) * 5}
            </p>
          </div>
          <div>
            <p className={`text-sm ${themeClasses.colors.text.tertiary}`}>Средняя длина</p>
            <p className={`text-xl font-bold ${themeClasses.colors.text.primary}`}>
              {user?.total_notes ? Math.round(user.total_words / user.total_notes) : 0} слов
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsTab;
