import { expect, PlaywrightTestConfig } from '@playwright/test'

expect.extend({
  fail(_: null, msg: string) {
    return {
      message: () => msg,
      pass: false
    }
  }
})

const config: PlaywrightTestConfig = {
  globalSetup: './playwright-setup.ts',
  use: {
    baseURL: "http://localhost:3000",
    // trace: 'retain-on-failure',
  }
}
export default config