'use client';
import { useEffect, useRef, useState } from 'react';
export function Header({ blogUrl }: {
    blogUrl: string;
}) {
    const [open, setOpen] = useState(false);
    const toggle = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        const key = (event: KeyboardEvent) => { if (event.key === 'Escape' && open) {
            setOpen(false);
            toggle.current?.focus();
        } };
        const resize = () => { if (window.innerWidth >= 900)
            setOpen(false); };
        document.addEventListener('keydown', key);
        window.addEventListener('resize', resize);
        return () => { document.removeEventListener('keydown', key); window.removeEventListener('resize', resize); };
    }, [open]);
    return <header className="site-header"><div className="container header-inner">
    <a className="wordmark" href="#" aria-label="Tactyqal Labs home"><span className="brand-symbol" aria-hidden="true">t.</span>tactyqal<span className="labs">labs</span></a>
    <button ref={toggle} className="menu-toggle" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Menu'}<span aria-hidden="true">{open ? '−' : '+'}</span></button>
    <nav id="main-nav" aria-label="Main navigation" className={open ? 'nav open' : 'nav'} onClick={() => setOpen(false)}>
      <a href="#projects">Projects</a><a href="#program">The program</a><a href="#faq">FAQ</a><a href={blogUrl}>Blog <span aria-hidden="true">↗</span></a>
      <a href="#consultation" className="button small">Book a free consultation <span aria-hidden="true">↗</span></a>
    </nav>
  </div></header>;
}
