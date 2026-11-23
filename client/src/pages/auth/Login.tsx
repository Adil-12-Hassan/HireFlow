import { ActionButton, AsyncForm } from "../../components/ui/Loading";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../api/client";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login({ email, password });
            navigate("/dashboard", { replace: true });
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="mx-auto max-w-md px-4 py-16">
            <h1 className="text-2xl font-bold">Sign in to HireFlow</h1>
            <AsyncForm onSubmit={onSubmit} className="mt-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium" htmlFor="email">Email</label>
                    <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium" htmlFor="password">Password</label>
                    <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <ActionButton type="submit" busy={loading} disabled={loading} className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
                    {loading ? "Signing in..." : "Sign in"}
                </ActionButton>
            </AsyncForm>
            <p className="mt-4 text-sm">
                No account? <Link className="text-blue-600" to="/register">Register</Link>
            </p>
            <p className="mt-2 text-sm">
                <Link className="text-blue-600" to="/forgot-password">Forgot password?</Link>
            </p>
        </main>
    );
}

