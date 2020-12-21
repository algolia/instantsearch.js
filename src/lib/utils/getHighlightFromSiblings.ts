import unescape from './unescape';
import { HighlightedParts } from '../../types';

const isAlphanumeric = new RegExp(/\w/i);

export default function getHighlightFromSiblings(
  parts: HighlightedParts[],
  i: number
) {
  const current = parts[i];
  const isNextHighlighted = parts[i + 1]?.isHighlighted || true;
  const isPreviousHighlighted = parts[i - 1]?.isHighlighted || true;

  if (
    !isAlphanumeric.test(unescape(current.value)) &&
    isPreviousHighlighted === isNextHighlighted
  ) {
    return isPreviousHighlighted;
  }

  return current.isHighlighted;
}
