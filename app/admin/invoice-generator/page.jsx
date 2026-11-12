'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Swal from 'sweetalert2';
import {
    Receipt,
    Download,
    Plus,
    Trash2,
    User,
    Target,
    CheckCircle,
    Clock,
    PieChart,
    QrCode,
    Upload,
    X,
    RefreshCw,
    RotateCcw,
    ArrowLeft,
    Eye,
    FileText,
    Sliders,
    BookmarkCheck,
    CreditCard,
    Sparkles,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import InvoicePdfDocument, { parseAmountNumber } from '@/components/admin/pdf/InvoicePdfDocument';

// Dynamic import for React-PDF Viewer to prevent SSR issues
const PDFViewer = dynamic(() => import('@react-pdf/renderer').then((mod) => mod.PDFViewer), {
    ssr: false,
    loading: () => (
        <div className="h-[640px] w-full flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-gray-200">
            <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-sm font-medium text-para">Rendering Live Invoice PDF...</p>
        </div>
    ),
});

const PAYMENT_STORAGE_KEY = 'tdc_invoice_payment_defaults_v1';

const GOAL_SUGGESTIONS = [
    'Weight Loss Regimen',
    'Body Transformation Regimen',
    'PCOS Management Diet',
    'Weight Gain Diet',
    'Therapeutic Diet Regimen',
    'Gestational Diet Regimen',
    'Postnatal Diet Regimen',
    '1-on-1 Clinical Nutrition Consultation',
];

const createRow = (description = '', amount = '') => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    description,
    amount,
});

const generateInvoiceMeta = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const suffix = String(Math.floor(100 + Math.random() * 900));
    const formattedDate = now.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
    return {
        invoice_number: `TDC-${yyyy}${mm}${dd}-${suffix}`,
        invoice_date: formattedDate,
    };
};

/**
 * Normalizes any browser-readable image file (PNG, JPG, WEBP, etc.)
 * into a clean PNG Data URL with a white background so @react-pdf/renderer
 * renders QR codes reliably without format errors or transparent-black artifacts.
 */
