import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['tests/**/*.test.js'],
		exclude: ['tests/integration/**/*'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			include: ['routes/**/*.js', 'utils/**/*.js', 'index.js'],
			exclude: ['node_modules/', 'tests/'],
		},
		testTimeout: 30000,
		hookTimeout: 30000,
	},
});
