import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { sanitizePdfText } from './pdfSanitizer';

// Static Brand Palette (The Diet Cascade)
const BRAND = {
    primary: '#2d6a4f',
    primaryDark: '#1b4332',
    primaryLight: '#ecfdf5',
    primaryBorder: '#a7f3d0',
    accent: '#fdbc00',
    accentDark: '#92400e',
    accentLight: '#fef3c7',
    heading: '#000a2d',
    text: '#1e293b',
    muted: '#64748b',
    subtle: '#94a3b8',
    surface: '#f8fafc',
    surfaceAlt: '#f1f5f9',
    border: '#e2e8f0',
    borderStrong: '#cbd5e1',
    white: '#ffffff',
    paidBg: '#dcfce7',
    paidBorder: '#86efac',
    paidText: '#166534',
    partialBg: '#fef3c7',
    partialSurface: '#fffbeb',
    partialBorder: '#fcd34d',
    partialStrong: '#d97706',
    partialText: '#92400e',
    unpaidBg: '#fef2f2',
    unpaidBorder: '#fecaca',
    unpaidText: '#dc2626',
};

const styles = StyleSheet.create({
    page: {
        paddingTop: 0,
        paddingBottom: 56,
        paddingHorizontal: 0,
        fontSize: 9.5,
        fontFamily: 'Helvetica',
        color: BRAND.text,
        backgroundColor: BRAND.white,
    },
    topAccentBar: {
        flexDirection: 'row',
        height: 6,
        width: '100%',
    },
    topAccentPrimary: {
        flex: 3,
        backgroundColor: BRAND.primary,
    },
    topAccentGold: {
        flex: 1,
        backgroundColor: BRAND.accent,
    },
    contentWrapper: {
        paddingTop: 24,
        paddingHorizontal: 36,
    },

    // ─── Static Brand Header ───
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingBottom: 16,
        borderBottomWidth: 1.5,
        borderBottomColor: BRAND.primary,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        maxWidth: '64%',
    },
    logoBox: {
        width: 46,
        height: 46,
        borderRadius: 8,
        backgroundColor: BRAND.surface,
        borderWidth: 1,
        borderColor: BRAND.border,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
    },
    logoImage: {
        width: 36,
        height: 36,
        objectFit: 'contain',
    },
    brandTextCol: {
        marginLeft: 12,
    },
    brandTitle: {
        fontSize: 18,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.primary,
        letterSpacing: 0.6,
    },
    brandSubtitle: {
        fontSize: 8.5,
        color: BRAND.muted,
        marginTop: 2,
    },
    brandStaticMeta: {
        fontSize: 7.5,
        color: BRAND.muted,
        marginTop: 3,
    },
    invoiceBadgeCol: {
        alignItems: 'flex-end',
    },
    invoiceTag: {
        backgroundColor: BRAND.accent,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 4,
    },
    invoiceTagText: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.heading,
        letterSpacing: 1,
    },
    invoiceMetaRow: {
        marginTop: 6,
        alignItems: 'flex-end',
    },
    invoiceMetaLabel: {
        fontSize: 7.5,
        color: BRAND.muted,
        marginTop: 1.5,
    },
    invoiceMetaStrong: {
        fontFamily: 'Helvetica-Bold',
        color: BRAND.heading,
    },

    // ─── Client, Goal & Status Card ───
    clientSection: {
        marginTop: 18,
        marginBottom: 18,
        padding: 14,
        backgroundColor: BRAND.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: BRAND.border,
        borderLeftWidth: 4,
        borderLeftColor: BRAND.primary,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    clientDetailsLeft: {
        flex: 1,
        paddingRight: 16,
    },
    fieldLabel: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.muted,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    clientNameValue: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.heading,
        marginTop: 3,
    },
    goalRow: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    goalLabel: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.muted,
        marginRight: 5,
    },
    goalValue: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.primary,
        flex: 1,
    },
    statusColRight: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    statusBadge: {
        marginTop: 4,
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 6,
        borderWidth: 1,
    },
    statusBadgePaid: {
        backgroundColor: BRAND.paidBg,
        borderColor: BRAND.paidBorder,
    },
    statusBadgePartial: {
        backgroundColor: BRAND.partialBg,
        borderColor: BRAND.partialBorder,
    },
    statusBadgeUnpaid: {
        backgroundColor: BRAND.unpaidBg,
        borderColor: BRAND.unpaidBorder,
    },
    statusBadgeText: {
        fontSize: 9.5,
        fontFamily: 'Helvetica-Bold',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    statusTextPaid: {
        color: BRAND.paidText,
    },
    statusTextPartial: {
        color: BRAND.partialText,
    },
    statusTextUnpaid: {
        color: BRAND.unpaidText,
    },

    // ─── 2-Column Line Items Table (Description & Amount) ───
    tableSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    tableSectionTitle: {
        fontSize: 9.5,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    tableSectionLine: {
        flex: 1,
        height: 1,
        backgroundColor: BRAND.border,
        marginLeft: 8,
    },
    tableContainer: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: BRAND.borderStrong,
        overflow: 'hidden',
        marginBottom: 18,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: BRAND.primary,
        paddingVertical: 9,
        paddingHorizontal: 14,
        alignItems: 'center',
    },
    colDescHeader: {
        width: '74%',
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.white,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    colAmountHeader: {
        width: '26%',
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.white,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        textAlign: 'right',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: BRAND.border,
        backgroundColor: BRAND.white,
        alignItems: 'center',
    },
    tableRowAlt: {
        backgroundColor: BRAND.surface,
    },
    colDescCell: {
        width: '74%',
        paddingRight: 12,
    },
    descText: {
        fontSize: 9.5,
        color: BRAND.text,
        lineHeight: 1.35,
    },
    colAmountCell: {
        width: '26%',
        alignItems: 'flex-end',
    },
    amountText: {
        fontSize: 9.5,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.heading,
        textAlign: 'right',
    },
    emptyRow: {
        paddingVertical: 16,
        paddingHorizontal: 14,
        alignItems: 'center',
        backgroundColor: BRAND.white,
        borderBottomWidth: 1,
        borderBottomColor: BRAND.border,
    },
    emptyRowText: {
        fontSize: 8.5,
        color: BRAND.subtle,
        fontStyle: 'italic',
    },

    // ─── Summary Rows (Total, and Partly Paid Breakdown) ───
    totalRowFinal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: BRAND.primaryLight,
        borderTopWidth: 1.5,
        borderTopColor: BRAND.primary,
        paddingVertical: 11,
        paddingHorizontal: 14,
    },
    totalFinalLabelText: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.primaryDark,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    totalFinalAmountText: {
        fontSize: 13,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.primaryDark,
        textAlign: 'right',
    },
    subtotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: BRAND.surfaceAlt,
        borderTopWidth: 1,
        borderTopColor: BRAND.borderStrong,
        paddingVertical: 8.5,
        paddingHorizontal: 14,
    },
    subtotalLabelText: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.heading,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    subtotalAmountText: {
        fontSize: 10.5,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.heading,
        textAlign: 'right',
    },
    paidSummaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: BRAND.white,
        borderTopWidth: 1,
        borderTopColor: BRAND.border,
        paddingVertical: 8,
        paddingHorizontal: 14,
    },
    paidSummaryLabelGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    paidSummaryLabelText: {
        fontSize: 8.5,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.paidText,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    paidSummaryAmountText: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.paidText,
        textAlign: 'right',
    },
    balanceRowPartial: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: BRAND.partialSurface,
        borderTopWidth: 1.5,
        borderTopColor: BRAND.partialStrong,
        paddingVertical: 11,
        paddingHorizontal: 14,
    },
    balanceLabelCol: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    balanceLabelText: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.partialText,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    totalSubPill: {
        marginLeft: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 0.8,
    },
    totalSubPillText: {
        fontSize: 6.5,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    balanceAmountText: {
        fontSize: 12.5,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.partialText,
        textAlign: 'right',
    },

    // ─── Payment Info (UPI ID & QR Image) ───
    paymentCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: BRAND.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: BRAND.border,
        padding: 14,
        marginTop: 2,
    },
    paymentInfoCol: {
        flex: 1,
        paddingRight: 16,
    },
    paymentHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    paymentDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: BRAND.primary,
        marginRight: 6,
    },
    paymentTitle: {
        fontSize: 9.5,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.heading,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    upiBox: {
        backgroundColor: BRAND.white,
        borderWidth: 1,
        borderColor: BRAND.borderStrong,
        borderRadius: 6,
        paddingVertical: 7,
        paddingHorizontal: 10,
        marginBottom: 8,
        alignSelf: 'flex-start',
        minWidth: 210,
    },
    upiLabel: {
        fontSize: 6.5,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.muted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    upiValue: {
        fontSize: 10.5,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.primary,
        marginTop: 2,
    },
    paymentNoteBox: {
        paddingVertical: 6,
        paddingHorizontal: 9,
        borderRadius: 5,
        borderLeftWidth: 3,
    },
    paymentNotePaid: {
        backgroundColor: BRAND.paidBg,
        borderLeftColor: BRAND.paidText,
    },
    paymentNoteUnpaid: {
        backgroundColor: BRAND.accentLight,
        borderLeftColor: BRAND.accentDark,
    },
    paymentNoteText: {
        fontSize: 8,
        lineHeight: 1.35,
    },
    qrContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: BRAND.white,
        borderWidth: 1,
        borderColor: BRAND.borderStrong,
        borderRadius: 8,
        padding: 8,
        width: 116,
    },
    qrImage: {
        width: 96,
        height: 96,
        objectFit: 'contain',
    },
    qrCaption: {
        fontSize: 6.5,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginTop: 4,
    },

    // ─── Static Disclaimer Note ───
    staticNoteRow: {
        marginTop: 16,
        paddingTop: 8,
        borderTopWidth: 0.5,
        borderTopColor: BRAND.border,
    },
    staticNoteText: {
        fontSize: 7.2,
        color: BRAND.subtle,
        fontStyle: 'italic',
        lineHeight: 1.35,
    },

    // ─── Static Footer (Pinned Bottom) ───
    footerContainer: {
        position: 'absolute',
        bottom: 18,
        left: 36,
        right: 36,
        borderTopWidth: 1,
        borderTopColor: BRAND.borderStrong,
        paddingTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerBrandGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerLogoSmall: {
        width: 16,
        height: 16,
        objectFit: 'contain',
        marginRight: 6,
    },
    footerNote: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.heading,
    },
    footerContact: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.primary,
    },
    pageNumber: {
        fontSize: 7,
        color: BRAND.subtle,
    },
});

