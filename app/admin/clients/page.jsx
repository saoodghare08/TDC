'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import {
    Users,
    Plus,
    Search,
    X,
    FileText,
    Receipt,
    Phone,
    ChevronRight,
    RefreshCw,
    Clock,
    Calendar,
    AlertCircle,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import ClientFormModal from '@/components/admin/clients/ClientFormModal';

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

const EMPTY_CLIENT_FORM = {
    full_name: '',
    phone: '',
    age: '',
    height: '',
    initial_goals: '',
    status: 'active',
    plan_start_date: '',
    plan_end_date: '',
    notes: '',
};

const formatDateShort = (iso) => {
    if (!iso) return '—';
    const str = String(iso).trim();
    const ymd = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const d = ymd
        ? new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]))
        : new Date(str);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const getRevisionBadgeMeta = (isoDate, clientStatus = 'active') => {
    if (!isoDate) return null;
    const m = String(isoDate).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const target = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
    const shortDate = target.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
    });

    if ((clientStatus || 'active') !== 'active') {
        return {
            label: `Rev: ${shortDate}`,
            cls: 'bg-gray-100 text-gray-600 border-gray-200',
            isDueAlert: false,
            diffDays,
        };
    }

    if (diffDays < 0) {
        return {
            label: `Overdue ${Math.abs(diffDays)}d • ${shortDate}`,
            cls: 'bg-rose-50 text-rose-700 border-rose-200',
            isDueAlert: true,
            diffDays,
        };
    }
    if (diffDays === 0) {
        return {
            label: `Due Today • ${shortDate}`,
            cls: 'bg-amber-100 text-amber-900 border-amber-300',
            isDueAlert: true,
            diffDays,
        };
    }
    if (diffDays <= 3) {
        return {
            label: `Due in ${diffDays}d • ${shortDate}`,
            cls: 'bg-amber-50 text-amber-800 border-amber-200',
            isDueAlert: true,
            diffDays,
        };
    }
    return {
        label: `Rev: ${shortDate}`,
        cls: 'bg-emerald-50/70 text-emerald-800 border-emerald-200/80',
        isDueAlert: false,
        diffDays,
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

const VALID_STATUS_FILTERS = new Set(['all', 'revision_due', 'active', 'paused', 'completed']);

function AdminClientsListingContent({ initialFilter = 'all' }) {
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);

    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState(() =>
        VALID_STATUS_FILTERS.has(initialFilter) ? initialFilter : 'all'
    );

    // Add Client Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [clientForm, setClientForm] = useState(EMPTY_CLIENT_FORM);

    const fetchClients = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*, client_diet_plans(count), client_invoices(count)')
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setClients(data || []);
        } catch (err) {
            console.error('Error loading clients:', err);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const filteredClients = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const list = clients.filter((c) => {
            if (statusFilter === 'revision_due') {
                const revMeta = getRevisionBadgeMeta(c.next_revision_date, c.status);
                if (!revMeta?.isDueAlert) return false;
            } else {
                const matchesStatus =
                    statusFilter === 'all' || (c.status || 'active') === statusFilter;
                if (!matchesStatus) return false;
            }

            if (!q) return true;
            return (
                c.full_name?.toLowerCase().includes(q) ||
                c.phone?.toLowerCase().includes(q) ||
                c.initial_goals?.toLowerCase().includes(q)
            );
        });

        if (statusFilter === 'revision_due') {
            return [...list].sort((a, b) => {
                const da = getRevisionBadgeMeta(a.next_revision_date, a.status)?.diffDays ?? 9999;
                const db = getRevisionBadgeMeta(b.next_revision_date, b.status)?.diffDays ?? 9999;
                return da - db;
            });
        }

        return list;
    }, [clients, searchQuery, statusFilter]);

    const stats = useMemo(() => {
        let totalPlans = 0;
        let activeCount = 0;
        let revisionDueCount = 0;

        for (const c of clients) {
            if ((c.status || 'active') === 'active') activeCount += 1;
            const revMeta = getRevisionBadgeMeta(c.next_revision_date, c.status);
            if (revMeta?.isDueAlert) revisionDueCount += 1;
            totalPlans += Number(c.client_diet_plans?.[0]?.count || 0);
        }

        return {
            totalClients: clients.length,
            activeCount,
            revisionDueCount,
            totalPlans,
        };
    }, [clients]);

    const handleCreateClient = async (e, opts = { openDietBuilderAfter: false }) => {
        if (e?.preventDefault) e.preventDefault();
        const name = clientForm.full_name.trim();
        if (!name) return;

        setSaving(true);
        try {
            const payload = {
                full_name: name,
                phone: clientForm.phone.trim() || '',
                age: clientForm.age.trim() || null,
                height: clientForm.height.trim() || null,
                initial_goals: clientForm.initial_goals.trim() || null,
                status: clientForm.status || 'active',
                plan_start_date: clientForm.plan_start_date || null,
                plan_end_date: clientForm.plan_end_date || null,
                notes: clientForm.notes.trim() || null,
                updated_at: new Date().toISOString(),
            };

            const { data, error } = await supabase
                .from('clients')
                .insert([payload])
                .select()
                .single();

            if (error) throw error;

            setIsModalOpen(false);
            setClientForm(EMPTY_CLIENT_FORM);
            if (opts?.openDietBuilderAfter) {
                router.push(`/admin/diet-plan-generator?clientId=${data.id}&new=1`);
            } else {
                router.push(`/admin/clients/${data.id}`);
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Could Not Add Client',
                text: err.message,
                confirmButtonColor: '#2d6a4f',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-0.5 sm:px-2 py-1 sm:py-4 space-y-4 sm:space-y-6">
            {/* ── Header ── */}
            <div className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                    <h1 className="text-xl sm:text-3xl font-bold text-heading flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <span className="p-2 sm:p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
                            <Users size={20} className="sm:w-[22px] sm:h-[22px]" />
                        </span>
                        <span className="truncate">Clients</span>
                    </h1>

                    <button
                        type="button"
                        onClick={() => {
                            setClientForm(EMPTY_CLIENT_FORM);
                            setIsModalOpen(true);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-10 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-xs whitespace-nowrap transition active:scale-[0.98] cursor-pointer shrink-0"
                    >
                        <Plus size={16} />
                        <span>Add Client</span>
                    </button>
                </div>
                <p className="text-xs sm:text-sm text-gray-500">
                    Select a client to view their diet plan revisions and invoices, or launch a new plan
                </p>
            </div>

            {/* ── Summary Metrics ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="bg-white rounded-2xl border border-gray-200/80 p-3 sm:p-4 shadow-2xs">
                    <p className="text-[11px] sm:text-xs font-medium text-gray-500">Total Clients</p>
                    <p className="text-xl sm:text-2xl font-bold text-heading mt-0.5 sm:mt-1">{stats.totalClients}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200/80 p-3 sm:p-4 shadow-2xs">
                    <p className="text-[11px] sm:text-xs font-medium text-gray-500">Active Clients</p>
                    <p className="text-xl sm:text-2xl font-bold text-emerald-700 mt-0.5 sm:mt-1">{stats.activeCount}</p>
                </div>
                <button
                    type="button"
                    onClick={() =>
                        setStatusFilter((prev) =>
                            prev === 'revision_due' ? 'all' : 'revision_due'
                        )
                    }
                    className={`text-left rounded-2xl border p-3 sm:p-4 shadow-2xs transition cursor-pointer ${statusFilter === 'revision_due'
                        ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200/60'
                        : stats.revisionDueCount > 0
                            ? 'bg-amber-50/40 border-amber-200 hover:bg-amber-50/80'
                            : 'bg-white border-gray-200/80 hover:bg-gray-50/60'
                        }`}
                >
                    <p className="text-[11px] sm:text-xs font-medium text-gray-600 flex items-center justify-between gap-1">
                        <span>Revision Due</span>
                        {stats.revisionDueCount > 0 && (
                            <AlertCircle size={13} className="text-amber-600 shrink-0" />
                        )}
                    </p>
                    <p
                        className={`text-xl sm:text-2xl font-bold mt-0.5 sm:mt-1 ${stats.revisionDueCount > 0 ? 'text-amber-800' : 'text-heading'
                            }`}
                    >
                        {stats.revisionDueCount}
                    </p>
                </button>
                <div className="bg-white rounded-2xl border border-gray-200/80 p-3 sm:p-4 shadow-2xs">
                    <p className="text-[11px] sm:text-xs font-medium text-gray-500">Saved Diet Plans</p>
                    <p className="text-xl sm:text-2xl font-bold text-heading mt-0.5 sm:mt-1">{stats.totalPlans}</p>
                </div>
            </div>

            {/* ── Search & Status Filter Bar ── */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
                <div className="relative flex-1">
                    <Search
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search clients by name, phone, or goal..."
                        className="w-full pl-10 pr-9 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                    {[
                        { key: 'all', label: 'All' },
                        {
                            key: 'revision_due',
                            label:
                                stats.revisionDueCount > 0
                                    ? `Revision Due (${stats.revisionDueCount})`
                                    : 'Revision Due',
                        },
                        { key: 'active', label: 'Active' },
                        { key: 'paused', label: 'Paused' },
                        { key: 'completed', label: 'Completed' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setStatusFilter(tab.key)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap inline-flex items-center gap-1 ${statusFilter === tab.key
                                ? tab.key === 'revision_due'
                                    ? 'bg-amber-600 text-white shadow-2xs'
                                    : 'bg-primary text-white shadow-2xs'
                                : tab.key === 'revision_due' && stats.revisionDueCount > 0
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
                                }`}
                        >
                            {tab.key === 'revision_due' && <Clock size={12} />}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Client Directory Table / Cards ── */}
            {loading ? (
                <div className="bg-white rounded-2xl border border-gray-200/80 py-16 text-center text-sm text-gray-500">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-primary" />
                    Loading clients...
                </div>
            ) : filteredClients.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200/80 py-14 px-6 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-primary flex items-center justify-center mx-auto mb-3">
                        <Users size={26} />
                    </div>
                    <h2 className="text-base font-bold text-heading">
                        {searchQuery || statusFilter !== 'all'
                            ? 'No matching clients found'
                            : 'No clients added yet'}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                        {searchQuery || statusFilter !== 'all'
                            ? 'Try adjusting your search term or status filter.'
                            : 'Add your first client to start storing diet plan revisions and invoices against their profile.'}
                    </p>
                    {!searchQuery && statusFilter === 'all' && (
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition cursor-pointer"
                        >
                            <Plus size={15} />
                            <span>Add First Client</span>
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    <th className="py-3.5 px-5">Client</th>
                                    <th className="py-3.5 px-4">Goal</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4">Timeline</th>
                                    <th className="py-3.5 px-4">Records</th>
                                    <th className="py-3.5 px-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {filteredClients.map((client) => {
                                    const planCount = Number(
                                        client.client_diet_plans?.[0]?.count || 0
                                    );
                                    const invoiceCount = Number(
                                        client.client_invoices?.[0]?.count || 0
                                    );
                                    const st =
                                        STATUS_STYLES[client.status] || STATUS_STYLES.active;
                                    const revMeta = getRevisionBadgeMeta(
                                        client.next_revision_date,
                                        client.status
                                    );

                                    return (
                                        <tr
                                            key={client.id}
                                            onClick={() =>
                                                router.push(`/admin/clients/${client.id}`)
                                            }
                                            className="hover:bg-emerald-50/30 transition-colors cursor-pointer group"
                                        >
                                            <td className="py-3.5 px-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                                        {getInitials(client.full_name)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-heading truncate group-hover:text-primary transition-colors">
                                                            {client.full_name}
                                                        </p>
                                                        {client.phone ? (
                                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                                <Phone size={11} />
                                                                <span>{client.phone}</span>
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs text-gray-400">
                                                                No phone added
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-xs text-gray-600 max-w-[180px] truncate">
                                                {client.initial_goals || '—'}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${st.bg} ${st.text} ${st.border}`}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${st.dot}`}
                                                    />
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-col items-start gap-1 text-[11px]">
                                                    {revMeta ? (
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold border whitespace-nowrap ${revMeta.cls}`}
                                                        >
                                                            {revMeta.isDueAlert ? (
                                                                <AlertCircle size={10} />
                                                            ) : (
                                                                <Clock size={10} />
                                                            )}
                                                            <span>{revMeta.label}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">No revision set</span>
                                                    )}
                                                    {client.plan_end_date && (
                                                        <span className="inline-flex items-center gap-1 text-gray-500 whitespace-nowrap">
                                                            <Calendar size={10} />
                                                            <span>
                                                                Ends: {formatDateShort(client.plan_end_date)}
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-semibold whitespace-nowrap">
                                                        <FileText size={11} />
                                                        {planCount} {planCount === 1 ? 'Plan' : 'Plans'}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 font-semibold">
                                                        <Receipt size={11} />
                                                        {invoiceCount}
                                                    </span>
                                                </div>
                                            </td>
                                            <td
                                                className="py-3.5 px-5 text-right"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="inline-flex items-center gap-2">
                                                    <Link
                                                        href={`/admin/diet-plan-generator?clientId=${client.id}&new=1`}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-primary border border-emerald-200 text-xs font-bold transition"
                                                        title="Create a new diet plan for this client"
                                                    >
                                                        <Plus size={12} />
                                                        <span>New Plan</span>
                                                    </Link>
                                                    <Link
                                                        href={`/admin/clients/${client.id}`}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-heading text-xs font-semibold transition"
                                                    >
                                                        <span>Details</span>
                                                        <ChevronRight size={13} />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden divide-y divide-gray-100">
                        {filteredClients.map((client) => {
                            const planCount = Number(client.client_diet_plans?.[0]?.count || 0);
                            const invoiceCount = Number(client.client_invoices?.[0]?.count || 0);
                            const st = STATUS_STYLES[client.status] || STATUS_STYLES.active;
                            const revMeta = getRevisionBadgeMeta(
                                client.next_revision_date,
                                client.status
                            );

                            return (
                                <div key={client.id} className="p-4 space-y-2.5">
                                    <div
                                        onClick={() => router.push(`/admin/clients/${client.id}`)}
                                        className="flex items-start justify-between gap-3 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                                {getInitials(client.full_name)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-heading truncate">
                                                    {client.full_name}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {client.phone || client.initial_goals || 'View profile'}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${st.bg} ${st.text} ${st.border}`}
                                        >
                                            {st.label}
                                        </span>
                                    </div>

                                    {(revMeta || client.plan_end_date) && (
                                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                            {revMeta && (
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold border ${revMeta.cls}`}
                                                >
                                                    {revMeta.isDueAlert ? (
                                                        <AlertCircle size={10} />
                                                    ) : (
                                                        <Clock size={10} />
                                                    )}
                                                    <span>{revMeta.label}</span>
                                                </span>
                                            )}
                                            {client.plan_end_date && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 text-gray-600 border border-gray-200">
                                                    <Calendar size={10} />
                                                    <span>Ends: {formatDateShort(client.plan_end_date)}</span>
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-50">
                                        <div className="flex items-center gap-1.5 text-[11px]">
                                            <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md whitespace-nowrap">
                                                {planCount} {planCount === 1 ? 'Plan' : 'Plans'}
                                            </span>
                                            <span className="font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md whitespace-nowrap">
                                                {invoiceCount} {invoiceCount === 1 ? 'Inv' : 'Invs'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <Link
                                                href={`/admin/diet-plan-generator?clientId=${client.id}&new=1`}
                                                className="inline-flex items-center min-h-9 px-3 py-1.5 rounded-xl bg-emerald-50 active:bg-emerald-100 text-primary border border-emerald-200/80 text-xs font-bold whitespace-nowrap"
                                            >
                                                + Plan
                                            </Link>
                                            <Link
                                                href={`/admin/clients/${client.id}`}
                                                className="inline-flex items-center min-h-9 px-3 py-1.5 rounded-xl bg-gray-100 active:bg-gray-200 text-heading text-xs font-semibold whitespace-nowrap"
                                            >
                                                Details →
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Simplified Add Client Modal ── */}
            <ClientFormModal
                key={isModalOpen ? 'create-open' : 'create-closed'}
                isOpen={isModalOpen}
                mode="create"
                form={clientForm}
                setForm={setClientForm}
                saving={saving}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateClient}
            />
        </div>
    );
}

function AdminClientsFilterRouter() {
    const searchParams = useSearchParams();
    const urlFilter = searchParams.get('filter') || 'all';
    return <AdminClientsListingContent key={urlFilter} initialFilter={urlFilter} />;
}

export default function AdminClientsListingPage() {
    return (
        <Suspense
            fallback={
                <div className="max-w-7xl mx-auto px-2 py-16 text-center text-sm text-gray-500">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-primary" />
                    Loading clients...
                </div>
            }
        >
            <AdminClientsFilterRouter />
        </Suspense>
    );
}

