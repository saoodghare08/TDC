'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    User,
    Search,
    Sparkles,
    Copy,
    Calendar,
    Clock,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Trash2,
    BookmarkPlus,
    X,
    HeartPulse,
    Ruler,
    ArrowLeftRight,
} from 'lucide-react';
import {
    FOOD_HABIT_CHIPS,
    LIFESTYLE_CHIPS,
    GOAL_CHIPS,
    addDaysToIsoDate,
    addMonthsToIsoDate,
    parseNaturalHeightToCm,
    DEFAULT_CALC_CONFIG,
} from './dietGeneratorUtils';

export default function StepClientBasics({
    formData,
    setFormData,
    allClients,
    selectedClient,
    onSelectClientObject,
    onDetachClient,
    onClientNameChange,
    clientPastPlans,
    loadedPlanRecord,
    onCopyPastPlan,
    templates,
    loadingTemplates,
    onApplyTemplate,
    onSaveCurrentAsTemplate,
    onDeleteTemplate,
    calcConfig,
    activeIbwNum,
    onHeightCmChange,
    onHeightInchesChange,
    onHeightFeetInchesChange,
    onIbwOffsetChange,
    onManualIbwChange,
}) {
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [showTemplatesDrawer, setShowTemplatesDrawer] = useState(false);
    const [showHeightHelper, setShowHeightHelper] = useState(false);
    const [showHealthDetails, setShowHealthDetails] = useState(() =>
        Boolean(
            formData.medical_conditions?.trim() ||
            formData.medication?.trim() ||
            formData.health_abuses?.trim()
        )
    );
    const clientBoxRef = useRef(null);

    const hasMedicalContent = Boolean(
        formData.medical_conditions?.trim() ||
        formData.medication?.trim() ||
        formData.health_abuses?.trim()
    );

    useEffect(() => {
        const handleOutside = (e) => {
            if (clientBoxRef.current && !clientBoxRef.current.contains(e.target)) {
                setShowClientDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    const matchingClients = useMemo(() => {
        const q = (formData.client_name || '').trim().toLowerCase();
        if (!q) return allClients.slice(0, 8);
        return allClients
            .filter(
                (c) =>
                    c.full_name?.toLowerCase().includes(q) ||
                    c.phone?.toLowerCase().includes(q) ||
                    c.initial_goals?.toLowerCase().includes(q)
            )
            .slice(0, 8);
    }, [allClients, formData.client_name]);

    const latestPastPlan = useMemo(() => {
        if (!Array.isArray(clientPastPlans) || clientPastPlans.length === 0) return null;
        return clientPastPlans.find((p) => p.id !== loadedPlanRecord?.id) || null;
    }, [clientPastPlans, loadedPlanRecord?.id]);

    const selectedGender = Number(calcConfig?.ibwOffset) === 100 ? 'male' : 'female';

    const handleNaturalHeightBlur = () => {
        const raw = (formData.client_height || '').trim();
        if (!raw) return;
        const parsedCm = parseNaturalHeightToCm(raw);
        if (Number.isFinite(parsedCm) && parsedCm > 0) {
            onHeightCmChange(String(parsedCm));
        }
    };

    const toggleChipValue = (field, chipVal) => {
        const current = (formData[field] || '').trim();
        if (current.toLowerCase() === chipVal.toLowerCase()) {
            setFormData((prev) => ({ ...prev, [field]: '' }));
        } else {
            setFormData((prev) => ({ ...prev, [field]: chipVal }));
        }
    };

    return (
        <div className="space-y-4">
            {/* ── QUICK-START BAR: Templates & Past Revision Cloner ── */}
            <div className="bg-linear-to-br from-emerald-50/90 via-white to-amber-50/40 rounded-2xl border border-emerald-200/80 p-3.5 sm:p-4 shadow-2xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="w-7 h-7 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
                            <Sparkles size={14} />
                        </span>
                        <div className="min-w-0">
                            <h3 className="text-xs sm:text-sm font-bold text-heading">
                                Fast Start Shortcuts
                            </h3>
                            <p className="text-[11px] text-gray-500 truncate">
                                Pick a saved clinic template or copy a returning client&apos;s previous plan
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowTemplatesDrawer((o) => !o)}
                            className="min-h-9 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-heading border border-emerald-200 text-xs font-bold shadow-2xs transition cursor-pointer"
                        >
                            <Sparkles size={13} className="text-amber-500" />
                            <span>
                                {showTemplatesDrawer
                                    ? 'Hide Templates'
                                    : `Browse Templates (${templates.length})`}
                            </span>
                            {showTemplatesDrawer ? (
                                <ChevronUp size={13} className="text-gray-400" />
                            ) : (
                                <ChevronDown size={13} className="text-gray-400" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Returning Client 1-Tap Copy Banner */}
                {selectedClient && latestPastPlan && (
                    <div className="rounded-xl bg-white border border-emerald-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                                <Copy size={13} className="text-primary shrink-0" />
                                <span className="truncate">
                                    Returning Client: {selectedClient.full_name} has{' '}
                                    {clientPastPlans.length} saved{' '}
                                    {clientPastPlans.length === 1 ? 'plan' : 'plans'}
                                </span>
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                                Latest: <strong>Rev {latestPastPlan.revision_number}</strong> —{' '}
                                {latestPastPlan.plan_title || 'Diet Plan'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => onCopyPastPlan(latestPastPlan)}
                            className="min-h-9 inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold whitespace-nowrap shadow-2xs transition cursor-pointer shrink-0"
                        >
                            <Copy size={12} />
                            <span>Copy Rev {latestPastPlan.revision_number} to Edit</span>
                        </button>
                    </div>
                )}

                {/* Visual Template Picker Grid */}
                {showTemplatesDrawer && (
                    <div className="pt-2 border-t border-emerald-100 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                Saved Clinic Templates
                            </span>
                            <button
                                type="button"
                                onClick={onSaveCurrentAsTemplate}
                                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                            >
                                <BookmarkPlus size={13} />
                                <span>Save Current Plan as Template</span>
                            </button>
                        </div>

                        {loadingTemplates ? (
                            <p className="text-xs text-gray-400 py-3 text-center">
                                Loading templates...
                            </p>
                        ) : templates.length === 0 ? (
                            <p className="text-xs text-gray-500 py-3 text-center bg-white rounded-xl border border-dashed border-gray-200">
                                No saved templates yet. Once you build a plan, click &ldquo;Save
                                Current Plan as Template&rdquo; to reuse it in 1 tap.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                                {templates.map((preset) => (
                                    <div
                                        key={preset.id || preset.label}
                                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-gray-200/90 hover:border-primary hover:bg-emerald-50/40 transition"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onApplyTemplate(preset);
                                                setShowTemplatesDrawer(false);
                                            }}
                                            className="flex-1 text-left min-w-0 cursor-pointer"
                                        >
                                            <p className="text-xs font-bold text-heading truncate">
                                                {preset.label}
                                            </p>
                                            <p className="text-[11px] text-primary font-semibold mt-0.5">
                                                {preset.badge ||
                                                    (preset.calories
                                                        ? `${preset.calories} kcal`
                                                        : 'Load preset')}
                                            </p>
                                        </button>
                                        {preset.id && !preset.is_preset && (
                                            <button
                                                type="button"
                                                onClick={(e) =>
                                                    onDeleteTemplate(preset.id, preset.label, e)
                                                }
                                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 cursor-pointer shrink-0"
                                                title="Delete custom template"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── CARD 1: WHO IS THIS PLAN FOR? ── */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 sm:p-5 space-y-5">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <User size={16} />
                        </div>
                        <div>
                            <h2 className="text-sm sm:text-base font-bold text-heading">
                                Client Details &amp; Body Profile
                            </h2>
                            <p className="text-[11px] text-gray-500">
                                Pick an existing client or type a new name — profile saves automatically
                            </p>
                        </div>
                    </div>

                    {selectedClient && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800 shrink-0">
                            <CheckCircle2 size={12} className="text-primary" />
                            <Link
                                href={`/admin/clients/${selectedClient.id}`}
                                className="hover:underline max-w-[120px] sm:max-w-[180px] truncate"
                            >
                                {selectedClient.full_name}
                            </Link>
                            <button
                                type="button"
                                onClick={onDetachClient}
                                className="text-gray-400 hover:text-red-500 ml-0.5 cursor-pointer"
                                title="Unlink from this client profile"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Row 1: Searchable Client Name + Phone + Age + Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* Touch-Friendly Searchable Client Combobox */}
                    <div className="sm:col-span-2 relative" ref={clientBoxRef}>
                        <label className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1">
                            <span>Client Full Name *</span>
                            <span className="text-[10px] font-medium text-gray-400">
                                {selectedClient ? 'Linked to saved profile' : 'Search or type new name'}
                            </span>
                        </label>
                        <div className="relative">
                            <Search
                                size={14}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                            <input
                                type="text"
                                value={formData.client_name}
                                onFocus={() => setShowClientDropdown(true)}
                                onChange={(e) => {
                                    onClientNameChange(e.target.value);
                                    setShowClientDropdown(true);
                                }}
                                placeholder="Type client name (e.g., Ananya Sharma)"
                                className="w-full min-h-[42px] text-sm font-semibold pl-9 pr-8 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                required
                            />
                            {formData.client_name && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onDetachClient();
                                        setFormData((prev) => ({ ...prev, client_name: '' }));
                                    }}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                                    title="Clear name"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {showClientDropdown && allClients.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-200 z-40 max-h-60 overflow-y-auto p-1.5">
                                {matchingClients.length > 0 ? (
                                    <>
                                        <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                            Saved Clients (Tap to Auto-Fill)
                                        </p>
                                        {matchingClients.map((c) => {
                                            const isChosen = selectedClient?.id === c.id;
                                            return (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => {
                                                        onSelectClientObject(c);
                                                        setShowClientDropdown(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-2 transition cursor-pointer ${isChosen
                                                        ? 'bg-emerald-50 text-emerald-950 font-bold'
                                                        : 'hover:bg-gray-50 text-heading'
                                                        }`}
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold truncate">
                                                            {c.full_name}
                                                        </p>
                                                        <p className="text-[11px] text-gray-500 truncate">
                                                            {[c.phone, c.initial_goals]
                                                                .filter(Boolean)
                                                                .join(' • ') || 'Saved client'}
                                                        </p>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-primary shrink-0">
                                                        {isChosen ? 'Selected ✓' : 'Select'}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </>
                                ) : (
                                    <div className="px-3 py-2.5 text-xs text-gray-600 flex items-center justify-between">
                                        <span>
                                            New client:{' '}
                                            <strong className="text-heading">
                                                &ldquo;{formData.client_name.trim()}&rdquo;
                                            </strong>{' '}
                                            will be created automatically on save.
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setShowClientDropdown(false)}
                                            className="text-primary font-bold ml-2 cursor-pointer"
                                        >
                                            OK
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            WhatsApp / Phone
                        </label>
                        <input
                            type="tel"
                            value={formData.client_phone}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, client_phone: e.target.value }))
                            }
                            placeholder="+91 98765 43210"
                            className="w-full min-h-[42px] text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    {/* Age + Gender */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                Age
                            </label>
                            <input
                                type="text"
                                value={formData.client_age}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        client_age: e.target.value,
                                    }))
                                }
                                placeholder="29 yrs"
                                className="w-full min-h-[42px] text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                Gender
                            </label>
                            <div className="min-h-[42px] grid grid-cols-2 bg-gray-100 p-0.5 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => onIbwOffsetChange(105)}
                                    className={`rounded-lg text-xs font-bold transition cursor-pointer ${selectedGender === 'female'
                                        ? 'bg-white text-primary shadow-2xs'
                                        : 'text-gray-500 hover:text-heading'
                                        }`}
                                >
                                    Female
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onIbwOffsetChange(100)}
                                    className={`rounded-lg text-xs font-bold transition cursor-pointer ${selectedGender === 'male'
                                        ? 'bg-white text-primary shadow-2xs'
                                        : 'text-gray-500 hover:text-heading'
                                        }`}
                                >
                                    Male
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 2: Weight, Smart Height, Ideal Weight */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-gray-100">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Current Weight
                        </label>
                        <input
                            type="text"
                            value={formData.start_weight}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    start_weight: e.target.value,
                                }))
                            }
                            placeholder="e.g., 68.5 kg"
                            className="w-full min-h-[42px] text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1">
                            <span>Height (cm or ft/in)</span>
                            <button
                                type="button"
                                onClick={() => setShowHeightHelper((o) => !o)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline cursor-pointer"
                            >
                                <Ruler size={11} />
                                <span>{showHeightHelper ? 'Hide Converter' : 'ft/in ↔ cm'}</span>
                            </button>
                        </label>
                        <input
                            type="text"
                            value={formData.client_height}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    client_height: e.target.value,
                                }))
                            }
                            onBlur={handleNaturalHeightBlur}
                            placeholder={`Type 165 cm or 5'5" — auto-converts`}
                            className="w-full min-h-[42px] text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1">
                            <span>Target / Ideal Weight</span>
                            {Number.isFinite(activeIbwNum) && (
                                <span className="text-[10px] font-semibold text-emerald-700">
                                    Auto-suggested
                                </span>
                            )}
                        </label>
                        <input
                            type="text"
                            value={formData.target_weight}
                            onChange={(e) => onManualIbwChange(e.target.value)}
                            placeholder="Auto-fills from height (e.g., 60 kg)"
                            className="w-full min-h-[42px] text-xs font-semibold text-emerald-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    {/* Optional Expanded ft/in <-> cm Converter */}
                    {showHeightHelper && (
                        <div className="sm:col-span-3 rounded-xl bg-gray-50 border border-gray-200 p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-600 shrink-0">
                                    Feet &amp; Inches:
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    max="8"
                                    value={(calcConfig || DEFAULT_CALC_CONFIG).heightFeet}
                                    onChange={(e) =>
                                        onHeightFeetInchesChange(
                                            e.target.value,
                                            (calcConfig || DEFAULT_CALC_CONFIG).heightRemInches
                                        )
                                    }
                                    placeholder="5"
                                    className="w-14 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
                                />
                                <span className="text-xs text-gray-500">ft</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="11.9"
                                    step="0.5"
                                    value={(calcConfig || DEFAULT_CALC_CONFIG).heightRemInches}
                                    onChange={(e) =>
                                        onHeightFeetInchesChange(
                                            (calcConfig || DEFAULT_CALC_CONFIG).heightFeet,
                                            e.target.value
                                        )
                                    }
                                    placeholder="5"
                                    className="w-16 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
                                />
                                <span className="text-xs text-gray-500">in</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={(calcConfig || DEFAULT_CALC_CONFIG).heightCm}
                                    onChange={(e) => onHeightCmChange(e.target.value)}
                                    placeholder="cm (165)"
                                    className="flex-1 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
                                />
                                <ArrowLeftRight size={13} className="text-gray-400 shrink-0" />
                                <input
                                    type="number"
                                    step="0.1"
                                    value={(calcConfig || DEFAULT_CALC_CONFIG).heightInches}
                                    onChange={(e) => onHeightInchesChange(e.target.value)}
                                    placeholder="total in (65)"
                                    className="flex-1 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
                                />
                            </div>

                            <div className="text-xs text-right text-gray-600">
                                Suggested Ideal Weight:{' '}
                                <strong className="text-primary">
                                    {Number.isFinite(activeIbwNum) ? `${activeIbwNum} kg` : '—'}
                                </strong>
                            </div>
                        </div>
                    )}
                </div>

                {/* Row 3: Tap-to-Select Preference Chips */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-3 border-t border-gray-100">
                    {/* Food Preference */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-700">
                            Diet Preference
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {FOOD_HABIT_CHIPS.map((chip) => {
                                const active =
                                    (formData.food_habits || '').trim().toLowerCase() ===
                                    chip.toLowerCase();
                                return (
                                    <button
                                        key={chip}
                                        type="button"
                                        onClick={() => toggleChipValue('food_habits', chip)}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${active
                                            ? 'bg-primary text-white border-primary shadow-2xs'
                                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                            }`}
                                    >
                                        {chip}
                                    </button>
                                );
                            })}
                        </div>
                        <input
                            type="text"
                            value={formData.food_habits}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, food_habits: e.target.value }))
                            }
                            placeholder="Or type custom (e.g., Veg + Eggs on weekdays)"
                            className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    {/* Activity / Lifestyle */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-700">
                            Daily Activity / Routine
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {LIFESTYLE_CHIPS.map((chip) => {
                                const active =
                                    (formData.lifestyle || '').trim().toLowerCase() ===
                                    chip.toLowerCase();
                                return (
                                    <button
                                        key={chip}
                                        type="button"
                                        onClick={() => toggleChipValue('lifestyle', chip)}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${active
                                            ? 'bg-primary text-white border-primary shadow-2xs'
                                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                            }`}
                                    >
                                        {chip}
                                    </button>
                                );
                            })}
                        </div>
                        <input
                            type="text"
                            value={formData.lifestyle}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, lifestyle: e.target.value }))
                            }
                            placeholder="Or type custom routine"
                            className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    {/* Goal */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-700">
                            Main Health / Weight Goal
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {GOAL_CHIPS.map((chip) => {
                                const active =
                                    (formData.goal || '').trim().toLowerCase() ===
                                    chip.toLowerCase();
                                return (
                                    <button
                                        key={chip}
                                        type="button"
                                        onClick={() => toggleChipValue('goal', chip)}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${active
                                            ? 'bg-primary text-white border-primary shadow-2xs'
                                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                            }`}
                                    >
                                        {chip}
                                    </button>
                                );
                            })}
                        </div>
                        <input
                            type="text"
                            value={formData.goal}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, goal: e.target.value }))
                            }
                            placeholder="Or type custom goal (e.g., Postpartum Fat Loss)"
                            className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>

                {/* Collapsible Medical, Medicines & Daily Habits */}
                <div className="pt-2 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => setShowHealthDetails((o) => !o)}
                        className="inline-flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-primary transition cursor-pointer py-1"
                    >
                        <HeartPulse size={14} className="text-rose-600" />
                        <span>
                            Medical Conditions, Medicines &amp; Daily Habits{' '}
                            <span className="text-gray-400 font-normal">(Optional)</span>
                        </span>
                        {hasMedicalContent && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                Filled
                            </span>
                        )}
                        {showHealthDetails ? (
                            <ChevronUp size={14} className="text-gray-400" />
                        ) : (
                            <ChevronDown size={14} className="text-gray-400" />
                        )}
                    </button>

                    {showHealthDetails && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-gray-50/80 border border-gray-200/80">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Medical Conditions
                                </label>
                                <input
                                    type="text"
                                    value={formData.medical_conditions}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            medical_conditions: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g., PCOS, Hypothyroidism, None"
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Current Medicines
                                </label>
                                <input
                                    type="text"
                                    value={formData.medication}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            medication: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g., Thyronorm 50mcg, Metformin"
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Daily Habits (Tea/Coffee, Late Nights)
                                </label>
                                <input
                                    type="text"
                                    value={formData.health_abuses}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            health_abuses: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g., 3 cups chai, late dinners"
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── CARD 2: PLAN SCHEDULE & REMINDER DATES ── */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-gray-100">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                        <Calendar size={16} />
                    </div>
                    <div>
                        <h2 className="text-sm sm:text-base font-bold text-heading">
                            Plan Title &amp; Reminder Dates
                        </h2>
                        <p className="text-[11px] text-gray-500">
                            Setting a Revision Date automatically schedules your 3-day-before push notification
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Plan Title{' '}
                            <span className="text-gray-400 font-normal">(Auto if blank)</span>
                        </label>
                        <input
                            type="text"
                            value={formData.plan_title}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, plan_title: e.target.value }))
                            }
                            placeholder="e.g., Phase 1: Fat Loss Plan"
                            className="w-full min-h-[42px] text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div>
                        <label className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1">
                            <span>Plan Start Date</span>
                            <button
                                type="button"
                                onClick={() =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        start_date: new Date().toISOString().split('T')[0],
                                    }))
                                }
                                className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                            >
                                Today
                            </button>
                        </label>
                        <input
                            type="date"
                            value={formData.start_date}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, start_date: e.target.value }))
                            }
                            className="w-full min-h-[42px] text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div>
                        <label className="flex items-center justify-between gap-1 text-xs font-bold text-amber-900 mb-1">
                            <span className="inline-flex items-center gap-1">
                                <Clock size={12} className="text-amber-600" />
                                Next Revision Date
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    const nextRev = addDaysToIsoDate(formData.start_date, 15);
                                    setFormData((prev) => ({
                                        ...prev,
                                        revision_date: nextRev,
                                        next_review_date: nextRev,
                                    }));
                                }}
                                className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 hover:bg-amber-200 text-[10px] font-bold transition cursor-pointer"
                                title="Set Next Revision to +15 days from Start Date"
                            >
                                +15 Days
                            </button>
                        </label>
                        <input
                            type="date"
                            value={formData.revision_date || ''}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    revision_date: e.target.value,
                                    next_review_date: e.target.value,
                                }))
                            }
                            className="w-full min-h-[42px] text-xs px-3 py-2 rounded-xl border border-amber-200 bg-amber-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-300/40"
                        />
                    </div>

                    <div>
                        <label className="flex items-center justify-between gap-1 text-xs font-bold text-gray-700 mb-1">
                            <span>Program End Date</span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary">
                                {[
                                    { label: '+1M', months: 1 },
                                    { label: '+3M', months: 3 },
                                    { label: '+6M', months: 6 },
                                ].map((opt) => (
                                    <button
                                        key={opt.label}
                                        type="button"
                                        onClick={() =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                end_date: addMonthsToIsoDate(
                                                    prev.start_date,
                                                    opt.months
                                                ),
                                            }))
                                        }
                                        className="px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 transition cursor-pointer"
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </span>
                        </label>
                        <input
                            type="date"
                            value={formData.end_date}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, end_date: e.target.value }))
                            }
                            className="w-full min-h-[42px] text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
