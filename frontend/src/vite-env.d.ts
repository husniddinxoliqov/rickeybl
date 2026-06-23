/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_TEST_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: {
    user?: {
      language_code?: string;
    };
  };
  ready: () => void;
  expand: () => void;
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
}
