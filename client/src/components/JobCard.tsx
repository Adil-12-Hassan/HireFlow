import { plainTextSummary } from "../utils/editorText";
import { Link } from "react-router-dom";
import type { Job } from "../api/jobs";

export default function JobCard({ job }: { job: Job }) {
    return (
        <Link to={`/jobs/${job.id}`} className="job-card">
            <div className="job-emblem" aria-hidden="true">{job.title.charAt(0).toUpperCase()}</div><div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold">{job.title}</h2>
                <span className="status-pill">{job.status}</span>
            </div>
            {job.description && (
                <p className="mt-2 line-clamp-3 text-sm text-gray-600">{plainTextSummary(job.description)}</p>
            )}
            <p className="mt-2 text-xs text-gray-500">
                {new Date(job.created_at).toLocaleDateString()}
            </p>
        </Link>
    );
}


