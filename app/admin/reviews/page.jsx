'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Trash2, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';
import Swal from 'sweetalert2';

export default function ReviewsPage() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchReviews = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setReviews(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Review?',
            text: 'This action cannot be undone!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        const { error } = await supabase.from('reviews').delete().eq('id', id);
        if (!error) {
            setReviews(reviews.filter(r => r.id !== id));
            Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'Review has been deleted.',
                confirmButtonColor: '#fdbc00',
                timer: 1500
            });
        }
    };

    const toggleApproval = async (id, currentStatus) => {
        const { error } = await supabase
            .from('reviews')
            .update({ is_approved: !currentStatus })
            .eq('id', id);

        if (!error) {
            setReviews(reviews.map(r => r.id === id ? { ...r, is_approved: !currentStatus } : r));
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-heading">Reviews Management</h1>
            </div>

            {loading ? (
                <div className="text-gray-500">Loading reviews...</div>
            ) : (
                <div className="grid gap-4">
                    {reviews.length === 0 && <p className="text-gray-500">No reviews found.</p>}

                    {reviews.map((review) => (
                        <div key={review.id} className="bg-white p-6 rounded-2xl border border-gray-100 flex items-start gap-4 shadow-sm hover:shadow-md transition">
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-lg text-heading">{review.name}</h3>
                                        <p className="text-sm text-gray-400">{review.location}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${review.is_approved ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                        {review.is_approved ? 'Published' : 'Pending'}
                                    </span>
                                </div>
                                <p className="text-gray-600 italic">"{review.content}"</p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => toggleApproval(review.id, review.is_approved)}
                                    className={`p-2 rounded-lg transition-colors ${review.is_approved ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                    title={review.is_approved ? "Unpublish" : "Approve"}
                                >
                                    {review.is_approved ? <XCircle size={20} /> : <CheckCircle size={20} />}
                                </button>
                                <button
                                    onClick={() => handleDelete(review.id)}
                                    className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
