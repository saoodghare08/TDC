'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import {
    Download,
    Send,
    User,
    Receipt,
    Eye,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    RotateCcw,
    ArrowLeft,
    ArrowRight,
    Users,
    Layers,
    Columns,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import InvoicePdfDocument, { parseAmountNumber } from '@/components/admin/pdf/InvoicePdfDocument';
import {
    PAYMENT_STORAGE_KEY,
    INVOICE_DRAFT_STORAGE_KEY,
    AUTO_SAVE_DELAY_MS,
    EMPTY_INVOICE_STATE,
    createRow,
    generateInvoiceMeta,
    hasInvoiceDraftContent,
    formatInr,
    escapeHtmlText,
    convertImageFileToPngDataUrl,
} from '@/components/admin/invoice-generator/invoiceGeneratorUtils';
import StepInvoiceClient from '@/components/admin/invoice-generator/StepInvoiceClient';
import StepInvoiceItemsPayment from '@/components/admin/invoice-generator/StepInvoiceItemsPayment';
import StepInvoiceReviewShare from '@/components/admin/invoice-generator/StepInvoiceReviewShare';

// Dynamic import for React-PDF Viewer to prevent SSR issues
const PDFViewer = dynamic(() => import('@react-pdf/renderer').then((mod) => mod.PDFViewer), {
    ssr: false,
    loading: () => (
        <div className="h-[600px] w-full flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-gray-200">
            <RefreshCw className="w-7 h-7 text-primary animate-spin mb-2.5" />
            <p className="text-xs font-medium text-para">Rendering Live Invoice PDF...</p>
        </div>
    ),
});

const INVOICE_STEPS = [
    { id: 1, shortLabel: 'Client & Goal', icon: User },
    { id: 2, shortLabel: 'Services & Payment', icon: Receipt },
    { id: 3, shortLabel: 'Preview & Share', icon: Eye },
];