const sanitizeInvoiceText = (value, fallback = '') => {
    if (value === null || value === undefined) return fallback;
    // Replace Indian Rupee symbol with WinAnsi-safe 'Rs. ' for standard PDF Helvetica
    const normalized = String(value)
        .replace(/\u20B9/g, 'Rs. ')
        .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, (ch) => ch);
    const cleaned = sanitizePdfText(normalized, fallback);
    // Strip any remaining non-WinAnsi codepoints (> U+00FF) so Helvetica never renders boxes
    const winAnsiSafe = cleaned.replace(/[^\x20-\x7E\xA0-\xFF]/g, '').trim();
    return winAnsiSafe || fallback;
};

export const parseAmountNumber = (raw) => {
    if (raw === null || raw === undefined || raw === '') return 0;
    if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
    const cleaned = String(raw).replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
};

export const formatPdfCurrency = (num) => {
    const safeNum = Number.isFinite(num) ? num : 0;
    const formatted = safeNum.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `Rs. ${formatted}`;
};

export default function InvoicePdfDocument({ invoice }) {
    const clientName = sanitizeInvoiceText(invoice?.client_name, 'Valued Client');
    const goal = sanitizeInvoiceText(invoice?.goal, 'Personalized Nutrition & Wellness Program');

    const rawStatus = String(invoice?.status || 'unpaid').toLowerCase();
    const isPaid = rawStatus === 'paid';
    const isPartlyPaid = rawStatus === 'partly_paid';

    const upiId = sanitizeInvoiceText(invoice?.upi_id, '');
    const qrImage = typeof invoice?.qr_image === 'string' && invoice.qr_image.trim() !== ''
        ? invoice.qr_image.trim()
        : '';

    const invoiceNumber = sanitizeInvoiceText(invoice?.invoice_number, 'TDC-INV-001');
    const invoiceDate = sanitizeInvoiceText(invoice?.invoice_date, '-');

    const rawItems = Array.isArray(invoice?.items) ? invoice.items : [];
    const items = rawItems
        .filter((row) => row && (String(row.description || '').trim() !== '' || String(row.amount || '').trim() !== ''))
        .map((row, idx) => {
            const amountNum = parseAmountNumber(row.amount);
            return {
                description: sanitizeInvoiceText(row.description, `Item ${idx + 1}`),
                amountNum,
            };
        });

    const totalAmount = items.reduce((sum, item) => sum + item.amountNum, 0);
    const enteredPaidAmount = Math.max(0, parseAmountNumber(invoice?.amount_paid));
    const paidAmount = isPaid
        ? totalAmount
        : isPartlyPaid
            ? Math.min(enteredPaidAmount, totalAmount)
            : 0;
    const balanceAmount = isPaid
        ? 0
        : isPartlyPaid
            ? Math.max(0, totalAmount - paidAmount)
            : totalAmount;

    const statusBadgeStyle = isPaid
        ? styles.statusBadgePaid
        : isPartlyPaid
            ? styles.statusBadgePartial
            : styles.statusBadgeUnpaid;

    const statusTextStyle = isPaid
        ? styles.statusTextPaid
        : isPartlyPaid
            ? styles.statusTextPartial
            : styles.statusTextUnpaid;

    const statusLabel = isPaid
        ? 'PAID'
        : isPartlyPaid
            ? 'PARTLY PAID'
            : 'UNPAID';

    const paymentMessage = isPaid
        ? 'Payment received in full with thanks. Wishing you a healthy and transformative journey with The Diet Cascade!'
        : isPartlyPaid
            ? qrImage
                ? `Partial payment of ${formatPdfCurrency(paidAmount)} received. Please pay the remaining balance of ${formatPdfCurrency(balanceAmount)} by scanning the QR code alongside or via the UPI ID above.`
                : `Partial payment of ${formatPdfCurrency(paidAmount)} received. Please complete the remaining balance of ${formatPdfCurrency(balanceAmount)} via the UPI ID listed above.`
            : qrImage
                ? 'Scan the QR code alongside using any UPI app (Google Pay, PhonePe, Paytm, BHIM) or send payment directly to the UPI ID above.'
                : 'Please complete the payment via UPI using the UPI ID listed above and share confirmation on WhatsApp.';

    const logoSrc = typeof window !== 'undefined'
        ? `${window.location.origin}/images/logo.png`
        : '/images/logo.png';

    return (
        <Document
            title={`Invoice_${clientName.replace(/\s+/g, '_')}_The_Diet_Cascade`}
            author="Dt. Sabah Ghare - The Diet Cascade"
        >
            <Page size="A4" style={styles.page}>
                {/* Static Top Brand Bar */}
                <View style={styles.topAccentBar} fixed>
                    <View style={styles.topAccentPrimary} />
                    <View style={styles.topAccentGold} />
                </View>

                <View style={styles.contentWrapper}>
                    {/* ══════ STATIC HEADER & LOGO ══════ */}
                    <View style={styles.headerContainer}>
                        <View style={styles.brandRow}>
                            <View style={styles.logoBox}>
                                <Image src={logoSrc} style={styles.logoImage} alt="The Diet Cascade Logo" />
                            </View>
                            <View style={styles.brandTextCol}>
                                <Text style={styles.brandTitle}>THE DIET CASCADE</Text>
                                <Text style={styles.brandSubtitle}>
                                    Clinical Nutrition & Lifestyle Transformation
                                </Text>
                                <Text style={styles.brandStaticMeta}>
                                    Dt. Sabah Ghare | Nerul, Navi Mumbai, Maharashtra, India
                                </Text>
                                <Text style={styles.brandStaticMeta}>
                                    sabahghare24@gmail.com | +91 90044 91160 | www.thedietcascade.com
                                </Text>
                            </View>
                        </View>

                        <View style={styles.invoiceBadgeCol}>
                            <View style={styles.invoiceTag}>
                                <Text style={styles.invoiceTagText}>INVOICE</Text>
                            </View>
                            <View style={styles.invoiceMetaRow}>
                                <Text style={styles.invoiceMetaLabel}>
                                    Invoice No: <Text style={styles.invoiceMetaStrong}>{invoiceNumber}</Text>
                                </Text>
                                <Text style={styles.invoiceMetaLabel}>
                                    Date: <Text style={styles.invoiceMetaStrong}>{invoiceDate}</Text>
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* ══════ CLIENT NAME, GOAL & STATUS ══════ */}
                    <View style={styles.clientSection}>
                        <View style={styles.clientDetailsLeft}>
                            <Text style={styles.fieldLabel}>Billed To</Text>
                            <Text style={styles.clientNameValue}>{clientName}</Text>
                            <View style={styles.goalRow}>
                                <Text style={styles.goalLabel}>Program / Goal:</Text>
                                <Text style={styles.goalValue}>{goal}</Text>
                            </View>
                        </View>

                        <View style={styles.statusColRight}>
                            <Text style={styles.fieldLabel}>Payment Status</Text>
                            <View style={[styles.statusBadge, statusBadgeStyle]}>
                                <Text style={[styles.statusBadgeText, statusTextStyle]}>
                                    {statusLabel}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* ══════ 2-COLUMN DESCRIPTION & AMOUNT TABLE ══════ */}
                    <View style={styles.tableSectionHeader}>
                        <Text style={styles.tableSectionTitle}>Invoice Summary</Text>
                        <View style={styles.tableSectionLine} />
                    </View>

                    <View style={styles.tableContainer}>
                        {/* Table Header */}
                        <View style={styles.tableHeaderRow}>
                            <Text style={styles.colDescHeader}>Description</Text>
                            <Text style={styles.colAmountHeader}>Amount (INR)</Text>
                        </View>

                        {/* Table Rows */}
                        {items.length > 0 ? (
                            items.map((item, index) => (
                                <View
                                    key={index}
                                    style={
                                        index % 2 === 1
                                            ? [styles.tableRow, styles.tableRowAlt]
                                            : styles.tableRow
                                    }
                                    wrap={false}
                                >
                                    <View style={styles.colDescCell}>
                                        <Text style={styles.descText}>{item.description}</Text>
                                    </View>
                                    <View style={styles.colAmountCell}>
                                        <Text style={styles.amountText}>
                                            {formatPdfCurrency(item.amountNum)}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyRow}>
                                <Text style={styles.emptyRowText}>
                                    No invoice line items added yet.
                                </Text>
                            </View>
                        )}

                        {/* Summary Rows */}
                        {isPartlyPaid ? (
                            <>
                                {/* Total Amount Row */}
                                <View style={styles.subtotalRow} wrap={false}>
                                    <Text style={styles.subtotalLabelText}>Total Amount</Text>
                                    <Text style={styles.subtotalAmountText}>
                                        {formatPdfCurrency(totalAmount)}
                                    </Text>
                                </View>

                                {/* Amount Paid Row */}
                                <View style={styles.paidSummaryRow} wrap={false}>
                                    <View style={styles.paidSummaryLabelGroup}>
                                        <Text style={styles.paidSummaryLabelText}>Amount Paid</Text>
                                        <View style={[styles.totalSubPill, styles.statusBadgePaid]}>
                                            <Text style={[styles.totalSubPillText, styles.statusTextPaid]}>
                                                Received
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.paidSummaryAmountText}>
                                        - {formatPdfCurrency(paidAmount)}
                                    </Text>
                                </View>

                                {/* Balance Amount Table Row (Only when Partly Paid) */}
                                <View style={styles.balanceRowPartial} wrap={false}>
                                    <View style={styles.balanceLabelCol}>
                                        <Text style={styles.balanceLabelText}>
                                            Balance Amount
                                        </Text>
                                        <View style={[styles.totalSubPill, styles.statusBadgePartial]}>
                                            <Text style={[styles.totalSubPillText, styles.statusTextPartial]}>
                                                Remaining Due
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.balanceAmountText}>
                                        {formatPdfCurrency(balanceAmount)}
                                    </Text>
                                </View>
                            </>
                        ) : (
                            <View style={styles.totalRowFinal} wrap={false}>
                                <View style={styles.balanceLabelCol}>
                                    <Text style={styles.totalFinalLabelText}>Total Amount</Text>
                                    <View style={[styles.totalSubPill, statusBadgeStyle]}>
                                        <Text style={[styles.totalSubPillText, statusTextStyle]}>
                                            {isPaid ? 'Paid in Full' : 'Unpaid'}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.totalFinalAmountText}>
                                    {formatPdfCurrency(totalAmount)}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* ══════ UPI ID & QR IMAGE PAYMENT SECTION ══════ */}
                    <View style={styles.paymentCard} wrap={false}>
                        <View style={styles.paymentInfoCol}>
                            <View style={styles.paymentHeaderRow}>
                                <View style={styles.paymentDot} />
                                <Text style={styles.paymentTitle}>Payment Details (UPI)</Text>
                            </View>

                            <View style={styles.upiBox}>
                                <Text style={styles.upiLabel}>UPI ID</Text>
                                <Text style={styles.upiValue}>
                                    {upiId || 'Not specified'}
                                </Text>
                            </View>

                            <View
                                style={[
                                    styles.paymentNoteBox,
                                    isPaid ? styles.paymentNotePaid : styles.paymentNoteUnpaid,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.paymentNoteText,
                                        { color: isPaid ? BRAND.paidText : BRAND.accentDark },
                                    ]}
                                >
                                    {paymentMessage}
                                </Text>
                            </View>
                        </View>

                        {qrImage ? (
                            <View style={styles.qrContainer}>
                                <Image src={qrImage} style={styles.qrImage} alt="UPI Payment QR Code" />
                                <Text style={styles.qrCaption}>Scan to Pay</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Static Computer-Generated Note */}
                    <View style={styles.staticNoteRow} wrap={false}>
                        <Text style={styles.staticNoteText}>
                            Note: This is an official computer-generated invoice issued by The Diet Cascade and does not require a physical signature. Fees paid towards customized nutrition programs are governed by clinic terms at www.thedietcascade.com/privacy.
                        </Text>
                    </View>
                </View>

                {/* ══════ STATIC FOOTER & LOGO ══════ */}
                <View style={styles.footerContainer} fixed>
                    <View style={styles.footerBrandGroup}>
                        <Image src={logoSrc} style={styles.footerLogoSmall} alt="The Diet Cascade Logo" />
                        <Text style={styles.footerNote}>
                            The Diet Cascade | Dt. Sabah Ghare
                        </Text>
                    </View>
                    <Text style={styles.footerContact}>
                        WhatsApp: +91 90044 91160 | @thedietcascade
                    </Text>
                    <Text
                        style={styles.pageNumber}
                        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                    />
                </View>
            </Page>
        </Document>
    );
}
