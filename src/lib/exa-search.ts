import Exa, { type RegularSearchOptions } from 'exa-js';

function getExaClient(): Exa {
    const apiKey = import.meta.env.EXA_API_KEY || process.env.EXA_API_KEY;

    if (!apiKey) throw new Error('EXA_API_KEY environment variable is not set');

    return new Exa(apiKey);
}

export interface ExaSearchOptions {
    numResults?: number;                         // Number of results to return (1-10, default: 10)
    type?: 'neural' | 'keyword' | 'auto';        // Type of search: 'neural', 'keyword', or 'auto' (default: 'auto')
    useAutoprompt?: boolean;                     // Whether to use autoprompt to expand query (default: false)
    category?: RegularSearchOptions['category']; // Category of content to search
    startCrawlDate?: string;                     // Start crawl date (YYYY-MM-DD)
    endCrawlDate?: string;                       // End crawl date (YYYY-MM-DD)
    startPublishedDate?: string;                 // Start published date (YYYY-MM-DD)
    endPublishedDate?: string;                   // End published date (YYYY-MM-DD)
    includeDomains?: string[];                   // Include domains (whitelist)
    excludeDomains?: string[];                   // Exclude domains (blacklist)
    contents?: {
        text?: true | { maxCharacters?: number };
        highlights?: true | { numSentences?: number; highlightsPerUrl?: number };
        summary?: true | { query?: string };
    };                                           // Whether to include page content
}

export interface ExaResult {
    url: string;
    title: string | null;
    publishedDate?: string;
    author?: string;
    score?: number;
    id: string;
    text?: string;
    highlights?: string[];
    summary?: string;
}

export async function searchWeb(
    query: string,
    options: ExaSearchOptions = {}
): Promise<ExaResult[]> {
    try {
        return (await getExaClient().searchAndContents(query, {
            ...options,
            ...options.contents,
        })).results;
    } catch (error) {
        console.error('Exa search error:', error);
        throw new Error('Failed to perform search', { cause: error });
    }
}

export async function findSimilar(
    url: string,
    options: Omit<ExaSearchOptions, 'type' | 'useAutoprompt'> = {}
): Promise<ExaResult[]> {
    try {
        return (await getExaClient().findSimilarAndContents(url, {
            ...options,
            ...options.contents,
        })).results;
    } catch (error) {
        console.error('Exa find similar error:', error);
        throw new Error('Failed to find similar content', { cause: error });
    }
}

export async function getContents(
    urls: string[],
    options: ExaSearchOptions['contents'] = {}
): Promise<ExaResult[]> {
    try {
        return (await getExaClient().getContents(urls, options)).results;
    } catch (error) {
        console.error('Exa get contents error:', error);
        throw new Error('Failed to get contents', { cause: error });
    }
}

export async function searchNews(query: string, daysBack: number = 7): Promise<ExaResult[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    return searchWeb(query, {
        category: 'news',
        startPublishedDate: startDate.toISOString().split('T')[0],
        endPublishedDate: new Date().toISOString().split('T')[0],
        numResults: 10,
        contents: {
            text: { maxCharacters: 1000 },
            highlights: { numSentences: 3 },
        },
    });
}

export async function searchResearch(
    query: string,
    options: ExaSearchOptions = {}
): Promise<ExaResult[]> {
    return searchWeb(query, {
        ...options,
        category: 'research paper',
        contents: {
            text: { maxCharacters: 2000 },
            summary: true,
            ...options.contents,
        },
    });
}

export async function searchGitHub(
    query: string,
    options: ExaSearchOptions = {}
): Promise<ExaResult[]> {
    return searchWeb(query, {
        ...options,
        category: 'github',
        includeDomains: ['github.com'],
        contents: {
            text: { maxCharacters: 1500 },
            highlights: { numSentences: 5 },
            ...options.contents,
        },
    });
}
