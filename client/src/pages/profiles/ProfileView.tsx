import { LoadingBlocks } from "../../components/ui/Loading";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "../../api/profiles";
import { getErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

function isHttpLink(link: string | null | undefined): link is string {
    return !!link && (link.startsWith("http://") || link.startsWith("https://"));
}

export default function ProfileView() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const { data: profile, isLoading, error } = useQuery({
        queryKey: ["profile", id],
        queryFn: () => getProfile(id!),
        enabled: !!id,
    });

    if (isLoading) {
        return <main className="mx-auto max-w-6xl px-4 py-8"><LoadingBlocks /></main>;
    }
    if (error || !profile) {
        return (
            <main className="mx-auto max-w-6xl px-4 py-8">
                <p className="text-sm text-red-600">{error ? getErrorMessage(error) : "Profile not found."}</p>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-6xl px-4 py-8">
            <h1 className="text-2xl font-bold">{profile.full_name}</h1>
            {profile.headline && <p className="mt-1 text-gray-600">{profile.headline}</p>}
            {profile.location && <p className="mt-1 text-sm text-gray-500">{profile.location}</p>}
            {user?.id === profile.id && (
                <p className="mt-2 text-sm">
                    <Link className="text-blue-600" to="/profiles/me">Edit my profile</Link>
                </p>
            )}

            {profile.about && (
                <section className="mt-8">
                    <h2 className="font-semibold">About</h2>
                    <p className="mt-2 whitespace-pre-wrap text-gray-700">{profile.about}</p>
                </section>
            )}

            {profile.skills && profile.skills.length > 0 && (
                <section className="mt-8">
                    <h2 className="font-semibold">Skills</h2>
                    <div className="mt-2 flex flex-wrap gap-1">
                        {profile.skills.map((skill) => (
                            <span key={skill} className="rounded bg-gray-100 px-2 py-1 text-xs">{skill}</span>
                        ))}
                    </div>
                </section>
            )}

            {profile.experiences && profile.experiences.length > 0 && (
                <section className="mt-8">
                    <h2 className="font-semibold">Experience</h2>
                    <ul className="mt-2 space-y-4">
                        {profile.experiences.map((exp) => (
                            <li key={exp.id} className="rounded border p-4">
                                <p className="font-medium">{exp.role} at {exp.company}</p>
                                <p className="text-xs text-gray-500">
                                    {exp.start_date ?? ""} — {exp.end_date ?? "Present"}
                                </p>
                                {exp.description && <p className="mt-2 text-sm text-gray-700">{exp.description}</p>}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {profile.projects && profile.projects.length > 0 && (
                <section className="mt-8">
                    <h2 className="font-semibold">Projects</h2>
                    <ul className="mt-2 space-y-4">
                        {profile.projects.map((project) => (
                            <li key={project.id} className="rounded border p-4">
                                <p className="font-medium">{project.title}</p>
                                {project.description && <p className="mt-2 text-sm text-gray-700">{project.description}</p>}
                                {isHttpLink(project.link) && (
                                    <a href={project.link} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-blue-600">
                                        {project.link}
                                    </a>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {profile.contact && (
                <section className="mt-8">
                    <h2 className="font-semibold">Contact</h2>
                    <p className="mt-2 text-gray-700">{profile.contact}</p>
                </section>
            )}
        </main>
    );
}

