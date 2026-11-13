import type { Category } from '@tactyqal/contracts';
import { api } from '@/lib/api';
import { requireEditor } from '@/lib/session';
import { PostEditor } from '@/components/post-editor';
export default async function NewPost() { await requireEditor(); const categories = await api<Category[]>('/categories'); return <main id="main" className="shell studio-page"><PostEditor categories={categories}/></main>; }
