import TextEditor from "../../components/ui/TextEditor";
import FormattedText from "../../components/ui/FormattedText";
import { ActionButton, LoadingBlocks, AsyncForm } from "../../components/ui/Loading";
import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getJob, updateJob } from "../../api/jobs";
import { applyToJob } from "../../api/applications";
import { getErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function JobDetail() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [coverNote, setCoverNote] = useState("");
    const [applyError, setApplyError] = useState("");
    const [applied, setApplied] = useState(false);
    const [actionError, setActionError] = useState("");

    const { data: job, isLoading, error } = useQuery({
        queryKey: ["job", id],
        queryFn: () => getJob(id!),
        enabled: !!id,
    });

    async function onApply(e: FormEvent) {
        e.preventDefault();
        setApplyError("");
        try {
            await applyToJob(id!, { cover_note: coverNote || null });
            setApplied(true);
            await queryClient.invalidateQueries({ queryKey: ["myApplications"] });
        } catch (err) {
            setApplyError(getErrorMessage(err));
        }
    }

    async function onChangeStatus(status: "open" | "closed") {
        setActionError("");
        try {
            await updateJob(id!, { status });
            await Promise.all([queryClient.invalidateQueries({ queryKey: ["job", id] }), queryClient.invalidateQueries({ queryKey: ["jobs"] })]);
        } catch (err) {
            setActionError(getErrorMessage(err));
        }
    }

    if (isLoading) {
        return <main className="mx-auto max-w-6xl px-4 py-8"><LoadingBlocks /></main>;
    }
    if (error || !job) {
        return (
            <main className="mx-auto max-w-6xl px-4 py-8">
                <p className="text-sm text-red-600">{error ? getErrorMessage(error) : "Job not found."}</p>
            </main>
        );
    }

    const isOwner = user?.id === job.owner_id;

    return (
        <main className="mx-auto max-w-6xl px-4 py-8">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{job.title}</h1>
                    <p className="mt-1 text-xs text-gray-500">
                        {job.status} · {new Date(job.created_at).toLocaleDateString()}
                    </p>
                </div>
                {isOwner && (
                    <Link to={`/jobs/${job.id}/edit`} className="rounded border px-3 py-1 text-sm">
                        Edit
                    </Link>
                )}
            </div>

            {job.description && (
                <FormattedText className="mt-6" text={job.description} />
            )}

            {isOwner && (
                <section className="mt-8 rounded border p-4">
                    <h2 className="font-semibold">Owner actions</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        <Link className="text-blue-600" to={`/jobs/${job.id}/applicants`}>View applicants</Link>
                    </p>
                    <div className="mt-3 flex gap-2">
                        {job.status === "draft" && (
                            <ActionButton type="button" onClick={() => onChangeStatus("open")} className="rounded bg-blue-600 px-4 py-2 text-white">
                                Publish
                            </ActionButton>
                        )}
                        {job.status === "open" && (
                            <ActionButton type="button" onClick={() => onChangeStatus("closed")} className="rounded border px-4 py-2">
                                Close job
                            </ActionButton>
                        )}
                    </div>
                    {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}
                </section>
            )}

            {!isOwner && job.status === "open" && (
                <section className="mt-8 rounded border p-4">
                    <h2 className="font-semibold">Apply for this job</h2>
                    {!user && (
                        <p className="mt-2 text-sm text-gray-600">
                            <Link className="text-blue-600" to="/login">Sign in</Link> to apply.
                        </p>
                    )}
                    {user && applied && (
                        <p className="mt-2 text-sm text-green-700">Application sent.</p>
                    )}
                    {user && !applied && (
                        <AsyncForm onSubmit={onApply} className="mt-4 space-y-3">
                            <div>
                                <label className="block text-sm font-medium" htmlFor="cover_note">Proposal / cover note (optional)</label>
                                <TextEditor key={id} id="cover_note" label="Proposal / cover note" value={coverNote} onChange={setCoverNote} maxLength={2000} placeholder="Introduce yourself, explain your approach, and highlight relevant experience." />
                            </div>
                            {applyError && <p className="text-sm text-red-600">{applyError}</p>}
                            <ActionButton type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
                                Apply
                            </ActionButton>
                        </AsyncForm>
                    )}
                </section>
            )}

            {!isOwner && job.status !== "open" && (
                <p className="mt-8 text-sm text-gray-600">This job is {job.status} and is not accepting applications.</p>
            )}
        </main>
    );
}



