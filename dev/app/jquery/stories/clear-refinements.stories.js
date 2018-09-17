import { storiesOf } from 'dev-novel';
import { wrapWithHitsAndJquery } from '../../utils/wrap-with-hits.js';
import * as widgets from '../widgets/index.js';

const stories = storiesOf('ClearAll');

export default () => {
  stories.add(
    'default',
    wrapWithHitsAndJquery(
      containerNode => {
        window.search.addWidget(widgets.clearRefinements({ containerNode }));
      },
      {
        searchParameters: {
          disjunctiveFacetsRefinements: { brand: ['Apple'] },
          disjunctiveFacets: ['brand'],
        },
      }
    )
  );
};
