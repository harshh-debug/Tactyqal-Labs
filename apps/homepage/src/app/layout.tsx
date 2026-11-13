import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { siteUrl } from '@/lib/content';
const display = localFont({ src: '../../public/fonts/bricolage.woff2', variable: '--font-display', display: 'swap' });
const body = localFont({ src: '../../public/fonts/body.woff2', variable: '--font-body', display: 'swap' });
export const metadata: Metadata = {
    metadataBase: new URL(siteUrl), title: 'Tactyqal Labs — A small idea. A real app. Your eight weeks.',
    description: 'One-to-one mentoring for teens. Explore, design, build and launch your first app in an eight-week product studio. Book a free consultation.',
    robots: { index: false, follow: false },
    openGraph: { title: 'Build your first app in 8 weeks.', description: 'An eight-week, one-to-one product studio for teens.', images: [{ url: '/images/studio-hero.webp', width: 1536, height: 1024 }] },
};
export default function RootLayout({ children }: {
    children: React.ReactNode;
}) {
    return <html lang="en" className={`${display.variable} ${body.variable}`}><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;
}
