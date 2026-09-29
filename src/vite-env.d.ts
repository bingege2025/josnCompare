/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GA_ENABLED?: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
  readonly VITE_GA_API_SECRET?: string;
  readonly VITE_GA_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

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
