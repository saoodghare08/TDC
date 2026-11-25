'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import {
    Receipt,
    Download,
    Plus,
    Trash2,
    User,
    Users,
    Target,
    CheckCircle,
    AlertCircle,
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
    Save,
    ChevronDown,
    ChevronUp,
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
const INVOICE_DRAFT_STORAGE_KEY = 'tdc_invoice_form_draft_v1';
const AUTO_SAVE_DELAY_MS = 2000;

const EMPTY_INVOICE_STATE = {
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
};

const hasInvoiceDraftContent = (data, savedPayment) => {
    if (!data || typeof data !== 'object') return false;
    if (String(data.client_name || '').trim() !== '') return true;
    if (String(data.goal || '').trim() !== '') return true;
    if (data.status && data.status !== 'unpaid') return true;
    if (String(data.amount_paid || '').trim() !== '') return true;
    if (
        Array.isArray(data.items) &&
        data.items.some(
            (row) =>
                String(row?.description || '').trim() !== '' ||
                String(row?.amount || '').trim() !== ''
        )
    ) {
        return true;
    }
    const draftUpi = String(data.upi_id || '').trim();
    const defaultUpi = String(savedPayment?.upi_id || '').trim();
    if (draftUpi && draftUpi !== defaultUpi) return true;
    if (data.qr_image && data.qr_image !== (savedPayment?.qr_image || '')) return true;
    return false;
};

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

