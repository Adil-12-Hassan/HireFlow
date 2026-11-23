import { createContext, useContext, useRef, useState, type ButtonHTMLAttributes, type FormHTMLAttributes, type FormEvent, type MouseEvent } from "react";
import { getErrorMessage } from "../../api/client";

const FormBusyContext = createContext(false);

export function Spinner() {
    return <span className="loading-spinner" aria-hidden="true" />;
}

export function LoadingBlocks({ compact = false }: { compact?: boolean }) {
    return <div className={`loading-blocks ${compact ? "loading-blocks-compact" : ""}`} role="status" aria-label="Loading content" aria-busy="true">
        <span className="sr-only">Loading content…</span>
        {Array.from({ length: compact ? 1 : 3 }, (_, index) => <div className="loading-block" aria-hidden="true" key={index}><div className="loading-block-icon" /><div className="loading-block-line loading-block-title" /><div className="loading-block-line" /><div className="loading-block-line loading-block-short" /></div>)}
    </div>;
}

type ActionButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void | Promise<unknown>;
    busy?: boolean;
};

export function ActionButton({ onClick, busy = false, disabled, children, type = "button", ...props }: ActionButtonProps) {
    const formBusy = useContext(FormBusyContext);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState("");
    const locked = useRef(false);
    const working = busy || pending || (type === "submit" && formBusy);
    async function handleClick(event: MouseEvent<HTMLButtonElement>) {
        if (locked.current || working) { event.preventDefault(); return; }
        if (!onClick) return;
        locked.current = true;
        setError("");
        try {
            const result = onClick(event);
            if (result && typeof result.then === "function") {
                setPending(true);
                await result;
            }
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            locked.current = false;
            setPending(false);
        }
    }
    return <><button {...props} type={type} disabled={disabled || working} aria-busy={working || undefined} onClick={handleClick}>{working && <Spinner />}{children}{working && <span className="sr-only"> — In progress</span>}</button>{error && <span role="alert" className="action-error">{error}</span>}</>;
}

type AsyncFormProps = Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> & {
    onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
};

export function AsyncForm({ onSubmit, children, className, ...props }: AsyncFormProps) {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState("");
    const locked = useRef(false);
    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (locked.current) return;
        locked.current = true;
        setPending(true);
        setError("");
        try { await onSubmit(event); }
        catch (err) { setError(getErrorMessage(err)); }
        finally { locked.current = false; setPending(false); }
    }
    return <form {...props} onSubmit={handleSubmit} className="async-form" aria-busy={pending || undefined}>
        <FormBusyContext.Provider value={pending}><fieldset disabled={pending} className={className}>{children}</fieldset></FormBusyContext.Provider>
        {pending && <div className="form-progress" role="status"><span className="form-progress-track" />Processing your request…</div>}
        {error && <p role="alert" className="action-error">{error}</p>}
    </form>;
}
