const filtersButtons = [
  ...document.querySelectorAll('[data-action="toggle-filters"]'),
];
const filtersPanels = document.querySelector('#filters');
const body = document.querySelector('body');

function toggleFilters() {
  if (filtersPanels) {
    filtersPanels.classList.toggle('container-filters-panel--hidden');
  }
  body.classList.toggle('filtering');
}

export function enhanceUi() {
  // Add `id` to the search box input to link it
  // to the magnifier label.
  const searchBoxInput = document.querySelector('.ais-SearchBox-input');

  if (searchBoxInput) {
    searchBoxInput.id = 'search-input';
  }

  // Attach event listeners.
  filtersButtons.forEach(filtersButton => {
    filtersButton.addEventListener('click', toggleFilters);
  });
  const seeResultsButton = document.querySelector('.see-results-button');
  seeResultsButton.addEventListener('click', toggleFilters);
}
