/// <reference types="vite/client" />

import type { AxeResults } from 'axe-core';

interface AxeMatchers {
  toHaveNoViolations(): void;
}

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Assertion<T = AxeResults> extends AxeMatchers {}
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
