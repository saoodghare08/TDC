'use client';

import React, { useState } from 'react';
import {
    User,
    X,
    Calendar,
    ChevronDown,
    ChevronUp,
    ArrowRight,
    Check,
} from 'lucide-react';
import {
    GOAL_CHIPS,
    addMonthsToIsoDate,
    parseNaturalHeightToCm,
    roundOne,
} from '@/components/admin/diet-generator/dietGeneratorUtils';

const STATUS_OPTIONS = [
    { key: 'active', label: 'Active', activeCls: 'bg-emerald-600 text-white border-emerald-600' },
    { key: 'paused', label: 'Paused', activeCls: 'bg-amber-500 text-white border-amber-500' },
    { key: 'completed', label: 'Completed', activeCls: 'bg-blue-600 text-white border-blue-600' },
];

export default function ClientFormModal({
    isOpen,
    mode = 'create', // 'create' | 'edit'
    form,
    setForm,
    saving = false,
    onClose,
    onSubmit, // (e, { openDietBuilderAfter: boolean }) => void
}) {
    const hasExtraDetails = Boolean(
        form?.age?.trim() || form?.height?.trim() || form?.notes?.trim()
    );
    const [showOptionalDetails, setShowOptionalDetails] = useState(
        () => mode === 'edit' && hasExtraDetails
    );

    if (!isOpen) return null;

    const toggleGoalChip = (chip) => {
        const current = (form.initial_goals || '').trim();
        if (current.toLowerCase() === chip.toLowerCase()) {
            setForm((prev) => ({ ...prev, initial_goals: '' }));
        } else {
            setForm((prev) => ({ ...prev, initial_goals: chip }));
        }
    };

    const handleApplyProgramDuration = (months) => {
        const todayIso = new Date().toISOString().split('T')[0];
        setForm((prev) => {
            const baseStart = prev.plan_start_date || todayIso;
            return {
                ...prev,
                plan_start_date: baseStart,
                plan_end_date: addMonthsToIsoDate(baseStart, months),
            };
        });
    };

    const handleHeightBlur = () => {
        const raw = (form.height || '').trim();
        if (!raw) return;
        const cm = parseNaturalHeightToCm(raw);
        if (Number.isFinite(cm) && cm > 0) {
            const inches = roundOne(cm / 2.54);
            setForm((prev) => ({
                ...prev,
                height: `${cm} cm (${inches} in)`,
            }));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/45 backdrop-blur-xs">
            <div
                className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-gray-100 max-h-[92dvh] overflow-y-auto"
                style={{ animation: 'modalIn 180ms cubic-bezier(0.23, 1, 0.32, 1)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <User size={18} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-heading">
                                {mode === 'create' ? 'Add New Client' : 'Edit Client Profile'}
                            </h2>
                            <p className="text-[11px] text-gray-500">
                                {mode === 'create'
                                    ? 'Only Full Name is required — everything else can be added anytime'
                                    : 'Update client contact details, status, or program dates'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form
                    onSubmit={(e) => onSubmit(e, { openDietBuilderAfter: false })}
                    className="space-y-4"
                >
                    {/* ── 1. ESSENTIAL DETAILS: Name, WhatsApp & Status ── */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                Client Full Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={form.full_name}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        full_name: e.target.value,
                                    }))
                                }
                                placeholder="e.g., Ananya Sharma"
                                className="w-full min-h-[42px] text-sm font-semibold px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    WhatsApp / Phone
                                </label>
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            phone: e.target.value,
                                        }))
                                    }
                                    placeholder="+91 98765 43210"
                                    className="w-full min-h-[42px] text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Client Status
                                </label>
                                <div className="min-h-[42px] grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl">
                                    {STATUS_OPTIONS.map((st) => {
                                        const active = (form.status || 'active') === st.key;
                                        return (
                                            <button
                                                key={st.key}
                                                type="button"
                                                onClick={() =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        status: st.key,
                                                    }))
                                                }
                                                className={`rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                                    active
                                                        ? `${st.activeCls} shadow-2xs`
                                                        : 'text-gray-600 hover:text-heading'
                                                }`}
                                            >
                                                {st.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── 2. PRIMARY GOAL (1-Tap Chips + Custom Input) ── */}
                    <div className="space-y-1.5 pt-2 border-t border-gray-100">
                        <label className="block text-xs font-bold text-gray-700">
                            Main Health / Weight Goal{' '}
                            <span className="text-gray-400 font-normal">(Tap or type)</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {GOAL_CHIPS.map((chip) => {
                                const active =
                                    (form.initial_goals || '').trim().toLowerCase() ===
                                    chip.toLowerCase();
                                return (
                                    <button
                                        key={chip}
                                        type="button"
                                        onClick={() => toggleGoalChip(chip)}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                                            active
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
                            value={form.initial_goals}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    initial_goals: e.target.value,
                                }))
                            }
                            placeholder="Or type custom goal (e.g., Postpartum Fat Loss)"
                            className="w-full min-h-10 text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    {/* ── 3. PROGRAM START & END DATES (1-Tap Duration Presets) ── */}
                    <div className="rounded-2xl bg-gray-50/80 border border-gray-200/80 p-3.5 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold text-heading flex items-center gap-1.5">
                                <Calendar size={14} className="text-primary" />
                                Program Duration
                            </span>
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] text-gray-400 mr-0.5">
                                    Quick set:
                                </span>
                                {[
                                    { label: '1 Month', months: 1 },
                                    { label: '3 Months', months: 3 },
                                    { label: '6 Months', months: 6 },
                                ].map((opt) => (
                                    <button
                                        key={opt.label}
                                        type="button"
                                        onClick={() => handleApplyProgramDuration(opt.months)}
                                        className="px-2 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-[11px] font-bold text-primary transition cursor-pointer"
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                            <div>
                                <label className="flex items-center justify-between text-[11px] font-semibold text-gray-600 mb-1">
                                    <span>Plan Start Date</span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setForm((prev) => ({
                                                ...prev,
                                                plan_start_date: new Date()
                                                    .toISOString()
                                                    .split('T')[0],
                                            }))
                                        }
                                        className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                                    >
                                        Today
                                    </button>
                                </label>
                                <input
                                    type="date"
                                    value={form.plan_start_date}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            plan_start_date: e.target.value,
                                        }))
                                    }
                                    className="w-full min-h-10 text-xs px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                    Plan End Date
                                </label>
                                <input
                                    type="date"
                                    value={form.plan_end_date}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            plan_end_date: e.target.value,
                                        }))
                                    }
                                    className="w-full min-h-10 text-xs px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-primary"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── 4. PROGRESSIVE OPTIONAL DETAILS: Age, Height & Notes ── */}
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowOptionalDetails((o) => !o)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-primary transition cursor-pointer"
                        >
                            <span>
                                {showOptionalDetails
                                    ? 'Hide Age, Height & Notes'
                                    : '+ Add Age, Height or Notes (Optional)'}
                            </span>
                            {hasExtraDetails && !showOptionalDetails && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px]">
                                    Filled
                                </span>
                            )}
                            {showOptionalDetails ? (
                                <ChevronUp size={14} className="text-gray-400" />
                            ) : (
                                <ChevronDown size={14} className="text-gray-400" />
                            )}
                        </button>

                        {showOptionalDetails && (
                            <div className="mt-2.5 p-3.5 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                            Age
                                        </label>
                                        <input
                                            type="text"
                                            value={form.age}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    age: e.target.value,
                                                }))
                                            }
                                            placeholder="e.g., 29 yrs"
                                            className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                            Height (cm or ft/in)
                                        </label>
                                        <input
                                            type="text"
                                            value={form.height}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    height: e.target.value,
                                                }))
                                            }
                                            onBlur={handleHeightBlur}
                                            placeholder={`165 cm or 5'5"`}
                                            className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                        Notes / Allergies
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={form.notes}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                notes: e.target.value,
                                            }))
                                        }
                                        placeholder="Any food allergies, medical history, or consultation notes..."
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── FOOTER ACTIONS ── */}
                    <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto min-h-10 px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                        >
                            Cancel
                        </button>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            {mode === 'create' ? (
                                <>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-primary border border-emerald-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                                    >
                                        <Check size={14} />
                                        <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        disabled={saving}
                                        onClick={(e) =>
                                            onSubmit(e, { openDietBuilderAfter: true })
                                        }
                                        className="min-h-[42px] px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs inline-flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                                    >
                                        <span>
                                            {saving ? 'Creating...' : 'Save & Build Diet Plan'}
                                        </span>
                                        <ArrowRight size={14} />
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="min-h-[42px] px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
