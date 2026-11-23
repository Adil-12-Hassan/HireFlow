import { ActionButton, LoadingBlocks } from "../../components/ui/Loading";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listJobs } from "../../api/jobs";
import { getErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import JobCard from "../../components/JobCard";

export default function JobsList() {
    const { user } = useAuth();
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const { data, isLoading, isFetching, error } = useQuery({
        queryKey: ["jobs", page, search],
        queryFn: () => listJobs({ page, limit: 20, search: search || undefined }),
    });

    function onSearch(e: FormEvent) {
        e.preventDefault();
        setSearch(searchInput.trim());
        setPage(1);
    }

    return (
        <main className="mx-auto max-w-6xl px-4 py-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Open Jobs</h1>
                {user && (
                    <Link to="/jobs/new" className="rounded bg-blue-600 px-4 py-2 text-white">
                        Post a job
                    </Link>
                )}
            </div>
            <form onSubmit={onSearch} className="mt-4 flex gap-2">
                <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search jobs by title or description"
                    className="w-full rounded border px-3 py-2"
                />
                <ActionButton busy={isFetching} type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
                    Search
                </ActionButton>
            </form>

            {isLoading && <LoadingBlocks />}
            {error && <p className="mt-6 text-sm text-red-600">{getErrorMessage(error)}</p>}
            {data && data.data.length === 0 && <p className="mt-6 text-gray-600">No open jobs yet.</p>}

            {data && data.data.length > 0 && (
                <>
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        {data.data.map((job) => (
                            <JobCard key={job.id} job={job} />
                        ))}
                    </div>
                    <div className="mt-6 flex items-center gap-4">
                        <ActionButton
                            type="button"
                            disabled={isFetching || !data.meta.hasPrevPage}
                            onClick={() => setPage((p) => p - 1)}
                            className="rounded border px-3 py-1 disabled:opacity-50"
                        >
                            Previous
                        </ActionButton>
                        <span className="text-sm text-gray-600">
                            Page {data.meta.page} of {data.meta.totalPages}
                        </span>
                        <ActionButton
                            type="button"
                            disabled={isFetching || !data.meta.hasNextPage}
                            onClick={() => setPage((p) => p + 1)}
                            className="rounded border px-3 py-1 disabled:opacity-50"
                        >
                            Next
                        </ActionButton>
                    </div>
                </>
            )}
        </main>
    );
}


