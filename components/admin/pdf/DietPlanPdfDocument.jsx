import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import DietPlanSeniorPdfDocument from './DietPlanSeniorPdfDocument';
import { cleanPlanData } from './pdfSanitizer';

const styles = StyleSheet.create({
    page: {
        paddingTop: 28,
        paddingBottom: 32,
        paddingHorizontal: 32,
        fontSize: 9,
        fontFamily: 'Helvetica',
        color: '#1e293b',
        backgroundColor: '#ffffff',
    },
    // Top Brand Header
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 12,
        borderBottomWidth: 1.5,
        borderBottomColor: '#2d6a4f',
    },
    logoImage: {
        width: 36,
        height: 28,
        objectFit: 'contain',
    },
    logoImageSmall: {
        width: 24,
        height: 18,
        objectFit: 'contain',
    },
    brandTitle: {
        fontSize: 18,
        fontFamily: 'Helvetica-Bold',
        color: '#2d6a4f',
        letterSpacing: 0.5,
    },
    brandSubtitle: {
        fontSize: 8,
        color: '#64748b',
        marginTop: 2,
    },
    badgeContainer: {
        alignItems: 'flex-end',
    },
    clinicBadge: {
        backgroundColor: '#fdbc00',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    clinicBadgeText: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#000a2d',
    },
    dietitianText: {
        fontSize: 7.5,
        color: '#64748b',
        marginTop: 3,
    },

    // Client Info Strip
    clientCard: {
        marginTop: 8,
        marginBottom: 10,
        padding: 8,
        backgroundColor: '#f8fafc',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    clientBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 4,
        marginBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    planTitleText: {
        fontSize: 9.5,
        fontFamily: 'Helvetica-Bold',
        color: '#2d6a4f',
    },
    planGoalText: {
        fontSize: 7.5,
        color: '#64748b',
        marginTop: 1,
    },
    clientGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    clientCol4: {
        width: '24%',
        marginBottom: 2,
    },
    clientCol3: {
        width: '32%',
    },
    infoLabel: {
        fontSize: 6.5,
        color: '#64748b',
        textTransform: 'uppercase',
        fontFamily: 'Helvetica-Bold',
        letterSpacing: 0.2,
    },
    infoValue: {
        fontSize: 8,
        color: '#000a2d',
        fontFamily: 'Helvetica-Bold',
        marginTop: 1,
    },
    clinicalStrip: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 6,
        paddingVertical: 3.5,
        borderRadius: 4,
        marginTop: 4,
    },
    clinicalLabel: {
        fontSize: 6,
        fontFamily: 'Helvetica-Bold',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: 0.2,
    },
    clinicalValue: {
        fontSize: 7.5,
        fontFamily: 'Helvetica',
        color: '#0f172a',
        marginTop: 1,
    },

    // Macro & Calorie Bar
    targetsCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#2d6a4f',
        borderRadius: 6,
        paddingVertical: 7,
        paddingHorizontal: 12,
        marginBottom: 14,
    },
    targetItem: {
        alignItems: 'center',
    },
    targetLabel: {
        fontSize: 7,
        color: '#e2e8f0',
        textTransform: 'uppercase',
    },
    targetValue: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: '#ffffff',
        marginTop: 1,
    },
    targetDivider: {
        width: 1,
        height: 16,
        backgroundColor: 'rgba(255,255,255,0.25)',
    },

    // Section Titles
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: '#2d6a4f',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e2e8f0',
        marginLeft: 8,
    },

    // Meal Card
    mealCard: {
        marginBottom: 7,
        backgroundColor: '#ffffff',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
    },
    mealHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    mealName: {
        fontSize: 8.5,
        fontFamily: 'Helvetica-Bold',
        color: '#000a2d',
    },
    mealTimePill: {
        backgroundColor: '#fef3c7',
        borderWidth: 0.5,
        borderColor: '#f59e0b',
        paddingHorizontal: 6,
        paddingVertical: 1.5,
        borderRadius: 3,
    },
    mealTimeText: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: '#92400e',
    },
    mealBody: {
        padding: 6,
        paddingHorizontal: 8,
    },
    optionRow: {
        flexDirection: 'row',
        marginBottom: 2.5,
    },
    optionTagPrimary: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: '#2d6a4f',
        width: 52,
    },
    optionTagAlt: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: '#d97706',
        width: 52,
    },
    optionContent: {
        fontSize: 8.2,
        color: '#334155',
        flex: 1,
        lineHeight: 1.25,
    },
    chefNoteContainer: {
        marginTop: 2,
        paddingTop: 2,
        borderTopWidth: 0.5,
        borderTopColor: '#f1f5f9',
        flexDirection: 'row',
    },
    chefNoteLabel: {
        fontSize: 6.8,
        fontFamily: 'Helvetica-Bold',
        color: '#64748b',
        width: 52,
    },
    chefNoteText: {
        fontSize: 7.2,
        color: '#64748b',
        fontStyle: 'italic',
        flex: 1,
    },

    // Prescribed Supplements Protocol (Horizontal Card)
    supplementsCard: {
        backgroundColor: '#ffffff',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderLeftWidth: 3,
        borderLeftColor: '#2d6a4f',
        padding: 6,
        paddingHorizontal: 7,
        marginTop: 6,
    },
    supplementsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
        paddingBottom: 3,
        borderBottomWidth: 0.5,
        borderBottomColor: '#f1f5f9',
    },
    supplementsIndicator: {
        width: 4.5,
        height: 4.5,
        borderRadius: 2.25,
        backgroundColor: '#2d6a4f',
        marginRight: 4,
    },
    supplementsTitle: {
        fontSize: 7.2,
        fontFamily: 'Helvetica-Bold',
        color: '#000a2d',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    supplementsBadge: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 3,
    },
    supplementsBadgeText: {
        fontSize: 5.8,
        fontFamily: 'Helvetica-Bold',
        color: '#2d6a4f',
        textTransform: 'uppercase',
    },
    supplementsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    supplementPillCard: {
        width: '48.8%',
        backgroundColor: '#f8fafc',
        borderWidth: 0.5,
        borderColor: '#e2e8f0',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 3,
        marginBottom: 3,
        flexDirection: 'row',
        alignItems: 'center',
    },
    supplementDot: {
        width: 3.5,
        height: 3.5,
        borderRadius: 1.75,
        backgroundColor: '#fdbc00',
        marginRight: 5,
    },
    supplementInfo: {
        flex: 1,
    },
    supplementNameText: {
        fontSize: 7.2,
        fontFamily: 'Helvetica-Bold',
        color: '#000a2d',
    },
    supplementMetaText: {
        fontSize: 6.6,
        color: '#475569',
        marginTop: 0.5,
    },
    supplementDosageText: {
        fontSize: 6.6,
        fontFamily: 'Helvetica-Bold',
        color: '#166534',
    },
    supplementTimingText: {
        fontSize: 6.5,
        color: '#b45309',
    },
    emptySupplementsText: {
        fontSize: 6.8,
        color: '#94a3b8',
        fontStyle: 'italic',
        paddingVertical: 2,
    },

    // Unified Guidelines & Food Restrictions Section
    unifiedRulesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    ruleColHalf: {
        width: '48.8%',
    },
    ruleBox: {
        backgroundColor: '#f8fafc',
        borderRadius: 6,
        borderWidth: 1,
        overflow: 'hidden',
        minHeight: 68,
    },
    ruleBoxGreen: {
        borderColor: '#bbf7d0',
    },
    ruleBoxRed: {
        borderColor: '#fed7aa',
    },
    ruleHeaderGreen: {
        backgroundColor: '#ecfdf5',
        borderBottomWidth: 1,
        borderBottomColor: '#bbf7d0',
        paddingVertical: 3.5,
        paddingHorizontal: 7,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    ruleHeaderRed: {
        backgroundColor: '#fff7ed',
        borderBottomWidth: 1,
        borderBottomColor: '#fed7aa',
        paddingVertical: 3.5,
        paddingHorizontal: 7,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    ruleTitleGreen: {
        fontSize: 7.2,
        fontFamily: 'Helvetica-Bold',
        color: '#166534',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    ruleTitleRed: {
        fontSize: 7.2,
        fontFamily: 'Helvetica-Bold',
        color: '#c2410c',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    ruleBadgeGreen: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 3,
    },
    ruleBadgeRed: {
        backgroundColor: '#ffedd5',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 3,
    },
    ruleBadgeTextGreen: {
        fontSize: 5.8,
        fontFamily: 'Helvetica-Bold',
        color: '#15803d',
    },
    ruleBadgeTextRed: {
        fontSize: 5.8,
        fontFamily: 'Helvetica-Bold',
        color: '#9a3412',
    },
    ruleBody: {
        padding: 5.5,
        paddingHorizontal: 7,
    },
    ruleBulletItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 2.5,
    },
    ruleBulletDotGreen: {
        width: 3.5,
        height: 3.5,
        borderRadius: 1.75,
        backgroundColor: '#16a34a',
        marginRight: 5,
        marginTop: 3,
    },
    ruleBulletDotRed: {
        width: 3.5,
        height: 3.5,
        borderRadius: 1.75,
        backgroundColor: '#dc2626',
        marginRight: 5,
        marginTop: 3,
    },
    ruleBulletText: {
        fontSize: 7,
        color: '#334155',
        flex: 1,
        lineHeight: 1.25,
    },
    emptyRuleText: {
        fontSize: 6.8,
        color: '#94a3b8',
        fontStyle: 'italic',
        paddingVertical: 2,
    },

    // Footer
    footerContainer: {
        position: 'absolute',
        bottom: 18,
        left: 32,
        right: 32,
        borderTopWidth: 0.8,
        borderTopColor: '#cbd5e1',
        paddingTop: 6,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerNote: {
        fontSize: 6.5,
        color: '#94a3b8',
    },
    footerContact: {
        fontSize: 6.5,
        fontFamily: 'Helvetica-Bold',
        color: '#2d6a4f',
    },
    pageNumber: {
        fontSize: 6.5,
        color: '#94a3b8',
    },

    // Personal Note Card
    personalNoteCard: {
        backgroundColor: '#f0fdf4',
        borderLeftWidth: 3,
        borderLeftColor: '#2d6a4f',
        padding: 7,
        marginTop: 6,
        borderRadius: 3,
    },
    personalNoteText: {
        fontSize: 7.5,
        color: '#166534',
        fontStyle: 'italic',
        lineHeight: 1.25,
    },

    // Medical Disclaimer
    disclaimerCard: {
        backgroundColor: '#f8fafc',
        borderWidth: 0.6,
        borderColor: '#e2e8f0',
        borderRadius: 4,
        paddingVertical: 4,
        paddingHorizontal: 6,
        marginTop: 6,
    },
    disclaimerTitle: {
        fontSize: 6,
        fontFamily: 'Helvetica-Bold',
        color: '#64748b',
        marginBottom: 1.5,
        letterSpacing: 0.4,
    },
    disclaimerText: {
        fontSize: 5.6,
        color: '#64748b',
        lineHeight: 1.25,
    },

    // ─── Recipe Annexure Table (Page 3) ───
    recipeTableContainer: {
        marginTop: 6,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 6,
        overflow: 'hidden',
    },
    recipeTableHeader: {
        flexDirection: 'row',
        backgroundColor: '#000a2d',
        paddingVertical: 5,
        paddingHorizontal: 8,
    },
    recipeCol1Header: {
        width: '26%',
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: '#ffffff',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    recipeCol2Header: {
        width: '33%',
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: '#ffffff',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    recipeCol3Header: {
        width: '41%',
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: '#ffffff',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    recipeTableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingVertical: 7,
        paddingHorizontal: 8,
        minHeight: 70,
    },
    recipeTableRowAlt: {
        backgroundColor: '#fafbfc',
    },
    recipeCol1: {
        width: '26%',
        paddingRight: 8,
    },
    recipeCol2: {
        width: '33%',
        paddingRight: 8,
        borderLeftWidth: 0.5,
        borderLeftColor: '#e2e8f0',
        paddingLeft: 7,
    },
    recipeCol3: {
        width: '41%',
        borderLeftWidth: 0.5,
        borderLeftColor: '#e2e8f0',
        paddingLeft: 7,
    },
    recipeDishName: {
        fontSize: 8.2,
        fontFamily: 'Helvetica-Bold',
        color: '#000a2d',
        marginBottom: 2,
    },
    recipeCategoryBadge: {
        backgroundColor: '#ecfdf5',
        borderWidth: 0.5,
        borderColor: '#a7f3d0',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 3,
        alignSelf: 'flex-start',
        marginBottom: 3,
    },
    recipeCategoryBadgeText: {
        fontSize: 5.8,
        fontFamily: 'Helvetica-Bold',
        color: '#166534',
        textTransform: 'uppercase',
    },
    recipeMetaText: {
        fontSize: 6.6,
        color: '#64748b',
        marginBottom: 3,
    },
    recipeMacroBox: {
        backgroundColor: '#f1f5f9',
        borderRadius: 4,
        padding: 4,
        marginTop: 2,
    },
    recipeMacroCal: {
        fontSize: 7.2,
        fontFamily: 'Helvetica-Bold',
        color: '#166534',
    },
    recipeMacroPills: {
        fontSize: 6.3,
        color: '#475569',
        marginTop: 1,
    },
    recipeIngredientItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 2.5,
    },
    recipeIngredientDot: {
        width: 3.5,
        height: 3.5,
        borderRadius: 1.75,
        backgroundColor: '#2d6a4f',
        marginRight: 5,
        marginTop: 3,
    },
    recipeIngredientText: {
        fontSize: 6.8,
        color: '#334155',
        flex: 1,
        lineHeight: 1.25,
    },
    recipeStepItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 2.5,
    },
    recipeStepNumber: {
        fontSize: 6.6,
        fontFamily: 'Helvetica-Bold',
        color: '#2d6a4f',
        width: 12,
        lineHeight: 1.25,
    },
    recipeStepText: {
        fontSize: 6.8,
        color: '#334155',
        flex: 1,
        lineHeight: 1.25,
    },
    recipeTipBox: {
        backgroundColor: '#f0fdf4',
        borderLeftWidth: 2,
        borderLeftColor: '#2d6a4f',
        padding: 3.5,
        paddingHorizontal: 5,
        borderRadius: 3,
        marginTop: 4,
    },
    recipeTipLabel: {
        fontSize: 6,
        fontFamily: 'Helvetica-Bold',
        color: '#166534',
        textTransform: 'uppercase',
        marginBottom: 1,
    },
    recipeTipText: {
        fontSize: 6.4,
        color: '#14532d',
        fontStyle: 'italic',
        lineHeight: 1.2,
    },

    // ─── Special Clinical Instructions Page (Edge Case) ───
    specialBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        paddingVertical: 6,
        paddingHorizontal: 8,
        marginTop: 5,
        marginBottom: 7,
    },
    specialBannerClient: {
        fontSize: 8.5,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
    },
    specialBannerMeta: {
        fontSize: 7,
        color: '#64748b',
        marginTop: 1,
    },
    specialBoxCallout: {
        borderRadius: 6,
        padding: 10,
        marginTop: 4,
        marginBottom: 7,
        borderWidth: 1,
        borderLeftWidth: 4,
    },
    specialBoxFramed: {
        borderRadius: 6,
        padding: 10,
        marginTop: 4,
        marginBottom: 7,
        borderWidth: 1.5,
    },
    specialBoxBanner: {
        borderRadius: 6,
        marginTop: 4,
        marginBottom: 7,
        borderWidth: 1,
        overflow: 'hidden',
    },
    specialBoxBannerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
    },
    specialBoxBannerBody: {
        padding: 10,
        backgroundColor: '#ffffff',
    },
    specialBoxHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        paddingBottom: 6,
        marginBottom: 8,
    },
    specialBoxTitle: {
        fontSize: 10.5,
        fontFamily: 'Helvetica-Bold',
    },
    specialBoxBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2.5,
        borderRadius: 10,
        borderWidth: 1,
    },
    specialBoxBadgeText: {
        fontSize: 6.5,
        fontFamily: 'Helvetica-Bold',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    specialInstructionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 5,
    },
    specialInstructionDot: {
        width: 4.5,
        height: 4.5,
        borderRadius: 2.25,
        marginTop: 3.5,
        marginRight: 6,
        flexShrink: 0,
    },
    specialInstructionNum: {
        fontSize: 7.5,
        fontFamily: 'Helvetica-Bold',
        width: 14,
        marginRight: 5,
        marginTop: 0.5,
        flexShrink: 0,
    },
    specialInstructionText: {
        fontSize: 8,
        color: '#0f172a',
        lineHeight: 1.35,
        flex: 1,
    },
    specialParagraphText: {
        fontSize: 8,
        color: '#0f172a',
        lineHeight: 1.4,
        marginBottom: 6,
    },
    specialWarningCard: {
        backgroundColor: '#fff1f2',
        borderWidth: 1,
        borderColor: '#fecdd3',
        borderRadius: 6,
        padding: 7,
        marginTop: 5,
    },
    specialWarningHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    specialWarningTitle: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: '#9f1239',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    specialWarningText: {
        fontSize: 7.5,
        color: '#881337',
        lineHeight: 1.3,
    },
    specialVerificationCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 6,
        paddingVertical: 6,
        paddingHorizontal: 9,
        marginTop: 7,
    },
    specialVerificationName: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#2d6a4f',
    },
    specialVerificationTitle: {
        fontSize: 6.5,
        color: '#64748b',
        marginTop: 1,
    },
    specialVerificationStamp: {
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#86efac',
        borderRadius: 5,
        paddingVertical: 2.5,
        paddingHorizontal: 6,
    },
    specialVerificationStampText: {
        fontSize: 6.5,
        fontFamily: 'Helvetica-Bold',
        color: '#2d6a4f',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});

