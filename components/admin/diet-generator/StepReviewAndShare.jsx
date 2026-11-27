'use client';

import React from 'react';
import {
    CheckCircle2,
    AlertCircle,
    Save,
    Download,
    Send,
    RefreshCw,
    Eye,
    Plus,
    FileText,
    Clock,
} from 'lucide-react';
import { addDaysToIsoDate } from './dietGeneratorUtils';

export default function StepReviewAndShare({
    formData,
    setFormData,
    loadedPlanRecord,
    onDetachLoadedRevision,
    savingToClientDb,
    generating,
    onSaveAndDownloadPdf,
    onSavePlanToDb,
    onDownloadPdfOnly,
    onOpenWhatsApp,
    onJumpToStep,
    previewKey,
    onRefreshPreview,
    PDFViewerComponent,
    DietPlanPdfDocumentComponent,
}) {
    const hasClientName = Boolean(formData.client_name?.trim());
    const mealCount = formData.meals?.length || 0;
    const hasRevisionDate = Boolean(formData.revision_date?.trim());

    return (
        <div className="space-y-4">
            {/* ── CARD 1: LAYMAN READINESS CHECK & PRINT SIZE ── */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 sm:p-5 space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Left: Readiness Checklist */}
                    <div className="lg:col-span-7 space-y-3">
                        <div>
                            <h2 className="text-sm sm:text-base font-bold text-heading">
                                Final Readiness Check
                            </h2>
                            <p className="text-[11px] text-gray-500">
                                Quick summary before saving to the client&apos;s profile and downloading the PDF
                            </p>
                        </div>

                        <div className="space-y-2">
                            {/* Check 1: Client Name */}
                            <div
                                className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${hasClientName
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
                                                Client: <strong>{formData.client_name}</strong>
                                                {loadedPlanRecord
                                                    ? ` (Editing Rev ${loadedPlanRecord.revision_number})`
                                                    : ' (Saves as New Revision)'}
                                            </>
                                        ) : (
                                            <strong>Client Name is required before saving</strong>
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

                            {/* Check 2: Meals */}
                            <div
                                className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${mealCount > 0
                                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    {mealCount > 0 ? (
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
                                        {mealCount > 0 ? (
                                            <>
                                                <strong>{mealCount} Meal Slots</strong> configured
                                                {formData.recipes?.length > 0
                                                    ? ` + ${formData.recipes.length} Attached ${formData.recipes.length === 1
                                                        ? 'Recipe'
                                                        : 'Recipes'
                                                    }`
                                                    : ''}
                                            </>
                                        ) : (
                                            'No meal slots added yet'
                                        )}
                                    </span>
                                </div>
                                {mealCount === 0 && onJumpToStep && (
                                    <button
                                        type="button"
                                        onClick={() => onJumpToStep(2)}
                                        className="font-bold text-amber-800 underline shrink-0 cursor-pointer"
                                    >
                                        Add Meals →
                                    </button>
                                )}
                            </div>

                            {/* Check 3: Next Revision Date (Push Reminder) */}
                            <div
                                className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${hasRevisionDate
                                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                                    }`}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    {hasRevisionDate ? (
                                        <CheckCircle2
                                            size={15}
                                            className="text-primary shrink-0"
                                        />
                                    ) : (
                                        <Clock size={15} className="text-amber-600 shrink-0" />
                                    )}
                                    <span className="truncate">
                                        {hasRevisionDate ? (
                                            <>
                                                Next Revision Reminder:{' '}
                                                <strong>{formData.revision_date}</strong> (Push
                                                alert 3d before)
                                            </>
                                        ) : (
                                            'Next Revision Date not set (no push reminder yet)'
                                        )}
                                    </span>
                                </div>
                                {!hasRevisionDate && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const nextRev = addDaysToIsoDate(
                                                formData.start_date,
                                                15
                                            );
                                            setFormData((prev) => ({
                                                ...prev,
                                                revision_date: nextRev,
                                                next_review_date: nextRev,
                                            }));
                                        }}
                                        className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-[11px] shrink-0 cursor-pointer"
                                    >
                                        + Set +15 Days
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Print Style Selector */}
                    <div className="lg:col-span-5 space-y-2.5">
                        <div>
                            <h3 className="text-xs sm:text-sm font-bold text-heading">
                                Choose PDF Print Style
                            </h3>
                            <p className="text-[11px] text-gray-500">
                                Switch anytime — updates the PDF immediately
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData((prev) => ({ ...prev, pdf_theme: 'clinical' }));
                                    onRefreshPreview();
                                }}
                                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-2.5 ${formData.pdf_theme !== 'senior'
                                    ? 'bg-emerald-50/80 border-primary ring-1 ring-primary/20'
                                    : 'bg-gray-50/60 border-gray-200 hover:bg-white'
                                    }`}
                            >
                                <FileText
                                    size={16}
                                    className={
                                        formData.pdf_theme !== 'senior'
                                            ? 'text-primary mt-0.5 shrink-0'
                                            : 'text-gray-400 mt-0.5 shrink-0'
                                    }
                                />
                                <div>
                                    <p className="text-xs font-bold text-heading">
                                        Standard Clinical Print
                                    </p>
                                    <p className="text-[11px] text-gray-500">
                                        Crisp, compact 2–3 page layout for most clients
                                    </p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setFormData((prev) => ({ ...prev, pdf_theme: 'senior' }));
                                    onRefreshPreview();
                                }}
                                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-2.5 ${formData.pdf_theme === 'senior'
                                    ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-300'
                                    : 'bg-gray-50/60 border-gray-200 hover:bg-white'
                                    }`}
                            >
                                <FileText
                                    size={16}
                                    className={
                                        formData.pdf_theme === 'senior'
                                            ? 'text-amber-700 mt-0.5 shrink-0'
                                            : 'text-gray-400 mt-0.5 shrink-0'
                                    }
                                />
                                <div>
                                    <p className="text-xs font-bold text-heading">
                                        Large Easy-Read Print (Seniors)
                                    </p>
                                    <p className="text-[11px] text-gray-500">
                                        Larger font size &amp; generous spacing for elders
                                    </p>
                                </div>
                            </button>
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
                                {loadedPlanRecord
                                    ? `Update Rev ${loadedPlanRecord.revision_number} & Download PDF`
                                    : 'Save Plan & Download PDF'}
                            </span>
                        </button>

                        {/* When editing an existing revision, explicit 1-tap Save as New Revision */}
                        {loadedPlanRecord && (
                            <button
                                type="button"
                                disabled={savingToClientDb || generating}
                                onClick={() => onSaveAndDownloadPdf('create')}
                                className="min-h-11 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-primary border border-emerald-200 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                            >
                                <Plus size={14} />
                                <span>Save as New Revision &amp; Download</span>
                            </button>
                        )}

                        {/* Save Only */}
                        <button
                            type="button"
                            disabled={savingToClientDb}
                            onClick={() => onSavePlanToDb('auto')}
                            className="min-h-11 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-heading border border-gray-200 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                        >
                            <Save size={14} className="text-primary" />
                            <span>
                                {loadedPlanRecord
                                    ? `Save Rev ${loadedPlanRecord.revision_number} Only`
                                    : 'Save to Client Only'}
                            </span>
                        </button>

                        {/* WhatsApp Summary */}
                        <button
                            type="button"
                            onClick={onOpenWhatsApp}
                            className="min-h-11 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-semibold text-xs transition cursor-pointer"
                        >
                            <Send size={14} className="text-emerald-700" />
                            <span>Send WhatsApp Message</span>
                        </button>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 text-[11px]">
                        {loadedPlanRecord && (
                            <button
                                type="button"
                                onClick={onDetachLoadedRevision}
                                className="text-gray-500 hover:text-heading underline cursor-pointer"
                            >
                                Detach from Rev {loadedPlanRecord.revision_number}
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

            {/* ── CARD 2: LIVE PDF PREVIEW ── */}
            <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-200/80 shadow-xs flex flex-col">
                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Eye size={15} className="text-primary shrink-0" />
                        <h3 className="font-heading font-bold text-heading text-xs sm:text-sm">
                            Live PDF Document Preview
                        </h3>
                        <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${formData.pdf_theme === 'senior'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                                }`}
                        >
                            {formData.pdf_theme === 'senior'
                                ? 'Large Easy-Read Print'
                                : 'Standard Print'}
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
                    <span>On mobile, tap Save &amp; Download to view full PDF pages.</span>
                    <button
                        type="button"
                        onClick={onDownloadPdfOnly}
                        disabled={generating}
                        className="font-bold text-primary underline shrink-0 cursor-pointer"
                    >
                        {generating ? 'Generating…' : 'Open PDF'}
                    </button>
                </div>

                <div className="w-full h-[520px] sm:h-[720px] rounded-xl overflow-hidden border border-gray-200">
                    <PDFViewerComponent
                        key={previewKey}
                        width="100%"
                        height="100%"
                        showToolbar={true}
                    >
                        <DietPlanPdfDocumentComponent plan={formData} />
                    </PDFViewerComponent>
                </div>
            </div>
        </div>
    );
}
