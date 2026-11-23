import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
    const { user } = useAuth();

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
        </main>
    );
}