// Customizable Design Text Box Color Schemes
const SPECIAL_BOX_THEMES = {
    emerald: {
        primary: '#166534',
        accent: '#15803d',
        bg: '#f0fdf4',
        border: '#86efac',
        badgeBg: '#dcfce7',
        badgeText: '#14532d',
        badgeBorder: '#bbf7d0',
        dot: '#16a34a',
        headerBg: '#dcfce7',
    },
    amber: {
        primary: '#92400e',
        accent: '#b45309',
        bg: '#fffbeb',
        border: '#fde68a',
        badgeBg: '#fef3c7',
        badgeText: '#78350f',
        badgeBorder: '#fcd34d',
        dot: '#d97706',
        headerBg: '#fef3c7',
    },
    indigo: {
        primary: '#1e3a8a',
        accent: '#2563eb',
        bg: '#eff6ff',
        border: '#bfdbfe',
        badgeBg: '#dbeafe',
        badgeText: '#1e40af',
        badgeBorder: '#93c5fd',
        dot: '#3b82f6',
        headerBg: '#dbeafe',
    },
    rose: {
        primary: '#881337',
        accent: '#be123c',
        bg: '#fff1f2',
        border: '#fecdd3',
        badgeBg: '#ffe4e6',
        badgeText: '#9f1239',
        badgeBorder: '#fda4af',
        dot: '#e11d48',
        headerBg: '#ffe4e6',
    },
    slate: {
        primary: '#1e293b',
        accent: '#475569',
        bg: '#f8fafc',
        border: '#cbd5e1',
        badgeBg: '#e2e8f0',
        badgeText: '#334155',
        badgeBorder: '#94a3b8',
        dot: '#64748b',
        headerBg: '#e2e8f0',
    },
};

