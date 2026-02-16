'use server';

import { revalidatePath } from 'next/cache';

export async function clearGlobalCache() {
    try {
        // Revalidate the entire application
        revalidatePath('/', 'layout');
        return { success: true, message: 'Global cache cleared successfully' };
    } catch (error) {
        console.error('Failed to clear cache:', error);
        return { success: false, message: 'Failed to clear cache' };
    }
}
