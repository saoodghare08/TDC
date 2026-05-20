'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Save, Plus, Trash2, MessageCircle, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ChatbotFAQsPage() {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [creating, setCreating] = useState(false);
    const supabase = createClient();

    // New FAQ form state
    const [newQuestion, setNewQuestion] = useState('');
    const [newAnswer, setNewAnswer] = useState('');
    const [newKeywordsInput, setNewKeywordsInput] = useState('');
    const [newIsPreset, setNewIsPreset] = useState(false);

    const fetchFAQs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('chatbot_faqs')
                .select('*')
                .order('id');
            
            if (error) throw error;
            if (data) {
                // Map the keywords array into a clean comma-separated string for user editing
                const formatted = data.map(item => ({
                    ...item,
                    keywords_input: (item.keywords && Array.isArray(item.keywords)) ? item.keywords.join(', ') : ''
                }));
                setFaqs(formatted);
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error Loading FAQs',
                text: err.message,
                confirmButtonColor: '#fdbc00'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFAQs();
    }, []);

    const handleUpdateField = (id, field, value) => {
        setFaqs(prev => prev.map(faq => 
            faq.id === id ? { ...faq, [field]: value } : faq
        ));
    };

    const handleSave = async (id) => {
        setSavingId(id);
        const faq = faqs.find(f => f.id === id);
        if (!faq) return;

        // Split keywords by comma, trim whitespace, and discard empty strings
        const parsedKeywords = faq.keywords_input
            ? faq.keywords_input.split(',').map(k => k.trim()).filter(Boolean)
            : [];

        try {
            const { error } = await supabase
                .from('chatbot_faqs')
                .update({
                    question: faq.question,
                    answer: faq.answer,
                    keywords: parsedKeywords,
                    is_preset: faq.is_preset
                })
                .eq('id', id);

            if (error) throw error;

            Swal.fire({
                icon: 'success',
                title: 'Saved!',
                text: 'FAQ updated successfully.',
                confirmButtonColor: '#fdbc00',
                timer: 1500
            });
            
            // Refresh to ensure sync
            fetchFAQs();
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: err.message,
                confirmButtonColor: '#fdbc00'
            });
        } finally {
            setSavingId(null);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newQuestion.trim() || !newAnswer.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Fields',
                text: 'Please provide both a Question and an Answer.',
                confirmButtonColor: '#fdbc00'
            });
            return;
        }

        setCreating(true);

        const parsedKeywords = newKeywordsInput
            ? newKeywordsInput.split(',').map(k => k.trim()).filter(Boolean)
            : [];

        try {
            const { data, error } = await supabase
                .from('chatbot_faqs')
                .insert([{
                    question: newQuestion,
                    answer: newAnswer,
                    keywords: parsedKeywords,
                    is_preset: newIsPreset
                }])
                .select();

            if (error) throw error;

            if (data) {
                Swal.fire({
                    icon: 'success',
                    title: 'Created!',
                    text: 'New FAQ added successfully.',
                    confirmButtonColor: '#fdbc00',
                    timer: 1500
                });

                // Reset new form fields
                setNewQuestion('');
                setNewAnswer('');
                setNewKeywordsInput('');
                setNewIsPreset(false);

                // Reload FAQs
                fetchFAQs();
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Creation Failed',
                text: err.message,
                confirmButtonColor: '#fdbc00'
            });
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete FAQ?',
            text: 'Are you sure you want to remove this question? Chatbot won\'t respond to it anymore!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        try {
            const { error } = await supabase
                .from('chatbot_faqs')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setFaqs(prev => prev.filter(f => f.id !== id));
            Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'FAQ has been deleted.',
                confirmButtonColor: '#fdbc00',
                timer: 1500
            });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Deletion Failed',
                text: err.message,
                confirmButtonColor: '#fdbc00'
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
                
                {/* Page Title Header */}
                <div className="flex items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-heading flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <MessageCircle size={24} className="text-primary" />
                            </div>
                            Chatbot FAQs Manager
                        </h1>
                        <p className="text-gray-400 text-sm mt-1 ml-1">
                            Customize the interactive questions, keyword-matching replies, and quick-preset badges.
                        </p>
                    </div>
                </div>

                {/* Add New FAQ Form */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-10">
                    <h2 className="text-base font-bold text-heading mb-4 flex items-center gap-2">
                        <Sparkles size={16} className="text-primary" /> Add New FAQ
                    </h2>
                    
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Question Text
                                </label>
                                <input
                                    type="text"
                                    value={newQuestion}
                                    onChange={(e) => setNewQuestion(e.target.value)}
                                    placeholder="e.g. What plans do you offer?"
                                    className="w-full px-4 py-2 text-sm rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Keywords (Comma-separated)
                                </label>
                                <input
                                    type="text"
                                    value={newKeywordsInput}
                                    onChange={(e) => setNewKeywordsInput(e.target.value)}
                                    placeholder="e.g. plan, plans, duration, cost"
                                    className="w-full px-4 py-2 text-sm rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition"
                                />
                                <span className="text-[10px] text-gray-400 mt-1 block">
                                    Trigger keywords to match user typed messages (case insensitive).
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                Answer Text (Markdown supported: **bold** and [link text](/url))
                            </label>
                            <textarea
                                value={newAnswer}
                                onChange={(e) => setNewAnswer(e.target.value)}
                                placeholder="Write the answer... Support Markdown link formats like [Checkout](/checkout)"
                                rows={3}
                                className="w-full px-4 py-2 text-sm rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition font-sans"
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={newIsPreset}
                                    onChange={(e) => setNewIsPreset(e.target.checked)}
                                    className="w-4.5 h-4.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    Show as Quick-Click Preset badge in chat
                                </span>
                            </label>

                            <button
                                type="submit"
                                disabled={creating}
                                className="px-6 py-2 bg-heading text-white text-sm font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                            >
                                <Plus size={16} /> {creating ? 'Adding...' : 'Add FAQ'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* FAQ List */}
                <h2 className="text-base font-bold text-heading mb-4 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-primary" /> Active FAQs ({faqs.length})
                </h2>

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                        <span className="text-sm text-gray-500 font-medium">Loading FAQ list...</span>
                    </div>
                ) : faqs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
                        <AlertCircle size={32} className="text-gray-300 mb-2" />
                        <h3 className="font-bold text-gray-700">No FAQs found</h3>
                        <p className="text-sm text-gray-400 mt-1">Use the form above to add your first chatbot FAQ.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {faqs.map((faq) => (
                            <div key={faq.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative">
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-50">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-xs font-mono text-gray-400 bg-gray-550/10 px-2 py-0.5 rounded">
                                            ID: {faq.id}
                                        </span>
                                        {faq.is_preset ? (
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                Preset Quick-Click
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-550 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                                Keyword-Match Only
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(faq.id)}
                                        className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                        title="Delete FAQ"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                                Question
                                            </label>
                                            <input
                                                type="text"
                                                value={faq.question}
                                                onChange={(e) => handleUpdateField(faq.id, 'question', e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                                Keywords (Comma-separated)
                                            </label>
                                            <input
                                                type="text"
                                                value={faq.keywords_input || ''}
                                                onChange={(e) => handleUpdateField(faq.id, 'keywords_input', e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                            Answer Text
                                        </label>
                                        <textarea
                                            value={faq.answer}
                                            onChange={(e) => handleUpdateField(faq.id, 'answer', e.target.value)}
                                            rows={3}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition font-sans"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={faq.is_preset}
                                                onChange={(e) => handleUpdateField(faq.id, 'is_preset', e.target.checked)}
                                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                            />
                                            <span className="text-xs font-medium text-gray-700">
                                                Preset Quick-Click Question
                                            </span>
                                        </label>

                                        <button
                                            onClick={() => handleSave(faq.id)}
                                            disabled={savingId === faq.id}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
                                        >
                                            <Save size={13} /> {savingId === faq.id ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
