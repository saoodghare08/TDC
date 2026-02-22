'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import {
    Users, Plus, Search, Eye, Edit2, ChevronRight,
    Phone, Instagram, Calendar, Activity, X,
} from 'lucide-react';

const STATUS_STYLES = {
    active: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', label: 'Active' },
    completed: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Completed' },
    paused: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Paused' },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400', label: 'Inactive' },
    pending: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-400', label: 'Pending' },
};

function StatusBadge({ status }) {
    const s = STATUS_STYLES[status] || STATUS_STYLES.inactive;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
        </span>
    );
}

function Initials({ name }) {
    const letters = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
    return (
        <div className="w-10 h-10 rounded-xl bg-heading text-white flex items-center justify-center text-sm font-bold shrink-0">
            {letters}
        </div>
    );
}

export default function ClientsPage() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const supabase = createClient();

    useEffect(() => { fetchClients(); }, []);

    const fetchClients = async () => {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(c => {
        const matchSearch =
            c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone?.includes(searchTerm) ||
            c.instagram?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === 'all' || c.status === filterStatus;
        return matchSearch && matchStatus;
    });

    /* ── Summary counts ── */
    const counts = {
        total: clients.length,
        active: clients.filter(c => c.status === 'active').length,
        completed: clients.filter(c => c.status === 'completed').length,
        paused: clients.filter(c => c.status === 'paused').length,
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Loading clients...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

                {/* ── Header ── */}
                <div className="flex items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-heading flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Users size={22} className="text-primary" />
                            </div>
                            Clients
                        </h1>
                        <p className="text-gray-400 text-sm mt-1 ml-1">Manage all client profiles and plans</p>
                    </div>
                    <Link
                        href="/admin/clients/create"
                        className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary-dark transition shadow-sm text-sm shrink-0"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Add Client</span>
                        <span className="sm:hidden">Add</span>
                    </Link>
                </div>

                {/* ── Summary Stats ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                        { label: 'Total', value: counts.total, color: 'text-heading', bg: 'bg-white', border: 'border-gray-100', filter: 'all' },
                        { label: 'Active', value: counts.active, color: 'text-green-600', bg: 'bg-white', border: 'border-green-100', filter: 'active' },
                        { label: 'Completed', value: counts.completed, color: 'text-blue-600', bg: 'bg-white', border: 'border-blue-100', filter: 'completed' },
                        { label: 'Paused', value: counts.paused, color: 'text-yellow-600', bg: 'bg-white', border: 'border-yellow-100', filter: 'paused' },
                    ].map(s => (
                        <button
                            key={s.filter}
                            onClick={() => setFilterStatus(s.filter)}
                            className={`${s.bg} rounded-2xl border ${s.border} p-4 text-left shadow-sm hover:shadow transition cursor-pointer ${filterStatus === s.filter ? 'ring-2 ring-primary' : ''}`}
                        >
                            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-xs text-gray-400 mt-0.5 font-medium">{s.label}</p>
                        </button>
                    ))}
                </div>

                {/* ── Search & Filter Bar ── */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, phone, or Instagram…"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-10 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm shadow-sm"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition"
                            >
                                <X size={14} className="text-gray-400" />
                            </button>
                        )}
                    </div>

                    {/* Status filter (mobile-friendly select) */}
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="sm:w-44 px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium text-gray-600 shadow-sm cursor-pointer"
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="paused">Paused</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                    </select>
                </div>

                {/* ── Results count ── */}
                {(searchTerm || filterStatus !== 'all') && (
                    <p className="text-sm text-gray-400 mb-4">
                        Showing <span className="font-bold text-heading">{filteredClients.length}</span> of {clients.length} clients
                    </p>
                )}

                {/* ── Empty State ── */}
                {filteredClients.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 sm:p-16 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
                            <Users size={36} className="text-gray-300" />
                        </div>
                        <h2 className="text-xl font-bold text-heading mb-2">
                            {searchTerm || filterStatus !== 'all' ? 'No clients found' : 'No clients yet'}
                        </h2>
                        <p className="text-gray-400 mb-6 text-sm">
                            {searchTerm || filterStatus !== 'all'
                                ? 'Try adjusting your search or filter'
                                : 'Start by adding your first client'}
                        </p>
                        {!searchTerm && filterStatus === 'all' && (
                            <Link
                                href="/admin/clients/create"
                                className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary-dark transition"
                            >
                                <Plus size={18} /> Add First Client
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        {/* ── DESKTOP TABLE (md+) ── */}
                        <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Client</th>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Contact</th>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Plan</th>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Status</th>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Start Date</th>
                                        <th className="text-center px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredClients.map(client => (
                                        <tr key={client.id} className="hover:bg-gray-50/70 transition group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Initials name={client.full_name} />
                                                    <div>
                                                        <p className="font-bold text-heading">{client.full_name}</p>
                                                        {client.instagram && (
                                                            <p className="text-xs text-gray-400">@{client.instagram}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-600 flex items-center gap-1.5">
                                                    <Phone size={12} className="text-gray-300" />
                                                    {client.phone}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-gray-700 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                                                    {client.assigned_plan_type || '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={client.status} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-500 flex items-center gap-1.5">
                                                    <Calendar size={12} className="text-gray-300" />
                                                    {client.plan_start_date
                                                        ? new Date(client.plan_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                        : '—'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Link
                                                        href={`/admin/clients/${client.id}`}
                                                        className="p-2 hover:bg-primary/10 rounded-xl transition"
                                                        title="View Details"
                                                    >
                                                        <Eye size={17} className="text-primary" />
                                                    </Link>
                                                    <Link
                                                        href={`/admin/clients/${client.id}/edit`}
                                                        className="p-2 hover:bg-blue-50 rounded-xl transition"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={17} className="text-blue-500" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* ── MOBILE CARDS (< md) ── */}
                        <div className="md:hidden space-y-3">
                            {filteredClients.map(client => (
                                <div key={client.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                                    {/* Top row */}
                                    <div className="flex items-start gap-3 mb-3">
                                        <Initials name={client.full_name} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="font-bold text-heading truncate">{client.full_name}</p>
                                                    {client.instagram && (
                                                        <p className="text-xs text-gray-400">@{client.instagram}</p>
                                                    )}
                                                </div>
                                                <StatusBadge status={client.status} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detail pills */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {client.phone && (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-600">
                                                <Phone size={11} className="text-gray-400" />
                                                {client.phone}
                                            </span>
                                        )}
                                        {client.assigned_plan_type && (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/5 border border-primary/10 rounded-lg text-xs text-primary font-semibold">
                                                {client.assigned_plan_type}
                                            </span>
                                        )}
                                        {client.plan_start_date && (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-500">
                                                <Calendar size={11} className="text-gray-400" />
                                                {new Date(client.plan_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/admin/clients/${client.id}`}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl transition text-sm"
                                        >
                                            <Eye size={15} />
                                            View
                                        </Link>
                                        <Link
                                            href={`/admin/clients/${client.id}/edit`}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-xl transition text-sm"
                                        >
                                            <Edit2 size={15} />
                                            Edit
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bottom count */}
                        <p className="text-xs text-gray-400 text-center mt-5">
                            {filteredClients.length} {filteredClients.length === 1 ? 'client' : 'clients'} shown
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
