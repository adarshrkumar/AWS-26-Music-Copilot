import * as cheerio from 'cheerio';

export function extractMetadata(html: string) {
    const $ = cheerio.load(html);

    return {
        title: $('title').text() || $('h1').first().text() || '',
        description: $('meta[name="description"]').attr('content') || '',
        keywords: $('meta[name="keywords"]').attr('content') || '',
        ogTitle: $('meta[property="og:title"]').attr('content') || '',
        ogDescription: $('meta[property="og:description"]').attr('content') || '',
        ogImage: $('meta[property="og:image"]').attr('content') || '',
        twitterCard: $('meta[name="twitter:card"]').attr('content') || '',
        canonical: $('link[rel="canonical"]').attr('href') || '',
    };
}

export function extractLinks(html: string) {
    const $ = cheerio.load(html);
    const links: Array<{ text: string; href: string; title?: string }> = [];

    $('a').each((_, element) => {
        const $el = $(element);
        const href = $el.attr('href');
        if (href) {
            links.push({
                text: $el.text().trim(),
                href,
                title: $el.attr('title'),
            });
        }
    });

    return links;
}

export function extractImages(html: string) {
    const $ = cheerio.load(html);
    const images: Array<{ src: string; alt?: string; title?: string }> = [];

    $('img').each((_, element) => {
        const $el = $(element);
        const src = $el.attr('src');
        if (src) {
            images.push({
                src,
                alt: $el.attr('alt'),
                title: $el.attr('title'),
            });
        }
    });

    return images;
}

export function extractHeadings(html: string) {
    const $ = cheerio.load(html);
    const headings: Array<{ level: number; text: string; id?: string }> = [];

    $('h1, h2, h3, h4, h5, h6').each((_, element) => {
        const $el = $(element);

        headings.push({
            level: parseInt($el.prop('tagName')?.toLowerCase().replace('h', '') || '1'),
            text: $el.text().trim(),
            id: $el.attr('id'),
        });
    });

    return headings;
}

export function generateTableOfContents(html: string, maxLevel: number = 3) {
    return extractHeadings(html)
        .filter(h => h.level <= maxLevel)
        .map(h => ({
            ...h,
            slug: h.id || h.text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
        }));
}

export function cleanHtml(html: string): string {
    const $ = cheerio.load(html);

    $('script, style, iframe, object, embed').remove();

    $('*').each((_, element) => {
        const $el = $(element);
        const attrs = $el.attr();

        if (attrs) {
            Object.keys(attrs).forEach(attr => {
                if (attr.startsWith('on')) $el.removeAttr(attr);
            });
        }
    });

    return $.html();
}

export function extractTextContent(html: string): string {
    const $ = cheerio.load(html);

    $('script, style').remove();

    return $('body').text().replace(/\s+/g, ' ').trim();
}

export function addHeadingIds(html: string): string {
    const $ = cheerio.load(html);

    $('h1, h2, h3, h4, h5, h6').each((_, element) => {
        const $el = $(element);

        if (!$el.attr('id')) $el.attr('id', $el.text().trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''));
    });

    return $.html();
}

export function addExternalLinkTargets(html: string, domain?: string): string {
    const $ = cheerio.load(html);

    $('a').each((_, element) => {
        const $el = $(element);
        const href = $el.attr('href');

        if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
            if (!domain || !href.includes(domain)) {
                $el.attr('target', '_blank');
                $el.attr('rel', 'noopener noreferrer');
            }
        }
    });

    return $.html();
}

export function calculateReadingTime(html: string, wordsPerMinute: number = 200): number {
    return Math.ceil(extractTextContent(html).split(/\s+/).length / wordsPerMinute);
}

export function wrapTables(html: string): string {
    const $ = cheerio.load(html);

    $('table').wrap('<div class="table-wrapper" style="overflow-x: auto;"></div>');

    return $.html();
}