function AdminInvoiceGeneratorContent() {
    const supabase = useMemo(() => createClient(), []);
    const searchParams = useSearchParams();
    const topAnchorRef = useRef(null);

    const [formData, setFormData] = useState(EMPTY_INVOICE_STATE);
    const [debouncedInvoice, setDebouncedInvoice] = useState(EMPTY_INVOICE_STATE);

    // Guided 3-Step Flow (default) vs All-in-One Scroll + Optional Wide-Desktop Live Split PDF
    const [currentStep, setCurrentStep] = useState(1);
    const [layoutMode, setLayoutMode] = useState('guided'); // 'guided' | 'all'
    const [showSplitPreview, setShowSplitPreview] = useState(false);

    const [generating, setGenerating] = useState(false);
    const [hasSavedDefaults, setHasSavedDefaults] = useState(false);
    const [allClients, setAllClients] = useState([]);
    const [previewKey, setPreviewKey] = useState(1);

    // Client 1-to-Many DB State
    const [selectedClient, setSelectedClient] = useState(null);
    const [loadedInvoiceRecord, setLoadedInvoiceRecord] = useState(null);
    const [savingToClientDb, setSavingToClientDb] = useState(false);
    const dbMetaRef = useRef({ selectedClient: null, loadedInvoiceRecord: null });

    useEffect(() => {
        dbMetaRef.current = { selectedClient, loadedInvoiceRecord };
    }, [selectedClient, loadedInvoiceRecord]);

    const jumpToStep = useCallback(
        (stepNum) => {
            const clamped = Math.min(3, Math.max(1, stepNum));
            setCurrentStep(clamped);
            if (clamped === 3) {
                setDebouncedInvoice(formData);
                setPreviewKey((k) => k + 1);
            }
            if (typeof window !== 'undefined' && topAnchorRef.current) {
                topAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        },
        [formData]
    );

    // ─── LocalStorage Draft Auto-Save & Restore ───
    const isDraftHydratedRef = useRef(false);
    const pendingHydratedDataRef = useRef(null);
    const lastSavedDataRef = useRef(EMPTY_INVOICE_STATE);
    const latestFormDataRef = useRef(EMPTY_INVOICE_STATE);
    const hasPendingSaveRef = useRef(false);
    const autoSaveTimerRef = useRef(null);

    const [saveStatus, setSaveStatus] = useState('idle');
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
            // Ignore
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
            if (restoredTimestamp) setLastSavedAt(restoredTimestamp);
            setSaveStatus('restored');
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

    // Fetch Clients
    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const { data } = await supabase
                    .from('clients')
                    .select('id, full_name, phone, initial_goals')
                    .order('updated_at', { ascending: false })
                    .limit(300);
                if (active && Array.isArray(data)) setAllClients(data);
            } catch {
                // Ignore
            }
        })();
        return () => {
            active = false;
        };
    }, [supabase]);

    // Delayed Draft Save
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

    // Debounced PDF Preview Sync
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedInvoice(formData);
        }, 350);
        return () => clearTimeout(timer);
    }, [formData]);

    const isPaid = formData.status === 'paid';
    const isPartlyPaid = formData.status === 'partly_paid';

    const totalAmount = useMemo(
        () =>
            (formData.items || []).reduce(
                (sum, row) => sum + parseAmountNumber(row.amount),
                0
            ),
        [formData.items]
    );

    const enteredPaidAmount = useMemo(
        () => Math.max(0, parseAmountNumber(formData.amount_paid)),
        [formData.amount_paid]
    );

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

    const formattedTotal = useMemo(() => formatInr(totalAmount), [totalAmount]);
    const formattedPaid = useMemo(
        () => formatInr(effectivePaidAmount),
        [effectivePaidAmount]
    );
    const formattedBalance = useMemo(() => formatInr(balanceAmount), [balanceAmount]);

    // ─── Line Item Handlers ───
    const handleAddRow = () =>
        setFormData((prev) => ({
            ...prev,
            items: [...prev.items, createRow('', '')],
        }));

    const handleRemoveRow = (id) =>
        setFormData((prev) => {
            const filtered = prev.items.filter((row) => row.id !== id);
            return {
                ...prev,
                items: filtered.length > 0 ? filtered : [createRow('', '')],
            };
        });

    const handleItemChange = (id, field, value) =>
        setFormData((prev) => ({
            ...prev,
            items: prev.items.map((row) =>
                row.id === id ? { ...row, [field]: value } : row
            ),
        }));

    // ─── QR Upload & Clinic Default Payment Handlers ───
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

    const handleRemoveQr = () => {
        setFormData((prev) => ({ ...prev, qr_image: '', qr_filename: '' }));
        setPreviewKey((k) => k + 1);
    };

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
                title: 'Clinic Payment Saved',
                text: 'Your UPI ID and QR code will auto-fill on every future invoice.',
                confirmButtonColor: '#2d6a4f',
                timer: 1800,
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
                timer: 1300,
                showConfirmButton: false,
            });
        } catch {
            // Ignore
        }
    };

    // ─── Reset Form (Clean Slate) ───
    const handleResetForm = () => {
        Swal.fire({
            title: 'Reset Invoice Form?',
            text: 'This will unlink the client and clear service items for a fresh invoice (your saved clinic UPI/QR stays intact).',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, start fresh',
        }).then((res) => {
            if (!res.isConfirmed) return;

            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
                autoSaveTimerRef.current = null;
            }
            hasPendingSaveRef.current = false;
            dbMetaRef.current = { selectedClient: null, loadedInvoiceRecord: null };

            let savedPayment = null;
            try {
                window.localStorage.removeItem(INVOICE_DRAFT_STORAGE_KEY);
                window.history.replaceState({}, '', '/admin/invoice-generator');
                const rawPayment = window.localStorage.getItem(PAYMENT_STORAGE_KEY);
                if (rawPayment) savedPayment = JSON.parse(rawPayment);
            } catch {
                // Ignore
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
            setFormData(freshInvoice);
            setDebouncedInvoice(freshInvoice);
            setCurrentStep(1);
            setLastSavedAt(null);
            setSaveStatus('idle');
            setPreviewKey((k) => k + 1);
        });
    };

    // ─── Hydrate URL ?invoiceId / ?clientId ───
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
            client_phone: snap.client_phone || ownerClient?.phone || '',
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
                        client_phone: clientRow.phone || '',
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

    // ─── Client Selection Handlers ───
    const handleSelectClientObject = (clientObj) => {
        if (!clientObj) return;
        if (loadedInvoiceRecord && loadedInvoiceRecord.client_id !== clientObj.id) {
            setLoadedInvoiceRecord(null);
        }
        setSelectedClient(clientObj);
        setFormData((prev) => ({
            ...prev,
            client_name: clientObj.full_name || '',
            client_phone: clientObj.phone || prev.client_phone || '',
            goal: prev.goal?.trim() ? prev.goal : clientObj.initial_goals || '',
        }));
    };

    const handleDetachClient = () => {
        setSelectedClient(null);
        setLoadedInvoiceRecord(null);
    };

    const handleClientNameChange = (typedVal) => {
        const matched = allClients.find(
            (c) => c.full_name?.trim().toLowerCase() === typedVal.trim().toLowerCase()
        );
        if (matched) {
            handleSelectClientObject(matched);
        } else {
            setFormData((prev) => ({ ...prev, client_name: typedVal }));
        }
    };

    // ─── Validation Check Before Generating / Saving ───
    const validateInvoiceReady = () => {
        if (!formData.client_name?.trim() && !selectedClient) {
            jumpToStep(1);
            Swal.fire({
                icon: 'warning',
                title: 'Missing Client Name',
                text: 'Please enter the Client Full Name in Step 1.',
                confirmButtonColor: '#2d6a4f',
            });
            return false;
        }

        const nonEmptyItems = (formData.items || []).filter(
            (r) => String(r.description || '').trim() !== '' || String(r.amount || '').trim() !== ''
        );
        if (nonEmptyItems.length === 0) {
            jumpToStep(2);
            Swal.fire({
                icon: 'warning',
                title: 'No Service Items Added',
                text: 'Please add at least one service description and fee in Step 2.',
                confirmButtonColor: '#2d6a4f',
            });
            return false;
        }

        if (isPartlyPaid && enteredPaidAmount <= 0) {
            jumpToStep(2);
            Swal.fire({
                icon: 'warning',
                title: 'Missing Paid Amount',
                text: 'Please enter the Amount Received So Far in Step 2 (or switch status to Unpaid).',
                confirmButtonColor: '#2d6a4f',
            });
            return false;
        }

        return true;
    };

    // ─── Unified Save Invoice to DB ───
    const handleSaveInvoiceToDb = async (
        requestedAction = 'auto',
        opts = { silentToast: false }
    ) => {
        const action =
            requestedAction === 'auto'
                ? loadedInvoiceRecord?.id
                    ? 'update'
                    : 'create'
                : requestedAction;

        const typedName = (formData.client_name || '').trim();
        const typedPhone = (formData.client_phone || '').trim();
        const phoneDigits = typedPhone.replace(/\D/g, '');

        if (!typedName && !selectedClient) {
            jumpToStep(1);
            Swal.fire({
                icon: 'warning',
                title: 'Missing Client Name',
                text: 'Please enter the Client Name in Step 1 before saving.',
                confirmButtonColor: '#2d6a4f',
            });
            return { ok: false };
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
                    html: `Save under <strong>${escapeHtmlText(typedName)}</strong> or keep under <strong>${escapeHtmlText(targetClient.full_name)}</strong>?`,
                    showDenyButton: true,
                    showCancelButton: true,
                    confirmButtonText: `Save under "${typedName}"`,
                    denyButtonText: `Keep "${targetClient.full_name}"`,
                    confirmButtonColor: '#2d6a4f',
                    denyButtonColor: '#0f766e',
                });
                if (choice.isDismissed) {
                    setSavingToClientDb(false);
                    return { ok: false };
                }
                if (choice.isConfirmed) targetClient = null;
            }

            if (!targetClient) {
                const existing = allClients.find((c) => {
                    const cDigits = String(c.phone || '').replace(/\D/g, '');
                    if (
                        phoneDigits.length >= 7 &&
                        cDigits.length >= 7 &&
                        cDigits === phoneDigits
                    ) {
                        return true;
                    }
                    return c.full_name?.trim().toLowerCase() === typedName.toLowerCase();
                });

                if (existing) {
                    targetClient = existing;
                } else {
                    const { data: createdClient, error: createErr } = await supabase
                        .from('clients')
                        .insert([
                            {
                                full_name: typedName,
                                phone: typedPhone || '',
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

            const clientPatch = { updated_at: new Date().toISOString() };
            if (typedPhone && !targetClient.phone) clientPatch.phone = typedPhone;
            await supabase.from('clients').update(clientPatch).eq('id', targetClient.id);
            targetClient = { ...targetClient, ...clientPatch };

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
                            effectiveData.invoice_number ||
                            loadedInvoiceRecord.invoice_number,
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

                if (!opts.silentToast) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Invoice Updated',
                        text: `Updated ${updatedInv.invoice_number} for ${targetClient.full_name}.`,
                        timer: 1600,
                        showConfirmButton: false,
                    });
                }
                return {
                    ok: true,
                    finalInvoiceData: effectiveData,
                    invoiceNum: updatedInv.invoice_number,
                    clientName: targetClient.full_name,
                };
            }

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

            if (!opts.silentToast) {
                Swal.fire({
                    icon: 'success',
                    title: 'Invoice Saved',
                    text: `Saved ${insertedInv.invoice_number} under ${targetClient.full_name}.`,
                    timer: 1700,
                    showConfirmButton: false,
                });
            }
            return {
                ok: true,
                finalInvoiceData: effectiveData,
                invoiceNum: insertedInv.invoice_number,
                clientName: targetClient.full_name,
            };
        } catch (err) {
            console.error('Error saving invoice:', err);
            Swal.fire({
                icon: 'error',
                title: 'Save Failed',
                text: err.message || 'Unable to save invoice.',
                confirmButtonColor: '#2d6a4f',
            });
            return { ok: false };
        } finally {
            setSavingToClientDb(false);
        }
    };

    // ─── PDF Generation & Unified Save + Download ───
    const generateAndDownloadInvoicePdf = async (invoicePayload) => {
        const targetInv = invoicePayload || formData;
        setGenerating(true);
        try {
            const { pdf } = await import('@react-pdf/renderer');
            const blob = await pdf(<InvoicePdfDocument invoice={targetInv} />).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const safeClient = (targetInv.client_name || 'Client')
                .trim()
                .replace(/[^a-zA-Z0-9_-]/g, '_');
            a.download = `${safeClient}_Invoice_TDC.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('Error generating invoice PDF:', error);
            Swal.fire({
                icon: 'error',
                title: 'PDF Generation Failed',
                text: error.message || 'Unable to generate PDF.',
                confirmButtonColor: '#2d6a4f',
            });
            return false;
        } finally {
            setGenerating(false);
        }
    };

    const handleDownloadPdfOnly = async () => {
        if (!validateInvoiceReady()) return;
        const ok = await generateAndDownloadInvoicePdf(formData);
        if (ok) {
            Swal.fire({
                icon: 'success',
                title: 'Invoice Downloaded!',
                timer: 1800,
                showConfirmButton: false,
            });
        }
    };

    const handleSaveAndDownloadPdf = async (requestedAction = 'auto') => {
        if (!validateInvoiceReady()) return;
        const saveRes = await handleSaveInvoiceToDb(requestedAction, { silentToast: true });
        if (!saveRes.ok) return;

        const pdfOk = await generateAndDownloadInvoicePdf(saveRes.finalInvoiceData);
        if (pdfOk) {
            Swal.fire({
                icon: 'success',
                title: 'Invoice Saved & Downloaded!',
                text: `${saveRes.invoiceNum} stored under ${saveRes.clientName} and saved to your downloads.`,
                confirmButtonColor: '#2d6a4f',
                timer: 2200,
                showConfirmButton: false,
            });
        }
    };

    // ─── WhatsApp Invoice Summary Share ───
    const handleOpenWhatsApp = () => {
        const phone = (formData.client_phone || selectedClient?.phone || '').replace(
            /[^0-9]/g,
            ''
        );
        const statusLine = isPaid
            ? `Status: *PAID IN FULL* (₹${formattedTotal})`
            : isPartlyPaid
              ? `Total: ₹${formattedTotal}\nReceived: ₹${formattedPaid}\n*Balance Due: ₹${formattedBalance}*`
              : `*Amount Due: ₹${formattedTotal}*`;

        const upiLine =
            !isPaid && formData.upi_id?.trim()
                ? `\nUPI ID for Payment: *${formData.upi_id.trim()}*`
                : '';

        const msg = `Hello ${formData.client_name || ''}! 👋\n\nHere are your invoice details from *The Diet Cascade*:\nInvoice No: *${formData.invoice_number}*\n${formData.goal ? `Program: ${formData.goal}\n` : ''}${statusLine}${upiLine}\n\nThank you,\n*Dt. Sabah Ghare*\nThe Diet Cascade`;

        const encoded = encodeURIComponent(msg);
        const url = phone
            ? `https://wa.me/${phone}?text=${encoded}`
            : `https://wa.me/?text=${encoded}`;
        window.open(url, '_blank');
    };

    const stepCompletion = useMemo(
        () => ({
            1: Boolean(formData.client_name?.trim()),
            2:
                totalAmount > 0 &&
                (formData.items || []).some(
                    (r) => String(r.description || '').trim() !== ''
                ),
            3: false,
        }),
        [formData.client_name, formData.items, totalAmount]
    );

    const isSplitDesktopActive =
        showSplitPreview && !(layoutMode === 'guided' && currentStep === 3);

    return (
        <div
            ref={topAnchorRef}
            className="bg-gray-50 pb-24 md:pb-16 font-sans text-heading"
        >
            <div className="max-w-7xl mx-auto px-0.5 sm:px-2 py-1 sm:py-3">
                {/* ── TOP CONTEXT HEADER ── */}
                <div className="mb-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 min-w-0">
                            <Link
                                href={
                                    selectedClient
                                        ? `/admin/clients/${selectedClient.id}`
                                        : '/admin/clients'
                                }
                                className="inline-flex items-center gap-1 font-semibold text-gray-500 hover:text-primary transition min-w-0"
                            >
                                <ArrowLeft size={13} className="shrink-0" />
                                <span className="truncate max-w-[160px] sm:max-w-xs">
                                    {selectedClient
                                        ? selectedClient.full_name
                                        : 'All Clients'}
                                </span>
                            </Link>
                            {loadedInvoiceRecord && (
                                <>
                                    <span className="text-gray-300">/</span>
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold font-mono text-[10px]">
                                        {loadedInvoiceRecord.invoice_number}
                                    </span>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[11px] text-gray-400 inline-flex items-center gap-1 mr-1">
                                {saveStatus === 'saving' && (
                                    <>
                                        <RefreshCw
                                            size={10}
                                            className="animate-spin text-amber-600"
                                        />
                                        <span className="hidden sm:inline">Saving…</span>
                                    </>
                                )}
                                {(saveStatus === 'saved' || saveStatus === 'restored') && (
                                    <>
                                        <CheckCircle2
                                            size={11}
                                            className="text-emerald-600"
                                        />
                                        <span className="hidden sm:inline">
                                            Draft saved
                                            {lastSavedTimeLabel ? ` ${lastSavedTimeLabel}` : ''}
                                        </span>
                                    </>
                                )}
                                {saveStatus === 'error' && (
                                    <>
                                        <AlertCircle size={11} className="text-red-500" />
                                        <span className="text-red-500">Storage full</span>
                                    </>
                                )}
                            </span>

                            <Link
                                href="/admin/clients"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-[11px] font-semibold text-heading transition"
                            >
                                <Users size={13} className="text-primary" />
                                <span className="hidden sm:inline">Client Directory</span>
                                <span className="sm:hidden">Clients</span>
                            </Link>
                        </div>
                    </div>

                    {/* Title + Mode Switcher + Quick Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h1 className="text-lg sm:text-2xl font-bold text-heading leading-tight">
                            Invoice Builder
                        </h1>

                        <div className="flex items-center gap-1.5 ml-auto">
                            {/* Step-by-Step vs All-in-One */}
                            <div className="bg-gray-200/70 p-0.5 rounded-xl inline-flex items-center text-[11px] font-semibold">
                                <button
                                    type="button"
                                    onClick={() => setLayoutMode('guided')}
                                    className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                                        layoutMode === 'guided'
                                            ? 'bg-white text-heading font-bold shadow-2xs'
                                            : 'text-gray-600 hover:text-heading'
                                    }`}
                                >
                                    Step-by-Step
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLayoutMode('all')}
                                    className={`px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 transition cursor-pointer ${
                                        layoutMode === 'all'
                                            ? 'bg-white text-heading font-bold shadow-2xs'
                                            : 'text-gray-600 hover:text-heading'
                                    }`}
                                >
                                    <Layers size={12} />
                                    <span>All-in-One</span>
                                </button>
                            </div>

                            {/* Wide-Screen Live Split PDF Toggle */}
                            {!(layoutMode === 'guided' && currentStep === 3) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDebouncedInvoice(formData);
                                        setShowSplitPreview((o) => !o);
                                        setPreviewKey((k) => k + 1);
                                    }}
                                    className={`hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                                        showSplitPreview
                                            ? 'bg-emerald-50 text-primary border-emerald-200 font-bold'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                                    title="Show live invoice PDF side-by-side"
                                >
                                    <Columns size={13} />
                                    <span>Live PDF</span>
                                </button>
                            )}

                            {/* Desktop Quick Save & PDF */}
                            <button
                                type="button"
                                disabled={savingToClientDb || generating}
                                onClick={() => handleSaveAndDownloadPdf('auto')}
                                className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-2xs transition cursor-pointer disabled:opacity-50"
                            >
                                {savingToClientDb || generating ? (
                                    <RefreshCw size={13} className="animate-spin" />
                                ) : (
                                    <Download size={13} />
                                )}
                                <span>Save &amp; PDF</span>
                            </button>

                            {/* Reset Clean Slate */}
                            <button
                                type="button"
                                onClick={handleResetForm}
                                className="p-2 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition cursor-pointer"
                                title="Reset invoice form"
                                aria-label="Reset invoice form"
                            >
                                <RotateCcw size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── STICKY 3-STEP GUIDED STEPPER BAR (Guided Mode) ── */}
                {layoutMode === 'guided' && (
                    <div className="sticky top-15 md:top-2 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-1.5 sm:p-2 mb-4 border border-gray-200/90 shadow-xs">
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                            {INVOICE_STEPS.map((st) => {
                                const Icon = st.icon;
                                const isActive = currentStep === st.id;
                                const isDone = stepCompletion[st.id] && !isActive;

                                return (
                                    <button
                                        key={st.id}
                                        type="button"
                                        onClick={() => jumpToStep(st.id)}
                                        className={`min-h-11 px-2.5 sm:px-3.5 py-2 rounded-xl flex items-center justify-center sm:justify-start gap-2 text-left transition cursor-pointer ${
                                            isActive
                                                ? 'bg-primary text-white shadow-xs'
                                                : isDone
                                                    ? 'bg-emerald-50/70 text-emerald-900 hover:bg-emerald-50'
                                                    : 'bg-gray-50/70 text-gray-500 hover:bg-gray-100 hover:text-heading'
                                        }`}
                                    >
                                        <span
                                            className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                                isActive
                                                    ? 'bg-white/20 text-white'
                                                    : isDone
                                                        ? 'bg-primary text-white'
                                                        : 'bg-gray-200/80 text-gray-600'
                                            }`}
                                        >
                                            {isDone ? '✓' : st.id}
                                        </span>
                                        <span className="text-xs font-bold truncate hidden sm:inline">
                                            {st.shortLabel}
                                        </span>
                                        <Icon size={14} className="sm:hidden shrink-0" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── MAIN WORKSPACE GRID ── */}
                <div
                    className={`grid gap-5 ${
                        isSplitDesktopActive ? 'xl:grid-cols-12 items-start' : 'grid-cols-1'
                    }`}
                >
                    <div
                        className={`space-y-5 ${
                            isSplitDesktopActive
                                ? 'xl:col-span-6'
                                : layoutMode === 'guided' && currentStep !== 3
                                    ? 'max-w-4xl mx-auto w-full'
                                    : 'w-full'
                        }`}
                    >
                        {/* STEP 1: CLIENT & GOAL */}
                        {(layoutMode === 'all' || currentStep === 1) && (
                            <StepInvoiceClient
                                formData={formData}
                                setFormData={setFormData}
                                allClients={allClients}
                                selectedClient={selectedClient}
                                onSelectClientObject={handleSelectClientObject}
                                onDetachClient={handleDetachClient}
                                onClientNameChange={handleClientNameChange}
                            />
                        )}

                        {/* STEP 2: SERVICES, AMOUNT & PAYMENT */}
                        {(layoutMode === 'all' || currentStep === 2) && (
                            <StepInvoiceItemsPayment
                                formData={formData}
                                setFormData={setFormData}
                                totalAmount={totalAmount}
                                formattedTotal={formattedTotal}
                                formattedBalance={formattedBalance}
                                onAddRow={handleAddRow}
                                onRemoveRow={handleRemoveRow}
                                onItemChange={handleItemChange}
                                onProcessQrFile={processQrFile}
                                onRemoveQr={handleRemoveQr}
                                hasSavedDefaults={hasSavedDefaults}
                                onSavePaymentDefaults={handleSavePaymentDefaults}
                                onClearPaymentDefaults={handleClearPaymentDefaults}
                            />
                        )}

                        {/* STEP 3: PREVIEW, SAVE & SHARE */}
                        {(layoutMode === 'all' || currentStep === 3) && (
                            <StepInvoiceReviewShare
                                formData={formData}
                                setFormData={setFormData}
                                debouncedInvoice={debouncedInvoice}
                                loadedInvoiceRecord={loadedInvoiceRecord}
                                onDetachLoadedInvoice={() => setLoadedInvoiceRecord(null)}
                                totalAmount={totalAmount}
                                enteredPaidAmount={enteredPaidAmount}
                                formattedTotal={formattedTotal}
                                formattedPaid={formattedPaid}
                                formattedBalance={formattedBalance}
                                savingToClientDb={savingToClientDb}
                                generating={generating}
                                onSaveAndDownloadPdf={handleSaveAndDownloadPdf}
                                onSaveInvoiceToDb={handleSaveInvoiceToDb}
                                onDownloadPdfOnly={handleDownloadPdfOnly}
                                onOpenWhatsApp={handleOpenWhatsApp}
                                onJumpToStep={layoutMode === 'guided' ? jumpToStep : null}
                                previewKey={previewKey}
                                onRefreshPreview={() => {
                                    setDebouncedInvoice(formData);
                                    setPreviewKey((k) => k + 1);
                                }}
                                PDFViewerComponent={PDFViewer}
                                InvoicePdfDocumentComponent={InvoicePdfDocument}
                            />
                        )}

                        {/* ── DESKTOP GUIDED STEP NAVIGATION FOOTER ── */}
                        {layoutMode === 'guided' && (
                            <div className="hidden md:flex items-center justify-between bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs">
                                <button
                                    type="button"
                                    disabled={currentStep === 1}
                                    onClick={() => jumpToStep(currentStep - 1)}
                                    className="min-h-10 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-heading text-xs font-bold disabled:opacity-40 transition cursor-pointer"
                                >
                                    <ArrowLeft size={14} />
                                    <span>Previous Step</span>
                                </button>

                                <span className="text-xs text-gray-400 font-medium">
                                    Step {currentStep} of 3 —{' '}
                                    {INVOICE_STEPS[currentStep - 1].shortLabel}
                                </span>

                                {currentStep < 3 ? (
                                    <button
                                        type="button"
                                        onClick={() => jumpToStep(currentStep + 1)}
                                        className="min-h-10 inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs transition cursor-pointer"
                                    >
                                        <span>
                                            Next: {INVOICE_STEPS[currentStep].shortLabel}
                                        </span>
                                        <ArrowRight size={14} />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={savingToClientDb || generating}
                                        onClick={() => handleSaveAndDownloadPdf('auto')}
                                        className="min-h-10 inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                                    >
                                        <Download size={14} />
                                        <span>Save Invoice &amp; Download PDF</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── OPTIONAL WIDE-DESKTOP SPLIT LIVE PDF COLUMN ── */}
                    {isSplitDesktopActive && (
                        <div className="hidden xl:flex xl:col-span-6 bg-white rounded-2xl p-3.5 border border-gray-200/80 shadow-xs flex-col sticky top-18 h-[calc(100dvh-6rem)]">
                            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-100">
                                <span className="text-xs font-bold text-heading flex items-center gap-1.5">
                                    <Eye size={14} className="text-primary" />
                                    Live Invoice Preview • ₹{formattedTotal}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDebouncedInvoice(formData);
                                        setPreviewKey((k) => k + 1);
                                    }}
                                    className="text-[11px] font-semibold text-gray-500 hover:text-primary inline-flex items-center gap-1 cursor-pointer"
                                >
                                    <RefreshCw size={12} />
                                    <span>Refresh</span>
                                </button>
                            </div>
                            <div className="flex-1 rounded-xl overflow-hidden border border-gray-200">
                                <PDFViewer
                                    key={previewKey}
                                    width="100%"
                                    height="100%"
                                    showToolbar={true}
                                >
                                    <InvoicePdfDocument invoice={debouncedInvoice} />
                                </PDFViewer>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── MOBILE THUMB-ZONE NAVIGATION & SAVE BAR (< md) ── */}
            <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 px-3.5 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-2 max-w-lg mx-auto">
                    {layoutMode === 'guided' && currentStep < 3 ? (
                        <>
                            {currentStep > 1 && (
                                <button
                                    type="button"
                                    onClick={() => jumpToStep(currentStep - 1)}
                                    className="min-h-11 px-3.5 rounded-xl bg-gray-100 active:bg-gray-200 text-heading font-bold text-xs inline-flex items-center justify-center gap-1 cursor-pointer shrink-0"
                                >
                                    <ArrowLeft size={14} />
                                    <span>Back</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => jumpToStep(currentStep + 1)}
                                className="flex-1 min-h-11 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                            >
                                <span>
                                    Next: {INVOICE_STEPS[currentStep].shortLabel}
                                </span>
                                <ArrowRight size={14} />
                            </button>
                        </>
                    ) : (
                        <>
                            {layoutMode === 'guided' && (
                                <button
                                    type="button"
                                    onClick={() => jumpToStep(2)}
                                    className="min-h-11 px-3 rounded-xl bg-gray-100 active:bg-gray-200 text-heading font-bold text-xs inline-flex items-center justify-center gap-1 cursor-pointer shrink-0"
                                >
                                    <ArrowLeft size={14} />
                                    <span>Back</span>
                                </button>
                            )}
                            <button
                                type="button"
                                disabled={savingToClientDb || generating}
                                onClick={() => handleSaveAndDownloadPdf('auto')}
                                className="flex-1 min-h-11 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                            >
                                {savingToClientDb || generating ? (
                                    <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                    <Download size={14} />
                                )}
                                <span>
                                    {loadedInvoiceRecord
                                        ? 'Update & Download PDF'
                                        : 'Save & Download PDF'}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={handleOpenWhatsApp}
                                className="min-h-11 px-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs inline-flex items-center justify-center cursor-pointer shrink-0"
                                title="Send WhatsApp Summary"
                            >
                                <Send size={15} />
                            </button>
                        </>
                    )}
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
                    Loading Invoice Builder...
                </div>
            }
        >
            <AdminInvoiceGeneratorContent />
        </Suspense>
    );
}
