import 'server-only';
import { z } from 'zod';
const httpUrl = z.url().refine(v => ['http:', 'https:'].includes(new URL(v).protocol), 'Expected an HTTP URL');
const config = z.object({ SITE_URL: httpUrl, HOMEPAGE_URL: httpUrl, BLOG_API_BASE_URL: httpUrl }).parse({ SITE_URL: process.env.SITE_URL || 'http://localhost:3001', HOMEPAGE_URL: process.env.HOMEPAGE_URL || 'http://localhost:3000', BLOG_API_BASE_URL: process.env.BLOG_API_BASE_URL || 'http://localhost:4000' });
export default config;
