import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
const id = (text: string) => text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
export function headings(body: string) { let inCode = false; const seen = new Map<string, number>(); return body.split('\n').flatMap(line => { if (/^\s*```/.test(line)) {
    inCode = !inCode;
    return [];
} const m = !inCode && /^## (.+)$/.exec(line); if (!m)
    return []; const base = id(m[1]); const count = seen.get(base) || 0; seen.set(base, count + 1); return [{ title: m[1], id: base + (count ? `-${count}` : '') }]; }); }
function safeUrl(url: string) { try {
    const parsed = new URL(url, 'https://concept.invalid');
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol) && !url.startsWith('//') ? url : '';
}
catch {
    return '';
} }
export function Markdown({ body }: {
    body: string;
}) {
    let cursor = 0;
    const sections = headings(body);
    return <div className="prose"><ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml urlTransform={safeUrl} components={{
            // Remote images are intentionally not loaded by the demo's Markdown renderer.
            img: ({ alt }) => <span className="image-omitted">{alt ? `Image description: ${alt}` : 'Image omitted. Choose a cover from the editor.'}</span>,
            h2: ({ children }) => <h2 id={sections[cursor++]?.id}>{children}</h2>,
            a: ({ href, children }) => <a href={href} rel="noopener noreferrer">{children}</a>,
        }}>{body}</ReactMarkdown></div>;
}
