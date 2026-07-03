import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Plus, Edit, Trash, Eye, Save, ArrowLeft, 
  AlertCircle, CheckCircle, Sparkles, Tag, FileText, ToggleLeft, ToggleRight,
  Bold, Italic, Link, Image, Video, Table
} from 'lucide-react';
import { parseMarkdown } from './markdown';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image_url: string;
  author: string;
  tags: string[];
  meta_title: string;
  meta_description: string;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at?: string;
  view_count: number;
}



export default function BlogAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [author, setAuthor] = useState('ReportIQ Team');
  const [tagsInput, setTagsInput] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [published, setPublished] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const replacement = before + (selectedText || after) + (selectedText ? after : '');

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setContent(newContent);

    // Reset cursor position after insert
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + replacement.length - (selectedText ? 0 : after.length)
      );
    }, 0);
  };

  const handleNavigate = (path: string) => {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  useEffect(() => {
    async function verifyAdminAndLoad() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const adminEmail = process.env.ADMIN_EMAIL || 'farooquiumair18@gmail.com';
        if (user && user.email === adminEmail) {
          setIsAdmin(true);
          await loadAllPosts();
        } else {
          // Redirect home
          window.history.pushState(null, '', '/');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      } catch (err) {
        console.error('Admin verification failure:', err);
      } finally {
        setChecking(false);
      }
    }
    verifyAdminAndLoad();
  }, []);

  const loadAllPosts = async () => {
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPosts(data || []);
    } catch (err: any) {
      showNotification('error', `Failed to load posts: ${err.message}`);
    } finally {
      setLoadingPosts(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    // Auto-generate slug
    if (!editingPost || !editingPost.id) {
      const autoSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // remove special chars
        .trim()
        .replace(/\s+/g, '-') // spaces to hyphens
        .replace(/-+/g, '-'); // collapse multiple hyphens
      setSlug(autoSlug);
    }
  };

  const openNewPostForm = () => {
    setEditingPost({});
    setTitle('');
    setSlug('');
    setExcerpt('');
    setContent('');
    setCoverImageUrl('');
    setAuthor('ReportIQ Team');
    setTagsInput('');
    setMetaTitle('');
    setMetaDescription('');
    setPublished(false);
    setPreviewMode(false);
  };

  const openEditPostForm = (post: BlogPost) => {
    setEditingPost(post);
    setTitle(post.title || '');
    setSlug(post.slug || '');
    setExcerpt(post.excerpt || '');
    setContent(post.content || '');
    setCoverImageUrl(post.cover_image_url || '');
    setAuthor(post.author || 'ReportIQ Team');
    setTagsInput(post.tags ? post.tags.join(', ') : '');
    setMetaTitle(post.meta_title || '');
    setMetaDescription(post.meta_description || '');
    setPublished(post.published || false);
    setPreviewMode(false);
  };

  const handleSave = async (forcePublish = false) => {
    if (!title.trim() || !slug.trim() || !content.trim()) {
      showNotification('error', 'Title, slug, and content are required.');
      return;
    }

    const cleanTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const isLive = forcePublish || published;
    const publishedAt = isLive ? (editingPost?.published_at || new Date().toISOString()) : null;

    const payload: Partial<BlogPost> = {
      title,
      slug,
      content,
      excerpt,
      cover_image_url: coverImageUrl,
      author,
      tags: cleanTags,
      meta_title: metaTitle || title,
      meta_description: metaDescription || excerpt,
      published: isLive,
      published_at: publishedAt,
      updated_at: new Date().toISOString() as any,
    };

    try {
      if (editingPost?.id) {
        // Update existing
        const { error } = await supabase
          .from('blogs')
          .update(payload)
          .eq('id', editingPost.id);
        if (error) throw error;
        showNotification('success', 'Blog post updated successfully.');
      } else {
        // Insert new
        const { error } = await supabase
          .from('blogs')
          .insert([payload]);
        if (error) throw error;
        showNotification('success', 'Blog post created successfully.');
      }

      // Ping IndexNow (Bing) if the post is published/live
      if (isLive) {
        try {
          const postUrl = `https://www.reportiq.xyz/blog/${slug}`;
          // Ping the specific blog post URL
          fetch(`https://www.bing.com/indexnow?url=${encodeURIComponent(postUrl)}&key=c8efbe0c12e84fa0bc80562e84d43615`, { mode: 'no-cors' });
          // Also ping the blog homepage
          fetch(`https://www.bing.com/indexnow?url=${encodeURIComponent('https://www.reportiq.xyz/blog')}&key=c8efbe0c12e84fa0bc80562e84d43615`, { mode: 'no-cors' });
          // Also ping the sitemap
          fetch(`https://www.bing.com/indexnow?url=${encodeURIComponent('https://www.reportiq.xyz/sitemap.xml')}&key=c8efbe0c12e84fa0bc80562e84d43615`, { mode: 'no-cors' });
        } catch (pingErr) {
          console.error("Failed to ping IndexNow:", pingErr);
        }
      }

      setEditingPost(null);
      await loadAllPosts();
    } catch (err: any) {
      showNotification('error', `Save failed: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete this blog post?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', id);
      if (error) throw error;
      showNotification('success', 'Blog post deleted successfully.');
      await loadAllPosts();
    } catch (err: any) {
      showNotification('error', `Delete failed: ${err.message}`);
    }
  };

  if (checking) {
    return (
      <div className="max-w-6xl mx-auto py-24 flex flex-col items-center justify-center space-y-3 font-sans">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
        <p className="text-slate-400 font-mono text-[10px] uppercase tracking-widest animate-pulse">
          Verifying Credentials...
        </p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 font-sans text-left animate-fade-in">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-lg border flex items-center gap-2.5 max-w-sm text-xs sm:text-sm font-semibold animate-scale-up ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {notification.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{notification.message}</span>
        </div>
      )}

      {editingPost ? (
        /* Edit/Create Form Editor view */
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <button
              onClick={() => setEditingPost(null)}
              className="group flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors bg-transparent border-none cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to List
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-3xs flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                {previewMode ? 'Edit Content' : 'Live Preview'}
              </button>
              <button
                onClick={() => handleSave(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-3xs flex items-center gap-1.5 border-none"
              >
                <Save className="w-3.5 h-3.5" />
                Save Draft
              </button>
              <button
                onClick={() => handleSave(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-3xs flex items-center gap-1.5 border-none"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Publish Post
              </button>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black font-display text-slate-950">
            {editingPost.id ? 'Edit Blog Post' : 'Compose New Guide'}
          </h2>

          {previewMode ? (
            /* Split live preview page */
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto shadow-2xs">
              <h1 className="text-3xl sm:text-5xl font-black font-display text-slate-950 mb-3">{title || 'Untitled Post'}</h1>
              <div className="flex gap-4 text-slate-400 font-mono text-[10px] mb-6">
                <span>By {author}</span>
                <span>•</span>
                <span>{formatDate(new Date().toISOString())}</span>
              </div>
              {coverImageUrl && (
                <img src={coverImageUrl} alt={title} className="w-full h-64 object-cover rounded-2xl mb-6 shadow-3xs" />
              )}
              <div className="prose prose-slate max-w-none text-slate-800">
                <div dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />
              </div>
            </div>
          ) : (
            /* Field Inputs editing panel */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Post fields edit */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">Post Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. 10 Client Reporting Tips to Scale Your Agency"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 outline-none p-3 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">URL Slug (lowercase-hyphens) *</label>
                  <input
                    type="text"
                    required
                    placeholder=" E.g. client-reporting-tips-agency"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 outline-none p-3 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1 font-mono">Preview Link: https://reportiq.xyz/blog/{slug || 'slug'}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">Excerpt Description *</label>
                  <textarea
                    required
                    rows={2}
                    maxLength={300}
                    placeholder="Short summary displayed in the listing grid card..."
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 outline-none p-3 text-xs sm:text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">Markdown Content *</label>
                  <div className="flex flex-wrap gap-1 bg-slate-100 p-1.5 rounded-t-xl border border-slate-200 border-b-0">
                    <button
                      type="button"
                      onClick={() => insertMarkdown('**', '**')}
                      className="p-1.5 hover:bg-white text-slate-600 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                      title="Bold text"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('*', '*')}
                      className="p-1.5 hover:bg-white text-slate-600 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                      title="Italic text"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const text = prompt('Enter the link text:', 'Link text') || '';
                        const url = prompt('Enter the link URL (e.g., https://example.com):', 'https://');
                        if (url) {
                          insertMarkdown(`[${text}](${url})`);
                        }
                      }}
                      className="p-1.5 hover:bg-white text-slate-650 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                      title="Insert link"
                    >
                      <Link className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const alt = prompt('Enter the image alt text:', 'Image description') || '';
                        const url = prompt('Enter the image URL:', 'https://');
                        if (url) {
                          insertMarkdown(`![${alt}](${url})`);
                        }
                      }}
                      className="p-1.5 hover:bg-white text-slate-650 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                      title="Insert image"
                    >
                      <Image className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt('Enter the video URL (Direct file link, YouTube, or Vimeo):', 'https://');
                        if (url) {
                          insertMarkdown(`![video](${url})`);
                        }
                      }}
                      className="p-1.5 hover:bg-white text-slate-655 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                      title="Insert video"
                    >
                      <Video className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const tableTemplate = `\n| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n| Cell 3   | Cell 4   |\n`;
                        insertMarkdown(tableTemplate);
                      }}
                      className="p-1.5 hover:bg-white text-slate-655 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                      title="Insert table"
                    >
                      <Table className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <textarea
                    ref={contentRef}
                    required
                    rows={15}
                    placeholder="# Main Header&#10;&#10;Write details here. Use **bolding** or *italic* tags.&#10;&#10;## Sub Header&#10;- Bullet list item 1&#10;- Bullet list item 2"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full rounded-b-xl border border-slate-200 bg-slate-50/50 outline-none p-4 text-xs sm:text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-mono leading-relaxed"
                  />
                </div>
              </div>

              {/* Right Column: Meta fields settings */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5 h-fit">
                <h3 className="font-extrabold font-display text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Meta Settings
                </h3>

                <div className="flex items-center justify-between border-b pb-4">
                  <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">Publish Immediately</span>
                  <button
                    type="button"
                    onClick={() => setPublished(!published)}
                    className="cursor-pointer bg-transparent border-none p-0 flex"
                  >
                    {published ? (
                      <ToggleRight className="w-10 h-6 text-indigo-600" />
                    ) : (
                      <ToggleLeft className="w-10 h-6 text-slate-400" />
                    )}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">Cover Image URL</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs focus:border-indigo-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">Author</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs focus:border-indigo-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="reporting, agency, growth"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs focus:border-indigo-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">Meta SEO Title</label>
                  <input
                    type="text"
                    placeholder="Max. 60 characters recommended"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs focus:border-indigo-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">Meta SEO Description</label>
                  <textarea
                    rows={3}
                    maxLength={160}
                    placeholder="Max. 160 characters recommended"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs focus:border-indigo-600 transition-all"
                  />
                  <div className="text-[9px] text-slate-400 text-right mt-1 font-mono">{metaDescription.length} / 160 characters</div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Blog posts dashboard listing */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 pb-5">
            <div>
              <h2 className="text-3xl font-black font-display text-slate-955 tracking-tight">Blog Articles Manager</h2>
              <p className="text-xs text-slate-450 mt-1 font-mono">Logged in as {process.env.ADMIN_EMAIL}</p>
            </div>
            <button
              onClick={openNewPostForm}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 self-start sm:self-auto border-none"
            >
              <Plus className="w-4 h-4" />
              Write New Post
            </button>
          </div>

          {loadingPosts ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3 bg-white border rounded-3xl">
              <div className="w-8 h-8 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin"></div>
              <p className="text-slate-400 font-mono text-[9px] uppercase tracking-widest animate-pulse">Loading Posts Database...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-2xs">
              <FileText className="w-10 h-10 text-indigo-400/80 mb-3 animate-pulse mx-auto" />
              <p className="text-sm font-bold text-slate-800">No blog posts found</p>
              <p className="text-xs text-slate-450 mt-1">Get started by creating your first article draft.</p>
            </div>
          ) : (
            /* Table list view */
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider font-mono">
                      <th className="py-3 px-6">Post Details</th>
                      <th className="py-3 px-6 text-center">Status</th>
                      <th className="py-3 px-6">Date Created</th>
                      <th className="py-3 px-6 text-center">Views</th>
                      <th className="py-3 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {posts.map((post) => (
                      <tr key={post.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4.5 px-6 max-w-sm">
                          <div className="font-extrabold text-slate-900 line-clamp-1 mb-1 font-sans">{post.title}</div>
                          <div className="text-[10px] text-slate-400 font-mono">/{post.slug}</div>
                        </td>
                        <td className="py-4.5 px-6 text-center">
                          {post.published ? (
                            <span className="inline-flex px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-150 text-[10px] font-bold uppercase tracking-wide">Published</span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-200 text-[10px] font-bold uppercase tracking-wide">Draft</span>
                          )}
                        </td>
                        <td className="py-4.5 px-6 text-slate-450 font-mono">{formatDate(post.created_at)}</td>
                        <td className="py-4.5 px-6 text-center font-mono font-bold text-slate-900">{post.view_count || 0}</td>
                        <td className="py-4.5 px-6">
                          <div className="flex gap-2 justify-center items-center">
                            <button
                              onClick={() => openEditPostForm(post)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-100 rounded-lg shadow-3xs cursor-pointer"
                              title="Edit post"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(post.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 bg-white border border-slate-200 hover:border-rose-100 rounded-lg shadow-3xs cursor-pointer"
                              title="Delete post"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleNavigate(`/blog/${post.slug}`)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-100 rounded-lg shadow-3xs cursor-pointer"
                              title="Preview live"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
