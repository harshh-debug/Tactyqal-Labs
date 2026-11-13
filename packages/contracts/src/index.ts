import { z } from 'zod';
export const slugSchema = z.string().trim().toLowerCase().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase words separated by hyphens.');
export const postInputSchema = z.object({
    title: z.string().trim().min(1, 'Add a title.').max(180),
    slug: slugSchema,
    excerpt: z.string().trim().max(500),
    body: z.string().max(100000),
    categoryId: z.uuid('Choose a category.'),
    coverPath: z.enum(['/covers/ideas.svg', '/covers/building.svg', '/covers/problems.svg']).nullable(),
    coverAlt: z.string().trim().max(250),
    status: z.enum(['draft', 'published']),
}).strict().superRefine((p, ctx) => {
    if (p.status === 'published') {
        if (!p.excerpt.trim())
            ctx.addIssue({ code: 'custom', path: ['excerpt'], message: 'Add an excerpt before publishing.' });
        if (!p.body.trim())
            ctx.addIssue({ code: 'custom', path: ['body'], message: 'Add article content before publishing.' });
        if (p.coverPath && !p.coverAlt.trim())
            ctx.addIssue({ code: 'custom', path: ['coverAlt'], message: 'Describe the cover before publishing.' });
    }
});
export const passwordSchema = z.string().min(1).max(72).refine(value => new TextEncoder().encode(value).length <= 72, 'Use a password of at most 72 UTF-8 bytes.');
export const loginSchema = z.object({ email: z.string().trim().toLowerCase().max(254).pipe(z.email()), password: passwordSchema }).strict();
export const pageSchema = z.coerce.number().int().min(1).max(1000).default(1);
export const listQuerySchema = z.object({ q: z.string().trim().max(120).default(''), category: z.string().max(120).regex(/^[a-z0-9-]*$/).default(''), page: pageSchema });
export type PostInput = z.infer<typeof postInputSchema>;
export interface Category {
    id: string;
    name: string;
    slug: string;
}
export interface PostSummary {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    coverPath: string | null;
    coverAlt: string;
    category: Category;
    author: {
        displayName: string;
    };
    publishedAt: string | null;
}
export interface Post extends PostSummary {
    body: string;
}
export interface AdminPost extends Post {
    status: 'draft' | 'published';
    firstPublishedAt: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface PageResult<T> {
    items: T[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}
export interface ApiErrorBody {
    error: {
        code: string;
        message: string;
        fieldErrors?: Record<string, string[]>;
    };
}
