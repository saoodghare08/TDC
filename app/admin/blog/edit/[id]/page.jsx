'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save } from 'lucide-react';
import Link from 'next/link';
import Swal from 'sweetalert2';

export default function EditBlogPage({ params: paramsPromise }) {
    const params = use(paramsPromise);
    const { id } = params;
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        cover_image: '',
        published: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const fetchPost = async () => {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('id', id)
                .single();

            if (data) {
                setFormData({
                    title: data.title || '',
                    slug: data.slug || '',
                    excerpt: data.excerpt || '',
                    content: data.content || '',
                    cover_image: data.cover_image || '',
                    published: data.published || false
                });
            } else if (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error Loading Post',
                    text: error.message,
                    confirmButtonColor: '#fdbc00'
                });
                router.push('/admin/blog');
            }
            setLoading(false);
        };

        fetchPost();
    }, [id, supabase, router]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleTitleChange = (e) => {
        const title = e.target.value;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        setFormData(prev => ({ ...prev, title, slug }));
    };

    const [showPreview, setShowPreview] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        const { error } = await supabase
            .from('posts')
            .update(formData)
            .eq('id', id);

        if (error) {
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: error.message,
                confirmButtonColor: '#fdbc00'
            });
            setSaving(false);
        } else {
            await Swal.fire({
                icon: 'success',
                title: 'Post Updated!',
                text: 'Your blog post has been updated successfully.',
                confirmButtonColor: '#fdbc00',
                timer: 1500
            });
            router.push('/admin/blog');
            router.refresh();
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading post details...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/blog" className="p-2 rounded-full hover:bg-gray-100 transition">
                        <ChevronLeft size={24} />
                    </Link>
                    <h1 className="text-3xl font-bold text-heading">Edit Post</h1>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setShowPreview(false)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition ${!showPreview ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Editor
                    </button>
                    <button
                        onClick={() => setShowPreview(true)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition ${showPreview ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Preview
                    </button>
                </div>
            </div>

            {showPreview ? (
                <div className="space-y-8 animate-in fade-in duration-300">
                    {/* Hero Preview */}
                    <div className="relative h-[400px] w-full bg-heading rounded-3xl overflow-hidden shadow-2xl">
                        {formData.cover_image ? (
                            <img src={formData.cover_image} alt={formData.title} className="w-full h-full object-cover opacity-60" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-900 font-mono">No Cover Image</div>
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex items-end">
                            <div className="p-12 w-full">
                                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight max-w-4xl">
                                    {formData.title || 'Untitled Post'}
                                </h1>
                                <div className="flex items-center gap-2 text-white/80">
                                    <span>Last updated: {new Date().toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Preview */}
                    <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-xl min-h-[500px]">
                        <div
                            className="max-w-3xl mx-auto prose prose-lg prose-blue blog-preview-content"
                            dangerouslySetInnerHTML={{ __html: formData.content || '<p class="text-gray-400 italic">No content yet...</p>' }}
                        />
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">

                    {/* Title & Slug */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleTitleChange}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                            <input
                                type="text"
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                required
                            />
                        </div>
                    </div>

                    {/* Image URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
                        <input
                            type="text"
                            name="cover_image"
                            value={formData.cover_image}
                            onChange={handleChange}
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    {/* Excerpt */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt (Short Summary)</label>
                        <textarea
                            name="excerpt"
                            value={formData.excerpt}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content (HTML or Text)</label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            rows={15}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-sm"
                            required
                        />
                        <p className="text-xs text-gray-400 mt-2 font-medium">
                            Tip: You can use HTML & CSS. Try <code className="bg-gray-100 px-1 rounded">&lt;style&gt;</code> blocks or <code className="bg-gray-100 px-1 rounded">style="..."</code> for custom designs.
                        </p>
                    </div>

                    {/* Publish Checkbox */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            name="published"
                            id="published"
                            checked={formData.published}
                            onChange={handleChange}
                            className="w-5 h-5 text-primary rounded focus:ring-primary"
                        />
                        <label htmlFor="published" className="font-medium text-gray-700">Published</label>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-8 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary-dark transition disabled:opacity-50 hover:cursor-pointer"
                        >
                            <Save size={20} />
                            {saving ? 'Saving...' : 'Update Post'}
                        </button>
                    </div>

                </form>
            )}
        </div>
    );
}
