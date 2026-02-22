'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { User, Phone, Instagram, FileText, Calendar, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import Swal from 'sweetalert2';

export default function CreateClientPage() {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        phone: '',
        instagram: '',
        initial_goals: '',
        assigned_plan_type: '1 Month Plan',
        plan_start_date: new Date().toISOString().split('T')[0],
        status: 'active'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const supabase = createClient();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const calculateEndDate = (startDate, planType) => {
        const start = new Date(startDate);
        let months = 1;
        if (planType === '3 Month Plan') months = 3;
        if (planType === '6 Month Plan') months = 6;
        start.setMonth(start.getMonth() + months);
        return start.toISOString().split('T')[0];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Create Supabase Auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thedietcascade.com'}/portal/dashboard`,
                }
            });

            if (authError) {
                setError(authError.message);
                setLoading(false);
                return;
            }

            if (!authData.user) {
                setError('Failed to create user account');
                setLoading(false);
                return;
            }

            // 2. Create client record
            const { error: clientError } = await supabase.from('clients').insert([{
                user_id: authData.user.id,
                full_name: formData.full_name,
                phone: formData.phone,
                instagram: formData.instagram || null,
                initial_goals: formData.initial_goals,
                assigned_plan_type: formData.assigned_plan_type,
                plan_start_date: formData.plan_start_date,
                plan_end_date: calculateEndDate(formData.plan_start_date, formData.assigned_plan_type),
                status: formData.status
            }]);

            if (clientError) {
                setError(clientError.message);
                setLoading(false);
                return;
            }

            await Swal.fire({
                icon: 'success',
                title: 'Client Created!',
                text: 'The client will receive a confirmation email.',
                confirmButtonColor: '#fdbc00',
                timer: 2500
            });
            router.push('/admin/clients');
        } catch (err) {
            setError('An unexpected error occurred');
            console.error(err);
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/clients" className="p-2 hover:bg-gray-100 rounded-full transition">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-heading">Add New Client</h1>
                    <p className="text-gray-500 mt-1">Create a client account and assign a plan</p>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl border border-gray-100 space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-heading flex items-center gap-2">
                        <User size={16} className="text-primary" />
                        Full Name *
                    </label>
                    <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                        placeholder="John Doe"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                </div>

                {/* Email & Password */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-heading">Email *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="client@example.com"
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                        <p className="text-xs text-gray-400">Client will use this to log in</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-heading">Password *</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={6}
                            placeholder="Min. 6 characters"
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                        <p className="text-xs text-gray-400">Temporary password for client</p>
                    </div>
                </div>

                {/* Phone & Instagram */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-heading flex items-center gap-2">
                            <Phone size={16} className="text-primary" />
                            Phone Number *
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            placeholder="+91 9876543210"
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-heading flex items-center gap-2">
                            <Instagram size={16} className="text-primary" />
                            Instagram Handle
                        </label>
                        <input
                            type="text"
                            name="instagram"
                            value={formData.instagram}
                            onChange={handleChange}
                            placeholder="username (without @)"
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                </div>

                {/* Initial Goals */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-heading flex items-center gap-2">
                        <FileText size={16} className="text-primary" />
                        Initial Goals
                    </label>
                    <textarea
                        name="initial_goals"
                        value={formData.initial_goals}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Weight loss, muscle gain, health management, etc."
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    />
                </div>

                {/* Plan Details */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-heading">Assigned Plan *</label>
                        <select
                            name="assigned_plan_type"
                            value={formData.assigned_plan_type}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            <option value="1 Month Plan">1 Month Plan</option>
                            <option value="3 Month Plan">3 Month Plan</option>
                            <option value="6 Month Plan">6 Month Plan</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-heading flex items-center gap-2">
                            <Calendar size={16} className="text-primary" />
                            Plan Start Date *
                        </label>
                        <input
                            type="date"
                            name="plan_start_date"
                            value={formData.plan_start_date}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-heading">Status</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

                {/* Submit */}
                <div className="flex gap-4 pt-4">
                    <Link
                        href="/admin/clients"
                        className="flex-1 py-3 text-center border-2 border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3 bg-primary px-5 bg-primary hover:bg-primary-dark shadow-lg text-black cursor-pointer font-bold rounded-lg hover:bg-primary-dark transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Save size={18} />
                        {loading ? 'Creating...' : 'Create Client'}
                    </button>
                </div>
            </form>
        </div>
    );
}
