import { ActionButton } from "../components/ui/Loading";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listJobs } from "../api/jobs";
import { useAuth } from "../context/AuthContext";
import JobCard from "../components/JobCard";

export default function Home() {
    const { user } = useAuth();
    const jobs = useQuery({ queryKey: ["jobs", "home"], queryFn: () => listJobs({ page: 1, limit: 3 }), retry: false, staleTime: 60_000 });
    return <main className="home-page">
        <section className="hero-section">
            <div className="hero-copy">
                <p className="eyebrow">YOUR AMBITION. YOUR NEXT CHAPTER.</p>
                <h1>Good work starts<br />with the <span>right<br className="desktop-break" /> connection.</span></h1>
                <p className="hero-description">A space for people who move things forward. Discover your next role, find your next hire, and put your experience to work.</p>
                <div className="hero-actions"><Link className="primary-action" to="/jobs">Explore opportunities</Link><Link className="secondary-action" to={user ? "/jobs/new" : "/register"}>Find your next hire</Link></div>
                <div className="hero-footnote"><span className="small-mark" aria-hidden="true">H</span><p>Built around people.<br /><strong>Designed for what comes next.</strong></p></div>
            </div>
            <div className="connection-art" aria-label="Your profile connects your skills, experience, and next opportunity">
                <div className="art-grid" /><div className="orbit orbit-one" /><div className="orbit orbit-two" />
                <div className="art-caption">A BETTER WAY TO MOVE FORWARD</div>
                <div className="identity-card"><div className="identity-top"><span className="identity-symbol">H</span><span className="mini-label">YOUR NEXT CHAPTER</span></div><h2>Potential,<br />meet possibility.</h2><div className="identity-rule" /><p>One profile. More possibilities.</p><div className="identity-tags"><span>Your skills</span><span>Your experience</span></div></div>
                <div className="floating-label label-skills"><span className="line-symbol" aria-hidden="true">+</span><div><small>BRING YOUR EXPERTISE</small><strong>Stand out for your skills</strong></div></div>
                <div className="floating-label label-role"><span className="role-symbol" aria-hidden="true" /><div><small>MAKE YOUR NEXT MOVE</small><strong>Find work that fits</strong></div></div>
                <div className="art-bottom">PEOPLE / POTENTIAL / PROGRESS</div>
            </div>
        </section>
        <section className="purpose-strip" aria-label="Platform capabilities"><p>Less friction.<br /><strong>More forward momentum.</strong></p><span>Professional profiles</span><span>Open opportunities</span><span>Clear application tracking</span></section>
        <section className="opportunities-section"><div className="section-heading"><div><p className="eyebrow">MAKE YOUR NEXT MOVE</p><h2>Something great starts here.</h2></div><Link className="text-link" to="/jobs">Explore all jobs</Link></div>
            {jobs.isPending && <div className="home-jobs" aria-label="Loading opportunities" aria-busy="true">{[1, 2, 3].map(i => <div className="skeleton-card" key={i} />)}</div>}
            {jobs.isError && <div className="quiet-state"><div><h3>Opportunities are a little out of reach.</h3><p>We couldn’t load the job board. Please try again in a moment.</p></div><ActionButton className="secondary-action" onClick={() => jobs.refetch()} busy={jobs.isFetching}>{jobs.isFetching ? "Trying again…" : "Try again"}</ActionButton></div>}
            {jobs.data && (jobs.data.data.length ? <div className="home-jobs">{jobs.data.data.map(job => <JobCard key={job.id} job={job} />)}</div> : <div className="quiet-state"><div><h3>The next opportunity could start with you.</h3><p>There are no open roles yet. Create a profile or post your first role.</p></div><Link className="secondary-action" to={user ? "/jobs/new" : "/register"}>{user ? "Post a role" : "Get started"}</Link></div>)}
        </section>
        <section className="pathways"><div className="pathway-intro"><p className="eyebrow">ONE PLATFORM. BOTH SIDES.</p><h2>Your career.<br />Your team.<br /><span>Your next step.</span></h2><p>Opportunity isn’t one-size-fits-all. HireFlow gives you space to grow in more than one direction.</p></div><Link className="pathway-card" to={user ? "/profiles/me" : "/register"}><span className="pathway-icon" aria-hidden="true">+</span><p className="eyebrow">FOR YOUR CAREER</p><h3>Let your work<br />do the talking.</h3><p>Bring your experience, projects, and skills together in a profile that tells your story.</p><span className="text-link">Build your profile</span></Link><Link className="pathway-card" to={user ? "/jobs/new" : "/register"}><span className="pathway-icon" aria-hidden="true">⌁</span><p className="eyebrow">FOR YOUR TEAM</p><h3>The right people.<br />The next big thing.</h3><p>Publish a role, review applicants, and keep every hiring decision moving in one place.</p><span className="text-link">Start hiring</span></Link></section>
        <section className="closing-banner"><p className="eyebrow">YOUR NEXT CHAPTER IS WAITING</p><h2>Make room for what’s next.</h2><Link className="primary-action" to={user ? "/dashboard" : "/register"}>{user ? "Open your workspace" : "Create your profile"}</Link></section>
    </main>;
}


