import { useIsFetching } from "@tanstack/react-query";
import { ActionButton } from "./ui/Loading";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
    const { user, logout } = useAuth();
    const fetching = useIsFetching();
    const [menuOpen, setMenuOpen] = useState(false);
    const [dark, setDark] = useState(() => {
        try { const saved = localStorage.getItem("hireflow-theme"); return saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches; } catch { return false; }
    });
    useEffect(() => {
        document.documentElement.dataset.theme = dark ? "dark" : "light";
        try { localStorage.setItem("hireflow-theme", dark ? "dark" : "light"); } catch { /* Theme works without storage. */ }
    }, [dark]);
    async function onLogout() {
        try {
            await logout();
        } finally {
            // Reload the app after clearing account data, replacing the protected URL.
            window.location.replace("/login");
        }
    }
    return <div className="app-shell">
        {fetching > 0 && <div className="request-progress" role="status" aria-label="Loading latest content" />}<a className="skip-link" href="#page-content">Skip to content</a>
        <header className="site-header"><div className="header-inner">
            <Link to="/" className="brand" aria-label="HireFlow home"><span className="brand-mark" aria-hidden="true">h<span /></span><span>hireflow<span className="brand-dot">.</span><small>BY ARQYON TECH</small></span></Link>
            <button className="menu-toggle" aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "Close" : "Menu"}</button>
            <nav id="main-navigation" className={`main-navigation ${menuOpen ? "is-open" : ""}`} aria-label="Main navigation" onClick={() => setMenuOpen(false)}>
                <NavLink to="/jobs">Find a job</NavLink><NavLink to="/profiles">Discover people</NavLink>
                {user && <><NavLink to="/dashboard">Workspace</NavLink><NavLink to="/applications/me">Applications</NavLink><NavLink to="/profiles/me">My profile</NavLink></>}
                <div className="navigation-actions"><button className="theme-toggle" onClick={() => setDark(!dark)} aria-label={`Switch to ${dark ? "light" : "dark"} theme`} title={`Switch to ${dark ? "light" : "dark"} theme`}><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">{dark ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2" /></> : <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />}</svg></button>{user ? <ActionButton className="secondary-action compact" onClick={onLogout}>Sign out</ActionButton> : <><NavLink to="/login">Sign in</NavLink><Link to="/register" className="primary-action compact">Get started</Link></>}</div>
            </nav>
        </div></header>
        <div id="page-content" tabIndex={-1}><Outlet /></div>
        <footer className="site-footer"><Link to="/" className="footer-brand">hireflow<span>.</span></Link><p>Built for the way you move forward.</p><span>© {new Date().getFullYear()} ARQYON Tech</span></footer>
    </div>;
}

