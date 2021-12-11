import { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  globalSetup: './playwright-setup.ts',
  use: {
    baseURL: "http://localhost:3000",
  }
}
export default config