import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { api, ApiError } from './api';
export const cookieName = 'tactyqal_editor';
export const requireEditor = cache(async () => {
    const token = (await cookies()).get(cookieName)?.value;
    if (!token)
        redirect('/studio/login');
    try {
        await api('/admin/posts?page=1', {}, token);
    }
    catch (error) {
        if (error instanceof ApiError && error.status === 401)
            redirect('/studio/login?expired=1');
        throw error;
    }
    return token;
});
