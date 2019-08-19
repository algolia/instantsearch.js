export function isWindowMaxSize(size: number) {
  return window.matchMedia(`(max-width: ${size}px)`).matches;
}

export const isWindowMediumSize = isWindowMaxSize(1200);
