import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { cleanPlanData } from './pdfSanitizer';

const styles = StyleSheet.create({
    page: {
        paddingTop: 30,
        paddingBottom: 36,
        paddingHorizontal: 32,
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#0f172a',
        backgroundColor: '#ffffff',
    },

    // ─── Header ───
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 10,
        borderBottomWidth: 2,
        borderBottomColor: '#16a34a',
    },
    logoImage: {
        width: 44,
        height: 34,
        objectFit: 'contain',
    },
    logoImageSmall: {
        width: 32,
        height: 24,
        objectFit: 'contain',
    },
    brandTitle: {
        fontSize: 20,
        fontFamily: 'Helvetica-Bold',
        color: '#166534',
        letterSpacing: 0.5,
    },
    brandSubtitle: {
        fontSize: 9,
        color: '#475569',
        marginTop: 2,
    },
    clinicBadge: {
        backgroundColor: '#fef08a',
        borderWidth: 1,
        borderColor: '#facc15',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    clinicBadgeText: {
        fontSize: 8.5,
        fontFamily: 'Helvetica-Bold',
        color: '#854d0e',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    dietitianText: {
        fontSize: 8.5,
        fontFamily: 'Helvetica-Bold',
        color: '#166534',
        marginTop: 3,
        textAlign: 'right',
    },

    // ─── Client Profile Card ───
    clientCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#cbd5e1',
        padding: 10,
        marginTop: 8,
    },
    clientBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 6,
        marginBottom: 6,
    },
    planTitleText: {
        fontSize: 13,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
    },
    planGoalText: {
        fontSize: 9,
        color: '#166534',
        fontFamily: 'Helvetica-Bold',
        marginTop: 1.5,
    },
    clientGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    clientCol4: {
        width: '24%',
        marginBottom: 3,
    },
    infoLabel: {
        fontSize: 7.5,
        color: '#64748b',
        textTransform: 'uppercase',
        fontFamily: 'Helvetica-Bold',
        letterSpacing: 0.3,
    },
    infoValue: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
        marginTop: 1,
    },
    clinicalStrip: {
        marginTop: 6,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        backgroundColor: '#fffbeb',
        borderWidth: 1,
        borderColor: '#fde68a',
        borderRadius: 6,
        padding: 6,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    clinicalCol: {
        width: '32%',
    },
    clinicalLabel: {
        fontSize: 7.5,
        fontFamily: 'Helvetica-Bold',
        color: '#92400e',
        textTransform: 'uppercase',
    },
    clinicalValue: {
        fontSize: 8.5,
        color: '#78350f',
        marginTop: 1.5,
        lineHeight: 1.25,
    },

    // ─── Targets Banner ───
    targetsCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#f0fdf4',
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#86efac',
        paddingVertical: 7,
        paddingHorizontal: 8,
        marginTop: 8,
    },
    targetItem: {
        flex: 1,
        alignItems: 'center',
    },
    targetDivider: {
        width: 1,
        backgroundColor: '#bbf7d0',
        marginHorizontal: 3,
    },
    targetLabel: {
        fontSize: 7.5,
        fontFamily: 'Helvetica-Bold',
        color: '#166534',
        textTransform: 'uppercase',
    },
    targetValue: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
        marginTop: 2,
    },

    // ─── Section Header ───
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 6,
    },
    sectionTitle: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: '#166534',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#86efac',
        marginLeft: 10,
    },

    // ─── Colorful Meal Cards (Older Age Friendly & High Contrast) ───
    mealCard: {
        borderRadius: 8,
        borderWidth: 1.5,
        marginBottom: 8,
        overflow: 'hidden',
        backgroundColor: '#ffffff',
    },
    mealHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
    },
    mealName: {
        fontSize: 11.5,
        fontFamily: 'Helvetica-Bold',
    },
    mealTimePill: {
        paddingHorizontal: 8,
        paddingVertical: 2.5,
        borderRadius: 5,
        borderWidth: 1,
    },
    mealTimeText: {
        fontSize: 8.5,
        fontFamily: 'Helvetica-Bold',
    },
    mealBody: {
        padding: 8,
        paddingHorizontal: 10,
        backgroundColor: '#ffffff',
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    optionTagPrimary: {
        fontSize: 8.5,
        fontFamily: 'Helvetica-Bold',
        color: '#166534',
        width: 65,
        marginTop: 1,
    },
    optionTagAlt: {
        fontSize: 8.5,
        fontFamily: 'Helvetica-Bold',
        color: '#c2410c',
        width: 65,
        marginTop: 1,
    },
    optionContent: {
        fontSize: 10,
        color: '#0f172a',
        flex: 1,
        lineHeight: 1.35,
    },
    chefNoteContainer: {
        marginTop: 4,
        paddingTop: 4,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        flexDirection: 'row',
        alignItems: 'center',
    },
    chefNoteLabel: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#0369a1',
        width: 65,
    },
    chefNoteText: {
        fontSize: 8.5,
        color: '#0369a1',
        fontStyle: 'italic',
        flex: 1,
    },

    // ─── Prescribed Supplements Protocol (High Visibility) ───
    supplementsCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#38bdf8',
        padding: 8,
        paddingHorizontal: 10,
        marginTop: 8,
    },
    supplementsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#e0f2fe',
    },
    supplementsTitle: {
        fontSize: 10.5,
        fontFamily: 'Helvetica-Bold',
        color: '#0369a1',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    supplementsBadge: {
        backgroundColor: '#e0f2fe',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    supplementsBadgeText: {
        fontSize: 7.5,
        fontFamily: 'Helvetica-Bold',
        color: '#0284c7',
        textTransform: 'uppercase',
    },
    supplementsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    supplementPillCard: {
        width: '48.5%',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#bae6fd',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 5,
        marginBottom: 5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    supplementDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#0284c7',
        marginRight: 6,
    },
    supplementInfo: {
        flex: 1,
    },
    supplementNameText: {
        fontSize: 9.5,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
    },
    supplementMetaText: {
        fontSize: 8.5,
        color: '#475569',
        marginTop: 1.5,
    },
    supplementDosageText: {
        fontSize: 8.5,
        fontFamily: 'Helvetica-Bold',
        color: '#166534',
    },
    supplementTimingText: {
        fontSize: 8.5,
        fontFamily: 'Helvetica-Bold',
        color: '#ea580c',
    },
    emptySupplementsText: {
        fontSize: 8.5,
        color: '#64748b',
        fontStyle: 'italic',
        paddingVertical: 4,
    },

    // ─── Unified Rules & Foods to Avoid (2 Big Vibrant Columns) ───
    unifiedRulesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    ruleColHalf: {
        width: '48.5%',
    },
    ruleBox: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        borderWidth: 2,
        overflow: 'hidden',
        minHeight: 110,
    },
    ruleBoxGreen: {
        borderColor: '#86efac',
    },
    ruleBoxRed: {
        borderColor: '#fca5a5',
    },
    ruleHeaderGreen: {
        backgroundColor: '#f0fdf4',
        borderBottomWidth: 1.5,
        borderBottomColor: '#86efac',
        paddingVertical: 6,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    ruleHeaderRed: {
        backgroundColor: '#fff1f2',
        borderBottomWidth: 1.5,
        borderBottomColor: '#fca5a5',
        paddingVertical: 6,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    ruleTitleGreen: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: '#15803d',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    ruleTitleRed: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: '#b91c1c',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    ruleBadgeGreen: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 6,
        paddingVertical: 1.5,
        borderRadius: 4,
    },
    ruleBadgeRed: {
        backgroundColor: '#fee2e2',
        paddingHorizontal: 6,
        paddingVertical: 1.5,
        borderRadius: 4,
    },
    ruleBadgeTextGreen: {
        fontSize: 7.5,
        fontFamily: 'Helvetica-Bold',
        color: '#166534',
    },
    ruleBadgeTextRed: {
        fontSize: 7.5,
        fontFamily: 'Helvetica-Bold',
        color: '#991b1b',
    },
    ruleBody: {
        padding: 8,
        paddingHorizontal: 10,
    },
    ruleBulletItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 4.5,
    },
    ruleBulletDotGreen: {
        width: 4.5,
        height: 4.5,
        borderRadius: 2.25,
        backgroundColor: '#15803d',
        marginRight: 6,
        marginTop: 4,
    },
    ruleBulletDotRed: {
        width: 4.5,
        height: 4.5,
        borderRadius: 2.25,
        backgroundColor: '#dc2626',
        marginRight: 6,
        marginTop: 4,
    },
    ruleBulletText: {
        fontSize: 9.2,
        color: '#0f172a',
        flex: 1,
        lineHeight: 1.35,
    },
    emptyRuleText: {
        fontSize: 8.5,
        color: '#64748b',
        fontStyle: 'italic',
        paddingVertical: 4,
    },

    // ─── Dietitian Personal Message (Warm & Heartfelt) ───
    personalNoteCard: {
        backgroundColor: '#fefce8',
        borderLeftWidth: 4,
        borderLeftColor: '#f59e0b',
        borderWidth: 1,
        borderColor: '#fef08a',
        borderRadius: 6,
        padding: 8,
        paddingHorizontal: 12,
        marginTop: 8,
    },
    personalNoteText: {
        fontSize: 9.5,
        color: '#78350f',
        fontStyle: 'italic',
        lineHeight: 1.35,
    },

    // ─── Medical Disclaimer ───
    disclaimerCard: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 6,
        paddingVertical: 5,
        paddingHorizontal: 8,
        marginTop: 8,
    },
    disclaimerTitle: {
        fontSize: 7.5,
        fontFamily: 'Helvetica-Bold',
        color: '#475569',
        marginBottom: 2,
        letterSpacing: 0.5,
    },
    disclaimerText: {
        fontSize: 7,
        color: '#475569',
        lineHeight: 1.3,
    },

    // ─── Footer ───
    footerContainer: {
        position: 'absolute',
        bottom: 18,
        left: 32,
        right: 32,
        borderTopWidth: 1.5,
        borderTopColor: '#cbd5e1',
        paddingTop: 6,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerNote: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#64748b',
    },
    footerContact: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#166534',
    },
    pageNumber: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
    },

    // ─── Recipe Annexure Table (Large & Clear) ───
    recipeTableContainer: {
        marginTop: 8,
        borderWidth: 1.5,
        borderColor: '#cbd5e1',
        borderRadius: 8,
        overflow: 'hidden',
    },
    recipeTableHeader: {
        flexDirection: 'row',
        backgroundColor: '#166534',
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    recipeCol1Header: {
        width: '28%',
        fontSize: 8.5,
        fontFamily: 'Helvetica-Bold',
        color: '#ffffff',
        textTransform: 'uppercase',
    },
    recipeCol2Header: {
        width: '32%',
        fontSize: 8.5,
        fontFamily: 'Helvetica-Bold',
        color: '#ffffff',
        textTransform: 'uppercase',
    },
    recipeCol3Header: {
        width: '40%',
        fontSize: 8.5,
        fontFamily: 'Helvetica-Bold',
        color: '#ffffff',
        textTransform: 'uppercase',
    },
    recipeTableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingVertical: 8,
        paddingHorizontal: 10,
        minHeight: 85,
    },
    recipeTableRowAlt: {
        backgroundColor: '#f8fafc',
    },
    recipeCol1: {
        width: '28%',
        paddingRight: 8,
    },
    recipeCol2: {
        width: '32%',
        paddingRight: 8,
        borderLeftWidth: 1,
        borderLeftColor: '#e2e8f0',
        paddingLeft: 8,
    },
    recipeCol3: {
        width: '40%',
        borderLeftWidth: 1,
        borderLeftColor: '#e2e8f0',
        paddingLeft: 8,
    },
    recipeDishName: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
        marginBottom: 3,
    },
    recipeCategoryBadge: {
        backgroundColor: '#fef08a',
        borderWidth: 1,
        borderColor: '#facc15',
        paddingHorizontal: 5,
        paddingVertical: 1.5,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 3,
    },
    recipeCategoryBadgeText: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: '#854d0e',
        textTransform: 'uppercase',
    },
    recipeMetaText: {
        fontSize: 8,
        color: '#64748b',
        marginBottom: 4,
    },
    recipeMacroBox: {
        backgroundColor: '#ecfdf5',
        borderWidth: 1,
        borderColor: '#a7f3d0',
        borderRadius: 5,
        padding: 5,
        marginTop: 2,
    },
    recipeMacroCal: {
        fontSize: 8.5,
        fontFamily: 'Helvetica-Bold',
        color: '#166534',
    },
    recipeMacroPills: {
        fontSize: 7.5,
        color: '#065f46',
        marginTop: 1.5,
        fontFamily: 'Helvetica-Bold',
    },
    recipeIngredientItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 3.5,
    },
    recipeIngredientDot: {
        width: 4.5,
        height: 4.5,
        borderRadius: 2.25,
        backgroundColor: '#16a34a',
        marginRight: 6,
        marginTop: 4,
    },
    recipeIngredientText: {
        fontSize: 8.5,
        color: '#0f172a',
        flex: 1,
        lineHeight: 1.3,
    },
    recipeStepItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 3.5,
    },
    recipeStepNumber: {
        fontSize: 8.5,
        fontFamily: 'Helvetica-Bold',
        color: '#166534',
        width: 14,
        lineHeight: 1.3,
    },
    recipeStepText: {
        fontSize: 8.5,
        color: '#0f172a',
        flex: 1,
        lineHeight: 1.3,
    },
    recipeTipBox: {
        backgroundColor: '#fefce8',
        borderLeftWidth: 3,
        borderLeftColor: '#f59e0b',
        borderWidth: 1,
        borderColor: '#fef08a',
        padding: 4,
        paddingHorizontal: 6,
        borderRadius: 4,
        marginTop: 5,
    },
    recipeTipLabel: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: '#92400e',
        textTransform: 'uppercase',
        marginBottom: 1,
    },
    recipeTipText: {
        fontSize: 7.5,
        color: '#78350f',
        fontStyle: 'italic',
        lineHeight: 1.25,
    },

    // ─── Special Clinical Instructions Page (Edge Case) ───
    specialBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#cbd5e1',
        paddingVertical: 7,
        paddingHorizontal: 10,
        marginTop: 6,
        marginBottom: 8,
    },
    specialBannerClient: {
        fontSize: 9.5,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
    },
    specialBannerMeta: {
        fontSize: 8,
        color: '#64748b',
        marginTop: 1,
    },
    specialBoxCallout: {
        borderRadius: 8,
        padding: 12,
        marginTop: 4,
        marginBottom: 8,
        borderWidth: 1,
        borderLeftWidth: 5,
    },
    specialBoxFramed: {
        borderRadius: 8,
        padding: 12,
        marginTop: 4,
        marginBottom: 8,
        borderWidth: 2,
    },
    specialBoxBanner: {
        borderRadius: 8,
        marginTop: 4,
        marginBottom: 8,
        borderWidth: 1.5,
        overflow: 'hidden',
    },
    specialBoxBannerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
    },
    specialBoxBannerBody: {
        padding: 12,
        backgroundColor: '#ffffff',
    },
    specialBoxHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        paddingBottom: 7,
        marginBottom: 9,
    },
    specialBoxTitle: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
    },
    specialBoxBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        borderWidth: 1,
    },
    specialBoxBadgeText: {
        fontSize: 7.5,
        fontFamily: 'Helvetica-Bold',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    specialInstructionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    specialInstructionDot: {
        width: 5.5,
        height: 5.5,
        borderRadius: 2.75,
        marginTop: 4,
        marginRight: 8,
        flexShrink: 0,
    },
    specialInstructionNum: {
        fontSize: 8.5,
        fontFamily: 'Helvetica-Bold',
        width: 16,
        marginRight: 6,
        marginTop: 0.5,
        flexShrink: 0,
    },
    specialInstructionText: {
        fontSize: 9.5,
        color: '#0f172a',
        lineHeight: 1.45,
        flex: 1,
    },
    specialParagraphText: {
        fontSize: 9.5,
        color: '#0f172a',
        lineHeight: 1.5,
        marginBottom: 7,
    },
    specialWarningCard: {
        backgroundColor: '#fff1f2',
        borderWidth: 1.5,
        borderColor: '#fecdd3',
        borderRadius: 8,
        padding: 9,
        marginTop: 6,
    },
    specialWarningHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    specialWarningTitle: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#9f1239',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    specialWarningText: {
        fontSize: 8.5,
        color: '#881337',
        lineHeight: 1.35,
    },
    specialVerificationCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        paddingVertical: 7,
        paddingHorizontal: 10,
        marginTop: 8,
    },
    specialVerificationName: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#166534',
    },
    specialVerificationTitle: {
        fontSize: 7.5,
        color: '#64748b',
        marginTop: 1,
    },
    specialVerificationStamp: {
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#86efac',
        borderRadius: 6,
        paddingVertical: 3,
        paddingHorizontal: 8,
    },
    specialVerificationStampText: {
        fontSize: 7.5,
        fontFamily: 'Helvetica-Bold',
        color: '#166534',
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

// Vibrant Meal Color Palette (distinguishable for senior eyes)
const MEAL_PALETTES = [
    // Meal 1: Early Morning Sunrise (Amber / Gold)
    {
        border: '#f59e0b',
        headerBg: '#fffbeb',
        titleColor: '#b45309',
        badgeBg: '#fef3c7',
        badgeBorder: '#fde68a',
        badgeText: '#92400e',
    },
    // Meal 2: Breakfast (Warm Orange / Tangerine)
    {
        border: '#ea580c',
        headerBg: '#fff7ed',
        titleColor: '#c2410c',
        badgeBg: '#ffedd5',
        badgeBorder: '#fed7aa',
        badgeText: '#9a3412',
    },
    // Meal 3: Mid-Morning (Citrus Yellow)
    {
        border: '#ca8a04',
        headerBg: '#fefce8',
        titleColor: '#a16207',
        badgeBg: '#fef9c3',
        badgeBorder: '#fef08a',
        badgeText: '#854d0e',
    },
    // Meal 4: Lunch (Fresh Emerald Green)
    {
        border: '#16a34a',
        headerBg: '#f0fdf4',
        titleColor: '#15803d',
        badgeBg: '#dcfce7',
        badgeBorder: '#bbf7d0',
        badgeText: '#166534',
    },
    // Meal 5: Evening Snack (Sunset Coral / Rose)
    {
        border: '#e11d48',
        headerBg: '#fff1f2',
        titleColor: '#be123c',
        badgeBg: '#ffe4e6',
        badgeBorder: '#fecdd3',
        badgeText: '#9f1239',
    },
    // Meal 6: Dinner (Royal Indigo)
    {
        border: '#6366f1',
        headerBg: '#eef2ff',
        titleColor: '#4338ca',
        badgeBg: '#e0e7ff',
        badgeBorder: '#c7d2fe',
        badgeText: '#3730a3',
    },
    // Meal 7: Bedtime Soother (Calming Sky Blue)
    {
        border: '#0284c7',
        headerBg: '#f0f9ff',
        titleColor: '#0369a1',
        badgeBg: '#e0f2fe',
        badgeBorder: '#bae6fd',
        badgeText: '#075985',
    },
];

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

export default function DietPlanSeniorPdfDocument({ plan: rawPlan }) {
    const plan = cleanPlanData(rawPlan);
    const meals = plan?.meals || [];
    // Senior Friendly Paging:
    // Page 1: Vitals, Targets + First 3 Meals (Early Morning, Breakfast, Mid-Morning)
    // Page 2: Next Meals (Lunch, Evening Snack, Dinner, Bedtime) + Prescribed Supplements
    // Page 3: Golden Rules & Habits + Foods to Avoid + Dietitian's Note + Disclaimer
    // Page 4 (Optional): Recipe Annexure Table
    const page1Meals = meals.slice(0, 3);
    const page2Meals = meals.slice(3);

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
        <Text style={{ fontSize: 9.5, color: '#64748b', fontStyle: 'italic', paddingVertical: 12 }}>
            No special instructions specified. Adhere to daily meal schedule and prescribed clinical routine.
        </Text>
    );

    const logoSrc = plan?.logo_url || (typeof window !== 'undefined'
        ? `${window.location.origin}/images/logo.png`
        : '/images/logo.png');

    return (
        <Document title={`${plan?.client_name || 'Client'}_Diet_Plan`} author="Dt. Sabah Ghare - The Diet Cascade">
            {/* ════════════════════ PAGE 1: MORNING TIMELINE & TARGETS ════════════════════ */}
            <Page size="A4" style={styles.page}>
                {/* Brand Header */}
                <View style={styles.headerContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image src={logoSrc} style={styles.logoImage} alt="The Diet Cascade Logo" />
                        <View style={{ marginLeft: 10 }}>
                            <Text style={styles.brandTitle}>THE DIET CASCADE</Text>
                            <Text style={styles.brandSubtitle}>Personalized Nutrition & Active Longevity Protocol</Text>
                        </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <View style={styles.clinicBadge}>
                            <Text style={styles.clinicBadgeText}>CLINICAL REGIMEN</Text>
                        </View>
                        <Text style={styles.dietitianText}>Lead Dietitian: {plan?.dietitian_name || 'Dt. Sabah Ghare'}</Text>
                    </View>
                </View>

                {/* Client Profile Card */}
                <View style={styles.clientCard}>
                    <View style={styles.clientBanner}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                            <Text style={styles.planTitleText}>{plan?.plan_title || 'Custom Diet Protocol'}</Text>
                            <Text style={styles.planGoalText}>Goal: {plan?.goal || 'General Health, Vitality & Wellness'}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.infoLabel}>Validity Period</Text>
                            <Text style={styles.infoValue}>
                                {plan?.start_date && plan?.end_date ? `${plan.start_date} to ${plan.end_date}` : (plan?.start_date || 'Active')}
                            </Text>
                        </View>
                    </View>

                    {/* Vitals Grid */}
                    <View style={styles.clientGrid}>
                        <View style={styles.clientCol4}>
                            <Text style={styles.infoLabel}>Client Name</Text>
                            <Text style={styles.infoValue}>{plan?.client_name || '-'}</Text>
                        </View>
                        <View style={styles.clientCol4}>
                            <Text style={styles.infoLabel}>Age</Text>
                            <Text style={styles.infoValue}>{plan?.client_age ? `${plan.client_age} yrs` : '-'}</Text>
                        </View>
                        <View style={styles.clientCol4}>
                            <Text style={styles.infoLabel}>Current Weight</Text>
                            <Text style={styles.infoValue}>
                                {plan?.start_weight ? `${plan.start_weight}${String(plan.start_weight).toLowerCase().includes('kg') ? '' : ' kg'}` : '-'}
                            </Text>
                        </View>
                        <View style={styles.clientCol4}>
                            <Text style={styles.infoLabel}>Target Weight</Text>
                            <Text style={[styles.infoValue, { color: '#16a34a' }]}>
                                {plan?.target_weight ? `${plan.target_weight}${String(plan.target_weight).toLowerCase().includes('kg') ? '' : ' kg'}` : '-'}
                            </Text>
                        </View>
                    </View>

                    {/* Clinical Details */}
                    {(plan?.medical_conditions || plan?.medication || plan?.health_abuses) ? (
                        <View style={styles.clinicalStrip}>
                            <View style={styles.clinicalCol}>
                                <Text style={styles.clinicalLabel}>Medical Conditions:</Text>
                                <Text style={styles.clinicalValue}>{plan?.medical_conditions || 'None Reported'}</Text>
                            </View>
                            <View style={styles.clinicalCol}>
                                <Text style={styles.clinicalLabel}>Medications:</Text>
                                <Text style={styles.clinicalValue}>{plan?.medication || 'None'}</Text>
                            </View>
                            <View style={styles.clinicalCol}>
                                <Text style={styles.clinicalLabel}>Lifestyle & Habits:</Text>
                                <Text style={styles.clinicalValue}>{plan?.health_abuses || 'None'}</Text>
                            </View>
                        </View>
                    ) : null}
                </View>

                {/* Daily Targets Banner */}
                <View style={styles.targetsCard}>
                    <View style={styles.targetItem}>
                        <Text style={styles.targetLabel}>Calories</Text>
                        <Text style={styles.targetValue}>{formatTarget(plan?.calories, 'kcal')}</Text>
                    </View>
                    <View style={styles.targetDivider} />
                    <View style={styles.targetItem}>
                        <Text style={styles.targetLabel}>Protein</Text>
                        <Text style={styles.targetValue}>{formatTarget(plan?.protein, 'g')}</Text>
                    </View>
                    <View style={styles.targetDivider} />
                    <View style={styles.targetItem}>
                        <Text style={styles.targetLabel}>Carbs</Text>
                        <Text style={styles.targetValue}>{formatTarget(plan?.carbs, 'g')}</Text>
                    </View>
                    <View style={styles.targetDivider} />
                    <View style={styles.targetItem}>
                        <Text style={styles.targetLabel}>Healthy Fats</Text>
                        <Text style={styles.targetValue}>{formatTarget(plan?.fats, 'g')}</Text>
                    </View>
                    <View style={styles.targetDivider} />
                    <View style={styles.targetItem}>
                        <Text style={styles.targetLabel}>Daily Water</Text>
                        <Text style={[styles.targetValue, { color: '#0284c7' }]}>{formatTarget(plan?.water, 'L')}</Text>
                    </View>
                    <View style={styles.targetDivider} />
                    <View style={styles.targetItem}>
                        <Text style={styles.targetLabel}>Daily Steps</Text>
                        <Text style={[styles.targetValue, { color: '#16a34a' }]}>{plan?.steps ? String(plan.steps) : '-'}</Text>
                    </View>
                </View>

                {/* Section Header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Daily Meal Schedule - Part 1 (Morning to Mid-Day)</Text>
                    <View style={styles.sectionLine} />
                </View>

                {/* Meals 1 to 3 */}
                {page1Meals.length > 0 ? (
                    page1Meals.map((meal, idx) => {
                        const palette = MEAL_PALETTES[idx % MEAL_PALETTES.length];
                        return (
                            <View key={idx} style={[styles.mealCard, { borderColor: palette.border }]}>
                                <View style={[styles.mealHeader, { backgroundColor: palette.headerBg, borderBottomColor: palette.border }]}>
                                    <Text style={[styles.mealName, { color: palette.titleColor }]}>
                                        {meal.name || `Meal ${idx + 1}`}
                                    </Text>
                                    {meal.time ? (
                                        <View style={[styles.mealTimePill, { backgroundColor: palette.badgeBg, borderColor: palette.badgeBorder }]}>
                                            <Text style={[styles.mealTimeText, { color: palette.badgeText }]}>{meal.time}</Text>
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
                        );
                    })
                ) : (
                    <View style={[styles.mealCard, { padding: 14, alignItems: 'center' }]}>
                        <Text style={{ fontSize: 9, color: '#94a3b8', fontStyle: 'italic' }}>
                            No morning meals scheduled. Add meals in the form editor.
                        </Text>
                    </View>
                )}

                {/* Page 1 Footer */}
                <View style={styles.footerContainer}>
                    <Text style={styles.footerNote}>Personalized for {plan?.client_name || 'Client'} | Large Print Nutrition Plan</Text>
                    <Text style={styles.footerContact}>WhatsApp: +91 98920 30733 | @thedietcascade</Text>
                    <Text
                        style={styles.pageNumber}
                        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                    />
                </View>
            </Page>

            {/* ════════════════════ PAGE 2: LUNCH, EVENING & SUPPLEMENTS ════════════════════ */}
            <Page size="A4" style={styles.page}>
                {/* Secondary Header */}
                <View style={styles.headerContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image src={logoSrc} style={styles.logoImageSmall} alt="The Diet Cascade Logo" />
                        <View style={{ marginLeft: 8 }}>
                            <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#166534' }}>
                                THE DIET CASCADE
                            </Text>
                            <Text style={{ fontSize: 8.5, color: '#64748b' }}>
                                {plan?.client_name ? `${plan.client_name}'s Protocol` : 'Protocol'} | Afternoon & Evening Schedule
                            </Text>
                        </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#0f172a' }}>
                            Next Review: {plan?.next_review_date || 'In 14 Days'}
                        </Text>
                    </View>
                </View>

                {/* Section Header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Daily Meal Schedule - Part 2 (Lunch & Dinner)</Text>
                    <View style={styles.sectionLine} />
                </View>

                {/* Meals 4 onwards */}
                {page2Meals.length > 0 ? (
                    page2Meals.map((meal, idx) => {
                        const palette = MEAL_PALETTES[(idx + 3) % MEAL_PALETTES.length];
                        return (
                            <View key={idx} style={[styles.mealCard, { borderColor: palette.border }]}>
                                <View style={[styles.mealHeader, { backgroundColor: palette.headerBg, borderBottomColor: palette.border }]}>
                                    <Text style={[styles.mealName, { color: palette.titleColor }]}>
                                        {meal.name || `Meal ${idx + 4}`}
                                    </Text>
                                    {meal.time ? (
                                        <View style={[styles.mealTimePill, { backgroundColor: palette.badgeBg, borderColor: palette.badgeBorder }]}>
                                            <Text style={[styles.mealTimeText, { color: palette.badgeText }]}>{meal.time}</Text>
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
                        );
                    })
                ) : (
                    <View style={[styles.mealCard, { padding: 12 }]}>
                        <Text style={{ fontSize: 9, color: '#64748b' }}>No afternoon or evening meals specified.</Text>
                    </View>
                )}

                {/* Prescribed Supplements Protocol */}
                <View style={styles.supplementsCard}>
                    <View style={styles.supplementsHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.supplementsTitle}>Prescribed Daily Supplements Protocol</Text>
                        </View>
                        <View style={styles.supplementsBadge}>
                            <Text style={styles.supplementsBadgeText}>DAILY NUTRACEUTICALS</Text>
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
                            No oral supplements required for this phase. All micronutrients are naturally provided via whole foods.
                        </Text>
                    )}
                </View>

                {/* Page 2 Footer */}
                <View style={styles.footerContainer}>
                    <Text style={styles.footerNote}>Private & Confidential | Senior Friendly Plan</Text>
                    <Text style={styles.footerContact}>WhatsApp: +91 98920 30733 | @thedietcascade</Text>
                    <Text
                        style={styles.pageNumber}
                        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                    />
                </View>
            </Page>

            {/* ════════════════════ PAGE: SPECIAL CLINICAL INSTRUCTIONS (EDGE CASE) ════════════════════ */}
            {hasSpecialInstructions && (
                <Page size="A4" style={styles.page}>
                    {/* Secondary Header */}
                    <View style={styles.headerContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Image src={logoSrc} style={styles.logoImageSmall} alt="The Diet Cascade Logo" />
                            <View style={{ marginLeft: 8 }}>
                                <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#166534' }}>
                                    THE DIET CASCADE
                                </Text>
                                <Text style={{ fontSize: 8.5, color: '#64748b' }}>
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
                            <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#64748b', textTransform: 'uppercase' }}>
                                Protocol Priority
                            </Text>
                            <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: specialTheme.primary }}>
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

            {/* ════════════════════ PAGE 3: RULES, RESTRICTIONS & MESSAGE ════════════════════ */}
            <Page size="A4" style={styles.page}>
                {/* Secondary Header */}
                <View style={styles.headerContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image src={logoSrc} style={styles.logoImageSmall} alt="The Diet Cascade Logo" />
                        <View style={{ marginLeft: 8 }}>
                            <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#166534' }}>
                                THE DIET CASCADE
                            </Text>
                            <Text style={{ fontSize: 8.5, color: '#64748b' }}>
                                {plan?.client_name ? `${plan.client_name}'s Protocol` : 'Protocol'} | Lifestyle Guidelines & Foods
                            </Text>
                        </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <View style={styles.clinicBadge}>
                            <Text style={styles.clinicBadgeText}>CLINICAL GUIDELINES</Text>
                        </View>
                    </View>
                </View>

                {/* Section Header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Daily Habits & Food Restrictions</Text>
                    <View style={styles.sectionLine} />
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
                                    <Text style={styles.emptyRuleText}>Drink water evenly, chew slowly, and take daily light walks.</Text>
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
                    <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#166534', marginTop: 4, textAlign: 'right' }}>
                        - {plan?.dietitian_name || 'Dt. Sabah Ghare'}, Lead Dietitian
                    </Text>
                </View>

                {/* Medical Disclaimer */}
                <View style={styles.disclaimerCard}>
                    <Text style={styles.disclaimerTitle}>MEDICAL DISCLAIMER:</Text>
                    <Text style={styles.disclaimerText}>
                        {"We and our system of coaching is not a replacement for your medical treatment and we will never tell you to use our system of program to replace your doctor's advice or medical treatment. We will not make decisions for you or your family on whether to take medical treatment or not, we will coach you on lifestyle, health and nutrition in accordance with your condition. We do not ever sell or suggest or claim products, pills, foods or methods that are 'magical' in nature and will take away your disease. We respect medicine and we also respect nature and the intelligence and healing power of the human body."}
                    </Text>
                </View>

                {/* Page 3 Footer */}
                <View style={styles.footerContainer}>
                    <Text style={styles.footerNote}>Confidential Medical Nutrition Plan | Strictly for designated client</Text>
                    <Text style={styles.footerContact}>Next Check-in: {plan?.next_review_date || 'In 14 Days'}</Text>
                    <Text
                        style={styles.pageNumber}
                        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                    />
                </View>
            </Page>

            {/* ════════════════════ PAGE 4: RECIPE ANNEXURE (IF ATTACHED) ════════════════════ */}
            {attachedRecipes.length > 0 && (
                <Page size="A4" style={styles.page}>
                    {/* Header Strip */}
                    <View style={styles.headerContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Image src={logoSrc} style={styles.logoImageSmall} alt="The Diet Cascade Logo" />
                            <View style={{ marginLeft: 8 }}>
                                <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#166534' }}>
                                    THE DIET CASCADE
                                </Text>
                                <Text style={{ fontSize: 8.5, color: '#64748b' }}>
                                    {plan?.client_name ? `${plan.client_name}'s Protocol` : 'Protocol'} | Clinical Recipe Formulations
                                </Text>
                            </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <View style={styles.clinicBadge}>
                                <Text style={styles.clinicBadgeText}>RECIPE GUIDE</Text>
                            </View>
                            <Text style={{ fontSize: 7.5, color: '#64748b', marginTop: 2 }}>
                                {attachedRecipes.length} Prescribed {attachedRecipes.length === 1 ? 'Dish' : 'Dishes'}
                            </Text>
                        </View>
                    </View>

                    {/* Section Header */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Prescribed Recipes & Preparation Methods</Text>
                        <View style={styles.sectionLine} />
                    </View>

                    {/* Formatted Recipe Table */}
                    <View style={styles.recipeTableContainer}>
                        {/* Table Header */}
                        <View style={styles.recipeTableHeader}>
                            <Text style={styles.recipeCol1Header}>DISH & MACRO PROFILE</Text>
                            <Text style={styles.recipeCol2Header}>MEASURED INGREDIENTS</Text>
                            <Text style={styles.recipeCol3Header}>STEP-BY-STEP COOKING METHOD</Text>
                        </View>

                        {/* Table Rows */}
                        {attachedRecipes.map((recipe, rIdx) => {
                            const ingList = ensureList(recipe.ingredients);
                            const instList = ensureList(recipe.instructions);
                            const isAlt = rIdx % 2 === 1;

                            // Build dynamic macro pills based on available nutrients
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
                                            <Text style={{ fontSize: 8, color: '#94a3b8', fontStyle: 'italic' }}>Standard ingredients as per meal blueprint.</Text>
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
                                            <Text style={{ fontSize: 8, color: '#94a3b8', fontStyle: 'italic' }}>Cook as prescribed by dietitian.</Text>
                                        )}

                                        {recipe.dietitian_tip ? (
                                            <View style={styles.recipeTipBox}>
                                                <Text style={styles.recipeTipLabel}>Dietitian Tip:</Text>
                                                <Text style={styles.recipeTipText}>{recipe.dietitian_tip}</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Page 4 Footer */}
                    <View style={styles.footerContainer}>
                        <Text style={styles.footerNote}>Clinical Culinary Guide | The Diet Cascade Precision Health</Text>
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
