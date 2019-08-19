import { panel } from 'instantsearch.js/es/widgets';
import { connectSortBy } from 'instantsearch.js/es/connectors';

const noop = () => {};

const sortBy = connectSortBy(
  (
    { widgetParams: { container, items }, currentRefinement, refine },
    isFirstRendering
  ) => {
    if (isFirstRendering) {
      // eslint-disable-next-line no-param-reassign
      container.innerHTML = `
      <div class="ais-NumericMenu">
        <ul class="ais-NumericMenu-list">
          ${items
            .map(
              item => `
            <li class="ais-NumericMenu-item ${
              currentRefinement === item.value
                ? 'ais-NumericMenu-item--selected'
                : ''
            }">
              <div>
                <label class="ais-NumericMenu-label">
                  <input
                    type="radio"
                    class="ais-NumericMenu-radio"
                    name="sortBy"
                    value="${item.value}"
                  />
                  <span class="ais-NumericMenu-labelText">${item.label}</span>
                </label>
              </div>
            </li>
            `
            )
            .join('')}
        </ul>
      </div>
    `;
      container.addEventListener('click', event => {
        const radioInput = container.querySelector(
          '.ais-NumericMenu-radio:checked'
        );
        if (radioInput) {
          const selectedValue = radioInput.value;
          refine(selectedValue);
        }
        event.target.blur();
      });
    }
    const selectedItem = container.querySelector(
      '.ais-NumericMenu-item--selected'
    );
    if (selectedItem) {
      selectedItem.classList.remove('ais-NumericMenu-item--selected');
    }
    const selectedRadioInput = container.querySelector(
      `.ais-NumericMenu-radio[value="${currentRefinement}"]`
    );
    if (selectedRadioInput) {
      const checkedListItem =
        selectedRadioInput.parentElement.parentElement.parentElement;
      checkedListItem.classList.add('ais-NumericMenu-item--selected');
    }
  },
  noop
);

const sortByWithPanel = panel({
  templates: {
    header: 'Sort By',
  },
})(sortBy);

export const sortByMobile = sortByWithPanel({
  container: '[data-widget="sort-by-mobile"]',
  items: [
    {
      label: 'Relevance',
      value: 'instant_search_media',
    },
    {
      label: 'Engagement',
      value: 'instant_search_media_engagement_desc',
    },
  ],
});
