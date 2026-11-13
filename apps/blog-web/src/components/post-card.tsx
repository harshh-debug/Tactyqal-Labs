import Image from 'next/image';
import type { PostSummary } from '@tactyqal/contracts';
export function PostCard({ post, lead = false }: {
    post: PostSummary;
    lead?: boolean;
}) { return <article className={lead ? 'post-card lead-story' : 'post-card'}><a href={`/blog/${post.slug}`} className="cover-link">{post.coverPath ? <Image src={post.coverPath} alt={post.coverAlt} width={960} height={640} sizes={lead ? '(max-width: 700px) 100vw, 55vw' : '(max-width: 700px) 100vw, 33vw'} className="cover"/> : <div className="cover cover-fallback" aria-hidden="true">Ideas worth exploring.</div>}</a><div className="post-card-copy"><a className="category" href={`/blog?category=${post.category.slug}`}>{post.category.name}</a><h2><a href={`/blog/${post.slug}`}>{post.title} <span aria-hidden="true">↗</span></a></h2><p>{post.excerpt}</p><div className="byline"><span>{post.author.displayName}</span>{post.publishedAt && <time dateTime={post.publishedAt}>{new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}</time>}</div></div></article>; }
