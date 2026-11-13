'use client';
import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminPost, Category } from '@tactyqal/contracts';
import { savePost } from '@/app/studio/actions';
import { Markdown } from './markdown';
export function PostEditor({ post, categories }: {
    post?: AdminPost;
    categories: Category[];
}) {
    const router = useRouter();
    const [body, setBody] = useState(post?.body || '');
    const [preview, setPreview] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [state, action, pending] = useActionState(savePost.bind(null, post?.id || null), {});
    const current = state.saved || post;
    const isNew = !post;
    const values = state.values;
    const value = (key: string, fallback = '') => values?.[key] ?? fallback;
    useEffect(() => {
        if (!state.saved)
            return;
        if (isNew)
            router.replace(`/studio/posts/${state.saved.id}`);
        router.refresh();
    }, [state.saved, isNew, router]);
    const error = (name: string) => state.fieldErrors?.[name]?.join(' ');
    const status = current?.status || 'draft';
    return <form action={action} className="editor-form"><div className="editor-header"><div><a className="back-link" href="/studio/posts">← All posts</a><h1>{post ? 'Shape your fieldnote.' : 'Start something worth sharing.'}</h1><p><span className={`status ${status}`}>{status}</span>{current?.updatedAt && <span> Saved {new Date(current.updatedAt).toLocaleTimeString('en-GB')}</span>}</p></div><div className="editor-actions"><button className="button secondary" name="intent" value={status} disabled={pending}>{pending ? 'Saving…' : status === 'published' ? 'Save changes' : 'Save draft'}</button>{current && <button className="button" name="intent" value={status === 'published' ? 'draft' : 'published'} disabled={pending}>{status === 'published' ? 'Unpublish' : 'Publish'}</button>}</div></div>
    {state.message && <div className={`feedback ${state.saved ? 'success' : 'error'}`} role={state.saved ? 'status' : 'alert'}>{state.message}{state.expired && <> <a href="/studio/login" target="_blank" rel="noopener noreferrer">Sign in in a new tab</a>, then save again.</>}</div>}
    {!current && <p className="editor-note">Save your draft first. You can publish it once the required fields are ready.</p>}
    <div className="editor-layout"><div className="editor-main"><label htmlFor="title">Title</label><input id="title" name="title" key={`title-${current?.id}`} defaultValue={value('title', current?.title)} maxLength={180} required aria-invalid={!!error('title')} aria-describedby={error('title') ? 'title-error' : undefined}/>{error('title') && <p id="title-error" className="field-error">{error('title')}</p>}
    <label htmlFor="slug">Article URL</label><div className="slug-input"><span>/blog/</span><input id="slug" name="slug" defaultValue={value('slug', current?.slug)} readOnly={!!current?.firstPublishedAt} maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" required aria-invalid={!!error('slug')} aria-describedby="slug-help"/></div><p id="slug-help" className="field-help">{current?.firstPublishedAt ? 'This URL is locked because the article has been public.' : 'Use lowercase words separated by hyphens. This URL locks at first publication.'}</p>{error('slug') && <p className="field-error">{error('slug')}</p>}
    <label htmlFor="excerpt">Excerpt</label><textarea id="excerpt" name="excerpt" rows={3} defaultValue={value('excerpt', current?.excerpt)} maxLength={500} aria-invalid={!!error('excerpt')}/>{error('excerpt') && <p className="field-error">{error('excerpt')}</p>}
    <div className="body-label"><label htmlFor="body">Article content</label><div className="preview-switch"><button type="button" aria-pressed={!preview} onClick={() => setPreview(false)}>Write</button><button type="button" aria-pressed={preview} onClick={() => setPreview(true)}>Preview</button></div></div><textarea id="body" name="body" rows={20} value={body} onChange={e => setBody(e.target.value)} maxLength={100000} hidden={preview} aria-invalid={!!error('body')}/>{preview && <section aria-label="Markdown preview" className="preview-pane">{body ? <Markdown body={body}/> : <p>Your preview will appear as you write.</p>}</section>}{error('body') && <p className="field-error">{error('body')}</p>}<p className="field-help">Markdown supported. Raw HTML and remote images are disabled.</p></div>
    <aside className="editor-aside"><label htmlFor="categoryId">Topic</label><select id="categoryId" name="categoryId" defaultValue={value('categoryId', current?.category.id || categories[0]?.id)} required aria-invalid={!!error('categoryId')}>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>{error('categoryId') && <p className="field-error">{error('categoryId')}</p>}
    <label htmlFor="coverPath">Cover illustration</label><select id="coverPath" name="coverPath" defaultValue={value('coverPath', current?.coverPath || '')}><option value="">No cover</option><option value="/covers/ideas.svg">Ideas — warm ochre</option><option value="/covers/building.svg">Building — mint</option><option value="/covers/problems.svg">Problems — blue</option></select><label htmlFor="coverAlt">Cover description</label><input id="coverAlt" name="coverAlt" defaultValue={value('coverAlt', current?.coverAlt)} maxLength={250} aria-invalid={!!error('coverAlt')}/>{error('coverAlt') && <p className="field-error">{error('coverAlt')}</p>}<p className="field-help">A meaningful cover needs a description before publishing.</p>
    {current?.status === 'published' && <a className="text-link" href={`/blog/${current.slug}`} target="_blank" rel="noopener noreferrer">Open public article ↗</a>}
    {current && <div className="delete-area"><h2>Delete this post</h2><p>Deletion permanently removes this demo post.</p><label className="checkbox-label"><input type="checkbox" name="confirmDelete" value="yes" checked={confirmDelete} onChange={e => setConfirmDelete(e.target.checked)}/>I understand. Delete this post.</label><button className="danger" name="intent" value="delete" formNoValidate disabled={!confirmDelete || pending}>Delete post</button></div>}</aside></div>
  </form>;
}
