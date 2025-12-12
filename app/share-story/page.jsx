'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Send, MapPin, User, Quote } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Section from '@/components/ui/Section';

export default function ShareStoryPage() {
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        content: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.from('reviews').insert([{
            ...formData,
            is_approved: false // Default to pending approval
        }]);

        if (error) {
            alert('Error submitting story: ' + error.message);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
        }
    };

    if (success) {
        return (
            <main className="min-h-screen bg-white flex flex-col"> {/* 1. Added flex & flex-col */}
                <Navbar />

                {/* 2. Added flex-grow (or flex-1) to push the footer down */}
                <Section className="grow flex flex-col items-center justify-center text-center">
                    <div className="flex items-center justify-center mb-6">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 animate-bounce">
                            <Send size={40} />
                        </div>
                    </div>
                    <h1 className="text-4xl font-heading font-bold text-heading mb-4">Thank You!</h1>
                    <div className="flex items-center justify-center">
                        <p className="text-gray-600 max-w-lg mb-8 text-lg">
                            Your story has been submitted successfully. It will be reviewed by our team and published soon.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/')}
                        className="px-8 py-3 bg-primary text-black font-bold rounded-xl border-2 border-primary-dark/20 shadow-md hover:shadow-lg hover:bg-primary-dark hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-200 ease-in-out cursor-pointer"
                    >
                        Back to Home
                    </button>
                </Section>

                <Footer />
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            {/* Header */}
            <div className="bg-heading text-white pt-40 pb-20 px-6 text-center rounded-b-[3rem]">
                <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">Share Your Journey</h1>
                <p className="text-gray-400 max-w-xl mx-auto text-lg">
                    Inspire others by sharing your transformation story with The Diet Cascade community.
                </p>
            </div>

            <Section className="max-w-3xl mx-auto -mt-20 relative z-10 px-4">
                <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-4xl shadow-xl border border-gray-100 space-y-6">

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 items-center gap-2">
                                <User size={16} className="text-primary" /> Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50 focus:bg-white transition-colors"
                                required
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 items-center gap-2">
                                <MapPin size={16} className="text-primary" /> Location
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50 focus:bg-white transition-colors"
                                required
                                placeholder="New York, USA"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 items-center gap-2">
                            <Quote size={16} className="text-primary" /> Your Story
                        </label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            rows={6}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50 focus:bg-white transition-colors resize-none"
                            required
                            placeholder="Tell us about your experience..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-primary text-black font-bold rounded-xl hover:bg-primary-dark transition shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 hover:cursor-pointer"
                    >
                        {loading ? 'Submitting...' : 'Submit Story'} <Send size={20} />
                    </button>

                </form>
            </Section>

            <Footer />
        </main>
    );
}
