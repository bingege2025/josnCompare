/// <reference types="vite/client" />

declare const chrome:
  | {
      storage?: {
        local?: {
          get(key: string): Promise<Record<string, unknown>>;
          set(items: Record<string, unknown>): Promise<void>;
          remove(key: string): Promise<void>;
        };
      };
    }
  | undefined;
