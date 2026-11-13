import type { AdminPost, PageResult } from '@tactyqal/contracts';
import { api } from '@/lib/api';
import { requireEditor } from '@/lib/session';
export default async function Posts({ searchParams }: {
    searchParams: Promise<{
        status?: string;
        page?: string;
    }>;
}) {
    const params = await searchParams;
    const status = ['draft', 'published'].includes(params.status || '') ? params.status! : '';
    const page = /^[1-9]\d{0,2}$/.test(params.page || '') ? params.page! : '1';
    const result = await api<PageResult<AdminPost>>(`/admin/posts?${new URLSearchParams({ status, page })}`, {}, await requireEditor());
    return <main id="main" className="shell studio-page"><div className="studio-heading"><div><h1>Your fieldnotes.</h1><p>A place for ideas in progress and stories ready to share.</p></div><a className="button" href="/studio/posts/new">Create a draft <span aria-hidden="true">+</span></a></div><nav className="topics" aria-label="Post status">{['', 'draft', 'published'].map(s => <a key={s} href={`/studio/posts?status=${s}`} aria-current={status === s ? 'page' : undefined}>{s ? s[0].toUpperCase() + s.slice(1) : 'All posts'}</a>)}</nav>
    {result.items.length === 0 ? <section className="empty-state"><h2>A fresh page.</h2><p>No posts match this view. Start a draft or choose another status.</p><a href="/studio/posts/new" className="button">Create your first draft</a></section> : <div className="post-list"><div className="list-labels"><span>Title</span><span>Status</span><span>Updated</span></div>{result.items.map(p => <a className="post-row" key={p.id} href={`/studio/posts/${p.id}`}><span><strong>{p.title}</strong><small>/{p.slug}</small></span><span className={`status ${p.status}`}>{p.status}</span><time dateTime={p.updatedAt}>{new Date(p.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}</time></a>)}</div>}
    {result.pagination.totalPages > 1 && <nav className="pagination" aria-label="Studio pages">{result.pagination.page > 1 ? <a href={`/studio/posts?status=${status}&page=${result.pagination.page - 1}`}>← Previous</a> : <span />}<span>Page {page} of {result.pagination.totalPages}</span>{result.pagination.page < result.pagination.totalPages ? <a href={`/studio/posts?status=${status}&page=${result.pagination.page + 1}`}>Next →</a> : <span />}</nav>}
  </main>;
}
