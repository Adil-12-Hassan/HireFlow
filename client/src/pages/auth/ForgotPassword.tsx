import { ActionButton, AsyncForm } from "../../components/ui/Loading";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../api/auth";
import { getErrorMessage } from "../../api/client";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await forgotPassword(email);
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
                    If an account exists for that email, a reset link has been sent.
                </p>
                <p className="mt-4 text-sm">
                    <Link className="text-blue-600" to="/login">Back to sign in</Link>
                </p>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-md px-4 py-16">
            <h1 className="text-2xl font-bold">Forgot password</h1>
            <AsyncForm onSubmit={onSubmit} className="mt-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium" htmlFor="email">Email</label>
                    <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <ActionButton type="submit" busy={loading} disabled={loading} className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
                    {loading ? "Sending..." : "Send reset link"}
                </ActionButton>
            </AsyncForm>
        </main>
    );
}

