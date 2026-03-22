'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Plus, Edit2, Trash2, Eye, MessageSquareQuote, ArrowRightIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Swal from 'sweetalert2';

export default function BlogListPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchPosts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setPosts(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Blog Post?',
            text: 'This action cannot be undone!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        const { error } = await supabase.from('posts').delete().eq('id', id);
        if (!error) {
            setPosts(posts.filter(p => p.id !== id));
            Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'Blog post has been deleted.',
                confirmButtonColor: '#fdbc00',
                timer: 1500
            });
        }
    };

    const togglePublish = async (id, currentStatus) => {
        const { error } = await supabase
            .from('posts')
            .update({ published: !currentStatus })
            .eq('id', id);

        if (!error) {
            setPosts(posts.map(p => p.id === id ? { ...p, published: !currentStatus } : p));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
                <div>
                    <div className="flex items-start sm:items-center justify-between gap-4 mb-6">
                        <div className="text-2xl sm:text-3xl font-bold text-heading flex items-center gap-3">
                            <h1 className="text-2xl sm:text-3xl font-bold text-heading flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <MessageSquareQuote size={22} className="text-primary" />
                                </div>
                                Blog Posts
                            </h1>
                            <p className="text-gray-400 text-sm mt-1 ml-1">Manage all Blog posts</p>
                        </div>
                        <Link 
                            href="/admin/blog/create" 
                            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary-dark transition shadow-sm text-sm shrink-0"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">Add Blog</span>
                            <span className="sm:hidden">Add</span>
                        </Link>
                    </div>
                </div>

                    {loading ? (
                        <div className="text-gray-500">Loading posts...</div>
                    ) : (
                        <div className="grid gap-4">
                            {posts.length === 0 && <p className="text-gray-500">No posts found. Create one!</p>}

                            {posts.map((post) => (
                                <div key={post.id} className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-6 shadow-sm hover:shadow-md transition">
                                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden relative shrink-0">
                                        {post.cover_image ? (
                                            <Image src={post.cover_image} alt={post.title} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">No Img</div>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="font-bold text-xl text-heading mb-1">{post.title}</h3>
                                        <p className="text-sm text-gray-400 font-mono mb-2">/{post.slug}</p>
                                        {post.published && (
                                        <Link
                                            href={`/blog/${post.slug}`}
                                            className="px-3 py-1 rounded-full text-xs font-bold uppercase inline-flex mr-3 text-blue-600 border border-blue-600 hover:bg-blue-50 transition"
                                        >
                                            View Blog
                                            <ArrowRightIcon className="w-4 h-4" />
                                        </Link>
                                        )}
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${post.published ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                            {post.published ? 'Published' : 'Draft'}
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => togglePublish(post.id, post.published)}
                                            className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition"
                                            title={post.published ? "Unpublish" : "Publish"}
                                        >
                                            <Eye size={20} />
                                        </button>
                                        <Link
                                            href={`/admin/blog/edit/${post.id}`}
                                            className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition"
                                            title="Edit"
                                        >
                                            <Edit2 size={20} />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(post.id)}
                                            className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition"
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
        </div>
    );
}
