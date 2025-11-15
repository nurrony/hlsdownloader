import { LocalStorage } from 'node-localstorage';

// Only polyfill if not already provided
if (typeof global.localStorage === 'undefined') {
  global.localStorage = new LocalStorage('./.jest-localstorage');
}
