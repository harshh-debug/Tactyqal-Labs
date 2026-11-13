import { requireEditor } from '@/lib/session';
import { signOut } from '@/app/studio/actions';
export const dynamic = 'force-dynamic';
export default async function StudioLayout({ children }: {
    children: React.ReactNode;
}) { await requireEditor(); return <><div className="shell studio-bar"><a href="/studio/posts">Editorial studio</a><form action={signOut}><button>Sign out ↗</button></form></div>{children}</>; }
