'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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
        if (!confirm('Are you sure you want to delete this post?')) return;

        const { error } = await supabase.from('posts').delete().eq('id', id);
        if (!error) {
            setPosts(posts.filter(p => p.id !== id));
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
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-heading">Blog Posts</h1>
                <Link href="/admin/blog/create" className="flex items-center gap-2 px-6 py-3 bg-primary text-black rounded-xl hover:bg-primary-dark transition shadow-lg shadow-primary/20">
                    <Plus size={20} />
                    Create New Post
                </Link>
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
    );
}
