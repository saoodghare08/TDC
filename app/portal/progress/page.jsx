'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Calendar, Camera, FileText, TrendingUp, Save, ArrowLeft, Scale, Ruler } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Swal from 'sweetalert2';

const MEASUREMENT_FIELDS = [
    { key: 'chest_cm', label: 'Chest', unit: 'cm', placeholder: '95', min: 50, max: 200, icon: Ruler, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', ring: 'focus:ring-blue-200' },
    { key: 'waist_cm', label: 'Waist', unit: 'cm', placeholder: '85', min: 40, max: 200, icon: Ruler, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-500', ring: 'focus:ring-red-200' },
    { key: 'hips_cm', label: 'Hips', unit: 'cm', placeholder: '100', min: 50, max: 200, icon: Ruler, bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', ring: 'focus:ring-purple-200' },
];

export default function ProgressPage() {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        weight_kg: '', chest_cm: '', waist_cm: '', hips_cm: '', notes: '',
    });
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [clientId, setClientId] = useState(null);
    const [errors, setErrors] = useState({});
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const getClientId = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: client } = await supabase.from('clients').select('id').eq('user_id', user.id).single();
                if (client) setClientId(client.id);
            }
        };
        getClientId();
    }, [supabase]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) { setPhotoFile(null); setPhotoPreview(null); return; }
        if (file.size > 5 * 1024 * 1024) { setErrors({ ...errors, photo: 'Photo must be under 5MB' }); return; }
        if (!file.type.startsWith('image/')) { setErrors({ ...errors, photo: 'Only image files allowed' }); return; }
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
        setErrors({ ...errors, photo: null });
    };

    const validateForm = () => {
        const newErrors = {};
        const hasData = formData.weight_kg || formData.chest_cm || formData.waist_cm || formData.hips_cm || photoFile || formData.notes;
        if (!hasData) { newErrors.general = 'Please enter at least one measurement, photo, or note'; }
        if (formData.weight_kg) {
            const w = parseFloat(formData.weight_kg);
            if (isNaN(w) || w < 20 || w > 300) newErrors.weight_kg = 'Weight must be between 20–300 kg';
        }
        if (formData.chest_cm) { const v = parseFloat(formData.chest_cm); if (isNaN(v) || v < 50 || v > 200) newErrors.chest_cm = '50–200 cm'; }
        if (formData.waist_cm) { const v = parseFloat(formData.waist_cm); if (isNaN(v) || v < 40 || v > 200) newErrors.waist_cm = '40–200 cm'; }
        if (formData.hips_cm) { const v = parseFloat(formData.hips_cm); if (isNaN(v) || v < 50 || v > 200) newErrors.hips_cm = '50–200 cm'; }
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return false; }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        if (!clientId) { setErrors({ general: 'Client profile not found' }); return; }

        setLoading(true); setErrors({});
        try {
            let photoUrl = null;
            if (photoFile) {
                const fileExt = photoFile.name.split('.').pop();
                const fileName = `${clientId}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('progress-photos').upload(fileName, photoFile);
                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage.from('progress-photos').getPublicUrl(fileName);
                    photoUrl = publicUrl;
                }
            }

            const { error } = await supabase.from('progress_entries').insert([{
                client_id: clientId, date: formData.date,
                weight_kg: formData.weight_kg || null, chest_cm: formData.chest_cm || null,
                waist_cm: formData.waist_cm || null, hips_cm: formData.hips_cm || null,
                photo_url: photoUrl, notes: formData.notes || null,
            }]);

            if (error) {
                Swal.fire({ icon: 'error', title: 'Error Saving Progress', text: error.message, confirmButtonColor: '#fdbc00' });
            } else {
                await Swal.fire({ icon: 'success', title: 'Progress Logged!', text: 'Your progress has been saved.', confirmButtonColor: '#fdbc00', timer: 2000 });
                router.push('/portal/progress/history');
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Unexpected Error', text: 'Please try again.', confirmButtonColor: '#fdbc00' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-12">

                {/* ── Header ── */}
                <div className="flex items-start justify-between gap-3 mb-6 sm:mb-10">
                    <div className="flex items-center gap-3">
                        <Link href="/portal/dashboard" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm sm:hidden shrink-0">
                            <ArrowLeft size={18} className="text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-heading font-bold text-heading leading-tight">
                                Log Your Progress
                            </h1>
                            <p className="text-gray-400 text-sm mt-0.5">Track your measurements and journey</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.push('/portal/progress/history')}
                        className="shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition cursor-pointer text-sm"
                    >
                        <TrendingUp size={16} />
                        <span className="hidden sm:inline">View </span>History
                    </button>
                </div>

                {errors.general && (
                    <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-medium">
                        {errors.general}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 space-y-5 sm:space-y-6">

                    {/* Date */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-heading flex items-center gap-2">
                            <Calendar size={15} className="text-primary" /> Date
                        </label>
                        <input
                            type="date" name="date" value={formData.date} onChange={handleChange}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm"
                            required
                        />
                    </div>

                    {/* Weight — full width, prominent */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-heading flex items-center gap-2">
                            <Scale size={15} className="text-amber-500" /> Weight (kg)
                        </label>
                        <div className="relative">
                            <input
                                type="number" step="0.1" min="20" max="300"
                                name="weight_kg" value={formData.weight_kg} onChange={handleChange}
                                placeholder="70.5"
                                className={`w-full px-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl border transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm ${errors.weight_kg ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-primary'}`}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">kg</span>
                        </div>
                        {errors.weight_kg && <p className="text-xs text-red-500">{errors.weight_kg}</p>}
                    </div>

                    {/* Body Measurements — 2-col grid on all sizes */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-heading">Body Measurements</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {MEASUREMENT_FIELDS.map(f => (
                                <div key={f.key} className={`rounded-xl border ${f.border} ${f.bg} p-3`}>
                                    <label className={`block text-xs font-bold ${f.text} mb-1.5`}>{f.label} ({f.unit})</label>
                                    <div className="relative">
                                        <input
                                            type="number" step="0.1" min={f.min} max={f.max}
                                            name={f.key} value={formData[f.key]} onChange={handleChange}
                                            placeholder={f.placeholder}
                                            className={`w-full px-3 py-2 sm:py-2.5 rounded-lg border border-white bg-white focus:outline-none focus:ring-2 ${f.ring} text-sm font-semibold ${errors[f.key] ? 'border-red-300' : ''}`}
                                        />
                                    </div>
                                    {errors[f.key] && <p className="text-xs text-red-500 mt-1">{errors[f.key]}</p>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Photo Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-heading flex items-center gap-2">
                            <Camera size={15} className="text-primary" /> Progress Photo <span className="text-gray-400 font-normal">(optional)</span>
                        </label>

                        {photoPreview && (
                            <div className="relative rounded-xl overflow-hidden border border-gray-200 mb-2">
                                <img src={photoPreview} alt="Preview" className="w-full max-h-48 object-cover" />
                                <button
                                    type="button"
                                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                                    className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-lg text-red-500 shadow transition cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>
                        )}

                        <label className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border border-dashed cursor-pointer transition text-sm ${errors.photo ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'}`}>
                            <Camera size={18} className="text-gray-400 shrink-0" />
                            <span className="text-gray-500 font-medium truncate">
                                {photoFile ? photoFile.name : 'Tap to choose a photo…'}
                            </span>
                            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                        </label>
                        {errors.photo && <p className="text-xs text-red-500">{errors.photo}</p>}
                        <p className="text-xs text-gray-400">Max 5MB · JPG, PNG, WEBP</p>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-heading flex items-center gap-2">
                            <FileText size={15} className="text-primary" /> Notes <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <textarea
                            name="notes" value={formData.notes} onChange={handleChange}
                            rows={3}
                            placeholder="How are you feeling? Any observations?"
                            className="w-full px-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm resize-none"
                        />
                    </div>

                    {/* Submit */}
                    <div className="pt-2">
                        <button
                            type="submit" disabled={loading}
                            className="cursor-pointer w-full py-4 bg-linear-to-r from-primary to-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                            <Save size={18} />
                            {loading ? 'Saving…' : 'Save Progress'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
