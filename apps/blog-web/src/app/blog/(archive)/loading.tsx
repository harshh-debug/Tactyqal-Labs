// This boundary belongs ONLY to the archive route group. Never move it to /blog
// or the root: article availability must resolve before response streaming.
export default function Loading() { return <main id="main" className="shell archive" aria-busy="true"><p role="status">Opening the fieldnotes…</p><div className="skeleton lead-skeleton"/><div className="post-grid">{[1, 2, 3].map(n => <div key={n} className="skeleton card-skeleton"/>)}</div></main>; }
