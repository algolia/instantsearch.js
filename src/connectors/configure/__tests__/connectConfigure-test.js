import algoliasearchHelper, { SearchParameters } from 'algoliasearch-helper';

import connectConfigure from '../connectConfigure.js';

const fakeClient = { addAlgoliaAgent: () => {}, search: jest.fn() };

describe('connectConfigure', () => {
  let helper;

  beforeEach(() => {
    helper = algoliasearchHelper(fakeClient, '', {});
  });

  it('throws on bad usage', () => {
    // without searchParameters
    {
      const makeWidget = connectConfigure();
      expect(() => makeWidget()).toThrow();
    }

    // with a renderFn but no unmountFn
    {
      const makeWidget = connectConfigure(jest.fn(), undefined);
      expect(() => makeWidget({ searchParameters: {} })).toThrow();
    }

    // with a unmountFn but no renderFn
    {
      const makeWidget = connectConfigure(undefined, jest.fn());
      expect(() => makeWidget({ searchParameters: {} })).toThrow();
    }
  });

  it('should apply searchParameters', () => {
    const makeWidget = connectConfigure();
    const widget = makeWidget({ searchParameters: { analytics: true } });

    const config = widget.getConfiguration(SearchParameters.make({}));
    expect(config).toEqual({ analytics: true });
  });

  it('should apply searchParameters with a higher priority', () => {
    const makeWidget = connectConfigure();
    const widget = makeWidget({ searchParameters: { analytics: true } });

    {
      const config = widget.getConfiguration(
        SearchParameters.make({ analytics: false })
      );
      expect(config).toEqual({ analytics: true });
    }

    {
      const config = widget.getConfiguration(
        SearchParameters.make({ analytics: false, extra: true })
      );
      expect(config).toEqual({ analytics: true });
    }
  });

  it('should apply new searchParameters on refine()', () => {
    const makeWidget = connectConfigure();
    const widget = makeWidget({ searchParameters: { analytics: true } });

    helper.setState(widget.getConfiguration());
    widget.init({ helper });

    expect(widget.getConfiguration()).toEqual({ analytics: true });
    expect(helper.getState().analytics).toEqual(true);

    widget._refine({ hitsPerPage: 3 });

    expect(widget.getConfiguration()).toEqual({ hitsPerPage: 3 });
    expect(helper.getState().analytics).toBe(undefined);
    expect(helper.getState().hitsPerPage).toBe(3);
  });

  it('should dispose all the state set by configure', () => {
    const makeWidget = connectConfigure();
    const widget = makeWidget({ searchParameters: { analytics: true } });

    helper.setState(widget.getConfiguration());
    widget.init({ helper });

    expect(widget.getConfiguration()).toEqual({ analytics: true });
    expect(helper.getState().analytics).toBe(true);

    const nextState = widget.dispose({ state: helper.getState() });

    expect(nextState.analytics).toBe(undefined);
  });
});
