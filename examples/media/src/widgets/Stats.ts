import { connectHits } from 'instantsearch.js/es/connectors';
import {
  getTime,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';
import { getCurrentDate, formatNumber } from '../utils';

const currentDate = getCurrentDate();

function getDateRangeFromTimestamp(timestamps: number[]) {
  const [start, end] = timestamps;

  if (
    start === getTime(startOfDay(currentDate)) &&
    end === getTime(endOfDay(currentDate))
  ) {
    return 'Today';
  }

  if (
    start === getTime(startOfWeek(currentDate)) &&
    end === getTime(endOfWeek(currentDate))
  ) {
    return 'This week';
  }

  if (
    start === getTime(startOfMonth(currentDate)) &&
    end === getTime(endOfMonth(currentDate))
  ) {
    return 'This month';
  }

  if (
    start === getTime(startOfYear(currentDate)) &&
    end === getTime(endOfYear(currentDate))
  ) {
    return 'This year';
  }

  return '';
}

const statsWidget = connectHits(({ results, widgetParams }) => {
  if (!results) {
    return;
  }

  const containerNode = document.querySelector(widgetParams.container);
  const { nbHits } = results;

  const resultsStats = `${formatNumber(nbHits)} results`;

  const stringRefinements = results
    .getRefinements()
    .filter(refinement => refinement.type !== 'numeric')
    .filter(refinement => refinement.attributeName !== 'topics')
    .map(refinement => refinement.name);
  const dateRefinement = getDateRangeFromTimestamp(
    results
      .getRefinements()
      .filter(refinement => refinement.attributeName === 'date')
      .map(refinement => refinement.numericValue)
  );

  const refinements = [...stringRefinements, dateRefinement]
    .filter(Boolean)
    .map(refinement => `<strong>${refinement}</strong>`);

  containerNode.innerHTML = `
<div class="ais-Stats">
  <div class="ais-Stats-text">
    ${[
      [resultsStats, refinements.slice(0, 5).join(', ')]
        .filter(Boolean)
        .join(' in '),
      refinements.length > 5 && '...',
    ]
      .filter(Boolean)
      .join('')}
  </div>
</div>
`;
});

export const stats = statsWidget({
  container: '[data-widget="stats"]',
});
