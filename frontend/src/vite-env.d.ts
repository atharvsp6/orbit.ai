/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_HEALTH_API_URL?: string
  readonly VITE_PRIORITY_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
