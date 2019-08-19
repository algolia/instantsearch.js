import instantsearch from 'instantsearch.js';
import { connectInfiniteHits } from 'instantsearch.js/es/connectors';
import { distanceInWords } from 'date-fns';
import { getCurrentDate } from '../utils';

const currentDate = getCurrentDate();

function createHit(hit, { isHighlighted }) {
  return `
<li class="ais-InfiniteHits-item${
    isHighlighted ? ' infinite-hits-item--highlighted' : ''
  }">
  <article class="card">
    <div class="card-image">
      <img src="${hit.image}" alt="${hit.title}">
    </div>

    <div class="card-content" data-layout="desktop">
      <header>
        ${
          hit.topics ? `<span class="card-subject">${hit.topics[0]}</span>` : ''
        }

        <h1 class="card-title">${instantsearch.highlight({
          attribute: 'title',
          hit,
        })}</h1>
      </header>

      <p class="card-description">${instantsearch.snippet({
        attribute: 'description',
        hit,
      })}</p>

      <footer>
        <span class="card-author">${hit.author}</span> – ${distanceInWords(
    currentDate,
    hit.date,
    { addSuffix: true }
  ).replace('about ', '')}
      </footer>
    </div>

    <div class="card-content" data-layout="mobile">
      <header>
      <h1 class="card-title">${instantsearch.highlight({
        attribute: 'title',
        hit,
      })}</h1>
      </header>

      <p class="card-mobile-footer">
        ${
          hit.topics ? `<span class="card-subject">${hit.topics[0]}</span>` : ''
        }
        <span class="card-timestamp">
          ${distanceInWords(currentDate, hit.date, {
            addSuffix: true,
          }).replace('about ', '')}
        </span>
      </p>
    </div>
  </article>
</li>
`;
}

function createPlaceholderHit({ isHighlighted }) {
  return `
<li class="ais-InfiniteHits-item${
    isHighlighted ? ' infinite-hits-item--highlighted' : ''
  }">
  <article class="card card--placeholder">
    <div class="card-image">
    </div>

    <div class="card-content">

    </div>
  </article>
</li>
`;
}

let globalIsLastPage = false;

const infiniteHits = connectInfiniteHits(
  ({ results, hits, showMore, isLastPage, widgetParams }, isFirstRender) => {
    const { container } = widgetParams;
    const containerNode = document.querySelector(container);

    globalIsLastPage = isLastPage;

    if (isFirstRender) {
      const hitsWrapper = document.createElement('div');
      hitsWrapper.classList.add('ais-InfiniteHits');
      const loadMoreTrigger = document.createElement('div');

      containerNode.appendChild(hitsWrapper);
      containerNode.appendChild(loadMoreTrigger);

      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !globalIsLastPage) {
            showMore();
          }
        });
      });

      observer.observe(loadMoreTrigger);

      containerNode.querySelector('div').innerHTML = `
<ol class="ais-InfiniteHits-list">
  ${[...Array(7)]
    .map((_, index) => createPlaceholderHit({ isHighlighted: index === 0 }))
    .join('')}
</ol>
`;

      return;
    }

    if (results.nbHits === 0) {
      containerNode.querySelector('div').innerHTML = `
<div class="infinite-hits-no-results-container">
  <svg width="138" height="138">
    <defs>
      <linearGradient id="c" x1="50%" x2="50%" y1="100%" y2="0%">
        <stop offset="0%" stop-color="#F5F5FA"/>
        <stop offset="100%" stop-color="#FFF"/>
      </linearGradient>
      <path id="b" d="M68.71 114.25a45.54 45.54 0 1 1 0-91.08 45.54 45.54 0 0 1 0 91.08z"/>
      <filter id="a" width="140.6%" height="140.6%" x="-20.3%" y="-15.9%" filterUnits="objectBoundingBox">
        <feOffset dy="4" in="SourceAlpha" result="shadowOffsetOuter1"/>
        <feGaussianBlur in="shadowOffsetOuter1" result="shadowBlurOuter1" stdDeviation="5.5"/>
        <feColorMatrix in="shadowBlurOuter1" result="shadowMatrixOuter1" values="0 0 0 0 0.145098039 0 0 0 0 0.17254902 0 0 0 0 0.380392157 0 0 0 0.15 0"/>
        <feOffset dy="2" in="SourceAlpha" result="shadowOffsetOuter2"/>
        <feGaussianBlur in="shadowOffsetOuter2" result="shadowBlurOuter2" stdDeviation="1.5"/>
        <feColorMatrix in="shadowBlurOuter2" result="shadowMatrixOuter2" values="0 0 0 0 0.364705882 0 0 0 0 0.392156863 0 0 0 0 0.580392157 0 0 0 0.2 0"/>
        <feMerge>
          <feMergeNode in="shadowMatrixOuter1"/>
          <feMergeNode in="shadowMatrixOuter2"/>
        </feMerge>
      </filter>
      <linearGradient id="d" x1="50%" x2="50%" y1="0%" y2="100%">
        <stop offset="0%" stop-color="#7354AF"/>
        <stop offset="100%" stop-color="#6779E3"/>
      </linearGradient>
    </defs>
    <g fill="none" fill-rule="evenodd">
      <circle cx="68.85" cy="68.85" r="68.85" fill="#6878E1" opacity=".07"/>
      <circle cx="68.85" cy="68.85" r="52.95" fill="#6877E1" opacity=".08"/>
      <use fill="#000" filter="url(#a)" xlink:href="#b"/>
      <use fill="url(#c)" xlink:href="#b"/>
      <path d="M32.01 32.98c5-5 5.03-13.06.07-18.01a12.73 12.73 0 0 0-18 .07c-5 4.99-5.03 13.05-.07 18a12.73 12.73 0 0 0 18-.06zm2.5 2.5a16.29 16.29 0 0 1-23.02.08 16.29 16.29 0 0 1 .08-23.03 16.28 16.28 0 0 1 23.03-.08 16.28 16.28 0 0 1-.08 23.03zm1.08-1.08l-2.15 2.15 8.6 8.6 2.16-2.14-8.6-8.6z" fill="url(#d)" transform="translate(44 42.46)"/>
    </g>
  </svg>

  <p class="infinite-hits-no-results-paragraph">
    Sorry, we can't find any matches${
      results.query ? ` for "${results.query}"` : ''
    }.
  </p>
</div>
`;
      return;
    }

    containerNode.querySelector('div').innerHTML = `
<ol class="ais-InfiniteHits-list">
  ${hits
    .map((hit, index: number) =>
      createHit(hit, {
        isHighlighted:
          results.nbHits !== 3 && (index === 0 || results.nbHits === 2),
      })
    )
    .join('')}
</ol>

${
  results.nbHits > 0 && isLastPage
    ? `
<div class="infinite-hits-end">
  <p>${results.nbHits} results shown</p>
</div>
`
    : ''
}
`;
  }
);

export const articles = infiniteHits({
  container: '[data-widget="hits"]',
});
