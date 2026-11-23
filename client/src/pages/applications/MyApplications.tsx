import FormattedText from "../../components/ui/FormattedText";
import { ActionButton, LoadingBlocks } from "../../components/ui/Loading";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { changeApplicationStatus, getApplicationHistory, listMyApplications } from "../../api/applications";
import { getErrorMessage } from "../../api/client";

const FINAL = ["hired", "rejected", "withdrawn"];

function History({ id }: { id: string }) {
    const [open, setOpen] = useState(false);
    const { data, isLoading, error: historyError } = useQuery({
        queryKey: ["applicationHistory", id],
        queryFn: () => getApplicationHistory(id),
        enabled: open,
    });
    return (
        <div className="mt-2">
            <ActionButton type="button" onClick={() => setOpen(!open)} className="text-sm text-blue-600">
                {open ? "Hide history" : "History"}
            </ActionButton>
            {open && (isLoading ? <LoadingBlocks compact /> : historyError ? <p role="alert" className="text-sm text-red-600">{getErrorMessage(historyError)}</p> : (
                <ul className="mt-1 text-sm text-gray-600">
                    {(data ?? []).map((h) => (
                        <li key={h.id}>{h.status} — {new Date(h.changed_at).toLocaleString()}</li>
                    ))}
                </ul>
            ))}
        </div>
    );
}

export default function MyApplications() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [error, setError] = useState("");
    const { data, isLoading, error: queryError } = useQuery({
        queryKey: ["myApplications", page],
        queryFn: () => listMyApplications({ page, limit: 20 }),
    });

    async function onWithdraw(id: string) {
        if (!window.confirm("Withdraw this application?")) return;
        setError("");
        try {
            await changeApplicationStatus(id, "withdrawn");
            await Promise.all([queryClient.invalidateQueries({ queryKey: ["myApplications"] }), queryClient.invalidateQueries({ queryKey: ["applicationHistory", id] })]);
        } catch (err) {
            setError(getErrorMessage(err));
        }
    }

    return (
        <main className="mx-auto max-w-6xl px-4 py-8">
            <h1 className="text-2xl font-bold">My Applications</h1>
            {isLoading && <LoadingBlocks />}
            {(queryError || error) && <p className="mt-6 text-sm text-red-600">{queryError ? getErrorMessage(queryError) : error}</p>}
            {data && data.data.length === 0 && <p className="mt-6 text-gray-600">You have not applied to any jobs yet.</p>}
            {data && data.data.length > 0 && (
                <>
                    <ul className="mt-6 space-y-4">
                        {data.data.map((app) => (
                            <li key={app.id} className="rounded border p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <Link to={`/jobs/${app.job_id}`} className="font-semibold text-blue-600">
                                            {app.job?.title ?? "Job"}
                                        </Link>
                                        <p className="mt-1 text-sm text-gray-600">Status: {app.status}</p>
                                        {app.cover_note && <FormattedText className="mt-2 text-sm" text={app.cover_note} />}
                                        <p className="mt-1 text-xs text-gray-500">{new Date(app.created_at).toLocaleDateString()}</p>
                                    </div>
                                    {!FINAL.includes(app.status) && (
                                        <ActionButton type="button" onClick={() => onWithdraw(app.id)} className="rounded border px-3 py-1 text-sm">
                                            Withdraw
                                        </ActionButton>
                                    )}
                                </div>
                                <History id={app.id} />
                            </li>
                        ))}
                    </ul>
                    <div className="mt-6 flex items-center gap-4">
                        <ActionButton type="button" disabled={!data.meta.hasPrevPage} onClick={() => setPage((p) => p - 1)} className="rounded border px-3 py-1 disabled:opacity-50">Previous</ActionButton>
                        <span className="text-sm text-gray-600">Page {data.meta.page} of {data.meta.totalPages}</span>
                        <ActionButton type="button" disabled={!data.meta.hasNextPage} onClick={() => setPage((p) => p + 1)} className="rounded border px-3 py-1 disabled:opacity-50">Next</ActionButton>
                    </div>
                </>
            )}
        </main>
    );
}




