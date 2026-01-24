import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: 1,
    reporter: 'line',
    use: {
        baseURL: 'http://127.0.0.1:5174',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: 'npm run dev -- --port 5174',
        url: 'http://127.0.0.1:5174',
        reuseExistingServer: !process.env.CI,
    },
});
