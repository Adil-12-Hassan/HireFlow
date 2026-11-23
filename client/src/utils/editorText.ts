export type Format = "bold" | "italic" | "heading" | "bullet" | "numbered" | "quote";

export function formatSelection(value: string, start: number, end: number, format: Format, limit: number) {
    let from = start;
    let to = end;
    let replacement: string;
    let selectionStart: number;
    let selectionEnd: number;
    if (format === "bold" || format === "italic") {
        const marker = format === "bold" ? "**" : "*";
        const selected = value.slice(start, end) || (format === "bold" ? "bold text" : "italic text");
        replacement = marker + selected + marker;
        selectionStart = start + marker.length;
        selectionEnd = selectionStart + selected.length;
    } else {
        from = start === 0 ? 0 : value.lastIndexOf("\n", start - 1) + 1;
        const last = end > start && value[end - 1] === "\n" ? end - 1 : end;
        const lineEnd = value.indexOf("\n", last);
        to = lineEnd === -1 ? value.length : lineEnd;
        replacement = value.slice(from, to).split("\n").map((line, i) => {
            const prefix = format === "heading" ? "## " : format === "bullet" ? "- " : format === "quote" ? "> " : `${i + 1}. `;
            return prefix + line.replace(/^(?:#{1,3} |[-*] |\d+\. |> )/, "");
        }).join("\n");
        selectionStart = from;
        selectionEnd = from + replacement.length;
    }
    const text = value.slice(0, from) + replacement + value.slice(to);
    return text.length <= limit ? { text, selectionStart, selectionEnd } : null;
}

export type TextBlock = { kind: "paragraph" | "heading" | "quote" | "bullet" | "numbered"; lines: string[] };
export function parseBlocks(value: string): TextBlock[] {
    const blocks: TextBlock[] = [];
    for (const line of value.replace(/\r\n/g, "\n").split("\n")) {
        if (!line.trim()) { blocks.push({ kind: "paragraph", lines: [] }); continue; }
        let kind: TextBlock["kind"] = "paragraph";
        let text = line;
        const match = /^(#{1,3} |[-*] |\d+\. |> )(.*)$/.exec(line);
        if (match) {
            kind = match[1].startsWith("#") ? "heading" : match[1].startsWith(">") ? "quote" : /^\d/.test(match[1]) ? "numbered" : "bullet";
            text = match[2];
        }
        const previous = blocks.at(-1);
        if (previous?.kind === kind && previous.lines.length && kind !== "heading") previous.lines.push(text);
        else blocks.push({ kind, lines: [text] });
    }
    return blocks.filter(block => block.lines.length);
}

export function experienceEndDate(current: boolean, end: string): string | null {
    return current ? null : end || null;
}

export function plainTextSummary(value: string): string {
    return parseBlocks(value).flatMap(block => block.lines).join(" ").replace(/\*\*([^*\n]+)\*\*/g, "$1").replace(/\*([^*\n]+)\*/g, "$1");
}
