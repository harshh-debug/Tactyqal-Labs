import type { Category, PageResult, PostSummary } from '@tactyqal/contracts';
import { listQuerySchema } from '@tactyqal/contracts';
import { api } from '@/lib/api';
import { PostCard } from '@/components/post-card';
export const dynamic = 'force-dynamic';
export default async function Blog({ searchParams }: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const raw = await searchParams;
    const parsed = listQuerySchema.safeParse(raw);
    if (!parsed.success)
        return <main id="main" className="shell message-page"><h1>Let’s simplify that search.</h1><p>Use a short search, a topic, and a page number from 1 to 1000.</p><a className="button" href="/blog">Reset filters</a></main>;
    const { q, category, page } = parsed.data;
    const params = new URLSearchParams({ q, category, page: String(page) });
    const [result, categories] = await Promise.all([api<PageResult<PostSummary>>(`/posts?${params}`), api<Category[]>('/categories')]);
    const lead = !q && !category && page === 1 ? result.items[0] : null;
    const items = lead ? result.items.slice(1) : result.items;
    const url = (nextPage: number, topic = category) => `/blog?${new URLSearchParams({ q, category: topic, page: String(nextPage) })}`;
    return <main id="main" className="shell archive"><div className="archive-intro"><h1>A little curiosity.<br /><span>A new perspective.</span></h1><p>Practical notes on finding problems,<br />building products, and starting small.</p></div>
    <section aria-label="Find articles" className="discovery"><form action="/blog" method="get" className="search-form"><label htmlFor="q">Search fieldnotes</label><div><input id="q" type="search" name="q" defaultValue={q} placeholder="An idea, a question, a starting point…" maxLength={120}/><input type="hidden" name="category" value={category}/><button type="submit">Search <span aria-hidden="true">↗</span></button></div></form><nav className="topics" aria-label="Topics"><a href={url(1, '')} aria-current={!category ? 'page' : undefined}>All topics</a>{categories.map(c => <a key={c.id} href={url(1, c.slug)} aria-current={category === c.slug ? 'page' : undefined}>{c.name}</a>)}</nav></section>
    {(q || category) && <p className="results-summary">{result.pagination.total} {result.pagination.total === 1 ? 'article' : 'articles'}{q ? ` for “${q}”` : ''}{category ? ` in ${categories.find(c => c.slug === category)?.name || category}` : ''} · <a href="/blog">Clear filters</a></p>}
    {lead && <PostCard post={lead} lead/>}
    {result.items.length === 0 ? <section className="empty-state"><h2>No fieldnotes here yet.</h2><p>Try a different search or explore all topics.</p><a className="button" href="/blog">Show all articles</a></section> : <section aria-label="Articles" className="post-grid">{items.map(p => <PostCard key={p.id} post={p}/>)}</section>}
    {result.pagination.totalPages > 1 && <nav className="pagination" aria-label="Article pages">{page > 1 ? <a href={url(page - 1)}>← Previous</a> : <span />}<span>Page {page} of {result.pagination.totalPages}</span>{page < result.pagination.totalPages ? <a href={url(page + 1)}>Next →</a> : <span />}</nav>}
  </main>;
}
