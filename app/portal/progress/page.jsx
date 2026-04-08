'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Calendar, Camera, FileText, TrendingUp, Save, ChevronLeft, Scale, Ruler, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Swal from 'sweetalert2';

const MEASUREMENT_FIELDS = [
    { key: 'chest_cm', label: 'Chest', unit: 'cm', placeholder: '95', min: 50, max: 200, icon: Ruler, bg: 'bg-primary/5', border: 'border-primary/10', text: 'text-primary', ring: 'focus:ring-primary/20' },
    { key: 'waist_cm', label: 'Waist', unit: 'cm', placeholder: '85', min: 40, max: 200, icon: Ruler, bg: 'bg-accent/5', border: 'border-accent/10', text: 'text-accent-dark', ring: 'focus:ring-accent/20' },
    { key: 'hips_cm', label: 'Hips', unit: 'cm', placeholder: '100', min: 50, max: 200, icon: Ruler, bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', ring: 'focus:ring-blue-200' },
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
                Swal.fire({ icon: 'error', title: 'Error Saving Progress', text: error.message, confirmButtonColor: '#2d6a4f' });
            } else {
                await Swal.fire({ icon: 'success', title: 'Progress Logged!', text: 'Your physical metrics have been updated.', confirmButtonColor: '#2d6a4f', timer: 2000 });
                router.push('/portal/progress/history');
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Unexpected Error', text: 'Please try again.', confirmButtonColor: '#2d6a4f' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface">
            <div className="max-w-2xl mx-auto px-5 sm:px-8 py-8 sm:py-12 pb-32">

                {/* Header */}
                <div className="flex items-center justify-between gap-4 mb-10">
                    <div className="flex items-center gap-4">
                        <Link href="/portal/dashboard" className="p-2.5 bg-white rounded-xl hover:text-primary transition-colors shadow-sm shadow-heading/5 sm:hidden">
                            <ChevronLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-heading font-bold text-heading">Update <span className="text-primary italic">Stats</span></h1>
                            <p className="text-para text-xs md:text-sm mt-0.5">Track your evolution day by day</p>
                        </div>
                    </div>
                    <Link
                        href="/portal/progress/history"
                        className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 text-heading font-bold rounded-xl transition-all duration-150 active:scale-95 shadow-sm shadow-heading/5 text-[10px] md:text-xs uppercase tracking-widest"
                    >
                        <TrendingUp size={14} className="text-primary" />
                        History
                    </Link>
                </div>

                {errors.general && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-medium animate-in fade-in duration-300">
                        {errors.general}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl shadow-heading/5 border border-gray-50 space-y-8">

                    {/* Date Selector */}
                    <div className="space-y-2">
                        <label className="text-[10px] md:text-xs font-bold text-heading uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                            <Calendar size={14} className="text-primary" /> Entry Date
                        </label>
                        <input
                            type="date" name="date" value={formData.date} onChange={handleChange}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary transition-all text-sm font-medium"
                            required
                        />
                    </div>

                    {/* Weight Entry */}
                    <div className="space-y-2">
                        <label className="text-[10px] md:text-xs font-bold text-heading uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                            <Scale size={14} className="text-primary" /> Body Weight (kg)
                        </label>
                        <div className="relative">
                            <input
                                type="number" step="0.1" min="20" max="300"
                                name="weight_kg" value={formData.weight_kg} onChange={handleChange}
                                placeholder="00.0"
                                className={`w-full px-5 py-4 rounded-xl border transition-all focus:outline-none focus:ring-4 focus:ring-primary/10 text-sm font-bold ${errors.weight_kg ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-surface focus:bg-white focus:border-primary'}`}
                            />
                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] text-para/40 font-black uppercase tracking-widest">Kilograms</span>
                        </div>
                        {errors.weight_kg && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.weight_kg}</p>}
                    </div>

                    {/* Body Measurements */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-[10px] md:text-xs font-bold text-heading uppercase tracking-[0.2em]">Body Metrics</label>
                            <span className="text-[8px] font-black text-para/30 uppercase tracking-widest">Optional but helpful</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {MEASUREMENT_FIELDS.map(f => (
                                <div key={f.key} className={`rounded-[1.5rem] border ${f.border} ${f.bg} p-4 md:p-5 transition-transform duration-200 hover:-translate-y-1`}>
                                    <label className={`block text-[10px] font-black ${f.text} uppercase tracking-[0.2em] mb-3`}>{f.label}</label>
                                    <div className="relative">
                                        <input
                                            type="number" step="0.1" min={f.min} max={f.max}
                                            name={f.key} value={formData[f.key]} onChange={handleChange}
                                            placeholder={f.placeholder}
                                            className={`w-full px-4 py-2.5 rounded-xl border border-white/50 bg-white/80 focus:bg-white focus:outline-none focus:ring-4 ${f.ring} text-sm font-bold shadow-sm ${errors[f.key] ? 'border-red-200' : ''}`}
                                        />
                                        <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold ${f.text} opacity-30`}>cm</span>
                                    </div>
                                    {errors[f.key] && <p className="text-[10px] text-red-500 font-bold mt-2 ml-1">{errors[f.key]}</p>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Photo Upload */}
                    <div className="space-y-4 pt-2">
                        <label className="text-[10px] md:text-xs font-bold text-heading uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                            <Camera size={14} className="text-primary" /> Progress Photo
                        </label>

                        {photoPreview ? (
                            <div className="relative rounded-[2rem] overflow-hidden border-2 border-primary/20 shadow-xl group">
                                <img src={photoPreview} alt="Preview" className="w-full max-h-64 object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                                        className="p-4 bg-white text-red-500 rounded-2xl shadow-2xl transition-transform active:scale-90 cursor-pointer"
                                    >
                                        <Trash2 size={24} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <label className={`flex flex-col items-center justify-center gap-3 px-6 py-10 rounded-[2rem] border-2 border-dashed transition-all cursor-pointer ${errors.photo ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-surface hover:bg-white hover:border-primary hover:shadow-xl hover:shadow-primary/5'}`}>
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                    <Camera size={24} />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-bold text-heading">Capture or Select Photo</p>
                                    <p className="text-[10px] text-para/50 mt-1 uppercase tracking-widest font-black">Visual Tracking is Key</p>
                                </div>
                                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                            </label>
                        )}
                        {errors.photo && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.photo}</p>}
                    </div>

                    {/* Notes Area */}
                    <div className="space-y-2">
                        <label className="text-[10px] md:text-xs font-bold text-heading uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                            <FileText size={14} className="text-primary" /> Daily Observations
                        </label>
                        <textarea
                            name="notes" value={formData.notes} onChange={handleChange}
                            rows={4}
                            placeholder="Describe how you feel today, energy levels, cravings, etc."
                            className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary transition-all text-sm leading-relaxed resize-none"
                        />
                    </div>

                    {/* Save Button */}
                    <div className="pt-4">
                        <button
                            type="submit" disabled={loading}
                            className="w-full py-5 bg-heading text-white font-bold rounded-2xl shadow-2xl shadow-heading/20 transition-all duration-150 active:scale-[0.97] hover:bg-primary flex items-center justify-center gap-3 disabled:opacity-50 text-sm md:text-base cursor-pointer group"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={20} className="transition-transform group-hover:scale-110" />
                                    Commit Progress
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
