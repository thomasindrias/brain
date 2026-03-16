import '@testing-library/jest-dom';

// Mock ResizeObserver for ReactFlow tests
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
