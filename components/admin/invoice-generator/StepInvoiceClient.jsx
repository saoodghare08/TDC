'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    User,
    Search,
    CheckCircle2,
    X,
    RefreshCw,
    FileText,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { INVOICE_GOAL_CHIPS, generateInvoiceMeta } from './invoiceGeneratorUtils';

export default function StepInvoiceClient({
    formData,
    setFormData,
    allClients,
    selectedClient,
    onSelectClientObject,
    onDetachClient,
    onClientNameChange,
}) {
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [showInvoiceMetaEdit, setShowInvoiceMetaEdit] = useState(false);
    const clientBoxRef = useRef(null);

    useEffect(() => {
        const handleOutside = (e) => {
            if (clientBoxRef.current && !clientBoxRef.current.contains(e.target)) {
                setShowClientDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    const matchingClients = useMemo(() => {
        const q = (formData.client_name || '').trim().toLowerCase();
        if (!q) return allClients.slice(0, 8);
        return allClients
            .filter(
                (c) =>
                    c.full_name?.toLowerCase().includes(q) ||
                    c.phone?.toLowerCase().includes(q) ||
                    c.initial_goals?.toLowerCase().includes(q)
            )
            .slice(0, 8);
    }, [allClients, formData.client_name]);

    const toggleGoalChip = (chipVal) => {
        const current = (formData.goal || '').trim();
        if (current.toLowerCase() === chipVal.toLowerCase()) {
            setFormData((prev) => ({ ...prev, goal: '' }));
        } else {
            setFormData((prev) => ({ ...prev, goal: chipVal }));
        }
    };

    return (
        <div className="space-y-4">
            {/* ── COMPACT INVOICE NUMBER & DATE STRIP ── */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-950 font-semibold">
                        <FileText size={15} className="text-primary shrink-0" />
                        <span>Invoice No:</span>
                        <span className="font-mono font-bold text-primary">
                            {formData.invoice_number || 'Auto'}
                        </span>
                        <span className="text-emerald-300">•</span>
                        <span>{formData.invoice_date || 'Today'}</span>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        <button
                            type="button"
                            onClick={() =>
                                setFormData((prev) => ({
                                    ...prev,
                                    ...generateInvoiceMeta(),
                                }))
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100 text-primary border border-emerald-200 text-[11px] font-bold transition cursor-pointer"
                            title="Generate a fresh invoice number"
                        >
                            <RefreshCw size={11} />
                            <span>New #</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowInvoiceMetaEdit((o) => !o)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-900 hover:underline cursor-pointer"
                        >
                            <span>{showInvoiceMetaEdit ? 'Done' : 'Edit # / Date'}</span>
                            {showInvoiceMetaEdit ? (
                                <ChevronUp size={12} />
                            ) : (
                                <ChevronDown size={12} />
                            )}
                        </button>
                    </div>
                </div>

                {showInvoiceMetaEdit && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-emerald-200/60">
                        <div>
                            <label className="block text-[11px] font-bold text-emerald-950 mb-1">
                                Custom Invoice Number
                            </label>
                            <input
                                type="text"
                                value={formData.invoice_number}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        invoice_number: e.target.value,
                                    }))
                                }
                                placeholder="TDC-20261127-101"
                                className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-emerald-950 mb-1">
                                Invoice Date Text
                            </label>
                            <input
                                type="text"
                                value={formData.invoice_date}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        invoice_date: e.target.value,
                                    }))
                                }
                                placeholder="e.g., 27 Nov 2026"
                                className="w-full text-xs px-3 py-2 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* ── CLIENT & PROGRAM CARD ── */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 sm:p-5 space-y-5">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <User size={16} />
                        </div>
                        <div>
                            <h2 className="text-sm sm:text-base font-bold text-heading">
                                Who Is This Invoice For?
                            </h2>
                            <p className="text-[11px] text-gray-500">
                                Pick a saved client or type a new name — saves to their profile automatically
                            </p>
                        </div>
                    </div>

                    {selectedClient && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800 shrink-0">
                            <CheckCircle2 size={12} className="text-primary" />
                            <Link
                                href={`/admin/clients/${selectedClient.id}`}
                                className="hover:underline max-w-[120px] sm:max-w-[180px] truncate"
                            >
                                {selectedClient.full_name}
                            </Link>
                            <button
                                type="button"
                                onClick={onDetachClient}
                                className="text-gray-400 hover:text-red-500 ml-0.5 cursor-pointer"
                                title="Unlink from this client profile"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Searchable Client Name + WhatsApp Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="sm:col-span-2 relative" ref={clientBoxRef}>
                        <label className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1">
                            <span>Client Full Name *</span>
                            <span className="text-[10px] font-medium text-gray-400">
                                {selectedClient ? 'Linked to saved profile' : 'Search or type new name'}
                            </span>
                        </label>
                        <div className="relative">
                            <Search
                                size={14}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                            <input
                                type="text"
                                value={formData.client_name}
                                onFocus={() => setShowClientDropdown(true)}
                                onChange={(e) => {
                                    onClientNameChange(e.target.value);
                                    setShowClientDropdown(true);
                                }}
                                placeholder="Type client name (e.g., Ananya Sharma)"
                                className="w-full min-h-[42px] text-sm font-semibold pl-9 pr-8 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                required
                            />
                            {formData.client_name && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onDetachClient();
                                        setFormData((prev) => ({ ...prev, client_name: '' }));
                                    }}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                                    title="Clear name"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {showClientDropdown && allClients.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-200 z-40 max-h-60 overflow-y-auto p-1.5">
                                {matchingClients.length > 0 ? (
                                    <>
                                        <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                            Saved Clients (Tap to Auto-Fill)
                                        </p>
                                        {matchingClients.map((c) => {
                                            const isChosen = selectedClient?.id === c.id;
                                            return (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => {
                                                        onSelectClientObject(c);
                                                        setShowClientDropdown(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-2 transition cursor-pointer ${
                                                        isChosen
                                                            ? 'bg-emerald-50 text-emerald-950 font-bold'
                                                            : 'hover:bg-gray-50 text-heading'
                                                    }`}
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold truncate">
                                                            {c.full_name}
                                                        </p>
                                                        <p className="text-[11px] text-gray-500 truncate">
                                                            {[c.phone, c.initial_goals]
                                                                .filter(Boolean)
                                                                .join(' • ') || 'Saved client'}
                                                        </p>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-primary shrink-0">
                                                        {isChosen ? 'Selected ✓' : 'Select'}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </>
                                ) : (
                                    <div className="px-3 py-2.5 text-xs text-gray-600 flex items-center justify-between">
                                        <span>
                                            New client:{' '}
                                            <strong className="text-heading">
                                                &ldquo;{formData.client_name.trim()}&rdquo;
                                            </strong>{' '}
                                            will be created on save.
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setShowClientDropdown(false)}
                                            className="text-primary font-bold ml-2 cursor-pointer"
                                        >
                                            OK
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            WhatsApp / Phone{' '}
                            <span className="text-gray-400 font-normal">(For sharing)</span>
                        </label>
                        <input
                            type="tel"
                            value={formData.client_phone || ''}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    client_phone: e.target.value,
                                }))
                            }
                            placeholder="+91 98765 43210"
                            className="w-full min-h-[42px] text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                </div>

                {/* Program / Goal Chips */}
                <div className="space-y-2 pt-3 border-t border-gray-100">
                    <label className="block text-xs font-bold text-gray-700">
                        Program / Goal Printed on Invoice{' '}
                        <span className="text-gray-400 font-normal">(Tap a preset or type custom)</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                        {INVOICE_GOAL_CHIPS.map((chip) => {
                            const active =
                                (formData.goal || '').trim().toLowerCase() ===
                                chip.toLowerCase();
                            return (
                                <button
                                    key={chip}
                                    type="button"
                                    onClick={() => toggleGoalChip(chip)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                                        active
                                            ? 'bg-primary text-white border-primary shadow-2xs'
                                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                    }`}
                                >
                                    {chip}
                                </button>
                            );
                        })}
                    </div>
                    <input
                        type="text"
                        value={formData.goal}
                        onChange={(e) =>
                            setFormData((prev) => ({ ...prev, goal: e.target.value }))
                        }
                        placeholder="Or type custom program / goal (e.g., 3-Month PCOS & Fat Loss Program)"
                        className="w-full min-h-[42px] text-xs px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                </div>
            </div>
        </div>
    );
}
