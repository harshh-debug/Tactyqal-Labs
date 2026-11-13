'use client';
import { useActionState } from 'react';
import { signIn } from '@/app/studio/actions';
export function LoginForm() { const [state, action, pending] = useActionState(signIn, {}); return <form action={action} className="login-form"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="username" required maxLength={254}/><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required maxLength={72}/>{state.message && <p className="feedback error" role="alert">{state.message}</p>}<button className="button" disabled={pending}>{pending ? 'Signing in…' : 'Sign in to the studio'} <span aria-hidden="true">↗</span></button></form>; }
