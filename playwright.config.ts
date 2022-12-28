import { expect, PlaywrightTestConfig } from '@playwright/test'

expect.extend({
  fail(_: null, msg: string) {
    return {
      message: () => msg,
      pass: false,
    }
  },
})

const config: PlaywrightTestConfig = {
  globalSetup: './playwright-setup.ts',
  timeout: 120_000, // 2min per test
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  testDir: './tests',
}
export default config
