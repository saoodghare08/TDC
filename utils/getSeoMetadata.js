import { createClient } from '@/utils/supabase/server';

/**
 * Fetches SEO metadata for a given route from the `seo_metadata` Supabase table.
 * Falls back to the provided `defaults` if no DB record exists or the request fails.
 *
 * Usage in any page:
 *   export async function generateMetadata() {
 *       return getSeoMetadata('/about', {
 *           title: 'About Us | The Diet Cascade',
 *           description: '...',
 *           keywords: '...',
 *       });
 *   }
 *
 * @param {string} route - The page route key, e.g. '/about', '/blog'
 * @param {{ title?: string, description?: string, keywords?: string }} defaults - Fallback values
 * @returns {Promise<{ title: string, description: string, keywords: string }>}
 */
export async function getSeoMetadata(route, defaults = {}) {
    try {
        const supabase = await createClient();
        const { data: seo, error } = await supabase
            .from('seo_metadata')
            .select('title, description, keywords')
            .eq('route', route)
            .single();

        if (error) throw error;

        return {
            title:       seo?.title       || defaults.title       || 'The Diet Cascade',
            description: seo?.description || defaults.description || '',
            keywords:    seo?.keywords    || defaults.keywords    || '',
        };
    } catch {
        // Silently fall back — a missing SEO row should never break a page
        return {
            title:       defaults.title       || 'The Diet Cascade',
            description: defaults.description || '',
            keywords:    defaults.keywords    || '',
        };
    }
}
