import { defineConfig } from 'vite'
const {createVuePlugin} = require('vite-plugin-vue2')
import legacyFn from '@vitejs/plugin-legacy'
const {VitePWA} = require('vite-plugin-pwa')
const path = require('path')
const {visualizer} = require('rollup-plugin-visualizer')

const pathSrc = path.resolve(__dirname, './src')

// the @use rules have to be the first in the compiled stylesheets
const SCSS_IMPORT_PREFIX = `@use "sass:math";
@import "${pathSrc}/styles/variables";`

const isModernBuild = Boolean(process.env.BUILD_MODERN_ONLY)
const legacy = isModernBuild
	? undefined
	: legacyFn({
		// recommended by browserslist => https://github.com/vitejs/vite/tree/main/packages/plugin-legacy#targets
		targets: ['defaults', 'not IE 11'],
	})

if (isModernBuild) {
	console.log('Building "modern-only" build')
} else {
	console.log('Building "legacy" build with "@vitejs/plugin-legacy"')
}

export default defineConfig({
	css: {
		preprocessorOptions: {
			scss: { additionalData: SCSS_IMPORT_PREFIX },
		},
	},
	plugins: [
		createVuePlugin(),
		legacy,
		VitePWA({
			srcDir: 'src',
			filename: 'sw.js',
			base: '/',
			strategies: 'injectManifest',
			injectRegister: false,
			manifest: {
				name: 'Vikunja',
				short_name: 'Vikunja',
				theme_color: '#1973ff',
				icons: [
					{
						src: './images/icons/android-chrome-192x192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: './images/icons/android-chrome-512x512.png',
						sizes: '512x512',
						type: 'image/png',
					},
					{
						src: './images/icons/icon-maskable.png',
						sizes: '1024x1024',
						type: 'image/png',
						purpose: 'maskable',
					},
				],
				start_url: '.',
				display: 'standalone',
				background_color: '#000000',
				shortcuts: [
					{
						name: 'Overview',
						url: '/',
					},
					{
						name: 'Namespaces And Lists Overview',
						short_name: 'Namespaces & Lists',
						url: '/namespaces',
					},
					{
						name: 'Tasks Next Week',
						short_name: 'Next Week',
						url: '/tasks/by/week',
					},
					{
						name: 'Tasks Next Month',
						short_name: 'Next Month',
						url: '/tasks/by/month',
					},
					{
						name: 'Teams Overview',
						short_name: 'Teams',
						url: '/teams',
					},
				],
			},
		}),
	],
	resolve: {
		alias: [
			{
				find: '@',
				replacement: path.resolve(__dirname, 'src'),
			},
		],
		extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
	},
	server: {
		port: 5000,
		strictPort: true,
	},
	build: {
		rollupOptions: {
			plugins: [
				visualizer(),
			],
			output: {
				manualChunks: {
					'user-settings': [
						'./src/views/user/PasswordReset',
						'./src/views/user/RequestPasswordReset',
						'./src/views/user/Settings',
					],
					'settings': [
						'./src/views/list/NewList',
						'./src/views/namespaces/NewNamespace',
						'./src/views/teams/EditTeam',
						'./src/views/teams/NewTeam',
					],
					'highlight': [
						'highlight.js',
					],
				},
			},
		},
	},
})
