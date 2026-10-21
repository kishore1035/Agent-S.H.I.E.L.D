import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import '../styles/tailwind.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Nexus — Orchestrate, Heal and Sign Agent Runs',
  description:
    'Nexus lets platform engineers run multi-agent tasks, inspect sandboxed self-healing diffs, and verify Ed25519 signed receipts.',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${jetbrainsMono.variable}`}>
      <body id="root" className={jakarta.className}>{children}

        <script type="module" async src="https://static.rocket.new/rocket-web.js?_cfg=https%3A%2F%2Fnexusorche2523back.builtwithrocket.new&_be=https%3A%2F%2Fappanalytics.rocket.new&_v=0.1.21" />
        <script type="module" defer src="https://static.rocket.new/rocket-shot.js?v=0.0.3" /></body>
    </html>
  );
}