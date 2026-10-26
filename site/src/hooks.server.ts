import type { Handle } from '@sveltejs/kit/hooks';

// Preload the self-hosted fonts with the page so text does not swap fonts after first paint.
export const handle: Handle = ({ event, resolve }) =>
  resolve(event, { preload: ({ type }) => type === 'js' || type === 'css' || type === 'font' });
