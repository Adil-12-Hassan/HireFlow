import { ActionButton, LoadingBlocks } from "../../components/ui/Loading";
import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { listProfiles } from "../../api/profiles";
import { getErrorMessage } from "../../api/client";
import ProfileCard from "../../components/ProfileCard";

export default function Discovery() {
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const { data, isLoading, isFetching, error } = useQuery({
        queryKey: ["profiles", page, search],
        queryFn: () => listProfiles({ page, limit: 20, search: search || undefined }),
    });

    function onSearch(e: FormEvent) {
        e.preventDefault();
        setSearch(searchInput.trim());
        setPage(1);
    }

    return (
        <main className="mx-auto max-w-6xl px-4 py-8">
            <h1 className="text-2xl font-bold">Members</h1>
            <form onSubmit={onSearch} className="mt-4 flex gap-2">
                <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by name, headline, or skill"
                    className="w-full rounded border px-3 py-2"
                />
                <ActionButton busy={isFetching} type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
                    Search
                </ActionButton>
            </form>

            {isLoading && <LoadingBlocks />}
            {error && <p className="mt-6 text-sm text-red-600">{getErrorMessage(error)}</p>}
            {data && data.data.length === 0 && <p className="mt-6 text-gray-600">No members found.</p>}

            {data && data.data.length > 0 && (
                <>
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        {data.data.map((profile) => (
                            <ProfileCard key={profile.id} profile={profile} />
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


