import { experienceEndDate } from "../../utils/editorText";
import { ActionButton, LoadingBlocks, AsyncForm } from "../../components/ui/Loading";
import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createExperience,
    createProject,
    deleteExperience,
    deleteProject,
    getMyProfile,
    setMySkills,
    updateExperience,
    updateMyProfile,
    updateMyVisibility,
    updateProject,
    type Experience,
    type Project,
    type VisibilityLevel,
    type VisibilityMap,
    type VisibilitySection,
} from "../../api/profiles";
import { getErrorMessage } from "../../api/client";

const SECTIONS: { key: VisibilitySection; label: string }[] = [
    { key: "about", label: "About" },
    { key: "skills", label: "Skills" },
    { key: "experience", label: "Experience" },
    { key: "projects", label: "Projects" },
    { key: "contact", label: "Contact" },
];

const LEVELS: { value: VisibilityLevel; label: string }[] = [
    { value: "only_me", label: "Only me" },
    { value: "connections", label: "Connections" },
    { value: "members", label: "Members" },
    { value: "public", label: "Public" },
];

const inputClass = "mt-1 w-full rounded border px-3 py-2";
const labelClass = "block text-sm font-medium";

export default function MyProfile() {
    const queryClient = useQueryClient();
    const { data: profile, isLoading, error } = useQuery({
        queryKey: ["myProfile"],
        queryFn: getMyProfile,
    });

    const [fullName, setFullName] = useState("");
    const [headline, setHeadline] = useState("");
    const [about, setAbout] = useState("");
    const [location, setLocation] = useState("");
    const [contact, setContact] = useState("");
    const [formLoaded, setFormLoaded] = useState(false);
    const [message, setMessage] = useState("");
    const [formError, setFormError] = useState("");

    const [visibility, setVisibility] = useState<VisibilityMap>({
        about: "members",
        skills: "members",
        experience: "members",
        projects: "members",
        contact: "members",
    });

    const [skillInput, setSkillInput] = useState("");

    const [expId, setExpId] = useState<string | null>(null);
    const [expCompany, setExpCompany] = useState("");
    const [expRole, setExpRole] = useState("");
    const [expStart, setExpStart] = useState("");
    const [expEnd, setExpEnd] = useState("");
    const [expCurrent, setExpCurrent] = useState(false);
    const [expDesc, setExpDesc] = useState("");

    const [projId, setProjId] = useState<string | null>(null);
    const [projTitle, setProjTitle] = useState("");
    const [projDesc, setProjDesc] = useState("");
    const [projLink, setProjLink] = useState("");

    useEffect(() => {
        if (profile && !formLoaded) {
            setFullName(profile.full_name ?? "");
            setHeadline(profile.headline ?? "");
            setAbout(profile.about ?? "");
            setLocation(profile.location ?? "");
            setContact(profile.contact ?? "");
            if (profile.visibility) setVisibility(profile.visibility);
            setFormLoaded(true);
        }
    }, [profile, formLoaded]);

    async function refresh() {
        await Promise.all([queryClient.invalidateQueries({ queryKey: ["myProfile"] }), queryClient.invalidateQueries({ queryKey: ["me"] }), queryClient.invalidateQueries({ queryKey: ["profiles"] })]);
    }

    async function onSaveProfile(e: FormEvent) {
        e.preventDefault();
        setFormError("");
        setMessage("");
        try {
            await updateMyProfile({
                full_name: fullName,
                headline: headline || null,
                about: about || null,
                location: location || null,
                contact: contact || null,
            });
            await refresh();
            setMessage("Profile saved.");
        } catch (err) {
            setFormError(getErrorMessage(err));
        }
    }

    async function onSaveVisibility(e: FormEvent) {
        e.preventDefault();
        setFormError("");
        setMessage("");
        try {
            await updateMyVisibility(visibility);
            await refresh();
            setMessage("Visibility saved.");
        } catch (err) {
            setFormError(getErrorMessage(err));
        }
    }

    async function onAddSkill(e: FormEvent) {
        e.preventDefault();
        const name = skillInput.trim();
        if (!name) return;
        const current = profile?.skills ?? [];
        if (current.length >= 30) {
            setFormError("You can add up to 30 skills.");
            return;
        }
        if (current.some((s) => s.toLowerCase() === name.toLowerCase())) {
            setFormError("That skill is already added.");
            return;
        }
        setFormError("");
        try {
            await setMySkills([...current, name]);
            setSkillInput("");
            await refresh();
        } catch (err) {
            setFormError(getErrorMessage(err));
        }
    }

    async function onRemoveSkill(name: string) {
        const current = profile?.skills ?? [];
        try {
            await setMySkills(current.filter((s) => s !== name));
            await refresh();
        } catch (err) {
            setFormError(getErrorMessage(err));
        }
    }

    function editExperience(exp: Experience) {
        setExpId(exp.id);
        setExpCompany(exp.company);
        setExpRole(exp.role);
        setExpStart(exp.start_date ?? "");
        setExpEnd(exp.end_date ?? "");
        setExpCurrent(exp.end_date === null);
        setExpDesc(exp.description ?? "");
    }

    function resetExperienceForm() {
        setExpId(null);
        setExpCompany("");
        setExpRole("");
        setExpStart("");
        setExpEnd("");
        setExpCurrent(false);
        setExpDesc("");
    }

    async function onSaveExperience(e: FormEvent) {
        e.preventDefault();
        if (!expCurrent && !expEnd) { setFormError("Enter an end date or select Currently working here."); return; }
        if (!expCurrent && expStart && expEnd && expEnd < expStart) {
            setFormError("End date must be on or after the start date.");
            return;
        }
        setFormError("");
        // Both dates are always sent, even when only one was changed,
        // so the backend checks start against end together.
        const data = {
            company: expCompany,
            role: expRole,
            start_date: expStart || null,
            end_date: experienceEndDate(expCurrent, expEnd),
            description: expDesc || null,
        };
        try {
            if (expId) await updateExperience(expId, data);
            else await createExperience(data);
            resetExperienceForm();
            await refresh();
        } catch (err) {
            setFormError(getErrorMessage(err));
        }
    }

    function editProject(project: Project) {
        setProjId(project.id);
        setProjTitle(project.title);
        setProjDesc(project.description ?? "");
        setProjLink(project.link ?? "");
    }

    function resetProjectForm() {
        setProjId(null);
        setProjTitle("");
        setProjDesc("");
        setProjLink("");
    }

    async function onSaveProject(e: FormEvent) {
        e.preventDefault();
        if (projLink && !projLink.startsWith("http://") && !projLink.startsWith("https://")) {
            setFormError("Project link must start with http:// or https://");
            return;
        }
        setFormError("");
        const data = {
            title: projTitle,
            description: projDesc || null,
            link: projLink || null,
        };
        try {
            if (projId) await updateProject(projId, data);
            else await createProject(data);
            resetProjectForm();
            await refresh();
        } catch (err) {
            setFormError(getErrorMessage(err));
        }
    }

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
            <h1 className="text-2xl font-bold">My Profile</h1>
            {message && <p className="mt-2 text-sm text-green-700">{message}</p>}
            {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}

            <section className="mt-8 rounded border p-4">
                <h2 className="font-semibold">Profile details</h2>
                <AsyncForm onSubmit={onSaveProfile} className="mt-4 space-y-4">
                    <div>
                        <label className={labelClass} htmlFor="full_name">Full name</label>
                        <input id="full_name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass} htmlFor="headline">Headline</label>
                        <input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass} htmlFor="about">About</label>
                        <textarea id="about" value={about} onChange={(e) => setAbout(e.target.value)} rows={4} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass} htmlFor="location">Location</label>
                        <input id="location" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass} htmlFor="contact">Contact</label>
                        <input id="contact" value={contact} onChange={(e) => setContact(e.target.value)} className={inputClass} />
                        <p className="mt-1 text-xs text-gray-500">Shown only to people allowed by your visibility setting below.</p>
                    </div>
                    <ActionButton type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">Save profile</ActionButton>
                </AsyncForm>
            </section>

            <section className="mt-8 rounded border p-4">
                <h2 className="font-semibold">Who can see each section</h2>
                <AsyncForm onSubmit={onSaveVisibility} className="mt-4 space-y-3">
                    {SECTIONS.map((section) => (
                        <div key={section.key} className="flex items-center justify-between gap-4">
                            <label className="text-sm" htmlFor={`vis-${section.key}`}>{section.label}</label>
                            <select
                                id={`vis-${section.key}`}
                                value={visibility[section.key]}
                                onChange={(e) => setVisibility({ ...visibility, [section.key]: e.target.value as VisibilityLevel })}
                                className="rounded border px-2 py-1"
                            >
                                {LEVELS.map((level) => (
                                    <option key={level.value} value={level.value}>{level.label}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                    <ActionButton type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">Save visibility</ActionButton>
                </AsyncForm>
            </section>

            <section className="mt-8 rounded border p-4">
                <h2 className="font-semibold">Skills ({(profile.skills ?? []).length} / 30)</h2>
                <div className="mt-3 flex flex-wrap gap-1">
                    {(profile.skills ?? []).map((skill) => (
                        <span key={skill} className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs">
                            {skill}
                            <ActionButton type="button" onClick={() => onRemoveSkill(skill)} aria-label={`Remove ${skill}`}>×</ActionButton>
                        </span>
                    ))}
                </div>
                <AsyncForm onSubmit={onAddSkill} className="mt-3 flex gap-2">
                    <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="Add a skill" className="w-full rounded border px-3 py-2" />
                    <ActionButton type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">Add</ActionButton>
                </AsyncForm>
            </section>

            <section className="mt-8 rounded border p-4">
                <h2 className="font-semibold">Experience</h2>
                <ul className="mt-3 space-y-3">
                    {(profile.experiences ?? []).map((exp) => (
                        <li key={exp.id} className="flex items-start justify-between gap-4 rounded border p-3">
                            <div>
                                <p className="font-medium">{exp.role} at {exp.company}</p>
                                <p className="text-xs text-gray-500">{exp.start_date ?? ""} — {exp.end_date ?? "Present"}</p>
                            </div>
                            <div className="flex gap-2 text-sm">
                                <ActionButton type="button" onClick={() => editExperience(exp)} className="text-blue-600">Edit</ActionButton>
                                <ActionButton type="button" onClick={async () => { if (window.confirm("Delete this experience?")) { await deleteExperience(exp.id); await refresh(); } }} className="text-red-600">Delete</ActionButton>
                            </div>
                        </li>
                    ))}
                </ul>
                <AsyncForm onSubmit={onSaveExperience} className="mt-4 space-y-3">
                    <h3 className="text-sm font-medium">{expId ? "Edit experience" : "Add experience"}</h3>
                    <input required placeholder="Company" value={expCompany} onChange={(e) => setExpCompany(e.target.value)} className={inputClass} />
                    <input required placeholder="Role" value={expRole} onChange={(e) => setExpRole(e.target.value)} className={inputClass} />
                    <div className="flex gap-2">
                        <input type="date" aria-label="Start date" value={expStart} onChange={(e) => setExpStart(e.target.value)} className={inputClass} />
                        <input type="date" aria-label="End date" aria-describedby="current-experience-hint" disabled={expCurrent} required={!expCurrent} min={expStart || undefined} value={expCurrent ? "" : expEnd} onChange={(e) => setExpEnd(e.target.value)} className={inputClass} />
                    </div>
                    <label className="current-experience"><input type="checkbox" checked={expCurrent} onChange={(e) => setExpCurrent(e.target.checked)} /><span>Currently working here</span></label>
                    <p id="current-experience-hint" className="text-sm text-gray-500">{expCurrent ? "This role will show Present on your profile. No end date is needed." : "Enter the date this role ended, or select the option above for an ongoing role."}</p>
                    <textarea placeholder="Description" value={expDesc} onChange={(e) => setExpDesc(e.target.value)} rows={3} className={inputClass} />
                    <div className="flex gap-2">
                        <ActionButton type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">{expId ? "Update" : "Add"} experience</ActionButton>
                        {expId && <ActionButton type="button" onClick={resetExperienceForm} className="rounded border px-4 py-2">Cancel</ActionButton>}
                    </div>
                </AsyncForm>
            </section>

            <section className="mt-8 rounded border p-4">
                <h2 className="font-semibold">Projects</h2>
                <ul className="mt-3 space-y-3">
                    {(profile.projects ?? []).map((project) => (
                        <li key={project.id} className="flex items-start justify-between gap-4 rounded border p-3">
                            <div>
                                <p className="font-medium">{project.title}</p>
                                {project.description && <p className="mt-1 text-sm text-gray-700">{project.description}</p>}
                            </div>
                            <div className="flex gap-2 text-sm">
                                <ActionButton type="button" onClick={() => editProject(project)} className="text-blue-600">Edit</ActionButton>
                                <ActionButton type="button" onClick={async () => { if (window.confirm("Delete this project?")) { await deleteProject(project.id); await refresh(); } }} className="text-red-600">Delete</ActionButton>
                            </div>
                        </li>
                    ))}
                </ul>
                <AsyncForm onSubmit={onSaveProject} className="mt-4 space-y-3">
                    <h3 className="text-sm font-medium">{projId ? "Edit project" : "Add project"}</h3>
                    <input required placeholder="Title" value={projTitle} onChange={(e) => setProjTitle(e.target.value)} className={inputClass} />
                    <textarea placeholder="Description" value={projDesc} onChange={(e) => setProjDesc(e.target.value)} rows={3} className={inputClass} />
                    <input placeholder="Link, http:// or https:// only" value={projLink} onChange={(e) => setProjLink(e.target.value)} className={inputClass} />
                    <div className="flex gap-2">
                        <ActionButton type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">{projId ? "Update" : "Add"} project</ActionButton>
                        {projId && <ActionButton type="button" onClick={resetProjectForm} className="rounded border px-4 py-2">Cancel</ActionButton>}
                    </div>
                </AsyncForm>
            </section>
        </main>
    );
}



