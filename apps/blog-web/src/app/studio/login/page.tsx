import { LoginForm } from '@/components/login-form';
export default async function Login({ searchParams }: {
    searchParams: Promise<{
        expired?: string;
    }>;
}) { const params = await searchParams; return <main id="main" className="shell login-page"><div><a className="back-link" href="/blog">← Back to fieldnotes</a><h1>A space for<br /><span>the next draft.</span></h1><p>Sign in to create, edit, and publish.</p>{params.expired && <p role="status">Your session has expired. Please sign in again.</p>}<LoginForm /><p className="login-note">Demo editor access is shared privately with reviewers.<br />Public articles are available without an account.</p></div><aside><span className="studio-mark" aria-hidden="true">t.</span><h2>Good ideas<br />take a few drafts.</h2><p>A focused editorial studio.<br />From the first sentence to publication.</p></aside></main>; }
