import FormattedText from "../../components/ui/FormattedText";
import { ActionButton, LoadingBlocks, Spinner } from "../../components/ui/Loading";
import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { changeApplicationStatus, getApplicationHistory, listJobApplications, type ApplicationStatus } from "../../api/applications";
import { getJob } from "../../api/jobs";
import { getErrorMessage } from "../../api/client";

const OWNER_STATUSES: ApplicationStatus[] = ["in_review", "shortlisted", "interview", "offer", "hired", "rejected"];

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

export default function JobApplicants() {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [error, setError] = useState("");
    const [pendingId, setPendingId] = useState<string | null>(null);
    const statusLocked = useRef(false);
    const { data: job } = useQuery({ queryKey: ["job", id], queryFn: () => getJob(id!), enabled: !!id });
    const { data, isLoading, error: queryError } = useQuery({
        queryKey: ["jobApplications", id, page],
        queryFn: () => listJobApplications(id!, { page, limit: 20 }),
        enabled: !!id,
    });

    async function onStatus(appId: string, status: ApplicationStatus) {
        if (statusLocked.current) return;
        statusLocked.current = true;
        setPendingId(appId);
        setError("");
        try {
            await changeApplicationStatus(appId, status);
            await Promise.all([queryClient.invalidateQueries({ queryKey: ["jobApplications", id] }), queryClient.invalidateQueries({ queryKey: ["applicationHistory", appId] })]);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            statusLocked.current = false;
            setPendingId(null);
        }
    }

    return (
        <main className="mx-auto max-w-6xl px-4 py-8">
            <h1 className="text-2xl font-bold">Applicants{job ? ` — ${job.title}` : ""}</h1>
            {isLoading && <LoadingBlocks />}
            {(queryError || error) && <p className="mt-6 text-sm text-red-600">{queryError ? getErrorMessage(queryError) : error}</p>}
            {data && data.data.length === 0 && <p className="mt-6 text-gray-600">No applications yet.</p>}
            {data && data.data.length > 0 && (
                <>
                    <ul className="mt-6 space-y-4">
                        {data.data.map((app) => (
                            <li key={app.id} className="rounded border p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <Link to={`/profiles/${app.applicant_id}`} className="font-semibold text-blue-600">
                                            {app.applicant?.full_name ?? "Applicant"}
                                        </Link>
                                        {app.applicant?.headline && <p className="text-sm text-gray-600">{app.applicant.headline}</p>}
                                        {app.cover_note && <FormattedText className="mt-2 text-sm" text={app.cover_note} />}
                                        <p className="mt-1 text-xs text-gray-500">{new Date(app.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div>{pendingId === app.id && <span role="status"><Spinner /><span className="sr-only">Updating application status</span></span>}<select disabled={pendingId !== null} aria-busy={pendingId === app.id}
                                        value={app.status}
                                        onChange={(e) => onStatus(app.id, e.target.value as ApplicationStatus)}
                                        className="rounded border px-2 py-1 text-sm"
                                        aria-label="Application status"
                                    >
                                        <option value="applied" disabled>applied</option>
                                        {OWNER_STATUSES.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select></div>
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




