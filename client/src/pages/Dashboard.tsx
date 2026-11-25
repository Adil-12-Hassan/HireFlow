import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listMyJobs } from "../api/jobs";
import { getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import JobCard from "../components/JobCard";
import { LoadingBlocks } from "../components/ui/Loading";

export default function Dashboard() {
    const { user } = useAuth();
    const myJobs = useQuery({ queryKey: ["jobs", "mine"], queryFn: () => listMyJobs({ page: 1, limit: 6 }) });

    return (
        <main className="mx-auto max-w-6xl px-4 py-8">
            <h1 className="text-2xl font-bold">Welcome, {user?.full_name ?? "member"}</h1>
            {user?.headline && <p className="mt-1 text-gray-600">{user.headline}</p>}
            {user?.location && <p className="mt-1 text-sm text-gray-500">{user.location}</p>}
            <div className="mt-8 grid gap-4 md:grid-cols-3">
                <Link to="/profiles/me" className="rounded border p-4">
                    <h2 className="font-semibold">My Profile</h2>
                    <p className="mt-1 text-sm text-gray-600">Edit your about, skills, experience, and projects.</p>
                </Link>
                <Link to="/jobs" className="rounded border p-4">
                    <h2 className="font-semibold">Browse Jobs</h2>
                    <p className="mt-1 text-sm text-gray-600">See open jobs and apply.</p>
                </Link>
                <Link to="/applications/me" className="rounded border p-4">
                    <h2 className="font-semibold">My Applications</h2>
                    <p className="mt-1 text-sm text-gray-600">Track the jobs you applied to.</p>
                </Link>
            </div>

            <section className="mt-10">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">My jobs</h2>
                    <Link to="/jobs/new" className="rounded border px-3 py-1 text-sm">Post a job</Link>
                </div>
                {myJobs.isLoading && <LoadingBlocks compact />}
                {myJobs.error && <p role="alert" className="mt-4 text-sm text-red-600">{getErrorMessage(myJobs.error)}</p>}
                {myJobs.data && myJobs.data.data.length === 0 && (
                    <p className="mt-4 text-gray-600">You have not posted a job yet. Drafts and closed jobs will show up here.</p>
                )}
                {myJobs.data && myJobs.data.data.length > 0 && (
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                        {myJobs.data.data.map((job) => <JobCard key={job.id} job={job} />)}
                    </div>
                )}
            </section>
        </main>
    );
}
