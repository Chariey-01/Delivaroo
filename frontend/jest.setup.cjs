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

// Each test owns its own fetch stubbing; this just guarantees the global exists.
if (!global.fetch) global.fetch = () => Promise.reject(new Error('fetch not stubbed'));
