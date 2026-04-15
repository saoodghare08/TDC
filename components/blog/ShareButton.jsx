'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export default function ShareButton() {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    return (
        <button 
            onClick={handleCopy}
            className={`w-full md:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest transition-all active:scale-[0.98] cursor-pointer group ${
                copied ? 'bg-emerald-500 text-white' : 'bg-heading text-white hover:bg-primary'
            }`}
        >
            {copied ? 'Link Copied' : 'Share Insight'}
            {copied ? (
                <Check size={16} className="animate-in zoom-in duration-200" />
            ) : (
                <Share2 size={16} className="transition-transform group-hover:scale-110" />
            )}
        </button>
    );
}