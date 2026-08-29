require('@testing-library/jest-dom');

// jsdom does not expose the WHATWG encoding globals that React Router 7 imports at
// module load. Node has had them since 11; they just are not on jsdom's `window`.
const { TextDecoder, TextEncoder } = require('node:util');
if (!global.TextEncoder) global.TextEncoder = TextEncoder;
if (!global.TextDecoder) global.TextDecoder = TextDecoder;

// jsdom implements neither; layout code and scroll restoration call both.
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};

// jsdom has no IntersectionObserver or ResizeObserver; the map container uses one.
if (!global.IntersectionObserver) {
  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
if (!global.ResizeObserver) {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Testing Library gives an async query one second to settle. That is a tight budget
// for a full-app render — store, router, guards and a session round trip — inside a
// jsdom worker competing with several others, and it produced an occasional failure
// on assertions that were logically correct. Widening the budget removes the flake
// without weakening anything: a query that will never settle still fails, just later.
require('@testing-library/dom').configure({ asyncUtilTimeout: 5000 });

// Each test owns its own fetch stubbing; this just guarantees the global exists.
if (!global.fetch) global.fetch = () => Promise.reject(new Error('fetch not stubbed'));
