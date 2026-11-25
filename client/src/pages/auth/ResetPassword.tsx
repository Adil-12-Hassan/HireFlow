import { ActionButton, AsyncForm } from "../../components/ui/Loading";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../api/auth";
import { getErrorMessage } from "../../api/client";

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    // Supabase puts the reset token in the URL hash (#access_token=...), custom
    // email templates put it in the query (?token=...). Accept both, read once.
    const [{ token, linkError }] = useState(() => {
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        return {
            token: searchParams.get("token") ?? hash.get("access_token") ?? "",
            linkError: hash.get("error_description") ?? "",
        };
    });
    // Do not leave the token sitting in the address bar and browser history.
    useEffect(() => {
        if (window.location.hash) {
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
    }, []);
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!token) {
        return (
            <main className="mx-auto max-w-md px-4 py-16">
                <h1 className="text-2xl font-bold">{linkError ? "Reset link is not valid" : "Reset link is missing"}</h1>
                <p className="mt-2 text-gray-600">
                    {linkError ? linkError.replace(/\+/g, " ") : "Open the reset link from your email again."}
                </p>
                <p className="mt-4 text-sm">
                    <Link className="text-blue-600" to="/forgot-password">Request a new link</Link>
                </p>
            </main>
        );
    }

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        if (password !== confirm) {
            setError("Passwords do not match");
            return;
        }
        setError("");
        setLoading(true);
        try {
            await resetPassword({ token, password });
            setDone(true);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    if (done) {
        return (
            <main className="mx-auto max-w-md px-4 py-16">
                <h1 className="text-2xl font-bold">Password changed</h1>
                <p className="mt-2 text-gray-600">You can now sign in with your new password.</p>
                <p className="mt-4 text-sm">
                    <Link className="text-blue-600" to="/login">Go to sign in</Link>
                </p>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-md px-4 py-16">
            <h1 className="text-2xl font-bold">Reset password</h1>
            <AsyncForm onSubmit={onSubmit} className="mt-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium" htmlFor="password">New password</label>
                    <input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium" htmlFor="confirm">Confirm new password</label>
                    <input id="confirm" type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <ActionButton type="submit" busy={loading} disabled={loading} className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
                    {loading ? "Changing..." : "Change password"}
                </ActionButton>
            </AsyncForm>
        </main>
    );
}

