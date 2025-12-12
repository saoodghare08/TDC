'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Save, Plus, Trash2 } from 'lucide-react';

export default function SEOPage() {
    const [seoEntries, setSeoEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const supabase = createClient();

    // New entry state
    const [newRoute, setNewRoute] = useState('');

    const fetchSEO = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('seo_metadata').select('*').order('route');
        if (data) setSeoEntries(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchSEO();
    }, []);

    const handleUpdate = async (id, field, value) => {
        const updatedEntries = seoEntries.map(entry =>
            entry.id === id ? { ...entry, [field]: value } : entry
        );
        setSeoEntries(updatedEntries);
    };

    const handleSave = async (id) => {
        setSaving(true);
        const entry = seoEntries.find(e => e.id === id);
        if (!entry) return;

        const { error } = await supabase
            .from('seo_metadata')
            .update({
                title: entry.title,
                description: entry.description,
                keywords: entry.keywords
            })
            .eq('id', id);

        if (error) alert('Error saving: ' + error.message);
        else alert('Saved successfully!');
        setSaving(false);
    };

    const handleCreate = async () => {
        if (!newRoute) return;

        const { data, error } = await supabase
            .from('seo_metadata')
            .insert([{ route: newRoute, title: '', description: '', keywords: '' }])
            .select();

        if (data) {
            setSeoEntries([...seoEntries, data[0]]);
            setNewRoute('');
        } else if (error) {
            alert('Error creating: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this SEO entry?')) return;
        const { error } = await supabase.from('seo_metadata').delete().eq('id', id);
        if (!error) {
            setSeoEntries(seoEntries.filter(e => e.id !== id));
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-heading mb-8">SEO Management</h1>

            {/* Create New */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8 flex gap-4 items-end">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Add Route (e.g., "/about" or "/")</label>
                    <input
                        type="text"
                        value={newRoute}
                        onChange={(e) => setNewRoute(e.target.value)}
                        placeholder="/new-page"
                        className="w-full px-4 py-2 rounded-lg border border-gray-200"
                    />
                </div>
                <button
                    onClick={handleCreate}
                    disabled={!newRoute}
                    className="px-6 py-2 bg-heading text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2 h-[42px]"
                >
                    <Plus size={18} /> Add
                </button>
            </div>

            {loading ? (
                <div>Loading SEO Data...</div>
            ) : (
                <div className="space-y-6">
                    {seoEntries.map((entry) => (
                        <div key={entry.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-50">
                                <h3 className="font-bold text-lg font-mono text-primary bg-primary/5 px-3 py-1 rounded inline-block">
                                    {entry.route}
                                </h3>
                                <button
                                    onClick={() => handleDelete(entry.id)}
                                    className="text-red-400 hover:text-red-500 p-2"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 mb-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Meta Title</label>
                                    <input
                                        type="text"
                                        value={entry.title || ''}
                                        onChange={(e) => handleUpdate(entry.id, 'title', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Keywords</label>
                                    <input
                                        type="text"
                                        value={entry.keywords || ''}
                                        onChange={(e) => handleUpdate(entry.id, 'keywords', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Meta Description</label>
                                <textarea
                                    value={entry.description || ''}
                                    onChange={(e) => handleUpdate(entry.id, 'description', e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => handleSave(entry.id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-bold"
                                >
                                    <Save size={16} /> Save Changes
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
