import { notFound } from 'next/navigation';
import type { AdminPost, Category } from '@tactyqal/contracts';
import { api, ApiError } from '@/lib/api';
import { requireEditor } from '@/lib/session';
import { PostEditor } from '@/components/post-editor';
export default async function EditPost({ params }: {
    params: Promise<{
        id: string;
    }>;
}) {
    const token = await requireEditor();
    const { id } = await params;
    try {
        const [post, categories] = await Promise.all([api<AdminPost>(`/admin/posts/${encodeURIComponent(id)}`, {}, token), api<Category[]>('/categories')]);
        return <main id="main" className="shell studio-page"><PostEditor key={post.id} post={post} categories={categories}/></main>;
    }
    catch (error) {
        if (error instanceof ApiError && error.status === 404)
            notFound();
        throw error;
    }
}
