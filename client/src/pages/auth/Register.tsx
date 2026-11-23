import { ActionButton, AsyncForm } from "../../components/ui/Loading";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { register } from "../../api/auth";
import { getErrorMessage } from "../../api/client";

export default function Register() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await register({ full_name: fullName, email, password });
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
                <h1 className="text-2xl font-bold">Check your email</h1>
                <p className="mt-2 text-gray-600">
                    If email verification is on, click the link in the email to verify your account, then sign in.
                </p>
                <p className="mt-4 text-sm">
                    <Link className="text-blue-600" to="/login">Go to sign in</Link>
                </p>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-md px-4 py-16">
            <h1 className="text-2xl font-bold">Create your account</h1>
            <AsyncForm onSubmit={onSubmit} className="mt-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium" htmlFor="full_name">Full name</label>
                    <input id="full_name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium" htmlFor="email">Email</label>
                    <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium" htmlFor="password">Password</label>
                    <input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
                    <p className="mt-1 text-xs text-gray-500">At least 8 characters.</p>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <ActionButton type="submit" busy={loading} disabled={loading} className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
                    {loading ? "Creating account..." : "Register"}
                </ActionButton>
            </AsyncForm>
            <p className="mt-4 text-sm">
                Already have an account? <Link className="text-blue-600" to="/login">Sign in</Link>
            </p>
        </main>
    );
}

