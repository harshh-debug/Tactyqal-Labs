'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { AdminPost } from '@tactyqal/contracts';
import { loginSchema } from '@tactyqal/contracts';
import { api, ApiError } from '@/lib/api';
import { cookieName } from '@/lib/session';
export interface ActionState {
    message?: string;
    fieldErrors?: Record<string, string[]>;
    values?: Record<string, string>;
    saved?: AdminPost;
    expired?: boolean;
}
function failure(error: unknown): ActionState {
    if (error instanceof ApiError)
        return { message: error.message, fieldErrors: error.fieldErrors, expired: error.status === 401 };
    return { message: 'We couldn’t save this request. Your changes are still here. Please try again.' };
}
export async function signIn(_previous: ActionState, data: FormData): Promise<ActionState> {
    const parsed = loginSchema.safeParse({ email: data.get('email'), password: data.get('password') });
    if (!parsed.success)
        return { message: 'Enter a valid email and password.' };
    try {
        const result = await api<{
            token: string;
            expiresAt: string;
        }>('/auth/login', { method: 'POST', body: JSON.stringify(parsed.data) });
        (await cookies()).set(cookieName, result.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: new Date(result.expiresAt) });
    }
    catch (error) {
        return failure(error);
    }
    redirect('/studio/posts');
}
export async function signOut() {
    const jar = await cookies();
    const token = jar.get(cookieName)?.value;
    if (token) {
        try {
            await api('/auth/logout', { method: 'POST' }, token);
        }
        catch (error) {
            if (!(error instanceof ApiError && error.status === 401))
                throw error;
        }
    }
    jar.delete(cookieName);
    redirect('/studio/login');
}
export async function savePost(id: string | null, _previous: ActionState, data: FormData): Promise<ActionState> {
    const fields = ['title', 'slug', 'excerpt', 'body', 'categoryId', 'coverPath', 'coverAlt', 'intent'];
    const values = Object.fromEntries(fields.map(k => [k, String(data.get(k) || '')]));
    const token = (await cookies()).get(cookieName)?.value;
    if (!token)
        return { message: 'Your session has expired. Sign in again, then save these changes.', values, expired: true };
    if (values.intent === 'delete') {
        if (!id || data.get('confirmDelete') !== 'yes')
            return { message: 'Confirm deletion before continuing.', values };
        try {
            await api(`/admin/posts/${encodeURIComponent(id)}`, { method: 'DELETE' }, token);
        }
        catch (error) {
            const result = failure(error);
            if (result.expired)
                (await cookies()).delete(cookieName);
            return { ...result, values };
        }
        revalidatePath('/studio/posts');
        revalidatePath('/blog');
        redirect('/studio/posts');
    }
    try {
        const intent = values.intent;
        if (!['draft', 'published'].includes(intent))
            return { message: 'Choose Save draft, Publish, or Unpublish.', values };
        const payload = { title: values.title, slug: values.slug, excerpt: values.excerpt, body: values.body, categoryId: values.categoryId, coverPath: values.coverPath || null, coverAlt: values.coverAlt, status: intent };
        const saved = await api<AdminPost>(id ? `/admin/posts/${encodeURIComponent(id)}` : '/admin/posts', { method: id ? 'PATCH' : 'POST', body: JSON.stringify(payload) }, token);
        revalidatePath('/studio/posts');
        revalidatePath('/blog');
        revalidatePath(`/blog/${saved.slug}`);
        return { saved, message: saved.status === 'published' ? 'Published. Your article is available to readers.' : 'Draft saved. This post is private.' };
    }
    catch (error) {
        const result = failure(error);
        if (result.expired)
            (await cookies()).delete(cookieName);
        return { ...result, values };
    }
}
