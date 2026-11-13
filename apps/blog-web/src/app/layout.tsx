import type { Metadata } from 'next';
import localFont from 'next/font/local';
import config from '@/lib/config';
import './globals.css';
const display = localFont({ src: '../../public/fonts/bricolage.woff2', variable: '--font-display', display: 'swap' });
const body = localFont({ src: '../../public/fonts/body.woff2', variable: '--font-body', display: 'swap' });
export const metadata: Metadata = { metadataBase: new URL(config.SITE_URL), title: { default: 'Fieldnotes — Tactyqal Labs', template: '%s · Tactyqal Fieldnotes' }, description: 'Practical notes for curious founders and young builders. A hire-a-thon concept publication.', robots: { index: false, follow: false } };
export default function Layout({ children }: {
    children: React.ReactNode;
}) { return <html lang="en" className={`${display.variable} ${body.variable}`}><body><a className="skip-link" href="#main">Skip to content</a><header className="publication-header shell"><a className="wordmark" href="/blog">tactyqal<span>fieldnotes</span></a><nav aria-label="Publication"><a href={config.HOMEPAGE_URL}>The program ↗</a><a href="/blog">All articles</a><a href="/studio/posts">Studio</a></nav></header>{children}<footer className="shell publication-footer"><a className="wordmark" href="/blog">tactyqal<span>fieldnotes</span></a><p>Hire-a-thon concept · Original synthetic guides</p><a href={config.HOMEPAGE_URL}>Back to the program ↗</a></footer></body></html>; }
