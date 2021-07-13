import { match, compile, parse } from 'path-to-regexp';
import qs from 'qs';
import { Router, UiState } from '../../types';

const setWindowTitle = (title?: string): void => {
  if (title) {
    window.document.title = title;
  }
};

export default function patternRouter<TRouteState extends object = UiState>({
  pattern,
  windowTitle,
  writeDelay = 400,
}: {
  pattern: string;
  windowTitle?: (routeState: TRouteState) => string;
  writeDelay?: number;
}) {
  const toPath = compile<TRouteState>(pattern, { encode: encodeURIComponent });
  const urlToParts = match<TRouteState>(pattern, {
    decode: decodeURIComponent,
  });
  const pathParameters = parse(pattern)
    .filter(
      <TKey>(token: TKey | string): token is TKey => typeof token !== 'string'
    )
    .map(token => token.name);

  let onPopState: (event: PopStateEvent) => void | undefined;
  let writeTimer: number | undefined;

  function parseURL(url: URL) {
    const res = urlToParts(url.pathname);

    if (res === false) {
      return {} as TRouteState;
    }

    const queryParams = qs.parse(url.search, {
      arrayLimit: 99,
      ignoreQueryPrefix: true,
    }) as TRouteState;

    return Object.assign({}, res.params, queryParams);
  }

  const router: Router<TRouteState> = {
    createURL(state) {
      // TODO: decide whether URL is needed here, or just location methods are fine?
      const url = new URL(window.location.href);

      url.pathname = toPath(state);

      // TODO: do this without needing polyfills
      const queryState = Object.fromEntries(
        Object.entries(state).filter(
          ([key]) => pathParameters.indexOf(key) === -1
        )
      );

      url.search = qs.stringify(queryState, { addQueryPrefix: true });

      return url.toString();
    },

    write(routeState) {
      const url = router.createURL(routeState);

      const title = windowTitle && windowTitle(routeState);

      if (writeTimer) {
        window.clearTimeout(writeTimer);
      }

      writeTimer = window.setTimeout(() => {
        setWindowTitle(title);

        window.history.pushState(routeState, title || '', url);
        writeTimer = undefined;
      }, writeDelay);
    },

    read() {
      return parseURL(new URL(window.location.href));
    },

    onUpdate(callback) {
      onPopState = event => {
        if (writeTimer) {
          window.clearTimeout(writeTimer);
          writeTimer = undefined;
        }

        const routeState = event.state;

        // At initial load, the state is read from the URL without update.
        // Therefore the state object is not available.
        // In this case, we fallback and read the URL.
        if (!routeState) {
          callback(this.read());
        } else {
          callback(routeState);
        }
      };

      window.addEventListener('popstate', onPopState);
    },

    dispose() {
      if (onPopState) {
        window.removeEventListener('popstate', onPopState);
      }

      if (writeTimer) {
        window.clearTimeout(writeTimer);
      }

      this.write({} as TRouteState);
    },
  };

  const title = windowTitle && windowTitle(router.read());

  setWindowTitle(title);

  return router;
}
