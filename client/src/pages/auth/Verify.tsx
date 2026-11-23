import { Spinner } from "../../components/ui/Loading";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../../api/auth";
import { getErrorMessage } from "../../api/client";

export default function Verify() {
    const [searchParams] = useSearchParams();
    const tokenHash = searchParams.get("token_hash") ?? "";
    const called = useRef(false);
    const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
    const [error, setError] = useState("");

    useEffect(() => {
        if (!tokenHash) {
            setStatus("error");
            setError("Verification link is missing.");
            return;
        }
        // StrictMode runs effects twice in dev. The link is single-use,
        // so only call verify once.
        if (called.current) return;
        called.current = true;
        verifyEmail(tokenHash)
            .then(() => setStatus("done"))
            .catch((err: unknown) => {
                setError(getErrorMessage(err));
                setStatus("error");
            });
    }, [tokenHash]);

    return (
        <main className="mx-auto max-w-md px-4 py-16">
            <h1 className="text-2xl font-bold">Verify your email</h1>
            {status === "loading" && <p className="mt-2 text-gray-600" role="status"><Spinner />Verifying your email…</p>}
            {status === "done" && (
                <>
                    <p className="mt-2 text-gray-600">Your email is verified. You can now sign in.</p>
                    <p className="mt-4 text-sm">
                        <Link className="text-blue-600" to="/login">Go to sign in</Link>
                    </p>
                </>
            )}
            {status === "error" && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </main>
    );
}