// Smart formatter for macros and targets supporting numbers, ranges, and text
const formatTarget = (val, unit) => {
    if (!val && val !== 0) return '-';
    const s = String(val).trim();
    if (!s || s === '-') return '-';
    if (s.toLowerCase().includes(unit.toLowerCase())) return s;
    if (/^[\d\s.,\-/]+$/.test(s)) {
        return unit === 'kcal' || unit === 'L' ? `${s} ${unit}` : `${s}${unit}`;
    }
    return s;
};

// Smart extractor for meal options (supports dynamic array or legacy option1/option2)
const getMealOptions = (meal) => {
    if (Array.isArray(meal?.options) && meal.options.length > 0) {
        const filtered = meal.options.filter(opt => opt && typeof opt === 'string' && opt.trim() !== '');
        if (filtered.length > 0) return filtered;
    }
    const list = [];
    if (meal?.option1 && typeof meal.option1 === 'string' && meal.option1.trim() !== '') list.push(meal.option1);
    if (meal?.option2 && typeof meal.option2 === 'string' && meal.option2.trim() !== '') list.push(meal.option2);
    return list.length > 0 ? list : (meal?.option1 ? [meal.option1] : ['Customised meal choice']);
};

// Smart parser to ensure string / array inputs are always a clean array of strings
const ensureList = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) {
        return val
            .map(item => (typeof item === 'string' ? item.trim() : String(item || '').trim()))
            .filter(Boolean);
    }
    if (typeof val === 'string') {
        if (val.includes('\n')) {
            return val.split('\n').map(s => s.replace(/^(?:[-*•✓·–—\u2022]\s*|\(?\d+[\.\)]\s+)/, '').trim()).filter(Boolean);
        }
        if (val.includes('•')) {
            return val.split('•').map(s => s.trim()).filter(Boolean);
        }
        const trimmed = val.trim();
        return trimmed ? [trimmed] : [];
    }
    return [];
};

