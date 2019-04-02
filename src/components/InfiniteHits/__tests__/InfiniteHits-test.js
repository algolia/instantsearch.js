import React from 'react';
import { mount } from 'enzyme';
import InfiniteHits from '../InfiniteHits';

describe('InfiniteHits', () => {
  const cssClasses = {
    root: 'root',
    emptyRoot: 'emptyRoot',
    item: 'item',
    list: 'list',
    loadMore: 'loadMore',
    disabledLoadMore: 'disabledLoadMore',
  };

  describe('markup', () => {
    it('should render <InfiniteHits /> on first page', () => {
      const hits = [
        {
          objectID: 'one',
          foo: 'bar',
        },
        {
          objectID: 'two',
          foo: 'baz',
        },
      ];

      const props = {
        hasShowPrevious: false,
        results: { hits },
        hits,
        isFirstPage: true,
        isLastPage: false,
        templateProps: {
          templates: {
            item: 'item',
            showMoreText: 'showMoreText',
          },
        },
        cssClasses,
      };

      const tree = mount(<InfiniteHits {...props} />);

      expect(tree).toMatchSnapshot();
    });

    it('should render <InfiniteHits /> on last page', () => {
      const hits = [
        {
          objectID: 'one',
          foo: 'bar',
        },
        {
          objectID: 'two',
          foo: 'baz',
        },
      ];

      const props = {
        hasShowPrevious: false,
        results: { hits },
        hits,
        isFirstPage: false,
        isLastPage: true,
        templateProps: {
          templates: {
            item: 'item',
            showMoreText: 'showMoreText',
          },
        },
        cssClasses,
      };

      const tree = mount(<InfiniteHits {...props} />);

      expect(tree).toMatchSnapshot();
    });

    it('should render <InfiniteHits /> without hits on first page', () => {
      const hits = [];

      const props = {
        hasShowPrevious: false,
        results: { hits },
        hits,
        isFirstPage: true,
        isLastPage: false,
        templateProps: {
          templates: {
            empty: 'empty',
            showMoreText: 'showMoreText',
          },
        },
        cssClasses,
      };

      const tree = mount(<InfiniteHits {...props} />);

      expect(tree).toMatchSnapshot();
    });

    it('should render <InfiniteHits /> without hits on last page', () => {
      const hits = [];

      const props = {
        hasShowPrevious: false,
        results: { hits },
        hits,
        isFirstPage: false,
        isLastPage: true,
        templateProps: {
          templates: {
            empty: 'empty',
            showMoreText: 'showMoreText',
          },
        },
        cssClasses,
      };

      const tree = mount(<InfiniteHits {...props} />);

      expect(tree).toMatchSnapshot();
    });

    it('should render <InfiniteHits /> with "Show previous" button on first page', () => {
      const hits = [
        {
          objectID: 'one',
          foo: 'bar',
        },
        {
          objectID: 'two',
          foo: 'baz',
        },
      ];

      const props = {
        hasShowPrevious: true,
        results: { hits },
        hits,
        isFirstPage: true,
        isLastPage: false,
        templateProps: {
          templates: {
            item: 'item',
            showMoreText: 'showMoreText',
            showPreviousText: 'showPreviousText',
          },
        },
        cssClasses,
      };

      const tree = mount(<InfiniteHits {...props} />);

      expect(tree).toMatchSnapshot();
    });

    it('should render <InfiniteHits /> with "Show previous" button on last page', () => {
      const hits = [
        {
          objectID: 'one',
          foo: 'bar',
        },
        {
          objectID: 'two',
          foo: 'baz',
        },
      ];

      const props = {
        hasShowPrevious: true,
        results: { hits },
        hits,
        isFirstPage: false,
        isLastPage: true,
        templateProps: {
          templates: {
            item: 'item',
            showMoreText: 'showMoreText',
            showPreviousText: 'showPreviousText',
          },
        },
        cssClasses,
      };

      const tree = mount(<InfiniteHits {...props} />);

      expect(tree).toMatchSnapshot();
    });
  });
});
