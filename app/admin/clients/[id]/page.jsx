'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Calendar, Phone, Instagram, FileText, Upload,
    TrendingUp, User, Edit2, Trash2, Image as ImageIcon, X,
    ZoomIn, ExternalLink, Download, Scale, Ruler, Activity,
    ChevronDown, ChevronUp, Plus, Loader2, CheckCircle, AlertTriangle,
    Clock, Target,
} from 'lucide-react';
import Link from 'next/link';
import Swal from 'sweetalert2';
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
    { key: 'weight_kg', label: 'Weight', unit: 'kg', color: '#fdbc00', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', icon: Scale },
    { key: 'chest_cm', label: 'Chest', unit: 'cm', color: '#3b82f6', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: Ruler },
    { key: 'waist_cm', label: 'Waist', unit: 'cm', color: '#ef4444', bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-200', icon: Ruler },
    { key: 'hips_cm', label: 'Hips', unit: 'cm', color: '#a855f7', bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', icon: Ruler },
];

const STATUS_STYLES = {
    active: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', label: 'Active' },
    completed: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Completed' },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', label: 'Inactive' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Pending' },
};

export default function ClientDetailPage() {
    const params = useParams();
    const router = useRouter();

    const [client, setClient] = useState(null);
    const [dietPlans, setDietPlans] = useState([]);
    const [progressEntries, setProgressEntries] = useState([]);

    // Upload form
    const [uploading, setUploading] = useState(false);
    const [planFile, setPlanFile] = useState(null);
    const [planName, setPlanName] = useState('');
    const [planNotes, setPlanNotes] = useState('');
    const [showUploadForm, setShowUploadForm] = useState(false);

    // UI state
    const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'progress'
    const [activeMetrics, setActiveMetrics] = useState(['weight_kg']);
    const [expandedEntries, setExpandedEntries] = useState({});

    // Modals
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);

    const supabase = createClient();

    /* ─── Helpers ─── */
    const isImage = (url) => {
        if (!url) return false;
        const ext = url.split('?')[0].split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
    };
    const isPdf = (url) => {
        if (!url) return false;
        return url.split('?')[0].split('.').pop().toLowerCase() === 'pdf';
    };

    /* ─── Data fetching ─── */
    useEffect(() => {
        if (params.id) fetchClientData();
    }, [params.id]);

    const fetchClientData = async () => {
        try {
            const { data: clientData } = await supabase
                .from('clients').select('*').eq('id', params.id).single();
            setClient(clientData);

            const { data: plansData } = await supabase
                .from('diet_plans').select('*').eq('client_id', params.id)
                .order('uploaded_at', { ascending: false });
            setDietPlans(plansData || []);

            const { data: progressData } = await supabase
                .from('progress_entries').select('*').eq('client_id', params.id)
                .order('date', { ascending: false });
            setProgressEntries(progressData || []);

            // Auto-expand latest progress entry
            if (progressData?.length > 0) {
                setExpandedEntries({ [progressData[0].id]: true });
            }
        } catch (error) {
            console.error('Error fetching client data:', error);
        }
    };

    /* ─── Upload ─── */
    const handleUploadPlan = async (e) => {
        e.preventDefault();
        if (!planFile || !planName) {
            Swal.fire({ icon: 'warning', title: 'Missing Information', text: 'Please provide plan name and file', confirmButtonColor: '#fdbc00' });
            return;
        }
        setUploading(true);
        try {
            const fileExt = planFile.name.split('.').pop();
            const fileName = `${params.id}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('diet-plans').upload(fileName, planFile);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('diet-plans').getPublicUrl(fileName);
            const { data: { user } } = await supabase.auth.getUser();
            const { error: dbError } = await supabase.from('diet_plans').insert([{
                client_id: params.id, plan_name: planName,
                file_url: publicUrl, notes: planNotes || null, uploaded_by: user?.id,
            }]);
            if (dbError) throw dbError;

            Swal.fire({ icon: 'success', title: 'Uploaded!', text: 'Diet plan uploaded successfully.', confirmButtonColor: '#fdbc00', timer: 2000 });
            setPlanFile(null); setPlanName(''); setPlanNotes('');
            setShowUploadForm(false);
            fetchClientData();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Upload Failed', text: error.message, confirmButtonColor: '#fdbc00' });
        } finally {
            setUploading(false);
        }
    };

    /* ─── Delete plan ─── */
    const handleDeletePlan = async (planId, fileUrl) => {
        const result = await Swal.fire({
            title: 'Delete Diet Plan?', text: 'This action cannot be undone!', icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280',
            confirmButtonText: 'Delete', cancelButtonText: 'Cancel',
        });
        if (!result.isConfirmed) return;
        try {
            await supabase.from('diet_plans').delete().eq('id', planId);
            if (fileUrl) {
                const urlParts = fileUrl.split('/');
                const filePath = urlParts.slice(-2).join('/');
                await supabase.storage.from('diet-plans').remove([filePath]);
            }
            Swal.fire({ icon: 'success', title: 'Deleted!', confirmButtonColor: '#fdbc00', timer: 1500 });
            fetchClientData();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Failed', text: error.message, confirmButtonColor: '#fdbc00' });
        }
    };

    /* ─── Delete progress ─── */
    const handleDeleteProgress = async (progressId, photoUrl) => {
        const result = await Swal.fire({
            title: 'Delete Progress Entry?', text: 'This cannot be undone!', icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280',
            confirmButtonText: 'Delete',
        });
        if (!result.isConfirmed) return;
        try {
            await supabase.from('progress_entries').delete().eq('id', progressId);
            if (photoUrl) {
                const urlParts = photoUrl.split('/');
                const filePath = `${urlParts[urlParts.length - 2]}/${urlParts[urlParts.length - 1]}`;
                await supabase.storage.from('progress-photos').remove([filePath]);
            }
            Swal.fire({ icon: 'success', title: 'Deleted!', confirmButtonColor: '#fdbc00', timer: 1500 });
            fetchClientData();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Failed', text: error.message, confirmButtonColor: '#fdbc00' });
        }
    };

    /* ─── Chart data ─── */
    const sortedProgress = [...progressEntries].reverse();
    const chartLabels = sortedProgress.map(e =>
        new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    const chartDatasets = METRICS
        .filter(m => activeMetrics.includes(m.key) && sortedProgress.some(e => e[m.key]))
        .map(m => ({
            label: `${m.label} (${m.unit})`,
            data: sortedProgress.map(e => e[m.key] || null),
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
                backgroundColor: '#fff', titleColor: '#0a0a1a', bodyColor: '#6b7280',
                borderColor: '#e5e7eb', borderWidth: 1, padding: 12, cornerRadius: 12,
                callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y ?? '—'}` },
            },
        },
        scales: {
            y: { grid: { color: '#f3f4f6' }, ticks: { color: '#9ca3af', font: { size: 11 } }, border: { display: false } },
            x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 11 } }, border: { display: false } },
        },
    };

    /* ─── Stat helpers ─── */
    const getProgressStats = (key) => {
        const values = [...progressEntries].reverse().map(e => e[key]).filter(Boolean).map(Number);
        if (!values.length) return null;
        const diff = (values[values.length - 1] - values[0]).toFixed(1);
        return { latest: values[values.length - 1], diff };
    };

    /* ─── Loading ─── */
    if (!client) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Loading client profile...</p>
                </div>
            </div>
        );
    }

    const status = STATUS_STYLES[client.status] || STATUS_STYLES.inactive;
    const initials = client.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const daysRemaining = client.plan_end_date
        ? Math.max(0, Math.ceil((new Date(client.plan_end_date) - new Date()) / (1000 * 60 * 60 * 24)))
        : null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ── Top Nav Bar ── */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/clients"
                            className="p-2 hover:bg-gray-100 border border-gray-200 rounded-xl transition"
                        >
                            <ArrowLeft size={18} className="text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-heading leading-none">{client.full_name}</h1>
                            <p className="text-xs text-gray-400 mt-0.5">Client ID: {params.id.slice(0, 8)}…</p>
                        </div>
                    </div>
                    <Link
                        href={`/admin/clients/${params.id}/edit`}
                        className="flex items-center gap-2 px-4 py-2.5 bg-heading text-white font-bold rounded-xl hover:bg-gray-800 transition text-sm"
                    >
                        <Edit2 size={15} />
                        Edit Client
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex flex-col xl:flex-row gap-6">

                    {/* ════ LEFT SIDEBAR ════ */}
                    <div className="xl:w-80 shrink-0 space-y-5">

                        {/* Profile Card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* Color banner */}
                            <div className="h-20 bg-linear-to-r from-primary/30 via-primary/10 to-blue-100" />
                            <div className="px-6 pb-6 -mt-10">
                                {/* Avatar */}
                                <div className="w-20 h-20 rounded-2xl bg-heading text-white flex items-center justify-center text-2xl font-bold shadow-lg mb-4 border-4 border-white">
                                    {initials}
                                </div>
                                <h2 className="text-xl font-bold text-heading mb-1">{client.full_name}</h2>

                                {/* Status badge */}
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${status.bg} ${status.text} mb-4`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                    {status.label}
                                </div>

                                <div className="space-y-3">
                                    {client.phone && (
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gray-50 rounded-lg shrink-0">
                                                <Phone size={14} className="text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400">Phone</p>
                                                <p className="text-sm font-semibold text-heading">{client.phone}</p>
                                            </div>
                                        </div>
                                    )}
                                    {client.instagram && (
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gray-50 rounded-lg shrink-0">
                                                <Instagram size={14} className="text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400">Instagram</p>
                                                <a
                                                    href={`https://www.instagram.com/${client.instagram}`}
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="text-sm font-semibold text-primary hover:underline"
                                                >
                                                    @{client.instagram}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Plan Info Card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                            <h3 className="text-sm font-bold text-heading flex items-center gap-2">
                                <Target size={15} className="text-primary" />
                                Plan Details
                            </h3>

                            {client.assigned_plan_type && (
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Plan Type</p>
                                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                                        {client.assigned_plan_type}
                                    </span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                                        <Calendar size={10} /> Start
                                    </p>
                                    <p className="text-sm font-bold text-heading">
                                        {client.plan_start_date
                                            ? new Date(client.plan_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                            : '—'}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                                        <Calendar size={10} /> End
                                    </p>
                                    <p className="text-sm font-bold text-heading">
                                        {client.plan_end_date
                                            ? new Date(client.plan_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                            : '—'}
                                    </p>
                                </div>
                            </div>

                            {daysRemaining !== null && client.status === 'active' && (
                                <div className={`flex items-center gap-2 p-3 rounded-xl ${daysRemaining <= 7 ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'}`}>
                                    <Clock size={14} className={daysRemaining <= 7 ? 'text-red-500' : 'text-green-600'} />
                                    <span className={`text-xs font-bold ${daysRemaining <= 7 ? 'text-red-600' : 'text-green-700'}`}>
                                        {daysRemaining === 0 ? 'Ends today!' : `${daysRemaining} days remaining`}
                                    </span>
                                </div>
                            )}

                            {client.initial_goals && (
                                <div className="pt-3 border-t border-gray-100">
                                    <p className="text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wide">Goals</p>
                                    <p className="text-sm text-gray-600 leading-relaxed">{client.initial_goals}</p>
                                </div>
                            )}
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                                <p className="text-2xl font-bold text-heading">{dietPlans.length}</p>
                                <p className="text-xs text-gray-400 mt-1">Diet Plans</p>
                            </div>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                                <p className="text-2xl font-bold text-heading">{progressEntries.length}</p>
                                <p className="text-xs text-gray-400 mt-1">Progress Logs</p>
                            </div>
                        </div>
                    </div>

                    {/* ════ MAIN CONTENT ════ */}
                    <div className="flex-1 min-w-0">

                        {/* Tabs */}
                        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-6 w-fit">
                            {[
                                { id: 'plans', icon: FileText, label: 'Diet Plans', count: dietPlans.length },
                                { id: 'progress', icon: TrendingUp, label: 'Progress', count: progressEntries.length },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === tab.id
                                        ? 'bg-white text-heading shadow-sm'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-500'}`}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* ── DIET PLANS TAB ── */}
                        {activeTab === 'plans' && (
                            <div className="space-y-5">
                                {/* Upload toggle */}
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-heading">Diet Plans</h2>
                                    <button
                                        onClick={() => setShowUploadForm(v => !v)}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-black font-bold rounded-xl hover:bg-primary-dark transition text-sm cursor-pointer"
                                    >
                                        <Plus size={16} />
                                        Upload Plan
                                    </button>
                                </div>

                                {/* Upload form (collapsible) */}
                                {showUploadForm && (
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                        <h3 className="font-bold text-heading mb-4 flex items-center gap-2">
                                            <Upload size={16} className="text-primary" />
                                            New Diet Plan
                                        </h3>
                                        <form onSubmit={handleUploadPlan} className="space-y-4">
                                            <input
                                                type="text"
                                                placeholder="Plan name (e.g. Week 1 – High Protein)"
                                                value={planName}
                                                onChange={e => setPlanName(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm"
                                                required
                                            />
                                            <textarea
                                                placeholder="Notes for the client (optional)"
                                                value={planNotes}
                                                onChange={e => setPlanNotes(e.target.value)}
                                                rows={2}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm resize-none"
                                            />
                                            <label className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 hover:border-primary rounded-xl cursor-pointer transition">
                                                <FileText size={18} className="text-gray-400 shrink-0" />
                                                <span className="text-sm text-gray-500 font-medium truncate">
                                                    {planFile ? planFile.name : 'Choose PDF, JPG or PNG…'}
                                                </span>
                                                <input
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={e => e.target.files?.[0] && setPlanFile(e.target.files[0])}
                                                    className="hidden"
                                                    required
                                                />
                                            </label>
                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowUploadForm(false)}
                                                    className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition text-sm cursor-pointer"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={uploading}
                                                    className="flex-1 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary-dark transition text-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                                                >
                                                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                                    {uploading ? 'Uploading…' : 'Upload'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* Plans list */}
                                {dietPlans.length === 0 ? (
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <FileText size={28} className="text-gray-300" />
                                        </div>
                                        <p className="text-gray-400 font-medium">No diet plans uploaded yet</p>
                                        <p className="text-gray-300 text-sm mt-1">Upload the first plan using the button above</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {dietPlans.map((plan, idx) => (
                                            <div key={plan.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-gray-200 transition">
                                                <div className="flex items-start gap-4">
                                                    {/* Icon */}
                                                    <div className="p-3 bg-primary/10 rounded-xl shrink-0">
                                                        <FileText size={20} className="text-primary" />
                                                    </div>
                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <h4 className="font-bold text-heading mb-0.5">{plan.plan_name}</h4>
                                                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                                                    <Calendar size={10} />
                                                                    {new Date(plan.uploaded_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                                </p>
                                                            </div>
                                                            {/* Latest badge */}
                                                            {idx === 0 && (
                                                                <span className="shrink-0 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                                                    Latest
                                                                </span>
                                                            )}
                                                        </div>
                                                        {plan.notes && (
                                                            <p className="mt-2 text-sm text-gray-600 italic bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                                                                {plan.notes}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-2 mt-3">
                                                            <button
                                                                onClick={() => setSelectedPlan(plan)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition cursor-pointer"
                                                            >
                                                                <ZoomIn size={13} /> View
                                                            </button>
                                                            <a
                                                                href={plan.file_url}
                                                                download
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-lg transition"
                                                            >
                                                                <Download size={13} /> Download
                                                            </a>
                                                            <button
                                                                onClick={() => handleDeletePlan(plan.id, plan.file_url)}
                                                                className="ml-auto p-1.5 hover:bg-red-50 rounded-lg transition text-gray-300 hover:text-red-500 cursor-pointer"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── PROGRESS TAB ── */}
                        {activeTab === 'progress' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold text-heading">Progress History</h2>

                                {progressEntries.length === 0 ? (
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Activity size={28} className="text-gray-300" />
                                        </div>
                                        <p className="text-gray-400 font-medium">No progress logged yet</p>
                                        <p className="text-gray-300 text-sm mt-1">Progress entries will appear here once the client logs them</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Stat summary */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {METRICS.map(m => {
                                                const stats = getProgressStats(m.key);
                                                if (!stats) return null;
                                                const isLoss = parseFloat(stats.diff) < 0;
                                                const isGain = parseFloat(stats.diff) > 0;
                                                const Icon = m.icon;
                                                return (
                                                    <div key={m.key} className={`bg-white rounded-2xl border ${m.border} p-4 shadow-sm`}>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{m.label}</span>
                                                            <div className={`p-1.5 ${m.bg} rounded-lg`}><Icon size={12} className={m.text} /></div>
                                                        </div>
                                                        <p className={`text-xl font-bold ${m.text}`}>
                                                            {stats.latest} <span className="text-xs font-semibold">{m.unit}</span>
                                                        </p>
                                                        <p className={`text-xs font-semibold ${isLoss ? 'text-green-600' : isGain ? 'text-red-500' : 'text-gray-400'}`}>
                                                            {isGain ? '+' : ''}{stats.diff} {m.unit}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Chart */}
                                        {sortedProgress.some(e => METRICS.some(m => e[m.key])) && (
                                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                                                    <div>
                                                        <h3 className="font-bold text-heading">Progress Chart</h3>
                                                        <p className="text-xs text-gray-400">{progressEntries.length} entries</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {METRICS.map(m => {
                                                            if (!sortedProgress.some(e => e[m.key])) return null;
                                                            const isActive = activeMetrics.includes(m.key);
                                                            return (
                                                                <button
                                                                    key={m.key}
                                                                    onClick={() => setActiveMetrics(prev =>
                                                                        isActive ? prev.filter(k => k !== m.key) : [...prev, m.key]
                                                                    )}
                                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${isActive ? 'text-white border-transparent' : 'bg-white text-gray-400 border-gray-200'}`}
                                                                    style={isActive ? { backgroundColor: m.color, borderColor: m.color } : {}}
                                                                >
                                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isActive ? 'white' : m.color }} />
                                                                    {m.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                                <Line data={{ labels: chartLabels, datasets: chartDatasets }} options={chartOptions} />
                                            </div>
                                        )}

                                        {/* Progress entries */}
                                        <div>
                                            <h3 className="font-bold text-heading mb-3 flex items-center gap-2 text-sm">
                                                <Calendar size={14} className="text-primary" />
                                                All Entries
                                                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 text-xs rounded-full">{progressEntries.length}</span>
                                            </h3>

                                            <div className="space-y-3">
                                                {progressEntries.map((entry, idx) => {
                                                    const isExpanded = expandedEntries[entry.id];
                                                    const isLatest = idx === 0;
                                                    const entryDate = new Date(entry.date);
                                                    const hasMetrics = METRICS.some(m => entry[m.key]);
                                                    return (
                                                        <div key={entry.id} className={`bg-white rounded-2xl border shadow-sm transition-all ${isLatest ? 'border-primary/30 ring-1 ring-primary/10' : 'border-gray-100'}`}>
                                                            {/* Row header */}
                                                            <div className="flex items-center gap-2 pr-4">
                                                                <button
                                                                    onClick={() => setExpandedEntries(prev => ({ ...prev, [entry.id]: !prev[entry.id] }))}
                                                                    className="flex-1 flex items-center gap-4 p-4 text-left cursor-pointer min-w-0"
                                                                >
                                                                    <div className={`flex flex-col items-center justify-center w-11 h-11 rounded-xl shrink-0 ${isLatest ? 'bg-primary/10' : 'bg-gray-50'}`}>
                                                                        <span className={`text-base font-bold leading-none ${isLatest ? 'text-primary' : 'text-heading'}`}>{entryDate.getDate()}</span>
                                                                        <span className="text-xs text-gray-400">{entryDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <span className="font-bold text-heading text-sm">
                                                                                {entryDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                                                                            </span>
                                                                            {isLatest && <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">Latest</span>}
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                                                            {METRICS.map(m => entry[m.key] ? (
                                                                                <span key={m.key} className={`px-2 py-0.5 ${m.bg} ${m.text} text-xs font-semibold rounded-full`}>
                                                                                    {m.label}: {entry[m.key]} {m.unit}
                                                                                </span>
                                                                            ) : null)}
                                                                            {entry.photo_url && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full">📷 Photo</span>}
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        onClick={() => handleDeleteProgress(entry.id, entry.photo_url)}
                                                                        className="p-2 hover:bg-red-50 rounded-xl transition text-gray-300 hover:text-red-500 cursor-pointer"
                                                                        title="Delete entry"
                                                                    >
                                                                        <Trash2 size={15} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setExpandedEntries(prev => ({ ...prev, [entry.id]: !prev[entry.id] }))}
                                                                        className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-400 cursor-pointer"
                                                                    >
                                                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Expanded */}
                                                            {isExpanded && (
                                                                <div className="px-4 pb-4 border-t border-gray-50">
                                                                    {hasMetrics && (
                                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                                                                            {METRICS.map(m => entry[m.key] ? (
                                                                                <div key={m.key} className={`${m.bg} rounded-xl p-3 border ${m.border}`}>
                                                                                    <p className="text-xs text-gray-500 font-semibold mb-1">{m.label}</p>
                                                                                    <p className={`text-lg font-bold ${m.text}`}>{entry[m.key]} <span className="text-xs">{m.unit}</span></p>
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
                                                                                <img src={entry.photo_url} alt="Progress" className="w-full max-h-48 object-cover group-hover:opacity-90 transition" />
                                                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/30 rounded-xl cursor-pointer">
                                                                                    <span className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-sm font-bold text-heading shadow">
                                                                                        <ImageIcon size={14} /> View Full
                                                                                    </span>
                                                                                </div>
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                    {entry.notes && (
                                                                        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                                                            <p className="text-xs font-bold text-heading mb-1">Note</p>
                                                                            <p className="text-sm text-gray-700 italic">{entry.notes}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ════ DIET PLAN FILE VIEWER ════ */}
            {selectedPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={() => setSelectedPlan(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 bg-blue-50 rounded-xl shrink-0"><FileText size={20} className="text-primary" /></div>
                                <div className="min-w-0">
                                    <h2 className="text-lg font-bold text-heading truncate">{selectedPlan.plan_name}</h2>
                                    <p className="text-xs text-gray-400">
                                        Uploaded {new Date(selectedPlan.uploaded_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-4">
                                <a href={selectedPlan.file_url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition">
                                    <ExternalLink size={15} /> Open
                                </a>
                                <a href={selectedPlan.file_url} download target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary hover:bg-primary-dark text-black font-semibold rounded-xl transition">
                                    <Download size={15} /> Download
                                </a>
                                <button onClick={() => setSelectedPlan(null)} className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-500 cursor-pointer">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        {selectedPlan.notes && (
                            <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 shrink-0">
                                <p className="text-sm text-blue-800 italic">{selectedPlan.notes}</p>
                            </div>
                        )}
                        <div className="flex-1 overflow-auto min-h-0 bg-gray-50">
                            {isImage(selectedPlan.file_url) ? (
                                <div className="flex items-center justify-center p-6 h-full">
                                    <img src={selectedPlan.file_url} alt={selectedPlan.plan_name} className="max-w-full max-h-full object-contain rounded-xl shadow-lg" />
                                </div>
                            ) : isPdf(selectedPlan.file_url) ? (
                                <iframe src={selectedPlan.file_url} title={selectedPlan.plan_name} className="w-full h-full min-h-[60vh]" style={{ border: 'none' }} />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                                    <FileText size={64} className="text-gray-300 mb-4" />
                                    <p className="text-gray-500 mb-6">This file type cannot be previewed.</p>
                                    <a href={selectedPlan.file_url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary-dark transition">
                                        <ExternalLink size={18} /> Open File
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ════ PHOTO LIGHTBOX ════ */}
            {selectedPhoto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" onClick={() => setSelectedPhoto(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-xl"><ImageIcon size={18} className="text-primary" /></div>
                                <span className="font-bold text-heading">Progress Photo</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <a href={selectedPhoto} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition">
                                    <ExternalLink size={15} /> Full size
                                </a>
                                <button onClick={() => setSelectedPhoto(null)} className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-500 cursor-pointer">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto min-h-0 bg-gray-950 flex items-center justify-center p-4">
                            <img src={selectedPhoto} alt="Progress" className="max-w-full max-h-[75vh] object-contain rounded-xl" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