export default function DietPlanPdfDocument({ plan: rawPlan, theme }) {
    const plan = cleanPlanData(rawPlan);
    const activeTheme = theme || plan?.pdf_theme || plan?.theme || 'clinical';
    if (activeTheme === 'senior') {
        return <DietPlanSeniorPdfDocument plan={plan} />;
    }

    const meals = plan?.meals || [];
    // Split meals cleanly across 2 pages:
    // Page 1: First 4 meals (Early Morning, Breakfast, Mid-Morning, Lunch)
    // Page 2: Remaining meals (Evening Snack, Dinner, Bedtime) + Guidelines + Supplements
    const page1Meals = meals.slice(0, 4);
    const page2Meals = meals.slice(4);

    const supplements = Array.isArray(plan?.supplements) ? plan.supplements : [];
    const guidelines = ensureList(plan?.guidelines);
    const donts = ensureList(plan?.donts);
    const attachedRecipes = Array.isArray(plan?.recipes)
        ? plan.recipes.filter(r => r && (typeof r === 'object' ? r.name : r))
        : [];

    const hasSpecialInstructions = Boolean(
        plan?.show_special_instructions ||
        (typeof plan?.special_instructions === 'string' && plan.special_instructions.trim().length > 0)
    );
    const specialThemeName = plan?.special_instructions_theme || 'emerald';
    const specialTheme = SPECIAL_BOX_THEMES[specialThemeName] || SPECIAL_BOX_THEMES.emerald;
    const specialBoxStyle = plan?.special_instructions_style || 'callout';

    const specialInstructionsText = plan?.special_instructions || '';
    const instructionLines = specialInstructionsText
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

    const renderedInstructions = instructionLines.length > 0 ? (
        instructionLines.map((line, lIdx) => {
            const isBullet = /^[-*•\u2022]\s*/.test(line);
            const isNumbered = /^\d+[\.\)]\s*/.test(line);
            const cleanLine = line.replace(/^(?:[-*•\u2022]\s*|\d+[\.\)]\s*)/, '').trim();

            if (isNumbered) {
                const numMatch = line.match(/^(\d+)[\.\)]/);
                const numStr = numMatch ? `${numMatch[1]}.` : `${lIdx + 1}.`;
                return (
                    <View key={lIdx} style={styles.specialInstructionItem}>
                        <Text style={[styles.specialInstructionNum, { color: specialTheme.primary }]}>{numStr}</Text>
                        <Text style={styles.specialInstructionText}>{cleanLine}</Text>
                    </View>
                );
            }

            if (isBullet) {
                return (
                    <View key={lIdx} style={styles.specialInstructionItem}>
                        <View style={[styles.specialInstructionDot, { backgroundColor: specialTheme.dot }]} />
                        <Text style={styles.specialInstructionText}>{cleanLine}</Text>
                    </View>
                );
            }

            return (
                <Text key={lIdx} style={styles.specialParagraphText}>
                    {line}
                </Text>
            );
        })
    ) : (
        <Text style={{ fontSize: 8, color: '#64748b', fontStyle: 'italic', paddingVertical: 10 }}>
            No special instructions specified. Adhere to daily meal schedule and prescribed clinical routine.
        </Text>
    );

    const logoSrc = plan?.logo_url || (typeof window !== 'undefined'
        ? `${window.location.origin}/images/logo.png`
        : '/images/logo.png');

    return (
        <Document title={`${plan?.client_name || 'Client'}_Diet_Plan`} author="Dt. Sabah Ghare - The Diet Cascade">
            {/* ════════════════════ PAGE 1 ════════════════════ */}
            <Page size="A4" style={styles.page}>
                {/* Brand Header */}
                <View style={styles.headerContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image src={logoSrc} style={styles.logoImage} alt="The Diet Cascade Logo" />
                        <View style={{ marginLeft: 10 }}>
                            <Text style={styles.brandTitle}>THE DIET CASCADE</Text>
                            <Text style={styles.brandSubtitle}>Clinical Nutrition & Lifestyle Transformation</Text>
                        </View>
                    </View>
                    <View style={styles.badgeContainer}>
                        <View style={styles.clinicBadge}>
                            <Text style={styles.clinicBadgeText}>CLINICAL REGIMEN</Text>
                        </View>
                        <Text style={styles.dietitianText}>Lead Dietitian: {plan?.dietitian_name || 'Dt. Sabah Ghare'}</Text>
                    </View>
                </View>

                {/* Client Info Grid */}
                <View style={styles.clientCard}>
                    {/* Plan Header Strip */}
                    <View style={styles.clientBanner}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                            <Text style={styles.planTitleText}>{plan?.plan_title || 'Diet Regimen Protocol'}</Text>
                            <Text style={styles.planGoalText}>Target Goal: {plan?.goal || 'General Health & Wellness'}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.infoLabel}>Validity Period</Text>
                            <Text style={styles.infoValue}>
                                {plan?.start_date && plan?.end_date ? `${plan.start_date} to ${plan.end_date}` : (plan?.start_date || '-')}
                            </Text>
                        </View>
                    </View>

                    {/* Row 1: Core Vitals & Demographics */}
                    <View style={[styles.clientGrid, { marginTop: 3 }]}>
                        <View style={styles.clientCol4}>
                            <Text style={styles.infoLabel}>Client Name</Text>
                            <Text style={styles.infoValue}>{plan?.client_name || '-'}</Text>
                        </View>
                        <View style={styles.clientCol4}>
                            <Text style={styles.infoLabel}>Age</Text>
                            <Text style={styles.infoValue}>{plan?.client_age ? `${plan.client_age}` : '-'}</Text>
                        </View>
                        <View style={styles.clientCol4}>
                            <Text style={styles.infoLabel}>Current Weight</Text>
                            <Text style={styles.infoValue}>
                                {plan?.start_weight ? `${plan.start_weight}${String(plan.start_weight).toLowerCase().includes('kg') ? '' : ' kg'}` : '-'}
                            </Text>
                        </View>
                        <View style={styles.clientCol4}>
                            <Text style={styles.infoLabel}>Height</Text>
                            <Text style={styles.infoValue}>{plan?.client_height || '-'}</Text>
                        </View>
                    </View>

                    {/* Row 2: Targets, Habits & Contact */}
                    <View style={[styles.clientGrid, { marginTop: 3 }]}>
                        <View style={styles.clientCol4}>
                            <Text style={styles.infoLabel}>Target Weight</Text>
                            <Text style={[styles.infoValue, { color: '#2d6a4f' }]}>
                                {plan?.target_weight ? `${plan.target_weight}${String(plan.target_weight).toLowerCase().includes('kg') ? '' : ' kg'}` : '-'}
                            </Text>
                        </View>
                        <View style={styles.clientCol4}>
                            <Text style={styles.infoLabel}>Food Habits</Text>
                            <Text style={styles.infoValue}>{plan?.food_habits || '-'}</Text>
                        </View>
                        <View style={styles.clientCol4}>
                            <Text style={styles.infoLabel}>Lifestyle</Text>
                            <Text style={styles.infoValue}>{plan?.lifestyle || '-'}</Text>
                        </View>
                        <View style={styles.clientCol4}>
                            <Text style={styles.infoLabel}>Phone</Text>
                            <Text style={styles.infoValue}>{plan?.client_phone || '-'}</Text>
                        </View>
                    </View>

                    {/* Row 3: Clinical Background (Conditions, Medication, Health Abuses) */}
                    {(plan?.medical_conditions || plan?.medication || plan?.health_abuses) ? (
                        <View style={styles.clinicalStrip}>
                            <View style={styles.clientCol3}>
                                <Text style={styles.clinicalLabel}>Medical Conditions:</Text>
                                <Text style={styles.clinicalValue}>{plan?.medical_conditions || 'None'}</Text>
                            </View>
                            <View style={styles.clientCol3}>
                                <Text style={styles.clinicalLabel}>Medication:</Text>
                                <Text style={styles.clinicalValue}>{plan?.medication || 'None'}</Text>
                            </View>
                            <View style={styles.clientCol3}>
                                <Text style={styles.clinicalLabel}>Health Abuses / Habits:</Text>
                                <Text style={styles.clinicalValue}>{plan?.health_abuses || 'None'}</Text>
                            </View>
                        </View>
                    ) : null}
                </View>

                {/* Daily Targets Banner */}
                <View style={styles.targetsCard}>
                    <View style={styles.targetItem}>
                        <Text style={styles.targetLabel}>Daily Calories</Text>
                        <Text style={styles.targetValue}>{formatTarget(plan?.calories, 'kcal')}</Text>
                    </View>
                    <View style={styles.targetDivider} />
                    <View style={styles.targetItem}>
                        <Text style={styles.targetLabel}>Protein</Text>
                        <Text style={styles.targetValue}>{formatTarget(plan?.protein, 'g')}</Text>
                    </View>
                    <View style={styles.targetDivider} />
                    <View style={styles.targetItem}>
                        <Text style={styles.targetLabel}>Carbohydrates</Text>
                        <Text style={styles.targetValue}>{formatTarget(plan?.carbs, 'g')}</Text>
                    </View>
                    <View style={styles.targetDivider} />
                    <View style={styles.targetItem}>
                        <Text style={styles.targetLabel}>Healthy Fats</Text>
                        <Text style={styles.targetValue}>{formatTarget(plan?.fats, 'g')}</Text>
                    </View>
                    <View style={styles.targetDivider} />
                    <View style={styles.targetItem}>
                        <Text style={styles.targetLabel}>Water Target</Text>
                        <Text style={styles.targetValue}>{formatTarget(plan?.water, 'L')}</Text>
                    </View>
                    <View style={styles.targetDivider} />
                    <View style={styles.targetItem}>
                        <Text style={styles.targetLabel}>Daily Steps</Text>
                        <Text style={styles.targetValue}>{plan?.steps ? String(plan.steps) : '-'}</Text>
                    </View>
                </View>

                {/* Section Header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Daily Meal Blueprint - Part 1</Text>
                    <View style={styles.sectionLine} />
                </View>

                {/* Meals 1 to 4 */}
                {page1Meals.length > 0 ? (
                    page1Meals.map((meal, idx) => (
                        <View key={idx} style={styles.mealCard}>
                            <View style={styles.mealHeader}>
                                <Text style={styles.mealName}>{meal.name || `Meal ${idx + 1}`}</Text>
                                {meal.time ? (
                                    <View style={styles.mealTimePill}>
                                        <Text style={styles.mealTimeText}>{meal.time}</Text>
                                    </View>
                                ) : null}
                            </View>
                            <View style={styles.mealBody}>
                                {getMealOptions(meal).map((opt, optIdx) => (
                                    <View key={optIdx} style={styles.optionRow}>
                                        <Text style={optIdx === 0 ? styles.optionTagPrimary : styles.optionTagAlt}>
                                            OPTION {optIdx + 1}:
                                        </Text>
                                        <Text style={styles.optionContent}>{opt}</Text>
                                    </View>
                                ))}
                                {meal.notes ? (
                                    <View style={styles.chefNoteContainer}>
                                        <Text style={styles.chefNoteLabel}>NOTE:</Text>
                                        <Text style={styles.chefNoteText}>{meal.notes}</Text>
                                    </View>
                                ) : null}
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={[styles.mealCard, { padding: 14, alignItems: 'center' }]}>
                        <Text style={{ fontSize: 8, color: '#94a3b8', fontStyle: 'italic' }}>
                            No daytime meals added yet. Add meals in the form editor or load a clinical preset.
                        </Text>
                    </View>
                )}

                {/* Page 1 Footer */}
                <View style={styles.footerContainer}>
                    <Text style={styles.footerNote}>Personalized for {plan?.client_name || 'Client'} | The Diet Cascade</Text>
                    <Text style={styles.footerContact}>WhatsApp: +91 98920 30733 | @thedietcascade</Text>
                    <Text
                        style={styles.pageNumber}
                        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                    />
                </View>
            </Page>

            {/* ════════════════════ PAGE 2 ════════════════════ */}
            <Page size="A4" style={styles.page}>
                {/* Secondary Header Strip */}
                <View style={styles.headerContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image src={logoSrc} style={styles.logoImageSmall} alt="The Diet Cascade Logo" />
                        <View style={{ marginLeft: 8 }}>
                            <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#2d6a4f' }}>
                                THE DIET CASCADE
                            </Text>
                            <Text style={{ fontSize: 7.5, color: '#64748b' }}>
                                {plan?.client_name ? `${plan.client_name}'s Protocol` : 'Protocol Continue'} | {plan?.plan_title || 'Diet Regimen'}
                            </Text>
                        </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#000a2d' }}>
                            Review Date: {plan?.next_review_date || 'In 14 Days'}
                        </Text>
                    </View>
                </View>

                {/* Section Header: Part 2 */}
                <View style={[styles.sectionHeader, { marginTop: 8 }]}>
                    <Text style={styles.sectionTitle}>Daily Meal Blueprint - Part 2</Text>
                    <View style={styles.sectionLine} />
                </View>

                {/* Meals 5 onwards */}
                {page2Meals.length > 0 ? (
                    page2Meals.map((meal, idx) => (
                        <View key={idx} style={styles.mealCard}>
                            <View style={styles.mealHeader}>
                                <Text style={styles.mealName}>{meal.name || `Meal ${idx + 5}`}</Text>
                                {meal.time ? (
                                    <View style={styles.mealTimePill}>
                                        <Text style={styles.mealTimeText}>{meal.time}</Text>
                                    </View>
                                ) : null}
                            </View>
                            <View style={styles.mealBody}>
                                {getMealOptions(meal).map((opt, optIdx) => (
                                    <View key={optIdx} style={styles.optionRow}>
                                        <Text style={optIdx === 0 ? styles.optionTagPrimary : styles.optionTagAlt}>
                                            OPTION {optIdx + 1}:
                                        </Text>
                                        <Text style={styles.optionContent}>{opt}</Text>
                                    </View>
                                ))}
                                {meal.notes ? (
                                    <View style={styles.chefNoteContainer}>
                                        <Text style={styles.chefNoteLabel}>NOTE:</Text>
                                        <Text style={styles.chefNoteText}>{meal.notes}</Text>
                                    </View>
                                ) : null}
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={[styles.mealCard, { padding: 8 }]}>
                        <Text style={{ fontSize: 8, color: '#64748b' }}>No evening meals specified.</Text>
                    </View>
                )}

                {/* Prescribed Supplements Protocol */}
                <View style={styles.supplementsCard}>
                    <View style={styles.supplementsHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={styles.supplementsIndicator} />
                            <Text style={styles.supplementsTitle}>Prescribed Supplementation Protocol</Text>
                        </View>
                        <View style={styles.supplementsBadge}>
                            <Text style={styles.supplementsBadgeText}>CLINICAL NUTRACEUTICALS</Text>
                        </View>
                    </View>

                    {supplements.length > 0 ? (
                        <View style={styles.supplementsGrid}>
                            {supplements.map((supp, sIdx) => (
                                <View
                                    key={sIdx}
                                    style={[
                                        styles.supplementPillCard,
                                        supplements.length === 1 ? { width: '100%' } : null
                                    ]}
                                >
                                    <View style={styles.supplementDot} />
                                    <View style={styles.supplementInfo}>
                                        <Text style={styles.supplementNameText}>{supp.name || 'Supplement'}</Text>
                                        <Text style={styles.supplementMetaText}>
                                            {supp.dosage ? <Text style={styles.supplementDosageText}>{supp.dosage}</Text> : null}
                                            {supp.dosage && supp.timing ? ' | ' : ''}
                                            {supp.timing ? <Text style={styles.supplementTimingText}>{supp.timing}</Text> : null}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text style={styles.emptySupplementsText}>
                            No daily supplements prescribed for this phase. Micronutrient balance is fulfilled via whole foods.
                        </Text>
                    )}
                </View>

                {/* Unified Section: GOLDEN RULES & HABITS and FOODS TO AVOID */}
                <View style={styles.unifiedRulesContainer}>
                    {/* Left Column: Golden Rules & Habits */}
                    <View style={styles.ruleColHalf}>
                        <View style={[styles.ruleBox, styles.ruleBoxGreen]}>
                            <View style={styles.ruleHeaderGreen}>
                                <Text style={styles.ruleTitleGreen}>GOLDEN RULES & HABITS</Text>
                                <View style={styles.ruleBadgeGreen}>
                                    <Text style={styles.ruleBadgeTextGreen}>DAILY HABITS</Text>
                                </View>
                            </View>
                            <View style={styles.ruleBody}>
                                {guidelines.length > 0 ? (
                                    guidelines.map((rule, rIdx) => (
                                        <View key={rIdx} style={styles.ruleBulletItem}>
                                            <View style={styles.ruleBulletDotGreen} />
                                            <Text style={styles.ruleBulletText}>{rule}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.emptyRuleText}>Maintain daily hydration, mindful chewing, and activity goals.</Text>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Right Column: Foods to Avoid */}
                    <View style={styles.ruleColHalf}>
                        <View style={[styles.ruleBox, styles.ruleBoxRed]}>
                            <View style={styles.ruleHeaderRed}>
                                <Text style={styles.ruleTitleRed}>FOODS TO AVOID</Text>
                                <View style={styles.ruleBadgeRed}>
                                    <Text style={styles.ruleBadgeTextRed}>RESTRICTIONS</Text>
                                </View>
                            </View>
                            <View style={styles.ruleBody}>
                                {donts.length > 0 ? (
                                    donts.map((item, dIdx) => (
                                        <View key={dIdx} style={styles.ruleBulletItem}>
                                            <View style={styles.ruleBulletDotRed} />
                                            <Text style={styles.ruleBulletText}>{item}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.emptyRuleText}>No strict food restrictions specified for this phase.</Text>
                                )}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Dietitian Message / Note */}
                <View style={styles.personalNoteCard}>
                    <Text style={styles.personalNoteText}>
                        {`"${plan?.dietitian_note || "Consistency over perfection. Eat mindfully, chew slowly, and stay hydrated. Remember that small daily choices lead to monumental transformations. You've got this!"}"`}
                    </Text>
                    <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#166534', marginTop: 3, textAlign: 'right' }}>
                        - {plan?.dietitian_name || 'Dt. Sabah Ghare'}, Lead Dietitian
                    </Text>
                </View>

                {/* Medical Disclaimer */}
                <View style={styles.disclaimerCard}>
                    <Text style={styles.disclaimerTitle}>DISCLAIMER:</Text>
                    <Text style={styles.disclaimerText}>
                        {"We and our system of coaching is not a replacement for your medical treatment and we will never tell you to use our system of program to replace your doctor's advice or medical treatment. We will not make decisions for you or your family on whether to take medical treatment or not, we will coach you on lifestyle, health and nutrition in accordance with your condition. We do not ever sell or suggest or claim products, pills, foods or methods that are 'magical' in nature and will take away your disease. We respect medicine and we also respect nature and the intelligence and healing power of the human body."}
                    </Text>
                </View>

                {/* Page 2 Footer */}
                <View style={styles.footerContainer}>
                    <Text style={styles.footerNote}>Confidential Medical Nutrition Plan | Strictly for designated client</Text>
                    <Text style={styles.footerContact}>Next Check-in: {plan?.next_review_date || 'In 14 Days'}</Text>
                    <Text
                        style={styles.pageNumber}
                        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                    />
                </View>
            </Page>

            {/* ════════════════════ PAGE: SPECIAL CLINICAL INSTRUCTIONS (EDGE CASE) ════════════════════ */}
            {hasSpecialInstructions && (
                <Page size="A4" style={styles.page}>
                    {/* Brand Header */}
                    <View style={styles.headerContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Image src={logoSrc} style={styles.logoImageSmall} alt="The Diet Cascade Logo" />
                            <View style={{ marginLeft: 8 }}>
                                <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#2d6a4f' }}>
                                    THE DIET CASCADE
                                </Text>
                                <Text style={{ fontSize: 7.5, color: '#64748b' }}>
                                    {plan?.client_name ? `${plan.client_name}'s Protocol` : 'Protocol'} | Edge-Case Clinical Directives
                                </Text>
                            </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <View style={[styles.clinicBadge, { backgroundColor: specialTheme.badgeBg, borderColor: specialTheme.badgeBorder }]}>
                                <Text style={[styles.clinicBadgeText, { color: specialTheme.badgeText }]}>
                                    {plan?.special_instructions_badge || 'EDGE CASE ADVISORY'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Section Header */}
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: specialTheme.primary }]}>
                            {plan?.special_instructions_title || 'Special Clinical Instructions & Edge-Case Directives'}
                        </Text>
                        <View style={[styles.sectionLine, { backgroundColor: specialTheme.accent }]} />
                    </View>

                    {/* Client Context Banner */}
                    <View style={styles.specialBanner}>
                        <View>
                            <Text style={styles.specialBannerClient}>
                                Patient: {plan?.client_name || 'Designated Client'} {plan?.client_age ? `(${plan.client_age} yrs)` : ''}
                            </Text>
                            <Text style={styles.specialBannerMeta}>
                                Primary Health Target: {plan?.goal || 'Individualized Regimen Optimization'}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#64748b', textTransform: 'uppercase' }}>
                                Protocol Priority
                            </Text>
                            <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: specialTheme.primary }}>
                                High Priority Care
                            </Text>
                        </View>
                    </View>

                    {/* Customizable Design Text Box */}
                    {specialBoxStyle === 'banner' ? (
                        <View style={[styles.specialBoxBanner, { borderColor: specialTheme.border }]}>
                            <View style={[styles.specialBoxBannerHeader, { backgroundColor: specialTheme.headerBg, borderBottomColor: specialTheme.border }]}>
                                <Text style={[styles.specialBoxTitle, { color: specialTheme.primary }]}>
                                    {plan?.special_instructions_title || 'Special Clinical Instructions'}
                                </Text>
                                <View style={[styles.specialBoxBadge, { backgroundColor: '#ffffff', borderColor: specialTheme.badgeBorder }]}>
                                    <Text style={[styles.specialBoxBadgeText, { color: specialTheme.badgeText }]}>
                                        {plan?.special_instructions_badge || 'EDGE CASE'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.specialBoxBannerBody}>
                                {renderedInstructions}
                            </View>
                        </View>
                    ) : specialBoxStyle === 'framed' ? (
                        <View style={[styles.specialBoxFramed, { backgroundColor: specialTheme.bg, borderColor: specialTheme.accent }]}>
                            <View style={[styles.specialBoxHeader, { borderBottomColor: specialTheme.border }]}>
                                <Text style={[styles.specialBoxTitle, { color: specialTheme.primary }]}>
                                    {plan?.special_instructions_title || 'Special Clinical Instructions'}
                                </Text>
                                <View style={[styles.specialBoxBadge, { backgroundColor: specialTheme.badgeBg, borderColor: specialTheme.badgeBorder }]}>
                                    <Text style={[styles.specialBoxBadgeText, { color: specialTheme.badgeText }]}>
                                        {plan?.special_instructions_badge || 'EDGE CASE'}
                                    </Text>
                                </View>
                            </View>
                            {renderedInstructions}
                        </View>
                    ) : (
                        // Default: 'callout'
                        <View style={[styles.specialBoxCallout, { backgroundColor: specialTheme.bg, borderLeftColor: specialTheme.accent, borderColor: specialTheme.border }]}>
                            <View style={[styles.specialBoxHeader, { borderBottomColor: specialTheme.border }]}>
                                <Text style={[styles.specialBoxTitle, { color: specialTheme.primary }]}>
                                    {plan?.special_instructions_title || 'Special Clinical Instructions'}
                                </Text>
                                <View style={[styles.specialBoxBadge, { backgroundColor: specialTheme.badgeBg, borderColor: specialTheme.badgeBorder }]}>
                                    <Text style={[styles.specialBoxBadgeText, { color: specialTheme.badgeText }]}>
                                        {plan?.special_instructions_badge || 'EDGE CASE'}
                                    </Text>
                                </View>
                            </View>
                            {renderedInstructions}
                        </View>
                    )}

                    {/* Optional Critical Precaution Warning Box */}
                    {plan?.special_instructions_warning ? (
                        <View style={styles.specialWarningCard}>
                            <View style={styles.specialWarningHeader}>
                                <Text style={styles.specialWarningTitle}>
                                    Critical Precaution & Clinical Red Flags:
                                </Text>
                            </View>
                            <Text style={styles.specialWarningText}>
                                {plan.special_instructions_warning}
                            </Text>
                        </View>
                    ) : null}


                    {/* Page Footer */}
                    <View style={styles.footerContainer}>
                        <Text style={styles.footerNote}>Special Directives | Strictly Confidential & Individualized</Text>
                        <Text style={styles.footerContact}>WhatsApp: +91 98920 30733 | @thedietcascade</Text>
                        <Text
                            style={styles.pageNumber}
                            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                        />
                    </View>
                </Page>
            )}

            {/* ════════════════════ PAGE 3 (RECIPE ANNEXURE) ════════════════════ */}
            {attachedRecipes.length > 0 && (
                <Page size="A4" style={styles.page}>
                    {/* Header Strip */}
                    <View style={styles.headerContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Image src={logoSrc} style={styles.logoImageSmall} alt="The Diet Cascade Logo" />
                            <View style={{ marginLeft: 8 }}>
                                <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#2d6a4f' }}>
                                    THE DIET CASCADE
                                </Text>
                                <Text style={{ fontSize: 7.5, color: '#64748b' }}>
                                    {plan?.client_name ? `${plan.client_name}'s Protocol` : 'Protocol'} | Clinical Recipe Formulations
                                </Text>
                            </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <View style={styles.clinicBadge}>
                                <Text style={styles.clinicBadgeText}>RECIPE ANNEXURE</Text>
                            </View>
                            <Text style={{ fontSize: 6.5, color: '#64748b', marginTop: 2 }}>
                                {attachedRecipes.length} Prescribed {attachedRecipes.length === 1 ? 'Dish' : 'Dishes'}
                            </Text>
                        </View>
                    </View>

                    {/* Section Header */}
                    <View style={[styles.sectionHeader, { marginTop: 8 }]}>
                        <Text style={styles.sectionTitle}>Prescribed Clinical Recipes & Preparation Methods</Text>
                        <View style={styles.sectionLine} />
                    </View>

                    {/* Formatted Recipe Table */}
                    <View style={styles.recipeTableContainer}>
                        {/* Table Header */}
                        <View style={styles.recipeTableHeader}>
                            <Text style={styles.recipeCol1Header}>DISH & MACRO PROFILE</Text>
                            <Text style={styles.recipeCol2Header}>MEASURED INGREDIENTS</Text>
                            <Text style={styles.recipeCol3Header}>STEP-BY-STEP METHOD & CLINICAL TIP</Text>
                        </View>

                        {/* Table Rows */}
                        {attachedRecipes.map((recipe, rIdx) => {
                            const ingList = ensureList(recipe.ingredients);
                            const instList = ensureList(recipe.instructions);
                            const isAlt = rIdx % 2 === 1;

                            const isMacroVal = (val) => {
                                if (!val && val !== 0) return false;
                                const s = String(val).trim();
                                return s !== '' && s !== '-' && s !== '—' && s.toLowerCase() !== 'n/a' && s.toLowerCase() !== 'none';
                            };

                            const macroPills = [];
                            if (isMacroVal(recipe.protein)) macroPills.push(`P: ${String(recipe.protein).trim()}`);
                            if (isMacroVal(recipe.carbs)) macroPills.push(`C: ${String(recipe.carbs).trim()}`);
                            if (isMacroVal(recipe.fats)) macroPills.push(`F: ${String(recipe.fats).trim()}`);
                            if (isMacroVal(recipe.fiber)) macroPills.push(`Fib: ${String(recipe.fiber).trim()}`);

                            const hasCalories = isMacroVal(recipe.calories);
                            const hasMacroPills = macroPills.length > 0;

                            return (
                                <View
                                    key={rIdx}
                                    style={[styles.recipeTableRow, isAlt ? styles.recipeTableRowAlt : null]}
                                    wrap={false}
                                >
                                    {/* Column 1: Dish & Macros */}
                                    <View style={styles.recipeCol1}>
                                        <Text style={styles.recipeDishName}>{recipe.name}</Text>
                                        <View style={styles.recipeCategoryBadge}>
                                            <Text style={styles.recipeCategoryBadgeText}>{recipe.category || 'General'}</Text>
                                        </View>
                                        <Text style={styles.recipeMetaText}>
                                            {recipe.servings || '1 serving'} | {(recipe.prep_time || '10m')} prep / {(recipe.cook_time || '15m')} cook
                                        </Text>
                                        {(hasCalories || hasMacroPills) && (
                                            <View style={styles.recipeMacroBox}>
                                                {hasCalories ? (
                                                    <Text style={styles.recipeMacroCal}>
                                                        {formatTarget(recipe.calories, 'kcal')}
                                                    </Text>
                                                ) : (
                                                    <Text style={styles.recipeMacroCal}>Calibrated Portion</Text>
                                                )}
                                                {hasMacroPills && (
                                                    <Text style={styles.recipeMacroPills}>
                                                        {macroPills.join(' | ')}
                                                    </Text>
                                                )}
                                            </View>
                                        )}
                                    </View>

                                    {/* Column 2: Measured Ingredients */}
                                    <View style={styles.recipeCol2}>
                                        {ingList.length > 0 ? (
                                            ingList.map((ing, iIdx) => (
                                                <View key={iIdx} style={styles.recipeIngredientItem}>
                                                    <View style={styles.recipeIngredientDot} />
                                                    <Text style={styles.recipeIngredientText}>{ing}</Text>
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={{ fontSize: 7, color: '#94a3b8', fontStyle: 'italic' }}>Standard ingredients as per meal blueprint.</Text>
                                        )}
                                    </View>

                                    {/* Column 3: Cooking Method & Tip */}
                                    <View style={styles.recipeCol3}>
                                        {instList.length > 0 ? (
                                            instList.map((step, sIdx) => (
                                                <View key={sIdx} style={styles.recipeStepItem}>
                                                    <Text style={styles.recipeStepNumber}>{sIdx + 1}.</Text>
                                                    <Text style={styles.recipeStepText}>{step}</Text>
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={{ fontSize: 7, color: '#94a3b8', fontStyle: 'italic' }}>Cook as prescribed by dietitian.</Text>
                                        )}

                                        {recipe.dietitian_tip ? (
                                            <View style={styles.recipeTipBox}>
                                                <Text style={styles.recipeTipLabel}>Clinical Benefit & Tip:</Text>
                                                <Text style={styles.recipeTipText}>{recipe.dietitian_tip}</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Page 3 Footer */}
                    <View style={styles.footerContainer} fixed>
                        <Text style={styles.footerNote}>Clinical Culinary Annexure | The Diet Cascade Precision Health</Text>
                        <Text style={styles.footerContact}>WhatsApp: +91 98920 30733 | @thedietcascade</Text>
                        <Text
                            style={styles.pageNumber}
                            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                        />
                    </View>
                </Page>
            )}
        </Document>
    );
}
