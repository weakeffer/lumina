import React from 'react';
import MiniStatistics from './MiniStatistics';

/**
 * Панель статистики с расширенным блоком «Детали» (символы, среднее, дата).
 * Реализация общая с {@link MiniStatistics}; сохранён отдельный экспорт для обратной совместимости.
 */
const StatisticsPanel = ({ notes, tags, favorites, deletedCount, onClose, onTagClick }) => (
  <MiniStatistics
    notes={notes}
    tags={tags}
    favorites={favorites}
    deletedCount={deletedCount}
    onClose={onClose}
    onTagClick={onTagClick}
    showExtendedDetails
  />
);

export default StatisticsPanel;
export { StatisticsPanel };