const convertImageFileToPngDataUrl = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read image file.'));
        reader.onload = () => {
            const img = new window.Image();
            img.onerror = () => reject(new Error('Unsupported or corrupted image file.'));
            img.onload = () => {
                const maxDim = 600;
                let width = img.naturalWidth || img.width || 300;
                let height = img.naturalHeight || img.height || 300;
                if (width > maxDim || height > maxDim) {
                    const scale = Math.min(maxDim / width, maxDim / height);
                    width = Math.round(width * scale);
                    height = Math.round(height * scale);
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });

export default function AdminInvoiceGeneratorPage() {
    const supabase = createClient();
    const qrInputRef = useRef(null);

    const [formData, setFormData] = useState({
        client_name: '',
        goal: '',
        status: 'unpaid', // 'unpaid' | 'partly_paid' | 'paid'
        amount_paid: '',
        upi_id: '',
        qr_image: '',
        qr_filename: '',
        items: [{ id: 'initial-row-1', description: '', amount: '' }],
        invoice_number: 'TDC-INV-001',
        invoice_date: '',
    });

    const [debouncedInvoice, setDebouncedInvoice] = useState(formData);
    const [activeView, setActiveView] = useState('editor'); // 'editor' | 'preview' | 'split'
    const [generating, setGenerating] = useState(false);
    const [isDraggingQr, setIsDraggingQr] = useState(false);
    const [hasSavedDefaults, setHasSavedDefaults] = useState(false);
    const [clientSuggestions, setClientSuggestions] = useState([]);
    const [previewKey, setPreviewKey] = useState(1);

    // Initialize client-side meta (invoice ref, date, responsive split view, saved UPI/QR defaults, client autocomplete)
    useEffect(() => {
        const meta = generateInvoiceMeta();
        let savedPayment = null;

        try {
            const raw = window.localStorage.getItem(PAYMENT_STORAGE_KEY);
            if (raw) {
                savedPayment = JSON.parse(raw);
                if (savedPayment?.upi_id || savedPayment?.qr_image) {
                    setHasSavedDefaults(true);
                }
            }
        } catch {
            // Ignore localStorage access errors
        }

        setFormData((prev) => ({
            ...prev,
            ...meta,
            upi_id: savedPayment?.upi_id || prev.upi_id,
            qr_image: savedPayment?.qr_image || prev.qr_image,
            qr_filename: savedPayment?.qr_filename || prev.qr_filename,
        }));

        if (window.innerWidth >= 1024) {
            setActiveView('split');
        }

        // Load client names silently for convenient autocomplete
        (async () => {
            try {
                const { data } = await supabase
                    .from('clients')
                    .select('full_name')
                    .order('created_at', { ascending: false })
                    .limit(100);
                if (Array.isArray(data)) {
                    const names = Array.from(
                        new Set(data.map((c) => c?.full_name?.trim()).filter(Boolean))
                    );
                    setClientSuggestions(names);
                }
            } catch {
                // Fail silently if table is empty or unavailable
            }
        })();
    }, [supabase]);

    // Debounce live PDF preview updates so typing stays fast and responsive
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedInvoice(formData);
        }, 350);
        return () => clearTimeout(timer);
    }, [formData]);

    const isPaid = formData.status === 'paid';
    const isPartlyPaid = formData.status === 'partly_paid';

    // Live total, paid, and balance calculations
    const totalAmount = useMemo(() => {
        return (formData.items || []).reduce(
            (sum, row) => sum + parseAmountNumber(row.amount),
            0
        );
    }, [formData.items]);

    const enteredPaidAmount = useMemo(() => {
        return Math.max(0, parseAmountNumber(formData.amount_paid));
    }, [formData.amount_paid]);

    const effectivePaidAmount = useMemo(() => {
        if (isPaid) return totalAmount;
        if (isPartlyPaid) return Math.min(enteredPaidAmount, totalAmount);
        return 0;
    }, [isPaid, isPartlyPaid, enteredPaidAmount, totalAmount]);

    const balanceAmount = useMemo(() => {
        if (isPaid) return 0;
        if (isPartlyPaid) return Math.max(0, totalAmount - effectivePaidAmount);
        return totalAmount;
    }, [isPaid, isPartlyPaid, totalAmount, effectivePaidAmount]);

    const formatInr = (val) =>
        val.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const formattedTotal = useMemo(() => formatInr(totalAmount), [totalAmount]);
    const formattedBalance = useMemo(() => formatInr(balanceAmount), [balanceAmount]);

    // ─── Line Item Table Handlers ───
    const handleAddRow = () => {
        setFormData((prev) => ({
            ...prev,
            items: [...prev.items, createRow('', '')],
        }));
    };

    const handleRemoveRow = (id) => {
        setFormData((prev) => ({
            ...prev,
            items: prev.items.filter((row) => row.id !== id),
        }));
    };

    const handleItemChange = (id, field, value) => {
        setFormData((prev) => ({
            ...prev,
            items: prev.items.map((row) =>
                row.id === id ? { ...row, [field]: value } : row
            ),
        }));
    };

    // ─── QR Image Upload Handlers ───
    const processQrFile = async (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            Swal.fire({
                icon: 'warning',
                title: 'Invalid File Type',
                text: 'Please upload a valid QR image file (PNG, JPG, or WEBP).',
                confirmButtonColor: '#2d6a4f',
            });
            return;
        }
        if (file.size > 8 * 1024 * 1024) {
            Swal.fire({
                icon: 'warning',
                title: 'Image Too Large',
                text: 'Please upload a QR image smaller than 8 MB.',
                confirmButtonColor: '#2d6a4f',
            });
            return;
        }

        try {
            const pngDataUrl = await convertImageFileToPngDataUrl(file);
            setFormData((prev) => ({
                ...prev,
                qr_image: pngDataUrl,
                qr_filename: file.name,
            }));
            setPreviewKey((k) => k + 1);
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Upload Failed',
                text: err.message || 'Could not process QR image.',
                confirmButtonColor: '#2d6a4f',
            });
        }
    };

    const handleQrInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) processQrFile(file);
        e.target.value = '';
    };

    const handleRemoveQr = () => {
        setFormData((prev) => ({
            ...prev,
            qr_image: '',
            qr_filename: '',
        }));
        setPreviewKey((k) => k + 1);
    };

    // ─── Save / Clear Payment Defaults in Browser ───
    const handleSavePaymentDefaults = () => {
        try {
            window.localStorage.setItem(
                PAYMENT_STORAGE_KEY,
                JSON.stringify({
                    upi_id: formData.upi_id,
                    qr_image: formData.qr_image,
                    qr_filename: formData.qr_filename,
                })
            );
            setHasSavedDefaults(Boolean(formData.upi_id || formData.qr_image));
            Swal.fire({
                icon: 'success',
                title: 'Payment Details Saved',
                text: 'Your UPI ID and QR image will auto-fill next time you open Invoice Generator.',
                confirmButtonColor: '#2d6a4f',
                timer: 2000,
                showConfirmButton: false,
            });
        } catch {
            Swal.fire({
                icon: 'error',
                title: 'Could Not Save Defaults',
                text: 'Browser storage quota exceeded. Try a smaller QR image.',
                confirmButtonColor: '#2d6a4f',
            });
        }
    };

    const handleClearPaymentDefaults = () => {
        try {
            window.localStorage.removeItem(PAYMENT_STORAGE_KEY);
            setHasSavedDefaults(false);
            Swal.fire({
                icon: 'info',
                title: 'Saved Defaults Cleared',
                timer: 1400,
                showConfirmButton: false,
            });
        } catch {
            // Ignore
        }
    };

    // ─── Reset Form ───
    const handleResetForm = () => {
        Swal.fire({
            title: 'Reset Invoice Form?',
            text: 'This will clear client details and line items for a fresh invoice.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, reset',
        }).then((res) => {
            if (res.isConfirmed) {
                const freshMeta = generateInvoiceMeta();
                setFormData((prev) => ({
                    ...prev,
                    ...freshMeta,
                    client_name: '',
                    goal: '',
                    status: 'unpaid',
                    amount_paid: '',
                    items: [createRow('', '')],
                    ...(hasSavedDefaults
                        ? {}
                        : { upi_id: '', qr_image: '', qr_filename: '' }),
                }));
                setPreviewKey((k) => k + 1);
            }
        });
    };

    // ─── Download PDF ───
    const handleDownloadPdf = async () => {
        if (!formData.client_name.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Client Name',
                text: 'Please enter the client name before downloading the invoice.',
                confirmButtonColor: '#2d6a4f',
            });
            return;
        }

        const nonEmptyItems = formData.items.filter(
            (r) => r.description.trim() !== '' || String(r.amount).trim() !== ''
        );
        if (nonEmptyItems.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Line Items Added',
                text: 'Please add at least one description and amount in the invoice table.',
                confirmButtonColor: '#2d6a4f',
            });
            return;
        }

        if (isPartlyPaid && enteredPaidAmount <= 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Paid Amount',
                text: 'Please enter the amount already paid for a Partly Paid invoice.',
                confirmButtonColor: '#2d6a4f',
            });
            return;
        }

        setGenerating(true);
        try {
            const { pdf } = await import('@react-pdf/renderer');
            const blob = await pdf(<InvoicePdfDocument invoice={formData} />).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const safeClient = formData.client_name
                .trim()
                .replace(/[^a-zA-Z0-9_-]/g, '_');
            a.download = `${safeClient}_Invoice_TDC.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            Swal.fire({
                icon: 'success',
                title: 'Invoice Downloaded!',
                text: 'Your branded PDF invoice has been saved.',
                confirmButtonColor: '#2d6a4f',
                timer: 2200,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error('Error generating invoice PDF:', error);
            Swal.fire({
                icon: 'error',
                title: 'PDF Generation Failed',
                text: error.message || 'Unable to generate PDF.',
                confirmButtonColor: '#2d6a4f',
            });
        } finally {
            setGenerating(false);
        }
    };

    const statusBadgeUi = isPaid
        ? {
              pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              dot: 'bg-emerald-600',
              previewPill: 'bg-emerald-100 text-emerald-800',
              label: 'Paid',
          }
        : isPartlyPaid
            ? {
                  pill: 'bg-amber-50 text-amber-800 border-amber-300',
                  dot: 'bg-amber-500',
                  previewPill: 'bg-amber-100 text-amber-800',
                  label: 'Partly Paid',
              }
            : {
                  pill: 'bg-red-50 text-red-600 border-red-200',
                  dot: 'bg-red-500',
                  previewPill: 'bg-red-100 text-red-700',
                  label: 'Unpaid',
              };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans text-heading">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

                {/* ── Page Header ── */}
                <div className="flex items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-heading flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Receipt size={22} className="text-primary" />
                            </div>
                            Invoice Generator
                        </h1>
                        <p className="text-gray-400 text-sm mt-1 ml-1">
                            Create branded client invoices with static clinic header, footer &amp; downloadable PDF
                        </p>
                    </div>
                    <Link
                        href="/admin"
                        className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-200 text-heading font-bold rounded-xl hover:bg-gray-100 transition shadow-xs text-xs sm:text-sm shrink-0"
                    >
                        <ArrowLeft size={16} />
                        <span className="hidden sm:inline">Back to Dashboard</span>
                        <span className="sm:hidden">Dashboard</span>
                    </Link>
                </div>

                {/* ── Top Action Toolbar ── */}
                <div className="bg-white rounded-2xl p-2.5 sm:p-3 mb-5 border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    {/* Mode Switcher */}
                    <div className="bg-gray-100 p-1 rounded-xl flex items-center w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => setActiveView('editor')}
                            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                activeView === 'editor'
                                    ? 'bg-white text-heading shadow-xs font-bold'
                                    : 'text-gray-500 hover:text-heading'
                            }`}
                        >
                            <FileText size={13} />
                            <span>Edit Form</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setDebouncedInvoice(formData);
                                setActiveView('preview');
                                setPreviewKey((k) => k + 1);
                            }}
                            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                activeView === 'preview'
                                    ? 'bg-white text-heading shadow-xs font-bold'
                                    : 'text-gray-500 hover:text-heading'
                            }`}
                        >
                            <Eye size={13} className="text-primary" />
                            <span>Preview PDF</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setDebouncedInvoice(formData);
                                setActiveView('split');
                                setPreviewKey((k) => k + 1);
                            }}
                            className={`hidden lg:flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                activeView === 'split'
                                    ? 'bg-white text-heading shadow-xs font-bold'
                                    : 'text-gray-500 hover:text-heading'
                            }`}
                        >
                            <Sliders size={13} />
                            <span>Split View</span>
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleResetForm}
                            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-600 hover:text-red-600 font-semibold text-xs rounded-xl shadow-2xs transition active:scale-95 cursor-pointer shrink-0"
                            title="Reset invoice form"
                        >
                            <RotateCcw size={13} />
                            <span>Reset</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleDownloadPdf}
                            disabled={generating}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-xl shadow-xs shadow-primary/20 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            {generating ? (
                                <RefreshCw size={13} className="animate-spin text-white shrink-0" />
                            ) : (
                                <Download size={13} className="text-white shrink-0" />
                            )}
                            <span>{generating ? 'Generating...' : 'Download PDF'}</span>
                        </button>
                    </div>
                </div>

                {/* ── Static Brand Info Strip ── */}
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl px-4 py-3 mb-6 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 text-emerald-900">
                        <Sparkles size={15} className="text-primary shrink-0" />
                        <span>
                            <strong>Static Clinic Branding Applied:</strong> The Diet Cascade Logo, Header, Footer &amp; Brand Palette (<span className="inline-block w-2.5 h-2.5 rounded-full bg-primary align-middle mx-0.5" /> Forest Emerald &amp; <span className="inline-block w-2.5 h-2.5 rounded-full bg-accent align-middle mx-0.5" /> Gold)
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                        <span>Ref: {formData.invoice_number}</span>
                        <span>•</span>
                        <span>{formData.invoice_date || 'Today'}</span>
                        <button
                            type="button"
                            onClick={() =>
                                setFormData((prev) => ({
                                    ...prev,
                                    ...generateInvoiceMeta(),
                                }))
                            }
                            className="p-1 rounded-lg hover:bg-emerald-100 text-primary transition cursor-pointer"
                            title="Generate new invoice reference number"
                        >
                            <RefreshCw size={12} />
                        </button>
                    </div>
                </div>

                {/* ── Main Content Grid (Editor / Split / Preview) ── */}
                <div
                    className={`grid gap-6 items-start ${
                        activeView === 'split' ? 'lg:grid-cols-12' : 'grid-cols-1'
                    }`}
                >
                    {/* ═══════════════ LEFT: INVOICE FORM ═══════════════ */}
                    {(activeView === 'editor' || activeView === 'split') && (
                        <div
                            className={`space-y-5 ${
                                activeView === 'split' ? 'lg:col-span-6' : 'max-w-3xl mx-auto w-full'
                            }`}
                        >
                            {/* ── CARD 1: Client Name, Goal & Status ── */}
                            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                            <User size={16} />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-sm text-heading">
                                                Client &amp; Invoice Status
                                            </h2>
                                            <p className="text-[11px] text-gray-400">
                                                Recipient details and payment status badge
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border ${statusBadgeUi.pill}`}
                                    >
                                        <span
                                            className={`w-1.5 h-1.5 rounded-full ${statusBadgeUi.dot}`}
                                        />
                                        {statusBadgeUi.label}
                                    </span>
                                </div>

                                <div className="p-5 space-y-4">
                                    {/* Client Name */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                            Client Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <User
                                                size={15}
                                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                            />
                                            <input
                                                type="text"
                                                list="invoice-client-suggestions"
                                                value={formData.client_name}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        client_name: e.target.value,
                                                    }))
                                                }
                                                placeholder="e.g., Ananya Sharma"
                                                className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 bg-surface/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                                                required
                                            />
                                            <datalist id="invoice-client-suggestions">
                                                {clientSuggestions.map((name) => (
                                                    <option key={name} value={name} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>

                                    {/* Goal */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                            Goal
                                        </label>
                                        <div className="relative">
                                            <Target
                                                size={15}
                                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                            />
                                            <input
                                                type="text"
                                                list="invoice-goal-suggestions"
                                                value={formData.goal}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        goal: e.target.value,
                                                    }))
                                                }
                                                placeholder="e.g., Weight Loss & Metabolic Reset"
                                                className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 bg-surface/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                                            />
                                            <datalist id="invoice-goal-suggestions">
                                                {GOAL_SUGGESTIONS.map((item) => (
                                                    <option key={item} value={item} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>

                                    {/* Status: Unpaid / Partly Paid / Paid */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                            Status
                                        </label>
                                        <div className="grid grid-cols-3 gap-2.5">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        status: 'unpaid',
                                                    }))
                                                }
                                                className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                                                    formData.status === 'unpaid'
                                                        ? 'bg-red-50 border-red-400 text-red-700 ring-2 ring-red-200/70 shadow-2xs'
                                                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                                }`}
                                            >
                                                <Clock size={14} className="shrink-0" />
                                                <span>Unpaid</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        status: 'partly_paid',
                                                    }))
                                                }
                                                className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                                                    isPartlyPaid
                                                        ? 'bg-amber-50 border-amber-400 text-amber-800 ring-2 ring-amber-200/70 shadow-2xs'
                                                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                                }`}
                                            >
                                                <PieChart size={14} className="shrink-0" />
                                                <span>Partly Paid</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        status: 'paid',
                                                    }))
                                                }
                                                className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                                                    isPaid
                                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-200/70 shadow-2xs'
                                                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                                }`}
                                            >
                                                <CheckCircle size={14} className="shrink-0" />
                                                <span>Paid</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── CARD 2: 2-Column Table (Description & Amount + Balance Row) ── */}
                            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                            <Receipt size={16} />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-sm text-heading">
                                                Invoice Line Items
                                            </h2>
                                            <p className="text-[11px] text-gray-400">
                                                Add or remove description &amp; amount rows
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5">
                                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                                        {/* Table Header */}
                                        <div className="grid grid-cols-12 bg-primary text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-2.5">
                                            <div className="col-span-7 sm:col-span-8">Description</div>
                                            <div className="col-span-4 sm:col-span-3 text-right pr-1">
                                                Amount (₹)
                                            </div>
                                            <div className="col-span-1 text-right">
                                                <span className="sr-only">Action</span>
                                            </div>
                                        </div>

                                        {/* Table Body */}
                                        {formData.items.length > 0 ? (
                                            <div className="divide-y divide-gray-100 bg-white">
                                                {formData.items.map((row, index) => (
                                                    <div
                                                        key={row.id}
                                                        className="grid grid-cols-12 gap-2 items-center px-3 py-2.5 hover:bg-gray-50/60 transition"
                                                    >
                                                        {/* Column 1: Description */}
                                                        <div className="col-span-7 sm:col-span-8">
                                                            <input
                                                                type="text"
                                                                value={row.description}
                                                                onChange={(e) =>
                                                                    handleItemChange(
                                                                        row.id,
                                                                        'description',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                placeholder={`Item ${
                                                                    index + 1
                                                                } (e.g., 3 Month Diet Program)`}
                                                                className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                            />
                                                        </div>

                                                        {/* Column 2: Amount */}
                                                        <div className="col-span-4 sm:col-span-3">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={row.amount}
                                                                onChange={(e) =>
                                                                    handleItemChange(
                                                                        row.id,
                                                                        'amount',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                placeholder="0.00"
                                                                className="w-full text-xs sm:text-sm px-2.5 py-2 rounded-lg border border-gray-200 bg-white text-right font-semibold text-heading focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                            />
                                                        </div>

                                                        {/* Remove Row Action */}
                                                        <div className="col-span-1 flex justify-end">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveRow(row.id)}
                                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                                                title="Remove row"
                                                                aria-label={`Remove row ${index + 1}`}
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-8 px-4 text-center bg-gray-50/50">
                                                <p className="text-xs text-gray-400 italic mb-2.5">
                                                    No rows in table. Click &ldquo;Add Row&rdquo; to add an invoice item.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={handleAddRow}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-primary text-primary text-xs font-bold rounded-lg transition cursor-pointer"
                                                >
                                                    <Plus size={13} />
                                                    <span>Add First Row</span>
                                                </button>
                                            </div>
                                        )}

                                        {/* Table Row: Total Amount */}
                                        <div
                                            className={`border-t px-4 py-3 flex items-center justify-between ${
                                                isPartlyPaid
                                                    ? 'bg-gray-50 border-gray-200 py-2.5'
                                                    : 'bg-emerald-50/80 border-emerald-200'
                                            }`}
                                        >
                                            <span
                                                className={`text-xs font-bold uppercase tracking-wider ${
                                                    isPartlyPaid ? 'text-gray-600' : 'text-emerald-900'
                                                }`}
                                            >
                                                Total Amount
                                            </span>
                                            <span
                                                className={`font-bold ${
                                                    isPartlyPaid
                                                        ? 'text-sm sm:text-base text-heading'
                                                        : 'text-base sm:text-lg text-primary'
                                                }`}
                                            >
                                                ₹{formattedTotal}
                                            </span>
                                        </div>

                                        {/* Table Rows: Amount Paid & Balance Amount (ONLY when Partly Paid) */}
                                        {isPartlyPaid && (
                                            <>
                                                <div className="bg-white border-t border-gray-100 px-4 py-2.5 flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                                                            Amount Paid
                                                        </span>
                                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Received
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-bold text-emerald-700">- ₹</span>
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
                                                            placeholder="0.00"
                                                            className="w-28 sm:w-32 text-xs sm:text-sm px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50/40 text-right font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="border-t bg-amber-50/80 border-amber-200 px-4 py-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                                                            Balance Amount
                                                        </span>
                                                        <span
                                                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${statusBadgeUi.pill}`}
                                                        >
                                                            Remaining Due
                                                        </span>
                                                    </div>
                                                    <span className="text-base sm:text-lg font-bold text-amber-800">
                                                        ₹{formattedBalance}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleAddRow}
                                        className="mt-3 w-full py-2 rounded-xl border border-dashed border-gray-300 hover:border-primary hover:bg-emerald-50/40 text-xs font-semibold text-gray-500 hover:text-primary flex items-center justify-center gap-1.5 transition cursor-pointer"
                                    >
                                        <Plus size={14} />
                                        <span>Add Another Item Row</span>
                                    </button>
                                </div>
                            </div>

                            {/* ── CARD 3: UPI ID & QR Image ── */}
                            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                            <QrCode size={16} />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-sm text-heading">
                                                UPI Payment &amp; QR Code
                                            </h2>
                                            <p className="text-[11px] text-gray-400">
                                                Displayed in the payment section of the PDF invoice
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={handleSavePaymentDefaults}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
                                            title="Remember UPI ID & QR image for future invoices"
                                        >
                                            <BookmarkCheck size={12} />
                                            <span>Save as Default</span>
                                        </button>
                                        {hasSavedDefaults && (
                                            <button
                                                type="button"
                                                onClick={handleClearPaymentDefaults}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                                title="Clear saved default UPI & QR"
                                            >
                                                <X size={13} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="p-5 space-y-4">
                                    {/* UPI ID */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                            UPI ID
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
                                                className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 bg-surface/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                                            />
                                        </div>
                                    </div>

                                    {/* QR Image Upload */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                            QR Image
                                        </label>
                                        <input
                                            ref={qrInputRef}
                                            type="file"
                                            accept="image/png,image/jpeg,image/jpg,image/webp"
                                            onChange={handleQrInputChange}
                                            className="hidden"
                                        />

                                        {formData.qr_image ? (
                                            <div className="flex items-center gap-4 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
                                                <div className="w-20 h-20 rounded-xl bg-white border border-gray-200 p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={formData.qr_image}
                                                        alt="UPI QR Preview"
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-heading truncate">
                                                        {formData.qr_filename || 'UPI QR Code Uploaded'}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                                        Ready to embed in invoice PDF
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => qrInputRef.current?.click()}
                                                            className="px-3 py-1.5 bg-white border border-gray-200 hover:border-primary text-xs font-semibold text-heading rounded-lg transition cursor-pointer"
                                                        >
                                                            Replace QR
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleRemoveQr}
                                                            className="px-3 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-xs font-semibold text-red-600 rounded-lg transition cursor-pointer"
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
                                                    if (file) processQrFile(file);
                                                }}
                                                className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${
                                                    isDraggingQr
                                                        ? 'border-primary bg-emerald-50/70'
                                                        : 'border-gray-200 hover:border-primary/60 hover:bg-gray-50/80'
                                                }`}
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                                                    <Upload size={18} />
                                                </div>
                                                <p className="text-xs font-bold text-heading">
                                                    Click to upload QR image or drag &amp; drop
                                                </p>
                                                <p className="text-[11px] text-gray-400 mt-1">
                                                    Supports PNG, JPG, JPEG, WEBP
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ── Bottom Download Button ── */}
                            <button
                                type="button"
                                onClick={handleDownloadPdf}
                                disabled={generating}
                                className="w-full py-3.5 px-6 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-2xl shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                            >
                                {generating ? (
                                    <RefreshCw size={17} className="animate-spin" />
                                ) : (
                                    <Download size={17} />
                                )}
                                <span>
                                    {generating
                                        ? 'Generating Invoice PDF...'
                                        : 'Download Invoice PDF'}
                                </span>
                            </button>
                        </div>
                    )}

                    {/* ═══════════════ RIGHT: LIVE PDF PREVIEW ═══════════════ */}
                    {(activeView === 'preview' || activeView === 'split') && (
                        <div
                            className={`bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/80 shadow-xs flex flex-col lg:sticky lg:top-6 ${
                                activeView === 'split' ? 'lg:col-span-6' : 'w-full'
                            }`}
                        >
                            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Eye size={16} className="text-primary" />
                                    <h3 className="font-heading font-bold text-heading text-xs sm:text-sm">
                                        Live Invoice PDF Preview
                                    </h3>
                                    <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusBadgeUi.previewPill}`}
                                    >
                                        {statusBadgeUi.label}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDebouncedInvoice(formData);
                                        setPreviewKey((k) => k + 1);
                                    }}
                                    className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer"
                                    title="Refresh PDF preview"
                                >
                                    <RefreshCw size={13} />
                                    <span>Refresh</span>
                                </button>
                            </div>

                            <div className="w-full h-[600px] sm:h-[700px] rounded-xl overflow-hidden border border-gray-200">
                                <PDFViewer
                                    key={previewKey}
                                    width="100%"
                                    height="100%"
                                    showToolbar={true}
                                >
                                    <InvoicePdfDocument invoice={debouncedInvoice} />
                                </PDFViewer>
                            </div>

                            <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-400">
                                <span>The Diet Cascade • Official Invoice Template</span>
                                <span className="font-semibold text-heading">
                                    Total: ₹{formattedTotal}
                                    {isPartlyPaid ? ` • Balance: ₹${formattedBalance}` : ''}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
