import React, { useEffect, useState } from 'react';
import { Calendar, User, ArrowLeft, ArrowRight, Sparkles, Tag, Eye } from 'lucide-react';
import { parseMarkdown } from './markdown';

interface BlogPostData {
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
  published_at: string;
  view_count: number;
}

interface BlogPostMeta {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string;
  author: string;
  tags: string[];
  published_at: string;
  view_count: number;
}



export default function BlogPost() {
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPostMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);

  // Extract slug from window.location.pathname (/blog/my-slug)
  const slug = window.location.pathname.split('/blog/')[1] || '';

  useEffect(() => {
    if (!slug) {
      setError(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    async function loadPostAndRelated() {
      try {
        // Fetch current post
        const res = await fetch(`/api/blog/post?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) {
          throw new Error('Post not found');
        }
        const postData = await res.json();
        setPost(postData);

        // Update document title/meta description dynamically
        document.title = postData.meta_title || `${postData.title} | ReportIQ Blog`;
        const metaDescEl = document.querySelector('meta[name="description"]');
        if (metaDescEl && postData.meta_description) {
          metaDescEl.setAttribute('content', postData.meta_description);
        }

        // Fetch all posts to determine related
        const postsRes = await fetch('/api/blog/posts');
        if (postsRes.ok) {
          const allPosts: BlogPostMeta[] = await postsRes.json();
          // Filter out current post, pick top 3
          const related = allPosts
            .filter((p) => p.slug !== slug)
            .slice(0, 3);
          setRelatedPosts(related);
        }
      } catch (err) {
        console.error('Error loading blog post details:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadPostAndRelated();
  }, [slug]);

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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 flex flex-col items-center justify-center space-y-3 font-sans">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
        <p className="text-slate-400 font-mono text-[10px] uppercase tracking-widest animate-pulse">
          Opening Article...
        </p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center font-sans">
        <button
          onClick={() => handleNavigate('/blog')}
          className="group flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-8 cursor-pointer bg-transparent border-none"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Blog
        </button>
        <div className="bg-white border border-slate-200 rounded-3xl p-12 max-w-md mx-auto shadow-2xs space-y-4">
          <Sparkles className="w-8 h-8 text-indigo-400/80 mb-1 animate-pulse mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">404 - Article Not Found</h2>
          <p className="text-xs text-slate-500">The guide you are looking for does not exist, has been draft-archived, or has moved to a new URL.</p>
          <button
            onClick={() => handleNavigate('/blog')}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs border-none"
          >
            Explore Blog Guides
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 font-sans text-left animate-fade-in">
      {/* Back to blog link */}
      <button
        onClick={() => handleNavigate('/blog')}
        className="group flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-8 cursor-pointer bg-transparent border-none"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Back to Blog
      </button>

      {/* Article Header */}
      <header className="mb-8">
        <h1 className="text-3xl sm:text-5xl font-black font-display text-slate-950 tracking-tight leading-tight mb-4">
          {post.title}
        </h1>

        {/* Metadata info */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400 font-mono font-medium pb-4 border-b border-slate-150">
          <span className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-slate-350" />
            By {post.author || 'ReportIQ Team'}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-350" />
            {formatDate(post.published_at)}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-slate-350" />
            {post.view_count || 0} views
          </span>
        </div>
      </header>

      {/* Cover Image */}
      {post.cover_image_url && (
        <div className="w-full h-64 sm:h-96 rounded-3xl overflow-hidden mb-10 shadow-2xs">
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as any).src = '';
              (e.target as any).className = 'hidden';
            }}
          />
        </div>
      )}

      {/* Article Body */}
      <article className="prose prose-slate max-w-none mb-12">
        <div
          className="text-slate-850 space-y-4 font-sans text-sm sm:text-base"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(post.content) }}
        />
      </article>

      {/* Tags line */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10 items-center">
          <Tag className="w-4 h-4 text-slate-400 shrink-0" />
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 rounded-md px-1.5 py-0.5 cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              onClick={() => handleNavigate('/blog')}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Post conversion CTA panel */}
      <div className="bg-indigo-600 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md mb-16">
        <div className="space-y-1">
          <h3 className="text-lg font-bold font-display text-white">
            Automate your client reports with ReportIQ
          </h3>
          <p className="text-indigo-100 text-xs leading-relaxed max-w-lg">
            Say goodbye to copy-pasting data. Write beautiful reports in under 30 seconds.
          </p>
        </div>
        <button
          onClick={() => handleNavigate('/')}
          className="w-full sm:w-auto py-3 px-6 bg-white text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs shrink-0 shadow-xs border-none"
        >
          Try Free &rarr; reportiq.xyz
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Related Posts section */}
      {relatedPosts.length > 0 && (
        <div className="border-t border-slate-200 pt-10 mb-10">
          <h3 className="text-xl font-bold font-display text-slate-950 mb-6">Related Guides</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((rPost) => (
              <div
                key={rPost.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs hover:border-indigo-200 transition-all cursor-pointer flex flex-col justify-between group"
                onClick={() => handleNavigate(`/blog/${rPost.slug}`)}
              >
                <div>
                  <h4 className="font-bold text-xs text-slate-900 mb-1.5 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                    {rPost.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono mb-2">{formatDate(rPost.published_at)}</p>
                  <p className="text-[11px] text-slate-500 leading-normal line-clamp-2">{rPost.excerpt}</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-bold mt-3.5 group-hover:text-indigo-755 transition-colors">
                  Read Guide
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
