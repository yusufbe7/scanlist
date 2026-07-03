import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
            manifest: {
                name: 'ScanList — Barcode Scanner',
                short_name: 'ScanList',
                description: "Supermarket xodimlari uchun tez barcode scan va eksport ilovasi",
                theme_color: '#1D8348',
                background_color: '#FFFFFF',
                display: 'standalone',
                orientation: 'portrait',
                start_url: '/',
                scope: '/',
                icons: [
                    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
                    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                    { src: 'icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
                    { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: function (_a) {
                            var url = _a.url;
                            return url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com';
                        },
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts',
                            expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }
                        }
                    }
                ]
            },
            devOptions: {
                enabled: true
            }
        })
    ],
    server: {
        host: true
    }
});
