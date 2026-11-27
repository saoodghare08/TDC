'use client';

import React from 'react';
import {
    CheckCircle2,
    AlertCircle,
    Download,
    Save,
    Send,
    RefreshCw,
    Eye,
    Plus,
    Clock,
    PieChart,
} from 'lucide-react';

export default function StepInvoiceReviewShare({
    formData,
    setFormData,
    debouncedInvoice,
    loadedInvoiceRecord,
    onDetachLoadedInvoice,
    totalAmount,
    enteredPaidAmount,
    formattedTotal,
    formattedPaid,
    formattedBalance,
    savingToClientDb,
    generating,
    onSaveAndDownloadPdf,
    onSaveInvoiceToDb,
    onDownloadPdfOnly,
    onOpenWhatsApp,
    onJumpToStep,
    previewKey,
    onRefreshPreview,
    PDFViewerComponent,
    InvoicePdfDocumentComponent,
}) {
    const hasClientName = Boolean(formData.client_name?.trim());
    const validItemsCount = (formData.items || []).filter(
        (r) => String(r.description || '').trim() !== '' || String(r.amount || '').trim() !== ''
    ).length;
    const isPaid = formData.status === 'paid';
    const isPartlyPaid = formData.status === 'partly_paid';
    const partlyPaidMissingAmount = isPartlyPaid && enteredPaidAmount <= 0;

    const statusBadgeUi = isPaid
        ? {
              pill: 'bg-emerald-100 text-emerald-800',
              label: 'Paid in Full',
          }
        : isPartlyPaid
          ? {
                pill: 'bg-amber-100 text-amber-800',
                label: 'Partly Paid',
            }
          : {
                pill: 'bg-red-100 text-red-700',
                label: 'Unpaid',
            };

    return (
        <div className="space-y-4">
            {/* ── CARD 1: FINAL READINESS CHECK & RECEIPT SUMMARY ── */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 sm:p-5 space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Left: Readiness Checklist */}
                    <div className="lg:col-span-7 space-y-3">
                        <div>
                            <h2 className="text-sm sm:text-base font-bold text-heading">
                                Final Invoice Check
                            </h2>
                            <p className="text-[11px] text-gray-500">
                                Verify client, amount, and payment status before saving &amp; downloading
                            </p>
                        </div>

                        <div className="space-y-2">
                            {/* Check 1: Client */}
                            <div
                                className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                                    hasClientName
                                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                                        : 'bg-rose-50/70 border-rose-200 text-rose-900'
                                }`}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    {hasClientName ? (
                                        <CheckCircle2
                                            size={15}
                                            className="text-primary shrink-0"
                                        />
                                    ) : (
                                        <AlertCircle
                                            size={15}
                                            className="text-rose-600 shrink-0"
                                        />
                                    )}
                                    <span className="truncate">
                                        {hasClientName ? (
                                            <>
                                                Billed to: <strong>{formData.client_name}</strong>
                                                {loadedInvoiceRecord
                                                    ? ` (Editing ${loadedInvoiceRecord.invoice_number})`
                                                    : ''}
                                            </>
                                        ) : (
                                            <strong>Client Name is required</strong>
                                        )}
                                    </span>
                                </div>
                                {!hasClientName && onJumpToStep && (
                                    <button
                                        type="button"
                                        onClick={() => onJumpToStep(1)}
                                        className="font-bold text-rose-700 underline shrink-0 cursor-pointer"
                                    >
                                        Fill in Step 1 →
                                    </button>
                                )}
                            </div>

                            {/* Check 2: Items & Total */}
                            <div
                                className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                                    validItemsCount > 0 && totalAmount > 0
                                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                                        : 'bg-amber-50/70 border-amber-200 text-amber-900'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    {validItemsCount > 0 && totalAmount > 0 ? (
                                        <CheckCircle2
                                            size={15}
                                            className="text-primary shrink-0"
                                        />
                                    ) : (
                                        <AlertCircle
                                            size={15}
                                            className="text-amber-600 shrink-0"
                                        />
                                    )}
                                    <span>
                                        {validItemsCount > 0 ? (
                                            <>
                                                <strong>{validItemsCount}</strong>{' '}
                                                {validItemsCount === 1 ? 'service' : 'services'} •
                                                Total <strong>₹{formattedTotal}</strong>
                                            </>
                                        ) : (
                                            'No service items or fee entered yet'
                                        )}
                                    </span>
                                </div>
                                {(validItemsCount === 0 || totalAmount <= 0) && onJumpToStep && (
                                    <button
                                        type="button"
                                        onClick={() => onJumpToStep(2)}
                                        className="font-bold text-amber-800 underline shrink-0 cursor-pointer"
                                    >
                                        Add Fee →
                                    </button>
                                )}
                            </div>

                            {/* Check 3: Quick Status Flip + Partly Paid Check */}
                            <div
                                className={`px-3.5 py-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs ${
                                    partlyPaidMissingAmount
                                        ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                                        : 'bg-gray-50/90 border-gray-200 text-heading'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    {partlyPaidMissingAmount ? (
                                        <AlertCircle size={15} className="text-rose-600 shrink-0" />
                                    ) : isPaid ? (
                                        <CheckCircle2 size={15} className="text-primary shrink-0" />
                                    ) : isPartlyPaid ? (
                                        <PieChart size={15} className="text-amber-600 shrink-0" />
                                    ) : (
                                        <Clock size={15} className="text-red-500 shrink-0" />
                                    )}
                                    <span>
                                        {partlyPaidMissingAmount ? (
                                            <strong>
                                                Enter Amount Received in Step 2 for Partly Paid
                                            </strong>
                                        ) : (
                                            <>
                                                Status: <strong>{statusBadgeUi.label}</strong>
                                            </>
                                        )}
                                    </span>
                                </div>

                                {/* Quick 1-Tap Status Toggle right on Step 3 */}
                                <div className="inline-flex items-center bg-white rounded-lg border border-gray-200 p-0.5 text-[11px] font-bold">
                                    {[
                                        { key: 'unpaid', label: 'Unpaid' },
                                        { key: 'partly_paid', label: 'Partly' },
                                        { key: 'paid', label: 'Paid' },
                                    ].map((st) => (
                                        <button
                                            key={st.key}
                                            type="button"
                                            onClick={() => {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    status: st.key,
                                                }));
                                                onRefreshPreview();
                                            }}
                                            className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                                                formData.status === st.key
                                                    ? st.key === 'paid'
                                                        ? 'bg-emerald-600 text-white'
                                                        : st.key === 'partly_paid'
                                                            ? 'bg-amber-500 text-white'
                                                            : 'bg-red-500 text-white'
                                                    : 'text-gray-500 hover:text-heading'
                                            }`}
                                        >
                                            {st.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Clean Amount Summary Card */}
                    <div className="lg:col-span-5 rounded-2xl bg-gray-50/90 border border-gray-200/90 p-4 space-y-2.5">
                        <div className="flex items-center justify-between text-xs text-gray-500 pb-2 border-b border-gray-200/80">
                            <span className="font-mono font-bold text-heading">
                                {formData.invoice_number}
                            </span>
                            <span>{formData.invoice_date || 'Today'}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Total Amount</span>
                            <span className="font-bold text-heading text-sm">
                                ₹{formattedTotal}
                            </span>
                        </div>

                        {(isPartlyPaid || isPaid) && (
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-emerald-700 font-semibold">
                                    Amount Received
                                </span>
                                <span className="font-bold text-emerald-700">
                                    ₹{isPaid ? formattedTotal : formattedPaid}
                                </span>
                            </div>
                        )}

                        <div className="pt-2 border-t border-gray-200/80 flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-heading">
                                {isPaid ? 'Balance Due' : 'Amount Due'}
                            </span>
                            <span
                                className={`text-lg font-bold ${
                                    isPaid ? 'text-primary' : 'text-amber-900'
                                }`}
                            >
                                ₹{isPaid ? '0.00' : formattedBalance}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── UNIFIED HERO ACTION BAR ── */}
                <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-2.5">
                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
                        {/* HERO CTA: Save & Download PDF */}
                        <button
                            type="button"
                            disabled={savingToClientDb || generating}
                            onClick={() => onSaveAndDownloadPdf('auto')}
                            className="min-h-11 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm shadow-sm shadow-primary/20 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                        >
                            {savingToClientDb || generating ? (
                                <RefreshCw size={15} className="animate-spin shrink-0" />
                            ) : (
                                <Download size={15} className="shrink-0" />
                            )}
                            <span>
                                {loadedInvoiceRecord
                                    ? 'Update Invoice & Download PDF'
                                    : 'Save Invoice & Download PDF'}
                            </span>
                        </button>

                        {loadedInvoiceRecord && (
                            <button
                                type="button"
                                disabled={savingToClientDb || generating}
                                onClick={() => onSaveAndDownloadPdf('create')}
                                className="min-h-11 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-primary border border-emerald-200 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                            >
                                <Plus size={14} />
                                <span>Save as New Invoice &amp; Download</span>
                            </button>
                        )}

                        {/* Save Only */}
                        <button
                            type="button"
                            disabled={savingToClientDb}
                            onClick={() => onSaveInvoiceToDb('auto')}
                            className="min-h-11 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-heading border border-gray-200 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                        >
                            <Save size={14} className="text-primary" />
                            <span>
                                {loadedInvoiceRecord ? 'Update Only' : 'Save to Client Only'}
                            </span>
                        </button>

                        {/* WhatsApp Invoice Summary */}
                        <button
                            type="button"
                            onClick={onOpenWhatsApp}
                            className="min-h-11 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-semibold text-xs transition cursor-pointer"
                        >
                            <Send size={14} className="text-emerald-700" />
                            <span>Send WhatsApp Summary</span>
                        </button>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 text-[11px]">
                        {loadedInvoiceRecord && (
                            <button
                                type="button"
                                onClick={onDetachLoadedInvoice}
                                className="text-gray-500 hover:text-heading underline cursor-pointer"
                            >
                                Detach from {loadedInvoiceRecord.invoice_number}
                            </button>
                        )}
                        <button
                            type="button"
                            disabled={generating}
                            onClick={onDownloadPdfOnly}
                            className="text-gray-500 hover:text-primary underline cursor-pointer disabled:opacity-50"
                        >
                            Download PDF Only (Don&apos;t Save)
                        </button>
                    </div>
                </div>
            </div>

            {/* ── CARD 2: LIVE INVOICE PDF PREVIEW ── */}
            <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-200/80 shadow-xs flex flex-col">
                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Eye size={15} className="text-primary shrink-0" />
                        <h3 className="font-heading font-bold text-heading text-xs sm:text-sm">
                            Live Invoice PDF Preview
                        </h3>
                        <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusBadgeUi.pill}`}
                        >
                            {statusBadgeUi.label}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onRefreshPreview}
                        className="px-2.5 py-1.5 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                        <RefreshCw size={13} />
                        <span>Refresh Preview</span>
                    </button>
                </div>

                {/* Mobile Browser Helper */}
                <div className="md:hidden mb-2.5 px-3 py-2 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-2 text-[11px] text-emerald-900">
                    <span>On mobile, tap Save &amp; Download to open the full PDF.</span>
                    <button
                        type="button"
                        onClick={onDownloadPdfOnly}
                        disabled={generating}
                        className="font-bold text-primary underline shrink-0 cursor-pointer"
                    >
                        {generating ? 'Generating…' : 'Open PDF'}
                    </button>
                </div>

                <div className="w-full h-[520px] sm:h-[700px] rounded-xl overflow-hidden border border-gray-200">
                    <PDFViewerComponent
                        key={previewKey}
                        width="100%"
                        height="100%"
                        showToolbar={true}
                    >
                        <InvoicePdfDocumentComponent invoice={debouncedInvoice} />
                    </PDFViewerComponent>
                </div>
            </div>
        </div>
    );
}
