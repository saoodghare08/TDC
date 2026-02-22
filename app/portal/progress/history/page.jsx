'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
    Calendar, TrendingUp, Image as ImageIcon, FileText,
    ArrowLeft, X, ExternalLink, Activity, Scale, Ruler,
    Plus, ChevronDown, ChevronUp, Edit2, Trash2, Save,
    Camera, AlertTriangle, Check, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const METRICS = [
    { key: 'weight_kg', label: 'Weight', unit: 'kg', color: '#fdbc00', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', icon: Scale, min: 20, max: 300, step: '0.1' },
    { key: 'chest_cm', label: 'Chest', unit: 'cm', color: '#3b82f6', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: Ruler, min: 50, max: 200, step: '0.1' },
    { key: 'waist_cm', label: 'Waist', unit: 'cm', color: '#ef4444', bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-200', icon: Ruler, min: 40, max: 200, step: '0.1' },
    { key: 'hips_cm', label: 'Hips', unit: 'cm', color: '#a855f7', bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', icon: Ruler, min: 50, max: 200, step: '0.1' },
];

export default function ProgressHistoryPage() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [clientId, setClientId] = useState(null);

    // Photo lightbox
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    // Chart toggles
    const [activeMetrics, setActiveMetrics] = useState(['weight_kg']);

    // Accordion
    const [expandedEntries, setExpandedEntries] = useState({});

    // Edit modal state
    const [editEntry, setEditEntry] = useState(null);   // the entry being edited
    const [editForm, setEditForm] = useState({});
    const [newPhotoFile, setNewPhotoFile] = useState(null);
    const [removePhoto, setRemovePhoto] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    // Delete confirm
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const supabase = createClient();

    /* ─── Fetch ─── */
    const fetchHistory = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: client } = await supabase
                .from('clients')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (client) {
                setClientId(client.id);
                const { data: progressData } = await supabase
                    .from('progress_entries')
                    .select('*')
                    .eq('client_id', client.id)
                    .order('date', { ascending: true });

                setEntries(progressData || []);
                if (progressData?.length > 0) {
                    const lastId = progressData[progressData.length - 1].id;
                    setExpandedEntries(prev => ({ ...prev, [lastId]: true }));
                }
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchHistory(); }, []);

    /* ─── Accordion ─── */
    const toggleEntry = (id) =>
        setExpandedEntries(prev => ({ ...prev, [id]: !prev[id] }));

    const toggleMetric = (key) =>
        setActiveMetrics(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );

    /* ─── Stats ─── */
    const getStats = (metricKey) => {
        const values = entries.map(e => e[metricKey]).filter(Boolean).map(Number);
        if (values.length === 0) return null;
        const first = values[0];
        const latest = values[values.length - 1];
        const diff = (latest - first).toFixed(1);
        return { first, latest, diff };
    };

    /* ─── Chart ─── */
    const sortedEntries = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    const chartLabels = sortedEntries.map(e =>
        new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    const chartDatasets = METRICS
        .filter(m => activeMetrics.includes(m.key) && sortedEntries.some(e => e[m.key]))
        .map(m => ({
            label: `${m.label} (${m.unit})`,
            data: sortedEntries.map(e => e[m.key] || null),
            borderColor: m.color,
            backgroundColor: m.color + '18',
            borderWidth: 2.5,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: m.color,
            fill: activeMetrics.length === 1,
            spanGaps: true,
        }));

    const chartOptions = {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#fff',
                titleColor: '#0a0a1a',
                bodyColor: '#6b7280',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 12,
                callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y ?? '—'}` },
            },
        },
        scales: {
            y: { grid: { color: '#f3f4f6' }, ticks: { color: '#9ca3af', font: { size: 12 } }, border: { display: false } },
            x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 12 } }, border: { display: false } },
        },
    };

    /* ─── Open Edit Modal ─── */
    const openEdit = (entry) => {
        setEditEntry(entry);
        setEditForm({
            date: entry.date?.split('T')[0] ?? entry.date ?? '',
            weight_kg: entry.weight_kg ?? '',
            chest_cm: entry.chest_cm ?? '',
            waist_cm: entry.waist_cm ?? '',
            hips_cm: entry.hips_cm ?? '',
            notes: entry.notes ?? '',
        });
        setNewPhotoFile(null);
        setRemovePhoto(false);
        setSaveError('');
    };

    const closeEdit = () => {
        setEditEntry(null);
        setNewPhotoFile(null);
        setRemovePhoto(false);
        setSaveError('');
    };

    /* ─── Save Edit ─── */
    const handleSaveEdit = async () => {
        setSaving(true);
        setSaveError('');
        try {
            let photoUrl = editEntry.photo_url;

            // If user wants to remove the photo
            if (removePhoto) {
                if (editEntry.photo_url) {
                    const urlParts = editEntry.photo_url.split('/');
                    const fn = urlParts[urlParts.length - 1];
                    const folder = urlParts[urlParts.length - 2];
                    await supabase.storage.from('progress-photos').remove([`${folder}/${fn}`]);
                }
                photoUrl = null;
            }

            // If user uploaded a new photo
            if (newPhotoFile) {
                // Delete old photo first
                if (editEntry.photo_url && !removePhoto) {
                    const urlParts = editEntry.photo_url.split('/');
                    const fn = urlParts[urlParts.length - 1];
                    const folder = urlParts[urlParts.length - 2];
                    await supabase.storage.from('progress-photos').remove([`${folder}/${fn}`]);
                }
                const fileExt = newPhotoFile.name.split('.').pop();
                const fileName = `${clientId}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('progress-photos')
                    .upload(fileName, newPhotoFile);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage
                    .from('progress-photos')
                    .getPublicUrl(fileName);
                photoUrl = publicUrl;
            }

            const { error } = await supabase
                .from('progress_entries')
                .update({
                    date: editForm.date,
                    weight_kg: editForm.weight_kg || null,
                    chest_cm: editForm.chest_cm || null,
                    waist_cm: editForm.waist_cm || null,
                    hips_cm: editForm.hips_cm || null,
                    notes: editForm.notes || null,
                    photo_url: photoUrl,
                })
                .eq('id', editEntry.id);

            if (error) throw error;

            closeEdit();
            await fetchHistory();
        } catch (err) {
            setSaveError(err.message || 'Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    /* ─── Delete Entry ─── */
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            // Delete photo from storage if present
            if (deleteTarget.photo_url) {
                const urlParts = deleteTarget.photo_url.split('/');
                const fn = urlParts[urlParts.length - 1];
                const folder = urlParts[urlParts.length - 2];
                await supabase.storage.from('progress-photos').remove([`${folder}/${fn}`]);
            }
            const { error } = await supabase
                .from('progress_entries')
                .delete()
                .eq('id', deleteTarget.id);
            if (error) throw error;
            setDeleteTarget(null);
            await fetchHistory();
        } catch (err) {
            console.error('Delete failed:', err);
        } finally {
            setDeleting(false);
        }
    };

    /* ─── Render ─── */
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Loading your progress...</p>
                </div>
            </div>
        );
    }

    const reversed = [...entries].reverse();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-10">

                {/* ── Header ── */}
                <div className="flex items-center justify-between mb-6 sm:mb-10">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Link
                            href="/portal/progress"
                            className="p-2 sm:p-2.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition shadow-sm shrink-0"
                        >
                            <ArrowLeft size={18} className="text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-xl sm:text-3xl font-heading font-bold text-heading">Progress History</h1>
                            <p className="text-gray-400 text-xs sm:text-sm mt-0.5">Track your transformation over time</p>
                        </div>
                    </div>
                    <Link
                        href="/portal/progress"
                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-primary text-black font-bold rounded-xl hover:bg-primary-dark transition shadow-sm text-xs sm:text-sm shrink-0"
                    >
                        <Plus size={14} />
                        <span className="hidden sm:inline">Log </span>Entry
                    </Link>
                </div>

                {entries.length === 0 ? (
                    <div className="bg-white p-16 rounded-3xl shadow-sm border border-gray-100 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Activity size={36} className="text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-heading mb-2">No Progress Logged Yet</h2>
                        <p className="text-gray-500 mb-8">Start tracking your journey to see it come to life here.</p>
                        <Link
                            href="/portal/progress"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary-dark transition"
                        >
                            <Plus size={18} />
                            Log First Entry
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* ── Stat Summary Bar ── */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                            {METRICS.map(m => {
                                const stats = getStats(m.key);
                                if (!stats) return null;
                                const isLoss = parseFloat(stats.diff) < 0;
                                const isGain = parseFloat(stats.diff) > 0;
                                const Icon = m.icon;
                                return (
                                    <div key={m.key} className={`bg-white rounded-2xl border ${m.border} p-3 sm:p-5 shadow-sm`}>
                                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{m.label}</span>
                                            <div className={`p-1.5 ${m.bg} rounded-lg`}><Icon size={12} className={m.text} /></div>
                                        </div>
                                        <p className={`text-xl sm:text-2xl font-bold ${m.text} mb-0.5 sm:mb-1`}>
                                            {stats.latest} <span className="text-xs sm:text-sm font-semibold">{m.unit}</span>
                                        </p>
                                        <p className={`text-xs font-semibold ${isLoss ? 'text-green-600' : isGain ? 'text-red-500' : 'text-gray-400'}`}>
                                            {isGain ? '+' : ''}{stats.diff} {m.unit}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── Chart Section ── */}
                        {entries.some(e => METRICS.some(m => e[m.key])) && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
                                <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-4 sm:mb-6">
                                    <div>
                                        <h2 className="text-base sm:text-lg font-bold text-heading">Progress Chart</h2>
                                        <p className="text-xs sm:text-sm text-gray-400">{entries.length} entries recorded</p>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                        {METRICS.map(m => {
                                            const hasData = entries.some(e => e[m.key]);
                                            if (!hasData) return null;
                                            const isActive = activeMetrics.includes(m.key);
                                            return (
                                                <button
                                                    key={m.key}
                                                    onClick={() => toggleMetric(m.key)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${isActive ? 'text-white border-transparent shadow-sm' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}
                                                    style={isActive ? { backgroundColor: m.color, borderColor: m.color } : {}}
                                                >
                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isActive ? 'white' : m.color }} />
                                                    {m.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <Line data={{ labels: chartLabels, datasets: chartDatasets }} options={chartOptions} />
                            </div>
                        )}

                        {/* ── Timeline Entries ── */}
                        <div>
                            <h2 className="text-sm sm:text-lg font-bold text-heading mb-3 sm:mb-4 flex items-center gap-2">
                                <Calendar size={16} className="text-primary" />
                                All Entries
                                <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">{entries.length}</span>
                            </h2>

                            <div className="relative">
                                <div className="absolute left-5 top-5 bottom-5 w-px bg-gray-200 hidden md:block" />

                                <div className="space-y-3 sm:space-y-4">
                                    {reversed.map((entry, idx) => {
                                        const isExpanded = expandedEntries[entry.id];
                                        const isLatest = idx === 0;
                                        const entryDate = new Date(entry.date);
                                        const hasMetrics = METRICS.some(m => entry[m.key]);

                                        return (
                                            <div key={entry.id} className="relative md:pl-14">
                                                {/* Timeline dot */}
                                                <div className={`absolute left-3.5 top-5 w-3 h-3 rounded-full border-2 border-white shadow hidden md:block ${isLatest ? 'bg-primary' : 'bg-gray-300'}`} />

                                                <div className={`bg-white rounded-2xl border shadow-sm transition-all ${isLatest ? 'border-primary/30 ring-1 ring-primary/10' : 'border-gray-100'}`}>
                                                    {/* Collapsible Header */}
                                                    <div className="flex items-center gap-1 pr-2 sm:pr-4">
                                                        <button
                                                            onClick={() => toggleEntry(entry.id)}
                                                            className="flex-1 flex items-center gap-2 sm:gap-4 p-3 sm:p-5 text-left cursor-pointer min-w-0"
                                                        >
                                                            {/* Date badge */}
                                                            <div className={`flex flex-col items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl shrink-0 ${isLatest ? 'bg-primary/10' : 'bg-gray-50'}`}>
                                                                <span className={`text-base sm:text-lg font-bold leading-none ${isLatest ? 'text-primary' : 'text-heading'}`}>
                                                                    {entryDate.getDate()}
                                                                </span>
                                                                <span className="text-xs text-gray-400 font-medium">
                                                                    {entryDate.toLocaleDateString('en-US', { month: 'short' })}
                                                                </span>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <h3 className="font-bold text-heading text-xs sm:text-base">
                                                                        <span className="hidden sm:inline">
                                                                            {entryDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                                                        </span>
                                                                        <span className="sm:hidden">
                                                                            {entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                        </span>
                                                                    </h3>
                                                                    {isLatest && (
                                                                        <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">Latest</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-1 mt-1 sm:mt-1.5">
                                                                    {METRICS.map(m => entry[m.key] ? (
                                                                        <span key={m.key} className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 ${m.bg} ${m.text} text-xs font-semibold rounded-full`}>
                                                                            {m.label}: {entry[m.key]}{m.unit}
                                                                        </span>
                                                                    ) : null)}
                                                                    {entry.photo_url && (
                                                                        <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full">
                                                                            <ImageIcon size={10} /> Photo
                                                                        </span>
                                                                    )}
                                                                    {entry.notes && (
                                                                        <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">
                                                                            <FileText size={10} /> Note
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </button>

                                                        {/* Edit / Delete / Chevron */}
                                                        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); openEdit(entry); }}
                                                                className="p-2 hover:bg-blue-50 rounded-xl transition text-gray-400 hover:text-blue-600 cursor-pointer"
                                                                title="Edit entry"
                                                            >
                                                                <Edit2 size={15} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setDeleteTarget(entry); }}
                                                                className="p-2 hover:bg-red-50 rounded-xl transition text-gray-400 hover:text-red-500 cursor-pointer"
                                                                title="Delete entry"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                            <button
                                                                onClick={() => toggleEntry(entry.id)}
                                                                className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-400 cursor-pointer"
                                                            >
                                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Expanded Details */}
                                                    {isExpanded && (
                                                        <div className="px-3 sm:px-5 pb-3 sm:pb-5 border-t border-gray-50">
                                                            {hasMetrics && (
                                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-3 sm:mt-4">
                                                                    {METRICS.map(m => entry[m.key] ? (
                                                                        <div key={m.key} className={`${m.bg} rounded-xl p-3 sm:p-4 border ${m.border}`}>
                                                                            <p className="text-xs text-gray-500 font-semibold mb-1">{m.label}</p>
                                                                            <p className={`text-lg sm:text-xl font-bold ${m.text}`}>
                                                                                {entry[m.key]} <span className="text-xs sm:text-sm">{m.unit}</span>
                                                                            </p>
                                                                        </div>
                                                                    ) : null)}
                                                                </div>
                                                            )}

                                                            {entry.photo_url && (
                                                                <div className="mt-4">
                                                                    <button
                                                                        onClick={() => setSelectedPhoto(entry.photo_url)}
                                                                        className="group relative block w-full overflow-hidden rounded-xl border border-gray-100"
                                                                    >
                                                                        <img
                                                                            src={entry.photo_url}
                                                                            alt="Progress photo"
                                                                            className="w-full max-h-56 object-cover group-hover:opacity-90 transition"
                                                                        />
                                                                        <div className="cursor-pointer absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/30 rounded-xl">
                                                                            <span className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-sm font-bold text-heading shadow">
                                                                                <ImageIcon size={15} />
                                                                                View Full Photo
                                                                            </span>
                                                                        </div>
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {entry.notes && (
                                                                <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                                                    <div className="flex items-center gap-2 mb-1.5">
                                                                        <FileText size={14} className="text-primary" />
                                                                        <span className="text-xs font-bold text-heading uppercase tracking-wide">Note</span>
                                                                    </div>
                                                                    <p className="text-gray-700 text-sm italic leading-relaxed">{entry.notes}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ════ EDIT MODAL ════ */}
            {editEntry && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm"
                    onClick={closeEdit}
                >
                    <div
                        className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[95vh] sm:max-h-[92vh] flex flex-col overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-xl">
                                    <Edit2 size={18} className="text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-heading text-lg">Edit Entry</h2>
                                    <p className="text-xs text-gray-400">
                                        {new Date(editEntry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <button onClick={closeEdit} className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-500 cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrollable Form */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-5 min-h-0">
                            {/* Date */}
                            <div>
                                <label className="block text-sm font-bold text-heading mb-1.5 items-center gap-2">
                                    <Calendar size={14} className="text-primary" /> Date
                                </label>
                                <input
                                    type="date"
                                    value={editForm.date}
                                    max={new Date().toISOString().split('T')[0]}
                                    onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm"
                                />
                            </div>

                            {/* Measurements grid */}
                            <div>
                                <label className="block text-sm font-bold text-heading mb-3 items-center gap-2">
                                    <TrendingUp size={14} className="text-primary" /> Measurements
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {METRICS.map(m => (
                                        <div key={m.key} className={`rounded-xl border ${m.border} ${m.bg} p-3`}>
                                            <label className={`block text-xs font-bold ${m.text} mb-1.5`}>
                                                {m.label} ({m.unit})
                                            </label>
                                            <input
                                                type="number"
                                                step={m.step}
                                                min={m.min}
                                                max={m.max}
                                                value={editForm[m.key]}
                                                onChange={e => setEditForm(f => ({ ...f, [m.key]: e.target.value }))}
                                                placeholder={`e.g. ${m.min + 10}`}
                                                className="w-full px-3 py-2 rounded-lg border border-white bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-semibold"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Photo */}
                            <div>
                                <label className="block text-sm font-bold text-heading mb-2 items-center gap-2">
                                    <Camera size={14} className="text-primary" /> Progress Photo
                                </label>

                                {/* Current photo preview */}
                                {editEntry.photo_url && !removePhoto && (
                                    <div className="relative mb-3 rounded-xl overflow-hidden border border-gray-200 group">
                                        <img
                                            src={newPhotoFile ? URL.createObjectURL(newPhotoFile) : editEntry.photo_url}
                                            alt="Current progress photo"
                                            className="w-full max-h-40 object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                                        {!newPhotoFile && (
                                            <button
                                                type="button"
                                                onClick={() => setRemovePhoto(true)}
                                                className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white text-red-500 rounded-lg shadow transition cursor-pointer"
                                                title="Remove photo"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                )}

                                {removePhoto && !newPhotoFile && (
                                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3">
                                        <span className="text-sm text-red-600 font-semibold flex items-center gap-2">
                                            <Trash2 size={14} /> Photo will be removed on save
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setRemovePhoto(false)}
                                            className="text-xs text-gray-500 hover:text-gray-700 underline cursor-pointer"
                                        >
                                            Undo
                                        </button>
                                    </div>
                                )}

                                {newPhotoFile && (
                                    <div className="mb-3 rounded-xl overflow-hidden border border-gray-200 relative">
                                        <img
                                            src={URL.createObjectURL(newPhotoFile)}
                                            alt="New photo preview"
                                            className="w-full max-h-40 object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setNewPhotoFile(null)}
                                            className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white text-red-500 rounded-lg shadow transition cursor-pointer"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}

                                <label className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 hover:border-gray-400 rounded-xl cursor-pointer transition text-sm text-gray-600 font-semibold">
                                    <Camera size={16} className="text-gray-400" />
                                    {newPhotoFile ? 'Change selected photo' : editEntry.photo_url && !removePhoto ? 'Replace photo' : 'Upload a photo'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) { setNewPhotoFile(file); setRemovePhoto(false); }
                                        }}
                                    />
                                </label>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-bold text-heading mb-1.5 items-center gap-2">
                                    <FileText size={14} className="text-primary" /> Notes
                                </label>
                                <textarea
                                    rows={3}
                                    value={editForm.notes}
                                    onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                                    placeholder="How are you feeling? Any observations?"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm resize-none"
                                />
                            </div>

                            {saveError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                                    <AlertTriangle size={15} />
                                    {saveError}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50">
                            <button
                                onClick={closeEdit}
                                className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-white transition text-sm cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={saving}
                                className="flex-1 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary-dark transition text-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {saving ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════ DELETE CONFIRM MODAL ════ */}
            {deleteTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm"
                    onClick={() => !deleting && setDeleteTarget(null)}
                >
                    <div
                        className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 text-center">
                            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={26} className="text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-heading mb-1">Delete Entry?</h3>
                            <p className="text-gray-500 text-sm mb-2">
                                {new Date(deleteTarget.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                            <p className="text-gray-400 text-xs mb-6">This will permanently delete the entry and any associated photo.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    disabled={deleting}
                                    className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition text-sm cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition text-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                                >
                                    {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                    {deleting ? 'Deleting…' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ════ PHOTO LIGHTBOX ════ */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/85 backdrop-blur-sm"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <div
                        className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl max-h-[95vh] sm:max-h-[92vh] flex flex-col overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-xl"><ImageIcon size={18} className="text-primary" /></div>
                                <span className="font-bold text-heading">Progress Photo</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={selectedPhoto}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
                                >
                                    <ExternalLink size={15} /> Full size
                                </a>
                                <button onClick={() => setSelectedPhoto(null)} className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-500 cursor-pointer">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto min-h-0 bg-gray-950 flex items-center justify-center p-4">
                            <img src={selectedPhoto} alt="Progress photo" className="max-w-full max-h-[75vh] object-contain rounded-xl" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
