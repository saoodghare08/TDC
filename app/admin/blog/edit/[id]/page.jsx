'use client';

import { useState, useEffect, useRef, use } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, Upload, X, ImageIcon } from 'lucide-react';
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
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null); // local blob URL for newly chosen file
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const fileInputRef = useRef(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const fetchPost = async () => {
            const { data, error } = await supabase.from('posts').select('*').eq('id', id).single();
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
                Swal.fire({ icon: 'error', title: 'Error Loading Post', text: error.message, confirmButtonColor: '#fdbc00' });
                router.push('/admin/blog');
            }
            setLoading(false);
        };
        fetchPost();
    }, [id, supabase, router]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleTitleChange = (e) => {
        const title = e.target.value;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        setFormData(prev => ({ ...prev, title, slug }));
    };

    const handleCoverChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            Swal.fire({ icon: 'error', title: 'File Too Large', text: 'Cover image must be under 10MB.', confirmButtonColor: '#fdbc00' });
            return;
        }
        if (!file.type.startsWith('image/')) {
            Swal.fire({ icon: 'error', title: 'Invalid File', text: 'Please select an image file.', confirmButtonColor: '#fdbc00' });
            return;
        }
        setCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
    };

    const removeCover = () => {
        setCoverFile(null);
        setCoverPreview(null);
        setFormData(prev => ({ ...prev, cover_image: '' }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) handleCoverChange({ target: { files: [file] } });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        let cover_image = formData.cover_image;

        // If a new file was chosen, upload it
        if (coverFile) {
            setUploading(true);
            const ext = coverFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from('blog-images')
                .upload(fileName, coverFile, { contentType: coverFile.type });

            if (uploadError) {
                Swal.fire({ icon: 'error', title: 'Image Upload Failed', text: uploadError.message, confirmButtonColor: '#fdbc00' });
                setSaving(false);
                setUploading(false);
                return;
            }

            const { data: { publicUrl } } = supabase.storage.from('blog-images').getPublicUrl(fileName);
            cover_image = publicUrl;
            setUploading(false);
        }

        const { error } = await supabase.from('posts').update({ ...formData, cover_image }).eq('id', id);

        if (error) {
            Swal.fire({ icon: 'error', title: 'Update Failed', text: error.message, confirmButtonColor: '#fdbc00' });
            setSaving(false);
        } else {
            await Swal.fire({ icon: 'success', title: 'Post Updated!', text: 'Your blog post has been updated successfully.', confirmButtonColor: '#fdbc00', timer: 1500 });
            router.push('/admin/blog');
            router.refresh();
        }
    };

    // Image to show in editor & preview: local blob > existing DB URL > nothing
    const displayCover = coverPreview || formData.cover_image || null;
    // Label for the current image strip
    const isNewFile = !!coverFile;

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
                    <button onClick={() => setShowPreview(false)} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${!showPreview ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Editor</button>
                    <button onClick={() => setShowPreview(true)} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${showPreview ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Preview</button>
                </div>
            </div>

            {showPreview ? (
                <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="relative h-[400px] w-full bg-heading rounded-3xl overflow-hidden shadow-2xl">
                        {displayCover ? (
                            <img src={displayCover} alt={formData.title} className="w-full h-full object-cover opacity-60" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-900 font-mono">No Cover Image</div>
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex items-end">
                            <div className="p-12 w-full">
                                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight max-w-4xl">{formData.title || 'Untitled Post'}</h1>
                                <div className="flex items-center gap-2 text-white/80"><span>Last updated: {new Date().toLocaleDateString()}</span></div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-xl min-h-[500px]">
                        <div className="max-w-3xl mx-auto prose prose-lg prose-blue blog-preview-content" dangerouslySetInnerHTML={{ __html: formData.content || '<p class="text-gray-400 italic">No content yet...</p>' }} />
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">

                    {/* Title & Slug */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input type="text" name="title" value={formData.title} onChange={handleTitleChange} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                            <input type="text" name="slug" value={formData.slug} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20" required />
                        </div>
                    </div>

                    {/* Cover Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>

                        {displayCover ? (
                            /* Existing or newly selected image */
                            <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                                <img src={displayCover} alt="Cover preview" className="w-full h-56 object-cover" />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-4 py-2 bg-white text-gray-800 font-semibold rounded-xl text-sm shadow cursor-pointer"
                                    >
                                        Replace Image
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={removeCover}
                                    className="absolute top-3 right-3 p-1.5 bg-white/90 hover:bg-white rounded-lg shadow text-red-500 transition cursor-pointer"
                                    title="Remove image"
                                >
                                    <X size={16} />
                                </button>
                                <div className="px-4 py-2 bg-white border-t border-gray-100 flex items-center gap-2 text-sm text-gray-500">
                                    <ImageIcon size={14} className="shrink-0" />
                                    {isNewFile ? (
                                        <>
                                            <span className="truncate font-medium">{coverFile.name}</span>
                                            <span className="ml-auto shrink-0 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">New</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="truncate text-gray-400 italic">Current cover image</span>
                                            <span className="ml-auto shrink-0 px-2 py-0.5 bg-green-50 text-green-600 text-xs font-bold rounded-full">Saved</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* Drop zone — shown when no image at all */
                            <div
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                                onClick={() => fileInputRef.current?.click()}
                                className="group border-2 border-dashed border-gray-200 hover:border-primary rounded-2xl p-10 text-center cursor-pointer transition bg-gray-50 hover:bg-primary/5"
                            >
                                <Upload size={32} className="mx-auto mb-3 text-gray-300 group-hover:text-primary transition" />
                                <p className="font-semibold text-gray-500 group-hover:text-primary transition">Drag & drop or click to upload</p>
                                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP · Max 10MB</p>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleCoverChange}
                        />
                    </div>

                    {/* Excerpt */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt (Short Summary)</label>
                        <textarea name="excerpt" value={formData.excerpt} onChange={handleChange} rows={3} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content (HTML or Text)</label>
                        <textarea name="content" value={formData.content} onChange={handleChange} rows={15} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-sm" required />
                        <p className="text-xs text-gray-400 mt-2 font-medium">
                            Tip: You can use HTML & CSS. Try <code className="bg-gray-100 px-1 rounded">&lt;style&gt;</code> blocks or <code className="bg-gray-100 px-1 rounded">style="..."</code> for custom designs.
                        </p>
                    </div>

                    {/* Publish Checkbox */}
                    <div className="flex items-center gap-3">
                        <input type="checkbox" name="published" id="published" checked={formData.published} onChange={handleChange} className="w-5 h-5 text-primary rounded focus:ring-primary" />
                        <label htmlFor="published" className="font-medium text-gray-700">Published</label>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-8 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary-dark transition disabled:opacity-50 hover:cursor-pointer"
                        >
                            <Save size={20} />
                            {uploading ? 'Uploading image…' : saving ? 'Saving…' : 'Update Post'}
                        </button>
                    </div>

                </form>
            )}
        </div>
    );
}
