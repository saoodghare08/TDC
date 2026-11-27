// ============================================================================
// Shared Constants, Package Quick-Picks & Helpers for Guided Invoice Builder
// ============================================================================

export const PAYMENT_STORAGE_KEY = 'tdc_invoice_payment_defaults_v1';
export const INVOICE_DRAFT_STORAGE_KEY = 'tdc_invoice_form_draft_v1';
export const AUTO_SAVE_DELAY_MS = 2000;

export const createRow = (description = '', amount = '') => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    description,
    amount,
});

export const EMPTY_INVOICE_STATE = {
    client_name: '',
    client_phone: '',
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

export const INVOICE_GOAL_CHIPS = [
    'Weight Loss Regimen',
    'PCOS Management Diet',
    'Body Transformation Regimen',
    'Therapeutic Diet Regimen',
    'Weight Gain Diet',
    'Gestational / Postnatal Diet',
    '1-on-1 Nutrition Consultation',
];

export const PACKAGE_QUICK_PICKS = [
    { label: '1 Month Program', description: '1 Month Personalized Clinical Diet Program' },
    { label: '3 Month Program', description: '3 Month Transformation & Lifestyle Diet Program' },
    { label: '6 Month Program', description: '6 Month Comprehensive Clinical Nutrition Program' },
    { label: '1-on-1 Consultation', description: '1-on-1 Clinical Dietitian Consultation & Assessment' },
    { label: 'Plan Renewal', description: 'Diet Program Renewal & Follow-Up Revisions' },
];

export const generateInvoiceMeta = () => {
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

export const hasInvoiceDraftContent = (data, savedPayment) => {
    if (!data || typeof data !== 'object') return false;
    if (String(data.client_name || '').trim() !== '') return true;
    if (String(data.client_phone || '').trim() !== '') return true;
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

export const formatInr = (val) =>
    (Number.isFinite(val) ? val : 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

export const escapeHtmlText = (str) =>
    String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

/**
 * Normalizes any browser-readable image file (PNG, JPG, WEBP, etc.)
 * into a clean PNG Data URL with a white background for @react-pdf/renderer.
 */
export const convertImageFileToPngDataUrl = (file) =>
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
