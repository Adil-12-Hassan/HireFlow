import { Fragment } from "react";
import { parseBlocks } from "../../utils/editorText";

function inline(text: string) {
    return text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g).map((part, index) =>
        part.startsWith("**") && part.endsWith("**") && part.length > 4 ? <strong key={index}>{part.slice(2, -2)}</strong> :
        part.startsWith("*") && part.endsWith("*") && part.length > 2 ? <em key={index}>{part.slice(1, -1)}</em> : <Fragment key={index}>{part}</Fragment>);
}

// Only React text nodes and known elements: HTML and arbitrary links are never executed.
export default function FormattedText({ text, className = "" }: { text: string; className?: string }) {
    return <div className={`formatted-text ${className}`}>{parseBlocks(text).map((block, index) => {
        if (block.kind === "bullet") return <ul key={index}>{block.lines.map((line, i) => <li key={i}>{inline(line)}</li>)}</ul>;
        if (block.kind === "numbered") return <ol key={index}>{block.lines.map((line, i) => <li key={i}>{inline(line)}</li>)}</ol>;
        const content = block.lines.map((line, i) => <Fragment key={i}>{i > 0 && <br />}{inline(line)}</Fragment>);
        if (block.kind === "heading") return <h3 key={index}>{content}</h3>;
        if (block.kind === "quote") return <blockquote key={index}>{content}</blockquote>;
        return <p key={index}>{content}</p>;
    })}</div>;
}
