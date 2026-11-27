'use client';

import React, { useState, useRef } from 'react';
import {
    Receipt,
    Plus,
    Trash2,
    Clock,
    PieChart,
    CheckCircle2,
    QrCode,
    CreditCard,
    Upload,
    BookmarkCheck,
    X,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { PACKAGE_QUICK_PICKS, createRow } from './invoiceGeneratorUtils';

export default function StepInvoiceItemsPayment({
    formData,
    setFormData,
    totalAmount,
    formattedTotal,
    formattedBalance,
    onAddRow,
    onRemoveRow,
    onItemChange,
    onProcessQrFile,
    onRemoveQr,
    hasSavedDefaults,
    onSavePaymentDefaults,
    onClearPaymentDefaults,
}) {
    const qrInputRef = useRef(null);
    const [isDraggingQr, setIsDraggingQr] = useState(false);

    const hasPaymentInfo = Boolean(formData.upi_id?.trim() || formData.qr_image);
    // Auto-collapse UPI/QR box when defaults are already configured so layman users aren't distracted
    const [showPaymentEditor, setShowPaymentEditor] = useState(() => !hasPaymentInfo);

    const isPaid = formData.status === 'paid';
    const isPartlyPaid = formData.status === 'partly_paid';

    const handleQuickPickPackage = (pkg) => {
        setFormData((prev) => {
            const currentItems = Array.isArray(prev.items) ? [...prev.items] : [];
            // Fill the first empty row if available; otherwise append a new row
            const emptyIdx = currentItems.findIndex(
                (r) => !String(r.description || '').trim() && !String(r.amount || '').trim()
            );
            if (emptyIdx !== -1) {
                currentItems[emptyIdx] = {
                    ...currentItems[emptyIdx],
                    description: pkg.description,
                };
                return { ...prev, items: currentItems };
            }
            return {
                ...prev,
                items: [...currentItems, createRow(pkg.description, '')],
            };
        });
    };

    const handleQrInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) onProcessQrFile(file);
        e.target.value = '';
    };

    return (
        <div className="space-y-4">
            {/* ── CARD 1: SERVICES / PACKAGES & AMOUNT ── */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Receipt size={16} />
                        </div>
                        <div>
                            <h2 className="text-sm sm:text-base font-bold text-heading">
                                Services &amp; Charges
                            </h2>
                            <p className="text-[11px] text-gray-500">
                                Tap a common clinic package below or type your own description &amp; fee
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onAddRow}
                        className="min-h-9 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-primary border border-emerald-200 text-xs font-bold transition cursor-pointer"
                    >
                        <Plus size={14} />
                        <span>Add Item Row</span>
                    </button>
                </div>

                {/* 1-Tap Package Quick-Picks */}
                <div className="space-y-1.5">
                    <span className="block text-[11px] font-bold text-gray-500">
                        Quick-fill service description:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {PACKAGE_QUICK_PICKS.map((pkg) => (
                            <button
                                key={pkg.label}
                                type="button"
                                onClick={() => handleQuickPickPackage(pkg)}
                                className="px-2.5 py-1.5 rounded-xl bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-xs font-semibold text-gray-700 hover:text-primary transition cursor-pointer"
                            >
                                + {pkg.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Clean Line Items List */}
                <div className="rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="hidden sm:grid sm:grid-cols-12 bg-primary text-white text-[11px] font-bold uppercase tracking-wider px-4 py-2.5">
                        <div className="col-span-8">Service / Program Description</div>
                        <div className="col-span-3 text-right pr-2">Amount (₹)</div>
                        <div className="col-span-1" />
                    </div>

                    {formData.items.length === 0 ? (
                        <div className="py-8 px-4 text-center bg-gray-50/50 space-y-2">
                            <p className="text-xs text-gray-500">No service items added yet.</p>
                            <button
                                type="button"
                                onClick={onAddRow}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold cursor-pointer"
                            >
                                <Plus size={13} />
                                <span>Add Service Row</span>
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 bg-white">
                            {formData.items.map((row, idx) => (
                                <div
                                    key={row.id}
                                    className="p-3 sm:px-4 sm:py-2.5 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center hover:bg-gray-50/50"
                                >
                                    <div className="sm:col-span-8 flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                                            {idx + 1}
                                        </span>
                                        <input
                                            type="text"
                                            value={row.description}
                                            onChange={(e) =>
                                                onItemChange(row.id, 'description', e.target.value)
                                            }
                                            placeholder="e.g., 3 Month Transformation Diet Program"
                                            className="w-full min-h-10 text-xs sm:text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        />
                                    </div>

                                    <div className="sm:col-span-4 flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                                                ₹
                                            </span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={row.amount}
                                                onChange={(e) =>
                                                    onItemChange(row.id, 'amount', e.target.value)
                                                }
                                                placeholder="0.00"
                                                className="w-full min-h-10 text-xs sm:text-sm pl-7 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-right font-bold text-heading focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => onRemoveRow(row.id)}
                                            disabled={formData.items.length === 1 && !row.description && !row.amount}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl disabled:opacity-30 transition cursor-pointer shrink-0"
                                            title="Remove item"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Total Strip */}
                    <div className="border-t border-emerald-200 bg-emerald-50/70 px-4 py-3 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                            Total Invoice Amount
                        </span>
                        <span className="text-base sm:text-lg font-bold text-primary">
                            ₹{formattedTotal}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── CARD 2: PAYMENT STATUS & BALANCE ── */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 sm:p-5 space-y-4">
                <div>
                    <h2 className="text-sm sm:text-base font-bold text-heading">
                        Has the Client Paid?
                    </h2>
                    <p className="text-[11px] text-gray-500">
                        Select the current payment status — stamps the matching badge on the PDF
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <button
                        type="button"
                        onClick={() =>
                            setFormData((prev) => ({ ...prev, status: 'unpaid' }))
                        }
                        className={`min-h-12 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-2.5 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                            formData.status === 'unpaid'
                                ? 'bg-red-50 border-red-400 text-red-700 ring-2 ring-red-200/70'
                                : 'bg-gray-50/70 border-gray-200 text-gray-600 hover:bg-white'
                        }`}
                    >
                        <Clock size={15} />
                        <span>Unpaid</span>
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            setFormData((prev) => ({ ...prev, status: 'partly_paid' }))
                        }
                        className={`min-h-12 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-2.5 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                            isPartlyPaid
                                ? 'bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-200/70'
                                : 'bg-gray-50/70 border-gray-200 text-gray-600 hover:bg-white'
                        }`}
                    >
                        <PieChart size={15} />
                        <span>Partly Paid</span>
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            setFormData((prev) => ({ ...prev, status: 'paid' }))
                        }
                        className={`min-h-12 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-2.5 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                            isPaid
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-200/70'
                                : 'bg-gray-50/70 border-gray-200 text-gray-600 hover:bg-white'
                        }`}
                    >
                        <CheckCircle2 size={15} />
                        <span>Paid in Full</span>
                    </button>
                </div>

                {/* Partly Paid Calculator Box */}
                {isPartlyPaid && (
                    <div className="rounded-2xl bg-amber-50/60 border border-amber-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                        <div>
                            <label className="block text-xs font-bold text-emerald-900 mb-1">
                                Amount Received So Far (₹) *
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.amount_paid}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            amount_paid: e.target.value,
                                        }))
                                    }
                                    placeholder="Enter paid amount (e.g., 2500)"
                                    className="w-full min-h-[42px] text-sm font-bold text-emerald-900 px-3.5 py-2 rounded-xl border border-emerald-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                {totalAmount > 0 && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                amount_paid: String(Math.round(totalAmount / 2)),
                                            }))
                                        }
                                        className="min-h-[42px] px-3 rounded-xl bg-white border border-amber-300 text-xs font-bold text-amber-900 hover:bg-amber-100 whitespace-nowrap cursor-pointer"
                                    >
                                        50%
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="sm:text-right bg-white/80 rounded-xl p-3 border border-amber-200/80">
                            <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-800">
                                Remaining Balance Due
                            </span>
                            <span className="text-xl font-bold text-amber-950">
                                ₹{formattedBalance}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* ── CARD 3: SMART COLLAPSIBLE CLINIC UPI & QR CODE ── */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                <div
                    onClick={() => setShowPaymentEditor((o) => !o)}
                    className="p-4 sm:p-5 flex items-center justify-between gap-2 cursor-pointer hover:bg-gray-50/60 select-none"
                >
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <QrCode size={16} />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm font-bold text-heading flex items-center gap-2 flex-wrap">
                                <span>Clinic UPI &amp; Payment QR</span>
                                {hasPaymentInfo ? (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                                        Ready on PDF ✓
                                    </span>
                                ) : (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold">
                                        Optional
                                    </span>
                                )}
                            </h2>
                            <p className="text-[11px] text-gray-500 truncate">
                                {hasPaymentInfo
                                    ? `${formData.upi_id ? `UPI: ${formData.upi_id}` : ''}${
                                          formData.upi_id && formData.qr_image ? ' • ' : ''
                                      }${formData.qr_image ? 'QR Code Attached' : ''}`
                                    : 'Set once & click "Save as Default" so future invoices fill automatically'}
                            </p>
                        </div>
                    </div>

                    <span className="text-xs font-semibold text-primary inline-flex items-center gap-1 shrink-0">
                        <span>{showPaymentEditor ? 'Hide' : 'Edit'}</span>
                        {showPaymentEditor ? (
                            <ChevronUp size={15} />
                        ) : (
                            <ChevronDown size={15} />
                        )}
                    </span>
                </div>

                {showPaymentEditor && (
                    <div className="p-4 sm:p-5 pt-0 border-t border-gray-100 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
                            <span className="text-[11px] text-gray-500">
                                Save your clinic UPI &amp; QR once so you never have to re-enter them:
                            </span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={onSavePaymentDefaults}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer"
                                >
                                    <BookmarkCheck size={13} />
                                    <span>Save as Clinic Default</span>
                                </button>
                                {hasSavedDefaults && (
                                    <button
                                        type="button"
                                        onClick={onClearPaymentDefaults}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                        title="Clear saved default UPI & QR"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                    Clinic UPI ID
                                </label>
                                <div className="relative">
                                    <CreditCard
                                        size={15}
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                    />
                                    <input
                                        type="text"
                                        value={formData.upi_id}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                upi_id: e.target.value,
                                            }))
                                        }
                                        placeholder="e.g., sabahghare@okicici"
                                        className="w-full min-h-[42px] text-xs sm:text-sm pl-10 pr-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                    Payment QR Image
                                </label>
                                <input
                                    ref={qrInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                    onChange={handleQrInputChange}
                                    className="hidden"
                                />

                                {formData.qr_image ? (
                                    <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/40">
                                        <div className="w-16 h-16 rounded-xl bg-white border border-gray-200 p-1 flex items-center justify-center shrink-0">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={formData.qr_image}
                                                alt="UPI QR Preview"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-heading truncate">
                                                {formData.qr_filename || 'QR Code Attached'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => qrInputRef.current?.click()}
                                                    className="px-2.5 py-1 bg-white border border-gray-200 hover:border-primary text-xs font-semibold rounded-lg cursor-pointer"
                                                >
                                                    Replace
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={onRemoveQr}
                                                    className="px-2.5 py-1 bg-white border border-red-200 text-xs font-semibold text-red-600 rounded-lg cursor-pointer"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => qrInputRef.current?.click()}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setIsDraggingQr(true);
                                        }}
                                        onDragLeave={() => setIsDraggingQr(false)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setIsDraggingQr(false);
                                            const file = e.dataTransfer.files?.[0];
                                            if (file) onProcessQrFile(file);
                                        }}
                                        className={`border-2 border-dashed rounded-xl p-4 text-center transition cursor-pointer ${
                                            isDraggingQr
                                                ? 'border-primary bg-emerald-50/70'
                                                : 'border-gray-200 hover:border-primary/60 hover:bg-gray-50/80'
                                        }`}
                                    >
                                        <Upload size={16} className="mx-auto text-primary mb-1" />
                                        <p className="text-xs font-bold text-heading">
                                            Tap to upload QR image
                                        </p>
                                        <p className="text-[10px] text-gray-400">
                                            PNG, JPG or WEBP
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
