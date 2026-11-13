import 'server-only';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { ApiErrorBody, Post } from '@tactyqal/contracts';
import config from './config';
export class ApiError extends Error {
    constructor(public status: number, public code: string, message: string, public fieldErrors: Record<string, string[]> = {}) { super(message); }
}
export async function api<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
    let response: Response;
    try {
        response = await fetch(new URL(`/api/v1${path}`, config.BLOG_API_BASE_URL), { ...options, cache: 'no-store', signal: AbortSignal.timeout(15000), headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
    }
    catch {
        throw new ApiError(503, 'UNAVAILABLE', 'The publication is taking longer than expected. Please try again.');
    }
    if (!response.ok) {
        const error = await response.json().catch(() => null) as ApiErrorBody | null;
        throw new ApiError(response.status, error?.error?.code || 'UNAVAILABLE', error?.error?.message || 'The publication is temporarily unavailable. Please try again.', error?.error?.fieldErrors);
    }
    if (response.status === 204)
        return undefined as T;
    return response.json() as Promise<T>;
}
// Only memoizes within this server render; the underlying request is uncached.
export const article = cache(async (slug: string): Promise<Post> => {
    try {
        return await api<Post>(`/posts/${encodeURIComponent(slug)}`);
    }
    catch (error) {
        if (error instanceof ApiError && error.status === 404)
            notFound();
        throw error;
    }
});
