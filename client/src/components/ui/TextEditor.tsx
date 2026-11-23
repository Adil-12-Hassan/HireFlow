import { useRef, useState } from "react";
import { formatSelection, type Format } from "../../utils/editorText";
import FormattedText from "./FormattedText";

type Props = { id: string; value: string; onChange: (value: string) => void; maxLength: number; placeholder?: string; label: string };
const formats: { name: string; format: Format; icon: string }[] = [
    { name: "Bold", format: "bold", icon: "B" }, { name: "Italic", format: "italic", icon: "I" },
    { name: "Heading", format: "heading", icon: "H" }, { name: "Bullet list", format: "bullet", icon: "• List" },
    { name: "Numbered list", format: "numbered", icon: "1. List" }, { name: "Quote", format: "quote", icon: "Quote" },
];

export default function TextEditor({ id, value, onChange, maxLength, placeholder, label }: Props) {
    const textarea = useRef<HTMLTextAreaElement>(null);
    const [preview, setPreview] = useState(false);
    const [notice, setNotice] = useState("");
    const [past, setPast] = useState<string[]>([]);
    const [future, setFuture] = useState<string[]>([]);
    function commit(next: string) {
        if (next === value) return;
        setPast(previous => [...previous.slice(-99), value]);
        setFuture([]);
        setNotice("");
        onChange(next);
    }
    function undo() {
        const previous = past.at(-1);
        if (previous === undefined) return;
        setPast(past.slice(0, -1)); setFuture([...future, value]); onChange(previous); setNotice("");
    }
    function redo() {
        const next = future.at(-1);
        if (next === undefined) return;
        setFuture(future.slice(0, -1)); setPast([...past, value]); onChange(next); setNotice("");
    }
    function format(style: Format) {
        const input = textarea.current;
        if (!input) return;
        const result = formatSelection(value, input.selectionStart, input.selectionEnd, style, maxLength);
        if (!result) { setNotice("This formatting would exceed the character limit."); return; }
        commit(result.text);
        requestAnimationFrame(() => { input.focus(); input.setSelectionRange(result.selectionStart, result.selectionEnd); });
    }
    const words = value.trim() ? value.trim().split(/\s+/).length : 0;
    return <div className="text-editor">
        <div className="editor-toolbar" role="group" aria-label={`${label} formatting`}>
            <div className="editor-tools">{formats.map(item => <button key={item.format} type="button" title={item.name} aria-label={item.name} disabled={preview} onClick={() => format(item.format)}>{item.icon}</button>)}<button type="button" disabled={!past.length || preview} onClick={undo} title="Undo (Ctrl+Z)">Undo</button><button type="button" disabled={!future.length || preview} onClick={redo} title="Redo (Ctrl+Shift+Z)">Redo</button></div>
            <button type="button" className="editor-preview-toggle" aria-pressed={preview} onClick={() => setPreview(!preview)}>{preview ? "Back to editor" : "Preview"}</button>
        </div>
        {preview ? <div className="editor-preview" role="region" aria-label={`${label} preview`}>{value.trim() ? <FormattedText text={value} /> : <p className="text-gray-500">Your preview will appear here once you start writing.</p>}</div> : <textarea ref={textarea} id={id} aria-label={label} aria-describedby={`${id}-help ${id}-count`} value={value} maxLength={maxLength} placeholder={placeholder} rows={8} onChange={event => commit(event.target.value)} onKeyDown={event => {
            if (!(event.ctrlKey || event.metaKey)) return;
            if (event.key.toLowerCase() === "b" || event.key.toLowerCase() === "i") { event.preventDefault(); format(event.key.toLowerCase() === "b" ? "bold" : "italic"); }
            if (event.key.toLowerCase() === "z") { event.preventDefault(); if (event.shiftKey) redo(); else undo(); }
        }} />}
        <div className="editor-footer"><span id={`${id}-help`}>Select text to format · Preview before submitting</span><span id={`${id}-count`}>{words} words · {value.length.toLocaleString()} / {maxLength.toLocaleString()}</span></div>
        {notice && <p className="editor-notice" role="status">{notice}</p>}
    </div>;
}
