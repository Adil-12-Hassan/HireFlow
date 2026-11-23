import TextEditor from "../../components/ui/TextEditor";
import { ActionButton, LoadingBlocks, AsyncForm } from "../../components/ui/Loading";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createJob, getJob, updateJob, type JobStatus } from "../../api/jobs";
import { getErrorMessage } from "../../api/client";

export default function JobForm() {
    const { id } = useParams<{ id?: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<JobStatus>("draft");
    const [loaded, setLoaded] = useState(!isEdit);
    const [error, setError] = useState("");

    const { data: job, error: loadError } = useQuery({
        queryKey: ["job", id],
        queryFn: () => getJob(id!),
        enabled: isEdit,
    });

    useEffect(() => {
        if (job && !loaded) {
            setTitle(job.title);
            setDescription(job.description ?? "");
            setStatus(job.status);
            setLoaded(true);
        }
    }, [job, loaded]);

    // Only the transitions the backend allows are offered.
    const statusOptions: JobStatus[] =
        !isEdit || !job ? ["draft", "open"]
            : job.status === "draft" ? ["draft", "open", "closed"]
                : job.status === "open" ? ["open", "closed"]
                    : ["closed"];

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        try {
            if (isEdit) {
                const updated = await updateJob(id!, { title, description: description || null, status });
                queryClient.setQueryData(["job", id], updated);
                await queryClient.invalidateQueries({ queryKey: ["jobs"] });
                navigate(`/jobs/${id}`);
            } else {
                const created = await createJob({
                    title,
                    description: description || null,
                    status: status === "closed" ? "draft" : status,
                });
                queryClient.setQueryData(["job", created.id], created);
                await queryClient.invalidateQueries({ queryKey: ["jobs"] });
                navigate(`/jobs/${created.id}`);
            }
        } catch (err) {
            setError(getErrorMessage(err));
        }
    }

    if (loadError) { return <main className="mx-auto max-w-2xl px-4 py-8"><p role="alert" className="text-red-600">{getErrorMessage(loadError)}</p></main>; }
    if (isEdit && !loaded) {
        return <main className="mx-auto max-w-2xl px-4 py-8"><LoadingBlocks /></main>;
    }

    return (
        <main className="mx-auto max-w-2xl px-4 py-8">
            <h1 className="text-2xl font-bold">{isEdit ? "Edit job" : "Post a job"}</h1>
            <AsyncForm onSubmit={onSubmit} className="mt-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium" htmlFor="title">Title</label>
                    <input id="title" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium" htmlFor="description">Description</label>
                    <TextEditor key={id ?? "new"} id="description" label="Job description" value={description} onChange={setDescription} maxLength={5000} placeholder="Describe the role, responsibilities, required skills, and what your team offers." />
                </div>
                <div>
                    <label className="block text-sm font-medium" htmlFor="status">Status</label>
                    <select id="status" value={status} onChange={(e) => setStatus(e.target.value as JobStatus)} className="mt-1 rounded border px-2 py-1">
                        {statusOptions.map((option) => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                    {!isEdit && <p className="mt-1 text-xs text-gray-500">Draft is private, open is public.</p>}
                    {isEdit && job?.status === "closed" && (
                        <p className="mt-1 text-xs text-gray-500">A closed job cannot be changed.</p>
                    )}
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <ActionButton type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
                    {isEdit ? "Save job" : "Create job"}
                </ActionButton>
            </AsyncForm>
        </main>
    );
}



