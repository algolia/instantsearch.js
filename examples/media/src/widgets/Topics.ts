import { connectMenu } from 'instantsearch.js/es/connectors';

const menu = connectMenu(({ items, refine, widgetParams }) => {
  const { container } = widgetParams;
  const containerNode = document.querySelector(container);

  containerNode.innerHTML = `
  <div class="ais-RefinementList">
    <ul class="ais-RefinementList-list">
      ${items
        .filter(item => !item.isRefined)
        .slice(0, 5)
        .map(
          item => `
      <li class="ais-RefinementList-item">
        <label class="ais-RefinementList-label" data-value="${item.value}">
          <input
            type="checkbox"
            class="ais-RefinementList-checkbox"
            value="${item.value}"
            checked="${item.isRefined}"
          />
          <span class="ais-RefinementList-labelText">${item.label}</span>
          <span class="ais-RefinementList-count">${item.count}</span>
        </label>
      </li>
  `
        )
        .join('')}
    </ul>
  </div>
  `;

  [...containerNode.querySelectorAll('label')].forEach(element => {
    element.addEventListener('click', event => {
      event.preventDefault();

      refine(event.currentTarget.dataset.value);
    });
  });
});

export const topics = menu({
  container: '[data-widget="topics"]',
  attribute: 'topics',
  limit: 6,
});