function AdminInvoiceGeneratorContent() {
    const supabase = useMemo(() => createClient(), []);
    const searchParams = useSearchParams();
    const qrInputRef = useRef(null);

    const [formData, setFormData] = useState(EMPTY_INVOICE_STATE);

    const [debouncedInvoice, setDebouncedInvoice] = useState(EMPTY_INVOICE_STATE);
    const [activeView, setActiveView] = useState('editor'); // 'editor' | 'preview' | 'split'
    const [generating, setGenerating] = useState(false);
    const [isDraggingQr, setIsDraggingQr] = useState(false);
    const [hasSavedDefaults, setHasSavedDefaults] = useState(false);
    const [allClients, setAllClients] = useState([]);
    const [previewKey, setPreviewKey] = useState(1);

    // ─── Client 1-to-Many DB State ───
    const [selectedClient, setSelectedClient] = useState(null);
    const [loadedInvoiceRecord, setLoadedInvoiceRecord] = useState(null);
    const [savingToClientDb, setSavingToClientDb] = useState(false);
    const [showSaveMenu, setShowSaveMenu] = useState(false);
    const saveMenuRef = useRef(null);
    const mobileSaveMenuRef = useRef(null);
    const dbMetaRef = useRef({ selectedClient: null, loadedInvoiceRecord: null });

    useEffect(() => {
        dbMetaRef.current = { selectedClient, loadedInvoiceRecord };
    }, [selectedClient, loadedInvoiceRecord]);

    useEffect(() => {
        const handleOutside = (e) => {
            const inDesktopSave = saveMenuRef.current?.contains(e.target);
            const inMobileSave = mobileSaveMenuRef.current?.contains(e.target);
            if (!inDesktopSave && !inMobileSave) {
                setShowSaveMenu(false);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    // ─── Delayed LocalStorage Auto-Save & Restore ───
    const isDraftHydratedRef = useRef(false);
    const pendingHydratedDataRef = useRef(null);
    const lastSavedDataRef = useRef(EMPTY_INVOICE_STATE);
    const latestFormDataRef = useRef(EMPTY_INVOICE_STATE);
    const hasPendingSaveRef = useRef(false);
    const autoSaveTimerRef = useRef(null);

    const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'restored' | 'error'
    const [lastSavedAt, setLastSavedAt] = useState(null);

    const lastSavedTimeLabel = useMemo(() => {
        if (!lastSavedAt) return '';
        const parsedDate = new Date(lastSavedAt);
        if (Number.isNaN(parsedDate.getTime())) return '';
        return parsedDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    }, [lastSavedAt]);

    const persistInvoiceDraft = useCallback((dataToSave) => {
        const savedAt = new Date().toISOString();
        try {
            window.localStorage.setItem(
                INVOICE_DRAFT_STORAGE_KEY,
                JSON.stringify({
                    version: 1,
                    savedAt,
                    data: dataToSave,
                    dbMeta: dbMetaRef.current,
                })
            );
            lastSavedDataRef.current = dataToSave;
            hasPendingSaveRef.current = false;
            return { ok: true, savedAt };
        } catch {
            // Fallback without base64 QR image if browser storage quota is tight
            try {
                const lightCopy = { ...dataToSave, qr_image: '', qr_filename: '' };
                window.localStorage.setItem(
                    INVOICE_DRAFT_STORAGE_KEY,
                    JSON.stringify({
                        version: 1,
                        savedAt,
                        data: lightCopy,
                        dbMeta: dbMetaRef.current,
                    })
                );
                lastSavedDataRef.current = dataToSave;
                hasPendingSaveRef.current = false;
                return { ok: true, savedAt };
            } catch (err) {
                console.warn('Unable to auto-save invoice draft to localStorage:', err);
                return { ok: false, savedAt: null };
            }
        }
    }, []);

    // Load saved invoice draft (or defaults) on reopen / reload, and flush pending edits on unload
    useEffect(() => {
        const meta = generateInvoiceMeta();
        let savedPayment = null;

        try {
            const rawPayment = window.localStorage.getItem(PAYMENT_STORAGE_KEY);
            if (rawPayment) {
                savedPayment = JSON.parse(rawPayment);
                if (savedPayment?.upi_id || savedPayment?.qr_image) {
                    setHasSavedDefaults(true);
                }
            }
        } catch {
            // Ignore localStorage access errors
        }

        let restoredInvoice = null;
        let restoredTimestamp = null;
        const hasUrlTarget = Boolean(
            searchParams?.get('invoiceId') || searchParams?.get('clientId')
        );

        if (!hasUrlTarget) {
            try {
                const rawDraft = window.localStorage.getItem(INVOICE_DRAFT_STORAGE_KEY);
                if (rawDraft) {
                    const parsed = JSON.parse(rawDraft);
                    const draft =
                        parsed?.data && typeof parsed.data === 'object' ? parsed.data : parsed;
                    if (parsed?.dbMeta && typeof parsed.dbMeta === 'object') {
                        if (parsed.dbMeta.selectedClient) {
                            setSelectedClient(parsed.dbMeta.selectedClient);
                        }
                        if (parsed.dbMeta.loadedInvoiceRecord) {
                            setLoadedInvoiceRecord(parsed.dbMeta.loadedInvoiceRecord);
                        }
                    }
                    if (
                        draft &&
                        typeof draft === 'object' &&
                        hasInvoiceDraftContent(draft, savedPayment)
                    ) {
                        restoredInvoice = {
                            ...EMPTY_INVOICE_STATE,
                            ...draft,
                            status: ['unpaid', 'partly_paid', 'paid'].includes(draft.status)
                                ? draft.status
                                : 'unpaid',
                            upi_id: draft.upi_id || savedPayment?.upi_id || '',
                            qr_image: draft.qr_image || savedPayment?.qr_image || '',
                            qr_filename: draft.qr_filename || savedPayment?.qr_filename || '',
                            items: Array.isArray(draft.items)
                                ? draft.items
                                : [{ id: 'initial-row-1', description: '', amount: '' }],
                            invoice_number: draft.invoice_number || meta.invoice_number,
                            invoice_date: draft.invoice_date || meta.invoice_date,
                        };
                        restoredTimestamp = parsed?.savedAt || null;
                    }
                }
            } catch (err) {
                console.warn('Failed to restore invoice draft from localStorage:', err);
            }
        }

        const initialData = restoredInvoice || {
            ...EMPTY_INVOICE_STATE,
            ...meta,
            upi_id: savedPayment?.upi_id || '',
            qr_image: savedPayment?.qr_image || '',
            qr_filename: savedPayment?.qr_filename || '',
        };

        lastSavedDataRef.current = initialData;
        latestFormDataRef.current = initialData;
        pendingHydratedDataRef.current = initialData;
        isDraftHydratedRef.current = true;

        setFormData(initialData);
        setDebouncedInvoice(initialData);
        if (restoredInvoice) {
            setPreviewKey((k) => k + 1);
            if (restoredTimestamp) {
                setLastSavedAt(restoredTimestamp);
            }
            setSaveStatus('restored');
        }

        if (window.innerWidth >= 1024) {
            setActiveView('split');
        }

        const flushPendingSave = () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
                autoSaveTimerRef.current = null;
            }
            if (hasPendingSaveRef.current) {
                persistInvoiceDraft(latestFormDataRef.current);
            }
        };

        window.addEventListener('beforeunload', flushPendingSave);
        window.addEventListener('pagehide', flushPendingSave);

        return () => {
            window.removeEventListener('beforeunload', flushPendingSave);
            window.removeEventListener('pagehide', flushPendingSave);
            flushPendingSave();
        };
    }, [persistInvoiceDraft, searchParams]);

    // Fetch clients for autocomplete
    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const { data } = await supabase
                    .from('clients')
                    .select('id, full_name, phone, initial_goals')
                    .order('updated_at', { ascending: false })
                    .limit(300);
                if (active && Array.isArray(data)) {
                    setAllClients(data);
                }
            } catch {
                // Fail silently
            }
        })();
        return () => {
            active = false;
        };
    }, [supabase]);

    // Save invoice details with a 2-second time delay between consecutive saves
    useEffect(() => {
        if (!isDraftHydratedRef.current) return;

        if (pendingHydratedDataRef.current !== null) {
            if (formData === pendingHydratedDataRef.current) {
                pendingHydratedDataRef.current = null;
            }
            return;
        }

        if (formData === lastSavedDataRef.current) return;

        latestFormDataRef.current = formData;
        hasPendingSaveRef.current = true;
        setSaveStatus('saving');

        if (!autoSaveTimerRef.current) {
            autoSaveTimerRef.current = setTimeout(() => {
                autoSaveTimerRef.current = null;
                const result = persistInvoiceDraft(latestFormDataRef.current);
                if (result.ok) {
                    setLastSavedAt(result.savedAt);
                    setSaveStatus('saved');
                } else {
                    setSaveStatus('error');
                }
            }, AUTO_SAVE_DELAY_MS);
        }
    }, [formData, persistInvoiceDraft]);

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
                if (autoSaveTimerRef.current) {
                    clearTimeout(autoSaveTimerRef.current);
                    autoSaveTimerRef.current = null;
                }
                hasPendingSaveRef.current = false;
                dbMetaRef.current = { selectedClient: null, loadedInvoiceRecord: null };

                let savedPayment = null;
                try {
                    window.localStorage.removeItem(INVOICE_DRAFT_STORAGE_KEY);
                    if (typeof window !== 'undefined') {
                        window.history.replaceState({}, '', '/admin/invoice-generator');
                    }
                    const rawPayment = window.localStorage.getItem(PAYMENT_STORAGE_KEY);
                    if (rawPayment) {
                        savedPayment = JSON.parse(rawPayment);
                    }
                } catch {
                    // Ignore storage errors
                }

                const freshMeta = generateInvoiceMeta();
                const freshInvoice = {
                    ...EMPTY_INVOICE_STATE,
                    ...freshMeta,
                    items: [createRow('', '')],
                    upi_id: savedPayment?.upi_id || '',
                    qr_image: savedPayment?.qr_image || '',
                    qr_filename: savedPayment?.qr_filename || '',
                };

                lastSavedDataRef.current = freshInvoice;
                latestFormDataRef.current = freshInvoice;
                pendingHydratedDataRef.current = freshInvoice;

                setSelectedClient(null);
                setLoadedInvoiceRecord(null);
                setShowSaveMenu(false);
                setFormData(freshInvoice);
                setDebouncedInvoice(freshInvoice);
                setLastSavedAt(null);
                setSaveStatus('idle');
                setPreviewKey((k) => k + 1);
            }
        });
    };

    // ─── Hydrate ?invoiceId or ?clientId from Client Details Page & Unified Save ───
    const applyInvoiceRecordToForm = useCallback((record, ownerClient) => {
        if (!record) return;
        const snap =
            record.invoice_data && typeof record.invoice_data === 'object'
                ? record.invoice_data
                : {};

        let savedPayment = null;
        try {
            const rawPayment = window.localStorage.getItem(PAYMENT_STORAGE_KEY);
            if (rawPayment) savedPayment = JSON.parse(rawPayment);
        } catch {
            // Ignore
        }

        const hydrated = {
            ...EMPTY_INVOICE_STATE,
            ...snap,
            invoice_number:
                snap.invoice_number ||
                record.invoice_number ||
                generateInvoiceMeta().invoice_number,
            invoice_date:
                snap.invoice_date ||
                record.invoice_date ||
                generateInvoiceMeta().invoice_date,
            client_name: snap.client_name || ownerClient?.full_name || '',
            goal: snap.goal ?? record.goal ?? '',
            status: ['unpaid', 'partly_paid', 'paid'].includes(snap.status || record.status)
                ? snap.status || record.status
                : 'unpaid',
            currency: snap.currency || record.currency || 'INR',
            amount_paid:
                snap.amount_paid !== undefined && snap.amount_paid !== ''
                    ? String(snap.amount_paid)
                    : record.paid_amount
                        ? String(record.paid_amount)
                        : '',
            upi_id: snap.upi_id || savedPayment?.upi_id || '',
            qr_image: snap.qr_image || savedPayment?.qr_image || '',
            qr_filename: snap.qr_filename || savedPayment?.qr_filename || '',
            items:
                Array.isArray(snap.items) && snap.items.length > 0
                    ? JSON.parse(JSON.stringify(snap.items))
                    : [createRow('', '')],
        };

        setFormData(hydrated);
        setDebouncedInvoice(hydrated);
        setPreviewKey((k) => k + 1);
    }, []);

    useEffect(() => {
        const urlInvoiceId = searchParams?.get('invoiceId');
        const urlClientId = searchParams?.get('clientId');
        if (!urlInvoiceId && !urlClientId) return;

        let active = true;
        (async () => {
            try {
                if (urlInvoiceId) {
                    const { data: invRow, error } = await supabase
                        .from('client_invoices')
                        .select('*, clients(*)')
                        .eq('id', urlInvoiceId)
                        .single();

                    if (!active || error || !invRow) return;
                    const owner = invRow.clients || null;
                    setSelectedClient(owner);
                    setLoadedInvoiceRecord(invRow);
                    applyInvoiceRecordToForm(invRow, owner);
                } else if (urlClientId) {
                    const { data: clientRow, error } = await supabase
                        .from('clients')
                        .select('*')
                        .eq('id', urlClientId)
                        .single();

                    if (!active || error || !clientRow) return;
                    let savedPayment = null;
                    try {
                        const rawPayment = window.localStorage.getItem(PAYMENT_STORAGE_KEY);
                        if (rawPayment) savedPayment = JSON.parse(rawPayment);
                    } catch {
                        // Ignore
                    }
                    const freshMeta = generateInvoiceMeta();
                    const freshForClient = {
                        ...EMPTY_INVOICE_STATE,
                        ...freshMeta,
                        client_name: clientRow.full_name || '',
                        goal: clientRow.initial_goals || '',
                        items: [createRow('', '')],
                        upi_id: savedPayment?.upi_id || '',
                        qr_image: savedPayment?.qr_image || '',
                        qr_filename: savedPayment?.qr_filename || '',
                    };
                    setSelectedClient(clientRow);
                    setLoadedInvoiceRecord(null);
                    setFormData(freshForClient);
                    setDebouncedInvoice(freshForClient);
                    setPreviewKey((k) => k + 1);
                }

                if (typeof window !== 'undefined') {
                    window.history.replaceState({}, '', '/admin/invoice-generator');
                }
            } catch (err) {
                console.warn('Error hydrating invoice from URL params:', err);
            }
        })();

        return () => {
            active = false;
        };
    }, [searchParams, supabase, applyInvoiceRecordToForm]);

    const handleClientNameChange = (typedVal) => {
        const matched = allClients.find(
            (c) => c.full_name?.trim().toLowerCase() === typedVal.trim().toLowerCase()
        );
        if (matched) {
            if (loadedInvoiceRecord && loadedInvoiceRecord.client_id !== matched.id) {
                setLoadedInvoiceRecord(null);
            }
            setSelectedClient(matched);
            setFormData((prev) => ({
                ...prev,
                client_name: typedVal,
                goal: prev.goal?.trim() ? prev.goal : matched.initial_goals || '',
            }));
        } else {
            setFormData((prev) => ({ ...prev, client_name: typedVal }));
        }
    };

    const handleSaveInvoiceToDb = async (requestedAction = 'auto') => {
        setShowSaveMenu(false);
        const action =
            requestedAction === 'auto'
                ? loadedInvoiceRecord?.id
                    ? 'update'
                    : 'create'
                : requestedAction;

        const typedName = (formData.client_name || '').trim();
        if (!typedName && !selectedClient) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Client Name',
                text: 'Please enter the Client Name before saving the invoice.',
                confirmButtonColor: '#2d6a4f',
            });
            return;
        }

        setSavingToClientDb(true);
        try {
            let targetClient = selectedClient;

            if (
                targetClient &&
                typedName &&
                targetClient.full_name?.trim().toLowerCase() !== typedName.toLowerCase()
            ) {
                const choice = await Swal.fire({
                    icon: 'question',
                    title: 'Different Client Name Entered',
                    html: `Save under <strong>${typedName}</strong> or keep under <strong>${targetClient.full_name}</strong>?`,
                    showDenyButton: true,
                    showCancelButton: true,
                    confirmButtonText: `Save under "${typedName}"`,
                    denyButtonText: `Keep "${targetClient.full_name}"`,
                    confirmButtonColor: '#2d6a4f',
                    denyButtonColor: '#0f766e',
                });
                if (choice.isDismissed) {
                    setSavingToClientDb(false);
                    return;
                }
                if (choice.isConfirmed) {
                    targetClient = null;
                }
            }

            if (!targetClient) {
                const existing = allClients.find(
                    (c) => c.full_name?.trim().toLowerCase() === typedName.toLowerCase()
                );
                if (existing) {
                    targetClient = existing;
                } else {
                    const { data: createdClient, error: createErr } = await supabase
                        .from('clients')
                        .insert([
                            {
                                full_name: typedName,
                                phone: '',
                                initial_goals: formData.goal?.trim() || null,
                                status: 'active',
                                updated_at: new Date().toISOString(),
                            },
                        ])
                        .select()
                        .single();
                    if (createErr) throw createErr;
                    targetClient = createdClient;
                    setAllClients((prev) => [
                        createdClient,
                        ...prev.filter((c) => c.id !== createdClient.id),
                    ]);
                }
            }

            await supabase
                .from('clients')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', targetClient.id);

            let effectiveData = {
                ...formData,
                client_name: typedName || targetClient.full_name,
            };

            if (
                action === 'create' &&
                loadedInvoiceRecord?.invoice_number &&
                effectiveData.invoice_number === loadedInvoiceRecord.invoice_number
            ) {
                effectiveData = {
                    ...effectiveData,
                    invoice_number: generateInvoiceMeta().invoice_number,
                };
                setFormData(effectiveData);
                setDebouncedInvoice(effectiveData);
            }

            if (
                action === 'update' &&
                loadedInvoiceRecord?.id &&
                loadedInvoiceRecord.client_id === targetClient.id
            ) {
                const { data: updatedInv, error: updErr } = await supabase
                    .from('client_invoices')
                    .update({
                        invoice_number:
                            effectiveData.invoice_number || loadedInvoiceRecord.invoice_number,
                        invoice_date: effectiveData.invoice_date || null,
                        goal: effectiveData.goal?.trim() || null,
                        status: effectiveData.status || 'unpaid',
                        currency: effectiveData.currency || 'INR',
                        total_amount: totalAmount,
                        paid_amount: effectivePaidAmount,
                        balance_amount: balanceAmount,
                        invoice_data: effectiveData,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', loadedInvoiceRecord.id)
                    .select()
                    .single();

                if (updErr) throw updErr;
                setSelectedClient(targetClient);
                setLoadedInvoiceRecord(updatedInv);

                Swal.fire({
                    icon: 'success',
                    title: 'Invoice Updated',
                    text: `Updated ${updatedInv.invoice_number} for ${targetClient.full_name}.`,
                    timer: 1600,
                    showConfirmButton: false,
                });
            } else {
                const { data: insertedInv, error: insErr } = await supabase
                    .from('client_invoices')
                    .insert([
                        {
                            client_id: targetClient.id,
                            invoice_number:
                                effectiveData.invoice_number || `TDC-${Date.now()}`,
                            invoice_date: effectiveData.invoice_date || null,
                            goal: effectiveData.goal?.trim() || null,
                            status: effectiveData.status || 'unpaid',
                            currency: effectiveData.currency || 'INR',
                            total_amount: totalAmount,
                            paid_amount: effectivePaidAmount,
                            balance_amount: balanceAmount,
                            invoice_data: effectiveData,
                            updated_at: new Date().toISOString(),
                        },
                    ])
                    .select()
                    .single();

                if (insErr) throw insErr;
                setSelectedClient(targetClient);
                setLoadedInvoiceRecord(insertedInv);

                Swal.fire({
                    icon: 'success',
                    title: 'Invoice Saved',
                    text: `Saved ${insertedInv.invoice_number} under ${targetClient.full_name}.`,
                    timer: 1700,
                    showConfirmButton: false,
                });
            }
        } catch (err) {
            console.error('Error saving invoice:', err);
            Swal.fire({
                icon: 'error',
                title: 'Save Failed',
                text: err.message || 'Unable to save invoice.',
                confirmButtonColor: '#2d6a4f',
            });
        } finally {
            setSavingToClientDb(false);
        }
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
        <div className="bg-gray-50 pb-24 md:pb-16 font-sans text-heading">
            <div className="max-w-7xl mx-auto px-0.5 sm:px-2 py-1 sm:py-4">

                {/* ── Contextual Page Header ── */}
                <div className="mb-3 sm:mb-4 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 min-w-0">
                            <Link
                                href={selectedClient ? `/admin/clients/${selectedClient.id}` : '/admin/clients'}
                                className="inline-flex items-center gap-1 font-semibold text-gray-500 hover:text-primary transition min-w-0"
                            >
                                <ArrowLeft size={13} className="shrink-0" />
                                <span className="truncate max-w-40 sm:max-w-xs">
                                    {selectedClient ? selectedClient.full_name : 'All Clients'}
                                </span>
                            </Link>
                            {loadedInvoiceRecord && (
                                <>
                                    <span className="text-gray-300 shrink-0">/</span>
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px] sm:text-[11px] font-mono shrink-0">
                                        {loadedInvoiceRecord.invoice_number}
                                    </span>
                                </>
                            )}
                        </div>

                        <Link
                            href="/admin/clients"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-[11px] sm:text-xs font-semibold text-heading transition shrink-0"
                        >
                            <Users size={13} className="text-primary shrink-0" />
                            <span className="sm:hidden">Clients</span>
                            <span className="hidden sm:inline">Client Directory</span>
                        </Link>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <h1 className="text-lg sm:text-2xl font-bold text-heading truncate leading-tight">
                            Invoice Generator
                        </h1>

                        <span className="text-[11px] text-gray-400 md:hidden inline-flex items-center gap-1 shrink-0">
                            {saveStatus === 'saving' && (
                                <>
                                    <RefreshCw size={10} className="animate-spin text-amber-600" />
                                    <span>Saving…</span>
                                </>
                            )}
                            {(saveStatus === 'saved' || saveStatus === 'restored') && (
                                <>
                                    <CheckCircle size={11} className="text-emerald-600" />
                                    <span>Saved{lastSavedTimeLabel ? ` ${lastSavedTimeLabel}` : ''}</span>
                                </>
                            )}
                            {saveStatus === 'error' && (
                                <>
                                    <AlertCircle size={11} className="text-red-500" />
                                    <span className="text-red-500">Storage full</span>
                                </>
                            )}
                        </span>
                    </div>
                </div>

                {/* ── Single Unified Sticky Toolbar ── */}
                <div className="sticky top-15 md:top-2 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-2 sm:p-2.5 mb-3.5 sm:mb-5 border border-gray-200/90 shadow-sm flex flex-wrap items-center justify-between gap-2">
                    {/* Mode Switcher */}
                    <div className="flex items-center gap-2.5">
                        <div className="bg-gray-100 p-0.5 rounded-xl flex items-center">
                            <button
                                type="button"
                                onClick={() => setActiveView('editor')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${activeView === 'editor'
                                    ? 'bg-white text-heading shadow-2xs font-bold'
                                    : 'text-gray-500 hover:text-heading'
                                    }`}
                            >
                                <FileText size={13} />
                                <span>Form</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setDebouncedInvoice(formData);
                                    setActiveView('split');
                                    setPreviewKey((k) => k + 1);
                                }}
                                className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${activeView === 'split'
                                    ? 'bg-white text-heading shadow-2xs font-bold'
                                    : 'text-gray-500 hover:text-heading'
                                    }`}
                            >
                                <Sliders size={13} />
                                <span>Split</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setDebouncedInvoice(formData);
                                    setActiveView('preview');
                                    setPreviewKey((k) => k + 1);
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${activeView === 'preview'
                                    ? 'bg-white text-heading shadow-2xs font-bold'
                                    : 'text-gray-500 hover:text-heading'
                                    }`}
                            >
                                <Eye size={13} />
                                <span>Preview</span>
                            </button>
                        </div>

                        <span className="text-[11px] text-gray-400 hidden md:inline-flex items-center gap-1">
                            {saveStatus === 'saving' && (
                                <>
                                    <RefreshCw size={10} className="animate-spin text-amber-600" />
                                    <span>Saving draft…</span>
                                </>
                            )}
                            {(saveStatus === 'saved' || saveStatus === 'restored') && (
                                <>
                                    <CheckCircle size={11} className="text-emerald-600" />
                                    <span>
                                        Draft saved{lastSavedTimeLabel ? ` ${lastSavedTimeLabel}` : ''}
                                    </span>
                                </>
                            )}
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 ml-auto">
                        {/* Desktop Primary Actions (Hidden on < md, moved to Mobile Bottom Thumb Bar) */}
                        <div className="hidden md:inline-flex items-center gap-2">
                            <div className="relative inline-flex items-center" ref={saveMenuRef}>
                                <button
                                    type="button"
                                    disabled={savingToClientDb}
                                    onClick={() => handleSaveInvoiceToDb('auto')}
                                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-primary border border-emerald-200 font-bold text-xs whitespace-nowrap transition active:scale-[0.98] cursor-pointer disabled:opacity-50 ${loadedInvoiceRecord ? 'rounded-l-xl border-r-0' : 'rounded-xl'
                                        }`}
                                >
                                    {savingToClientDb ? (
                                        <RefreshCw size={13} className="animate-spin shrink-0" />
                                    ) : (
                                        <Save size={13} className="shrink-0" />
                                    )}
                                    <span>
                                        {loadedInvoiceRecord ? 'Update Invoice' : 'Save Invoice'}
                                    </span>
                                </button>

                                {loadedInvoiceRecord && (
                                    <button
                                        type="button"
                                        disabled={savingToClientDb}
                                        onClick={() => setShowSaveMenu((o) => !o)}
                                        className="px-2 py-2 bg-emerald-50 hover:bg-emerald-100 text-primary border border-emerald-200 rounded-r-xl transition cursor-pointer disabled:opacity-50"
                                        title="More save options"
                                    >
                                        <ChevronDown size={13} />
                                    </button>
                                )}

                                {loadedInvoiceRecord && showSaveMenu && (
                                    <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 text-xs">
                                        <button
                                            type="button"
                                            onClick={() => handleSaveInvoiceToDb('create')}
                                            className="w-full px-3.5 py-2 text-left font-semibold text-heading hover:bg-emerald-50 hover:text-primary flex items-center gap-2 cursor-pointer"
                                        >
                                            <Plus size={13} className="text-primary" />
                                            <span>Save as New Invoice</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setLoadedInvoiceRecord(null);
                                                setShowSaveMenu(false);
                                            }}
                                            className="w-full px-3.5 py-2 text-left text-gray-500 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                        >
                                            <X size={13} />
                                            <span>Detach from {loadedInvoiceRecord.invoice_number}</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={handleDownloadPdf}
                                disabled={generating}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-xl shadow-xs whitespace-nowrap transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                            >
                                {generating ? (
                                    <RefreshCw size={13} className="animate-spin shrink-0" />
                                ) : (
                                    <Download size={13} className="shrink-0" />
                                )}
                                <span>{generating ? 'Generating...' : 'Download PDF'}</span>
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={handleResetForm}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Reset invoice form"
                            aria-label="Reset invoice form"
                        >
                            <RotateCcw size={15} />
                        </button>
                    </div>
                </div>

                {/* ── Static Brand Info Strip (Compact on Mobile) ── */}
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl px-3 sm:px-4 py-2 sm:py-3 mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-900 min-w-0">
                        <Sparkles size={14} className="text-primary shrink-0" />
                        <span className="sm:hidden font-semibold text-[11px] truncate">
                            TDC Branded Invoice
                        </span>
                        <span className="hidden sm:inline">
                            <strong>Static Clinic Branding Applied:</strong> The Diet Cascade Logo, Header, Footer &amp; Brand Palette (<span className="inline-block w-2.5 h-2.5 rounded-full bg-primary align-middle mx-0.5" /> Forest Emerald &amp; <span className="inline-block w-2.5 h-2.5 rounded-full bg-accent align-middle mx-0.5" /> Gold)
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-800 font-semibold text-[11px] sm:text-xs ml-auto">
                        <span className="font-mono">{formData.invoice_number}</span>
                        <span className="text-emerald-400">•</span>
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
                    className={`grid gap-6 items-start ${activeView === 'split' ? 'lg:grid-cols-12' : 'grid-cols-1'
                        }`}
                >
                    {/* ═══════════════ LEFT: INVOICE FORM ═══════════════ */}
                    {(activeView === 'editor' || activeView === 'split') && (
                        <div
                            className={`space-y-5 ${activeView === 'split' ? 'lg:col-span-6' : 'max-w-3xl mx-auto w-full'
                                }`}
                        >
                            {/* ── CARD 1: Client Name, Goal & Status ── */}
                            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                                <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-gray-100 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                            <User size={16} />
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="font-bold text-xs sm:text-sm text-heading truncate">
                                                Client &amp; Invoice Status
                                            </h2>
                                            <p className="text-[11px] text-gray-400 truncate">
                                                Recipient details and payment status badge
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wide border shrink-0 whitespace-nowrap ${statusBadgeUi.pill}`}
                                    >
                                        <span
                                            className={`w-1.5 h-1.5 rounded-full ${statusBadgeUi.dot}`}
                                        />
                                        {statusBadgeUi.label}
                                    </span>
                                </div>

                                <div className="p-4 sm:p-5 space-y-4">
                                    {/* Client Name */}
                                    <div>
                                        <label className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1.5">
                                            <span>
                                                Client Name <span className="text-red-500">*</span>
                                            </span>
                                            {selectedClient && (
                                                <Link
                                                    href={`/admin/clients/${selectedClient.id}`}
                                                    className="text-[11px] font-bold text-primary hover:underline"
                                                >
                                                    View Client Profile →
                                                </Link>
                                            )}
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
                                                onChange={(e) => handleClientNameChange(e.target.value)}
                                                placeholder="e.g., Ananya Sharma"
                                                className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 bg-surface/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                                                required
                                            />
                                            <datalist id="invoice-client-suggestions">
                                                {allClients.map((c) => (
                                                    <option key={c.id} value={c.full_name} />
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
                                        <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        status: 'unpaid',
                                                    }))
                                                }
                                                className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-1.5 sm:px-2.5 rounded-xl border text-[11px] sm:text-xs font-bold whitespace-nowrap transition cursor-pointer ${formData.status === 'unpaid'
                                                    ? 'bg-red-50 border-red-400 text-red-700 ring-2 ring-red-200/70 shadow-2xs'
                                                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <Clock size={13} className="shrink-0" />
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
                                                className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-1.5 sm:px-2.5 rounded-xl border text-[11px] sm:text-xs font-bold whitespace-nowrap transition cursor-pointer ${isPartlyPaid
                                                    ? 'bg-amber-50 border-amber-400 text-amber-800 ring-2 ring-amber-200/70 shadow-2xs'
                                                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <PieChart size={13} className="shrink-0" />
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
                                                className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-1.5 sm:px-2.5 rounded-xl border text-[11px] sm:text-xs font-bold whitespace-nowrap transition cursor-pointer ${isPaid
                                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-200/70 shadow-2xs'
                                                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <CheckCircle size={13} className="shrink-0" />
                                                <span>Paid</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── CARD 2: 2-Column Table (Description & Amount + Balance Row) ── */}
                            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                                <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-gray-100 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                            <Receipt size={16} />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-xs sm:text-sm text-heading">
                                                Invoice Line Items
                                            </h2>
                                            <p className="text-[11px] text-gray-400">
                                                Add or remove description &amp; amount rows
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3.5 sm:p-5">
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
                                                                placeholder={`Item ${index + 1
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
                                            className={`border-t px-4 py-3 flex items-center justify-between ${isPartlyPaid
                                                ? 'bg-gray-50 border-gray-200 py-2.5'
                                                : 'bg-emerald-50/80 border-emerald-200'
                                                }`}
                                        >
                                            <span
                                                className={`text-xs font-bold uppercase tracking-wider ${isPartlyPaid ? 'text-gray-600' : 'text-emerald-900'
                                                    }`}
                                            >
                                                Total Amount
                                            </span>
                                            <span
                                                className={`font-bold ${isPartlyPaid
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
                                                <div className="bg-white border-t border-gray-100 px-3.5 sm:px-4 py-2.5 flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                                                            Amount Paid
                                                        </span>
                                                        <span className="hidden sm:inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
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
                                                            className="w-24 sm:w-32 text-xs sm:text-sm px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50/40 text-right font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="border-t bg-amber-50/80 border-amber-200 px-3.5 sm:px-4 py-3 flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                                                            Balance Amount
                                                        </span>
                                                        <span
                                                            className={`hidden sm:inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${statusBadgeUi.pill}`}
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
                                <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                            <QrCode size={16} />
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="font-bold text-xs sm:text-sm text-heading truncate">
                                                UPI Payment &amp; QR Code
                                            </h2>
                                            <p className="text-[11px] text-gray-400 truncate">
                                                Displayed in the payment section of the PDF invoice
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={handleSavePaymentDefaults}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer"
                                            title="Remember UPI ID & QR image for future invoices"
                                        >
                                            <BookmarkCheck size={12} />
                                            <span className="sm:hidden">Save Default</span>
                                            <span className="hidden sm:inline">Save as Default</span>
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

                                <div className="p-4 sm:p-5 space-y-4">
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
                                                className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${isDraggingQr
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

                            {/* ── Bottom Download Button (Desktop; < md uses Fixed Bottom Action Bar) ── */}
                            <button
                                type="button"
                                onClick={handleDownloadPdf}
                                disabled={generating}
                                className="hidden md:flex w-full py-3.5 px-6 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-2xl shadow-md shadow-primary/20 items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
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
                            className={`bg-white rounded-2xl p-3 sm:p-4 border border-gray-200/80 shadow-xs flex flex-col lg:sticky lg:top-16 ${activeView === 'split' ? 'lg:col-span-6' : 'w-full'
                                }`}
                        >
                            <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-gray-100">
                                <div className="flex items-center gap-2 flex-wrap min-w-0">
                                    <Eye size={15} className="text-primary shrink-0" />
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
                                    className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer shrink-0"
                                    title="Refresh PDF preview"
                                >
                                    <RefreshCw size={13} />
                                    <span className="hidden sm:inline">Refresh</span>
                                </button>
                            </div>

                            {/* Mobile Browser PDF Helper Banner */}
                            <div className="md:hidden mb-2.5 px-3 py-2 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-2 text-[11px] text-emerald-900">
                                <span>Some mobile browsers open PDFs externally.</span>
                                <button
                                    type="button"
                                    onClick={handleDownloadPdf}
                                    disabled={generating}
                                    className="font-bold text-primary underline shrink-0 cursor-pointer"
                                >
                                    {generating ? 'Generating…' : 'Open / Download PDF'}
                                </button>
                            </div>

                            <div className="w-full h-[480px] sm:h-[700px] rounded-xl overflow-hidden border border-gray-200">
                                <PDFViewer
                                    key={previewKey}
                                    width="100%"
                                    height="100%"
                                    showToolbar={true}
                                >
                                    <InvoicePdfDocument invoice={debouncedInvoice} />
                                </PDFViewer>
                            </div>

                            <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] text-gray-400">
                                <span className="truncate">The Diet Cascade • Official Invoice</span>
                                <span className="font-semibold text-heading shrink-0">
                                    Total: ₹{formattedTotal}
                                    {isPartlyPaid ? ` • Bal: ₹${formattedBalance}` : ''}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════════ MOBILE THUMB-ZONE ACTION BAR (< md) ═══════════════ */}
            <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 px-3.5 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-2.5 max-w-lg mx-auto">
                    {/* Mobile Save / Split Update Button */}
                    <div className="relative flex-1 flex items-stretch" ref={mobileSaveMenuRef}>
                        <button
                            type="button"
                            disabled={savingToClientDb}
                            onClick={() => handleSaveInvoiceToDb('auto')}
                            className={`flex-1 min-h-11 inline-flex items-center justify-center gap-1.5 px-3 bg-emerald-50 active:bg-emerald-100 text-primary border border-emerald-200 font-bold text-xs whitespace-nowrap transition active:scale-[0.98] cursor-pointer disabled:opacity-50 ${loadedInvoiceRecord ? 'rounded-l-xl border-r-0' : 'rounded-xl'
                                }`}
                        >
                            {savingToClientDb ? (
                                <RefreshCw size={14} className="animate-spin shrink-0" />
                            ) : (
                                <Save size={14} className="shrink-0" />
                            )}
                            <span className="truncate">
                                {loadedInvoiceRecord ? 'Update Invoice' : 'Save Invoice'}
                            </span>
                        </button>

                        {loadedInvoiceRecord && (
                            <button
                                type="button"
                                disabled={savingToClientDb}
                                onClick={() => setShowSaveMenu((o) => !o)}
                                className="min-h-11 px-2.5 bg-emerald-50 active:bg-emerald-100 text-primary border border-emerald-200 rounded-r-xl flex items-center justify-center transition cursor-pointer disabled:opacity-50"
                                title="More save options"
                                aria-label="More save options"
                            >
                                <ChevronUp size={14} />
                            </button>
                        )}

                        {loadedInvoiceRecord && showSaveMenu && (
                            <div className="absolute left-0 bottom-full mb-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 text-xs">
                                <button
                                    type="button"
                                    onClick={() => handleSaveInvoiceToDb('create')}
                                    className="w-full px-3.5 py-2.5 text-left font-semibold text-heading hover:bg-emerald-50 hover:text-primary flex items-center gap-2 cursor-pointer"
                                >
                                    <Plus size={14} className="text-primary" />
                                    <span>Save as New Invoice</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLoadedInvoiceRecord(null);
                                        setShowSaveMenu(false);
                                    }}
                                    className="w-full px-3.5 py-2.5 text-left text-gray-500 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                >
                                    <X size={14} />
                                    <span>Detach from {loadedInvoiceRecord.invoice_number}</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Primary Download PDF Button */}
                    <button
                        type="button"
                        onClick={handleDownloadPdf}
                        disabled={generating}
                        className="flex-1 min-h-11 inline-flex items-center justify-center gap-1.5 px-3 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-xl shadow-xs whitespace-nowrap transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    >
                        {generating ? (
                            <RefreshCw size={14} className="animate-spin shrink-0" />
                        ) : (
                            <Download size={14} className="shrink-0" />
                        )}
                        <span>{generating ? 'Generating…' : 'Download PDF'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminInvoiceGeneratorPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
                    <RefreshCw size={18} className="animate-spin mr-2 text-primary" />
                    Loading Invoice Generator...
                </div>
            }
        >
            <AdminInvoiceGeneratorContent />
        </Suspense>
    );
}
