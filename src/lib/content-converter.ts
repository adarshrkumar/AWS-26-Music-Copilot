import { marked } from 'marked';
import { gfmHeadingId } from 'marked-gfm-heading-id';
import TurndownService from 'turndown';

marked.setOptions({
    gfm: true,       // GitHub Flavored Markdown
    breaks: true,    // Convert \n to <br>
});

marked.use(gfmHeadingId());

const turndownService = new TurndownService({
    headingStyle: 'atx',      // Use # for headings
    hr: '---',                // Use --- for horizontal rules
    bulletListMarker: '-',    // Use - for bullet lists
    codeBlockStyle: 'fenced', // Use ``` for code blocks
    fence: '```',             // Code fence marker
    emDelimiter: '*',         // Use * for emphasis
    strongDelimiter: '**',    // Use ** for strong
    linkStyle: 'inlined',     // Use [text](url) for links
});

export async function markdownToHtml(markdown: string): Promise<string> {
    try {
        return await marked.parse(markdown);
    } catch (error) {
        console.error('Error converting markdown to HTML:', error);
        throw new Error('Failed to convert markdown to HTML', { cause: error });
    }
}

export function markdownToHtmlSync(markdown: string): string {
    try {
        return marked.parse(markdown, { async: false });
    } catch (error) {
        console.error('Error converting markdown to HTML:', error);
        throw new Error('Failed to convert markdown to HTML', { cause: error });
    }
}

export function htmlToMarkdown(html: string): string {
    try {
        return turndownService.turndown(html);
    } catch (error) {
        console.error('Error converting HTML to markdown:', error);
        throw new Error('Failed to convert HTML to markdown', { cause: error });
    }
}

export async function sanitizeMarkdown(markdown: string): Promise<string> {
    try {
        return await marked.parse(
            markdown
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/on\w+="[^"]*"/g, '')
                .replace(/on\w+='[^']*'/g, '')
        );
    } catch (error) {
        console.error('Error sanitizing markdown:', error);
        throw new Error('Failed to sanitize markdown', { cause: error });
    }
}

export function markdownToPlainText(markdown: string): string {
    try {
        return marked.parse(markdown, { async: false })
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&nbsp;/g, ' ') // Replace &nbsp;
            .replace(/&amp;/g, '&') // Replace &amp;
            .replace(/&lt;/g, '<') // Replace &lt;
            .replace(/&gt;/g, '>') // Replace &gt;
            .replace(/&quot;/g, '"') // Replace &quot;
            .trim();
    } catch (error) {
        console.error('Error extracting plain text:', error);
        throw new Error('Failed to extract plain text', { cause: error });
    }
}

export function generateExcerpt(markdown: string, maxLength: number = 200): string {
    const plainText = markdownToPlainText(markdown);

    if (plainText.length <= maxLength) return plainText;

    const truncated = plainText.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > 0) return truncated.slice(0, lastSpace) + '...';

    return truncated + '...';
}
