'use client';
export default function ErrorPage({ reset }: {
    reset: () => void;
}) { return <main id="main" className="shell message-page"><h1>A pause in the conversation.</h1><p>We couldn’t reach the publication. If the API is waking up, please try again in a moment.</p><button className="button" onClick={reset}>Try again</button><a href="/blog">Return to the articles</a></main>; }
