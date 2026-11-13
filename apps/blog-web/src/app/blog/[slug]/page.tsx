import type { Metadata } from 'next';
import Image from 'next/image';
import type { PageResult, PostSummary } from '@tactyqal/contracts';
import { api, article } from '@/lib/api';
import { headings, Markdown } from '@/components/markdown';
import { PostCard } from '@/components/post-card';
type Props = {
    params: Promise<{
        slug: string;
    }>;
};
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    // With htmlLimitedBots: /.*/ this is blocking for browsers and bots. A
    // missing/unpublished article throws notFound before HTTP headers are sent.
    const post = await article((await params).slug);
    return { title: post.title, description: post.excerpt, alternates: { canonical: `/blog/${post.slug}` }, openGraph: { type: 'article', title: post.title, description: post.excerpt, ...(post.publishedAt ? { publishedTime: post.publishedAt } : {}), ...(post.coverPath ? { images: [{ url: post.coverPath, alt: post.coverAlt }] } : {}) } };
}
export default async function Article({ params }: Props) {
    const post = await article((await params).slug);
    const contents = headings(post.body);
    // Related content failure must never make an available article unreadable.
    const related = await api<PageResult<PostSummary>>(`/posts?category=${post.category.slug}`).then(r => r.items.filter(p => p.id !== post.id).slice(0, 3)).catch(() => []);
    return <main id="main" className="shell article-page"><a className="back-link" href="/blog">← All fieldnotes</a><header className="article-heading"><a className="category" href={`/blog?category=${post.category.slug}`}>{post.category.name}</a><h1>{post.title}</h1><p>{post.excerpt}</p><div className="byline"><span>{post.author.displayName}</span>{post.publishedAt && <time dateTime={post.publishedAt}>{new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}</time>}<span>{Math.max(1, Math.ceil(post.body.split(/\s+/).length / 200))} min read</span></div></header>
    {post.coverPath && <Image className="article-cover" src={post.coverPath} alt={post.coverAlt} width={1200} height={650} sizes="(max-width: 1200px) 100vw, 1120px"/>}
    <div className="article-body">{contents.length >= 3 && <nav className="contents" aria-label="In this article"><h2>In this fieldnote</h2><ol>{contents.map(h => <li key={h.id}><a href={`#${h.id}`}>{h.title}</a></li>)}</ol></nav>}<Markdown body={post.body}/></div>
    {related.length > 0 && <section className="related"><h2>Keep exploring.</h2><div className="post-grid">{related.map(p => <PostCard key={p.id} post={p}/>)}</div></section>}
  </main>;
}
