import { Link } from "react-router-dom";
import type { Profile } from "../api/profiles";

export default function ProfileCard({ profile }: { profile: Profile }) {
    return (
        <Link to={`/profiles/${profile.id}`} className="profile-card">
            <div className="profile-avatar" aria-hidden="true">{profile.full_name.split(" ").filter(Boolean).slice(0, 2).map(part => part[0]).join("")}</div><h2 className="font-semibold">{profile.full_name}</h2>
            {profile.headline && <p className="mt-1 text-sm text-gray-600">{profile.headline}</p>}
            {profile.location && <p className="mt-1 text-xs text-gray-500">{profile.location}</p>}
            {profile.skills && profile.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                    {profile.skills.slice(0, 5).map((skill) => (
                        <span key={skill} className="rounded bg-gray-100 px-2 py-1 text-xs">
                            {skill}
                        </span>
                    ))}
                </div>
            )}
        </Link>
    );
}

