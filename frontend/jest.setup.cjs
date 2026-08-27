require('@testing-library/jest-dom');

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
