'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import {
    ArrowLeft,
    Plus,
    FileText,
    Receipt,
    Phone,
    Target,
    Edit3,
    Trash2,
    ArrowRight,
    Calendar,
    Clock,
    AlertCircle,
    RefreshCw,
    X,
    MessageCircle,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

const STATUS_STYLES = {
    active: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        label: 'Active',
    },
    paused: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
        label: 'Paused',
    },
    completed: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
        label: 'Completed',
    },
};

const CURRENCY_SYMBOLS = {
    INR: '₹',
    AED: 'AED ',
    USD: '$',
    GBP: '£',
    EUR: '€',
};

const addMonthsToIsoDate = (baseIso, months) => {
    const fallback = new Date().toISOString().split('T')[0];
    const [y, m, d] = String(baseIso || fallback)
        .split('-')
        .map(Number);
    if (!y || !m || !d) return '';
    const dt = new Date(y, m - 1, d);
    dt.setMonth(dt.getMonth() + months);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
        dt.getDate()
    ).padStart(2, '0')}`;
};

const formatDateShort = (iso) => {
    if (!iso) return '—';
    const str = String(iso).trim();
    const ymd = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const d = ymd
        ? new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]))
        : new Date(str);
    if (Number.isNaN(d.getTime())) return str;
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const getRevisionAlertMeta = (isoDate, clientStatus = 'active') => {
    if (!isoDate) return null;
    const m = String(isoDate).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const target = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
    const formatted = formatDateShort(isoDate);

    if ((clientStatus || 'active') !== 'active') {
        return {
            label: `Revision: ${formatted}`,
            cls: 'bg-gray-100 text-gray-600 border-gray-200',
            urgent: false,
        };
    }

    if (diffDays < 0) {
        const overdueDays = Math.abs(diffDays);
        return {
            label: `Revision Overdue (${overdueDays}d) • ${formatted}`,
            cls: 'bg-rose-50 text-rose-700 border-rose-200',
            urgent: true,
        };
    }
    if (diffDays === 0) {
        return {
            label: `Revision Due Today (${formatted})`,
            cls: 'bg-amber-100 text-amber-900 border-amber-300',
            urgent: true,
        };
    }
    if (diffDays <= 3) {
        return {
            label: `Revision in ${diffDays}d (${formatted})`,
            cls: 'bg-amber-50 text-amber-800 border-amber-200',
            urgent: true,
        };
    }
    return {
        label: `Next Revision: ${formatted}`,
        cls: 'bg-emerald-50/70 text-emerald-800 border-emerald-200',
        urgent: false,
    };
};

const getInitials = (name) =>
    String(name || '?')
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || '?';

export default function AdminClientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const clientId = params?.id;
    const supabase = useMemo(() => createClient(), []);

    const [client, setClient] = useState(null);
    const [dietPlans, setDietPlans] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'invoices'

    // Edit Client Modal
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [savingEdit, setSavingEdit] = useState(false);
    const [editForm, setEditForm] = useState({
        full_name: '',
        phone: '',
        age: '',
        height: '',
        initial_goals: '',
        status: 'active',
        plan_start_date: '',
        plan_end_date: '',
        notes: '',
    });

    const fetchClientDetails = useCallback(async () => {
        if (!clientId) return;
        setLoading(true);
        try {
            const [clientRes, plansRes, invoicesRes] = await Promise.all([
                supabase.from('clients').select('*').eq('id', clientId).single(),
                supabase
                    .from('client_diet_plans')
                    .select('*')
                    .eq('client_id', clientId)
                    .order('revision_number', { ascending: false })
                    .order('updated_at', { ascending: false }),
                supabase
                    .from('client_invoices')
                    .select('*')
                    .eq('client_id', clientId)
                    .order('updated_at', { ascending: false }),
            ]);

            if (clientRes.error || !clientRes.data) {
                setClient(null);
                return;
            }

            setClient(clientRes.data);
            setDietPlans(plansRes.data || []);
            setInvoices(invoicesRes.data || []);
        } catch (err) {
            console.error('Error loading client details:', err);
        } finally {
            setLoading(false);
        }
    }, [clientId, supabase]);

    useEffect(() => {
        fetchClientDetails();
    }, [fetchClientDetails]);

    const handleOpenEdit = () => {
        if (!client) return;
        const fallbackStartDate =
            client.plan_start_date ||
            dietPlans[dietPlans.length - 1]?.start_date ||
            '';
        const fallbackEndDate =
            client.plan_end_date ||
            dietPlans[0]?.end_date ||
            dietPlans[0]?.plan_data?.end_date ||
            '';
        setEditForm({
            full_name: client.full_name || '',
            phone: client.phone || '',
            age: client.age || '',
            height: client.height || '',
            initial_goals: client.initial_goals || '',
            status: client.status || 'active',
            plan_start_date: fallbackStartDate,
            plan_end_date: fallbackEndDate,
            notes: client.notes || '',
        });
        setIsEditOpen(true);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editForm.full_name.trim()) return;
        setSavingEdit(true);
        try {
            const payload = {
                full_name: editForm.full_name.trim(),
                phone: editForm.phone.trim() || '',
                age: editForm.age.trim() || null,
                height: editForm.height.trim() || null,
                initial_goals: editForm.initial_goals.trim() || null,
                status: editForm.status || 'active',
                plan_start_date: editForm.plan_start_date || null,
                plan_end_date: editForm.plan_end_date || null,
                notes: editForm.notes.trim() || null,
                updated_at: new Date().toISOString(),
            };

            const { data, error } = await supabase
                .from('clients')
                .update(payload)
                .eq('id', clientId)
                .select()
                .single();

            if (error) throw error;
            setClient(data);
            setIsEditOpen(false);
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: err.message,
                confirmButtonColor: '#2d6a4f',
            });
        } finally {
            setSavingEdit(false);
        }
    };

    const handleDeleteClient = async () => {
        if (!client) return;
        const res = await Swal.fire({
            icon: 'warning',
            title: `Delete "${client.full_name}"?`,
            text: `This will permanently delete this client along with ${dietPlans.length} saved diet plan(s) and ${invoices.length} invoice(s).`,
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete client',
        });

        if (!res.isConfirmed) return;

        try {
            const { error } = await supabase.from('clients').delete().eq('id', clientId);
            if (error) throw error;
            router.push('/admin/clients');
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Delete Failed',
                text: err.message,
                confirmButtonColor: '#2d6a4f',
            });
        }
    };

    const handleDeleteDietPlan = async (plan) => {
        const res = await Swal.fire({
            icon: 'warning',
            title: `Delete Rev ${plan.revision_number}?`,
            text: `"${plan.plan_title}" will be permanently deleted.`,
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Delete',
        });
        if (!res.isConfirmed) return;

        try {
            const { error } = await supabase
                .from('client_diet_plans')
                .delete()
                .eq('id', plan.id);
            if (error) throw error;
            setDietPlans((prev) => prev.filter((p) => p.id !== plan.id));
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Delete Failed',
                text: err.message,
                confirmButtonColor: '#2d6a4f',
            });
        }
    };

    const handleDeleteInvoice = async (inv) => {
        const res = await Swal.fire({
            icon: 'warning',
            title: `Delete Invoice ${inv.invoice_number}?`,
            text: 'This invoice record will be permanently deleted.',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Delete',
        });
        if (!res.isConfirmed) return;

        try {
            const { error } = await supabase
                .from('client_invoices')
                .delete()
                .eq('id', inv.id);
            if (error) throw error;
            setInvoices((prev) => prev.filter((i) => i.id !== inv.id));
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Delete Failed',
                text: err.message,
                confirmButtonColor: '#2d6a4f',
            });
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto py-20 text-center text-sm text-gray-500">
                <RefreshCw size={22} className="animate-spin mx-auto mb-3 text-primary" />
                Loading client profile &amp; records...
            </div>
        );
    }

    if (!client) {
        return (
            <div className="max-w-xl mx-auto py-20 text-center space-y-4">
                <h2 className="text-xl font-bold text-heading">Client not found</h2>
                <p className="text-sm text-gray-500">
                    This client profile may have been deleted or does not exist.
                </p>
                <Link
                    href="/admin/clients"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
                >
                    <ArrowLeft size={14} />
                    <span>Back to Clients</span>
                </Link>
            </div>
        );
    }

    const statusUi = STATUS_STYLES[client.status] || STATUS_STYLES.active;
    const cleanPhoneDigits = String(client.phone || '').replace(/\D/g, '');
    const activeRevisionDate =
        client.next_revision_date ||
        dietPlans[0]?.revision_date ||
        dietPlans[0]?.plan_data?.revision_date ||
        '';
    const activeProgramStartDate =
        client.plan_start_date ||
        dietPlans[dietPlans.length - 1]?.start_date ||
        '';
    const activeProgramEndDate =
        client.plan_end_date ||
        dietPlans[0]?.end_date ||
        dietPlans[0]?.plan_data?.end_date ||
        '';
    const revisionAlert = getRevisionAlertMeta(activeRevisionDate, client.status);

    return (
        <div className="max-w-6xl mx-auto px-0.5 sm:px-2 py-1 sm:py-4 space-y-4 sm:space-y-6">
            {/* ── Top Breadcrumb ── */}
            <div className="flex items-center justify-between gap-3">
                <Link
                    href="/admin/clients"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-heading transition"
                >
                    <ArrowLeft size={15} />
                    <span>All Clients</span>
                </Link>
            </div>

            {/* ── Client Profile Summary Card ── */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-6 shadow-2xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3.5 sm:gap-4">
                    <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                        <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 text-primary font-bold text-sm sm:text-lg flex items-center justify-center shrink-0">
                            {getInitials(client.full_name)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-lg sm:text-2xl font-bold text-heading truncate">
                                    {client.full_name}
                                </h1>
                                <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold border shrink-0 ${statusUi.bg} ${statusUi.text} ${statusUi.border}`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusUi.dot}`} />
                                    {statusUi.label}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 mt-1.5 sm:mt-2 text-xs text-gray-500">
                                {client.phone && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <Phone size={12} className="text-gray-400" />
                                        <span>{client.phone}</span>
                                        {cleanPhoneDigits.length >= 8 && (
                                            <a
                                                href={`https://wa.me/${cleanPhoneDigits}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-semibold ml-0.5"
                                            >
                                                <MessageCircle size={12} />
                                                WhatsApp
                                            </a>
                                        )}
                                    </span>
                                )}
                                {client.age && <span>Age: {client.age}</span>}
                                {client.height && <span>Height: {client.height}</span>}
                                {client.initial_goals && (
                                    <span className="inline-flex items-center gap-1 text-heading font-medium">
                                        <Target size={12} className="text-primary shrink-0" />
                                        <span>{client.initial_goals}</span>
                                    </span>
                                )}
                            </div>

                            {(revisionAlert || activeProgramStartDate || activeProgramEndDate) && (
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    {revisionAlert && (
                                        <span
                                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${revisionAlert.cls}`}
                                        >
                                            {revisionAlert.urgent ? (
                                                <AlertCircle size={11} className="shrink-0" />
                                            ) : (
                                                <Clock size={11} className="shrink-0" />
                                            )}
                                            <span>{revisionAlert.label}</span>
                                        </span>
                                    )}
                                    {(activeProgramStartDate || activeProgramEndDate) && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                                            <Calendar size={11} className="shrink-0 text-gray-500" />
                                            <span>
                                                {activeProgramStartDate && activeProgramEndDate
                                                    ? `Plan: ${formatDateShort(activeProgramStartDate)} → ${formatDateShort(activeProgramEndDate)}`
                                                    : activeProgramEndDate
                                                        ? `Plan Ends: ${formatDateShort(activeProgramEndDate)}`
                                                        : `Plan Starts: ${formatDateShort(activeProgramStartDate)}`}
                                            </span>
                                        </span>
                                    )}
                                </div>
                            )}

                            {client.notes && (
                                <p className="mt-2.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 max-w-2xl">
                                    {client.notes}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Primary Actions: Launch Generators + Edit/Delete */}
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100 shrink-0">
                        <Link
                            href={`/admin/diet-plan-generator?clientId=${client.id}&new=1`}
                            className="flex-1 sm:flex-initial min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs whitespace-nowrap transition active:scale-[0.98]"
                        >
                            <Plus size={15} className="shrink-0" />
                            <span>New Diet Plan</span>
                        </Link>

                        <Link
                            href={`/admin/invoice-generator?clientId=${client.id}&new=1`}
                            className="flex-1 sm:flex-initial min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-heading border border-gray-200 text-xs font-bold whitespace-nowrap transition active:scale-[0.98]"
                        >
                            <Receipt size={14} className="text-primary shrink-0" />
                            <span>New Invoice</span>
                        </Link>

                        <button
                            type="button"
                            onClick={handleOpenEdit}
                            className="min-h-[42px] w-[42px] inline-flex items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:text-heading hover:bg-gray-50 transition cursor-pointer shrink-0"
                            title="Edit client profile"
                            aria-label="Edit client profile"
                        >
                            <Edit3 size={15} />
                        </button>

                        <button
                            type="button"
                            onClick={handleDeleteClient}
                            className="min-h-[42px] w-[42px] inline-flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition cursor-pointer shrink-0"
                            title="Delete client"
                            aria-label="Delete client"
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Segmented Tabs: Diet Plans vs Invoices ── */}
            <div className="flex items-center justify-between border-b border-gray-200 overflow-x-auto scrollbar-none">
                <div className="flex items-center gap-4 sm:gap-6">
                    <button
                        type="button"
                        onClick={() => setActiveTab('plans')}
                        className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${activeTab === 'plans'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-heading'
                            }`}
                    >
                        <FileText size={15} className="shrink-0" />
                        <span className="sm:hidden">Diet Plans</span>
                        <span className="hidden sm:inline">Diet Plan Revisions</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-heading">
                            {dietPlans.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('invoices')}
                        className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${activeTab === 'invoices'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-heading'
                            }`}
                    >
                        <Receipt size={15} className="shrink-0" />
                        <span>Invoices</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-heading">
                            {invoices.length}
                        </span>
                    </button>
                </div>
            </div>

            {/* ── Tab 1: Diet Plan Revisions (1 -> Many) ── */}
            {activeTab === 'plans' && (
                <div className="space-y-3">
                    {dietPlans.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-200/80 py-14 px-6 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-primary flex items-center justify-center mx-auto mb-3">
                                <FileText size={22} />
                            </div>
                            <h3 className="text-base font-bold text-heading">
                                No diet plans saved yet for {client.full_name}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                                Create a personalized clinical diet plan in the generator — every phase or revision saved will appear here.
                            </p>
                            <Link
                                href={`/admin/diet-plan-generator?clientId=${client.id}&new=1`}
                                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition"
                            >
                                <Plus size={14} />
                                <span>Create First Diet Plan</span>
                            </Link>
                        </div>
                    ) : (
                        dietPlans.map((plan) => {
                            const mealCount = Array.isArray(plan.plan_data?.meals)
                                ? plan.plan_data.meals.length
                                : 0;
                            const recipeCount = Array.isArray(plan.plan_data?.recipes)
                                ? plan.plan_data.recipes.length
                                : 0;

                            return (
                                <div
                                    key={plan.id}
                                    className="bg-white rounded-2xl border border-gray-200/80 hover:border-primary/40 p-4 sm:p-5 shadow-2xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                >
                                    <div className="space-y-1.5 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary">
                                                Rev {plan.revision_number}
                                            </span>
                                            <h3 className="text-sm sm:text-base font-bold text-heading truncate">
                                                {plan.plan_title || 'Diet Plan'}
                                            </h3>
                                            {plan.pdf_theme === 'senior' && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                                    Senior Print
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                            {plan.calories && (
                                                <span className="font-semibold text-emerald-800">
                                                    {plan.calories} kcal
                                                </span>
                                            )}
                                            {plan.goal && <span>• {plan.goal}</span>}
                                            {mealCount > 0 && <span>• {mealCount} Meals</span>}
                                            {recipeCount > 0 && <span>• {recipeCount} Recipes</span>}
                                            {plan.start_date && (
                                                <span className="inline-flex items-center gap-1">
                                                    • <Calendar size={11} />
                                                    Start: {formatDateShort(plan.start_date)}
                                                </span>
                                            )}
                                            {(plan.revision_date || plan.plan_data?.revision_date) && (
                                                <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.2 rounded-md">
                                                    <Clock size={10} />
                                                    Rev: {formatDateShort(plan.revision_date || plan.plan_data?.revision_date)}
                                                </span>
                                            )}
                                            {(plan.end_date || plan.plan_data?.end_date) && (
                                                <span className="inline-flex items-center gap-1 text-gray-600">
                                                    • Ends: {formatDateShort(plan.end_date || plan.plan_data?.end_date)}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-[11px] text-gray-400">
                                            Last updated {formatDateShort(plan.updated_at || plan.created_at)}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 border-gray-100 shrink-0">
                                        <Link
                                            href={`/admin/diet-plan-generator?clientId=${client.id}&planId=${plan.id}`}
                                            className="flex-1 sm:flex-initial min-h-10 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-2xs whitespace-nowrap transition active:scale-[0.98]"
                                        >
                                            <span>Open &amp; Revise</span>
                                            <ArrowRight size={14} />
                                        </Link>

                                        <button
                                            type="button"
                                            onClick={() => handleDeleteDietPlan(plan)}
                                            className="min-h-10 w-10 inline-flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition cursor-pointer shrink-0"
                                            title="Delete revision"
                                            aria-label="Delete revision"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* ── Tab 2: Client Invoices (1 -> Many) ── */}
            {activeTab === 'invoices' && (
                <div className="space-y-3">
                    {invoices.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-200/80 py-14 px-6 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-primary flex items-center justify-center mx-auto mb-3">
                                <Receipt size={22} />
                            </div>
                            <h3 className="text-base font-bold text-heading">
                                No invoices saved yet for {client.full_name}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                                Create an invoice in Invoice Generator — saved invoices can be opened anytime to update payment status or line items.
                            </p>
                            <Link
                                href={`/admin/invoice-generator?clientId=${client.id}&new=1`}
                                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition"
                            >
                                <Plus size={14} />
                                <span>Create First Invoice</span>
                            </Link>
                        </div>
                    ) : (
                        invoices.map((inv) => {
                            const sym = CURRENCY_SYMBOLS[inv.currency] || '₹';
                            const statusBadge =
                                inv.status === 'paid'
                                    ? {
                                        cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                                        label: 'PAID',
                                    }
                                    : inv.status === 'partly_paid'
                                        ? {
                                            cls: 'bg-amber-50 text-amber-800 border-amber-200',
                                            label: 'PARTLY PAID',
                                        }
                                        : {
                                            cls: 'bg-rose-50 text-rose-700 border-rose-200',
                                            label: 'UNPAID',
                                        };

                            return (
                                <div
                                    key={inv.id}
                                    className="bg-white rounded-2xl border border-gray-200/80 hover:border-primary/40 p-4 sm:p-5 shadow-2xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                >
                                    <div className="space-y-1.5 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-gray-100 text-heading font-mono">
                                                {inv.invoice_number}
                                            </span>
                                            <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.cls}`}
                                            >
                                                {statusBadge.label}
                                            </span>
                                            <span className="text-sm font-bold text-heading">
                                                {sym}
                                                {Number(inv.total_amount || 0).toLocaleString('en-IN', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                            {inv.status === 'partly_paid' && (
                                                <span className="text-xs font-semibold text-amber-700">
                                                    (Balance: {sym}
                                                    {Number(inv.balance_amount || 0).toLocaleString(
                                                        'en-IN',
                                                        {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        }
                                                    )}
                                                    )
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                            {inv.goal && <span>{inv.goal}</span>}
                                            <span>
                                                • Date: {formatDateShort(inv.invoice_date || inv.created_at)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 border-gray-100 shrink-0">
                                        <Link
                                            href={`/admin/invoice-generator?clientId=${client.id}&invoiceId=${inv.id}`}
                                            className="flex-1 sm:flex-initial min-h-10 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-2xs whitespace-nowrap transition active:scale-[0.98]"
                                        >
                                            <span>Open &amp; Revise</span>
                                            <ArrowRight size={14} />
                                        </Link>

                                        <button
                                            type="button"
                                            onClick={() => handleDeleteInvoice(inv)}
                                            className="min-h-10 w-10 inline-flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition cursor-pointer shrink-0"
                                            title="Delete invoice"
                                            aria-label="Delete invoice"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* ── Edit Client Modal ── */}
            {isEditOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/45 backdrop-blur-xs">
                    <div
                        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-gray-100 max-h-[92dvh] overflow-y-auto"
                        style={{ animation: 'modalIn 180ms cubic-bezier(0.23, 1, 0.32, 1)' }}
                    >
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                            <h2 className="text-base font-bold text-heading">Edit Client Profile</h2>
                            <button
                                type="button"
                                onClick={() => setIsEditOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="space-y-3.5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.full_name}
                                        onChange={(e) =>
                                            setEditForm((prev) => ({
                                                ...prev,
                                                full_name: e.target.value,
                                            }))
                                        }
                                        className="w-full text-sm px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Phone / WhatsApp
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.phone}
                                        onChange={(e) =>
                                            setEditForm((prev) => ({
                                                ...prev,
                                                phone: e.target.value,
                                            }))
                                        }
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={editForm.status}
                                        onChange={(e) =>
                                            setEditForm((prev) => ({
                                                ...prev,
                                                status: e.target.value,
                                            }))
                                        }
                                        className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="active">Active</option>
                                        <option value="paused">Paused</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Age
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.age}
                                        onChange={(e) =>
                                            setEditForm((prev) => ({
                                                ...prev,
                                                age: e.target.value,
                                            }))
                                        }
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Height
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.height}
                                        onChange={(e) =>
                                            setEditForm((prev) => ({
                                                ...prev,
                                                height: e.target.value,
                                            }))
                                        }
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Plan Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={editForm.plan_start_date}
                                        onChange={(e) =>
                                            setEditForm((prev) => ({
                                                ...prev,
                                                plan_start_date: e.target.value,
                                            }))
                                        }
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center justify-between gap-1 text-xs font-bold text-gray-700 mb-1">
                                        <span>Plan End Date</span>
                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-primary">
                                            {[
                                                { label: '+1M', months: 1 },
                                                { label: '+3M', months: 3 },
                                                { label: '+6M', months: 6 },
                                            ].map((opt) => (
                                                <button
                                                    key={opt.label}
                                                    type="button"
                                                    onClick={() =>
                                                        setEditForm((prev) => ({
                                                            ...prev,
                                                            plan_end_date: addMonthsToIsoDate(
                                                                prev.plan_start_date,
                                                                opt.months
                                                            ),
                                                        }))
                                                    }
                                                    className="hover:underline cursor-pointer"
                                                    title={`Set Plan End Date to ${opt.label} from Plan Start Date`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </span>
                                    </label>
                                    <input
                                        type="date"
                                        value={editForm.plan_end_date}
                                        onChange={(e) =>
                                            setEditForm((prev) => ({
                                                ...prev,
                                                plan_end_date: e.target.value,
                                            }))
                                        }
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Primary Goal
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.initial_goals}
                                        onChange={(e) =>
                                            setEditForm((prev) => ({
                                                ...prev,
                                                initial_goals: e.target.value,
                                            }))
                                        }
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Clinical Notes
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={editForm.notes}
                                        onChange={(e) =>
                                            setEditForm((prev) => ({
                                                ...prev,
                                                notes: e.target.value,
                                            }))
                                        }
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 sm:gap-2.5 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsEditOpen(false)}
                                    className="w-full sm:w-auto min-h-10 px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingEdit}
                                    className="w-full sm:w-auto min-h-[42px] px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                                >
                                    {savingEdit ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

