import React, { useEffect, useState } from 'react';
import { Sparkles, Calendar, User, ArrowRight, BookOpen } from 'lucide-react';

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

export default function BlogHome() {
  const [posts, setPosts] = useState<BlogPostMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    // Dynamic Meta Update
    document.title = "Client Reporting Blog — Tips for Freelancers and Agencies | ReportIQ";
    const metaDescEl = document.querySelector('meta[name="description"]');
    if (metaDescEl) {
      metaDescEl.setAttribute('content', 'Expert tips on client reporting, agency growth, freelance productivity, and AI tools. Free resources updated weekly.');
    }

    // Fetch posts
    async function fetchPosts() {
      try {
        const res = await fetch('/api/blog/posts');
        if (!res.ok) {
          throw new Error(`Failed to load posts (Status ${res.status})`);
        }
        const data = await res.json();
        setPosts(data);
      } catch (err: any) {
        console.error('Error fetching blog posts:', err);
        setError(err.message || 'Failed to retrieve blog posts.');
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  const handleNavigate = (path: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    window.history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Get all unique tags from published posts
  const allTags = Array.from(
    new Set(posts.flatMap((post) => post.tags || []))
  ).filter(Boolean);

  // Filter posts by selected tag
  const filteredPosts = selectedTag
    ? posts.filter((post) => post.tags && post.tags.includes(selectedTag))
    : posts;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 font-sans text-left animate-fade-in">
      {/* Header section */}
      <div className="text-center mb-12">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold rounded-full text-xs font-mono uppercase tracking-wider mb-4">
          <BookOpen className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
          Guides & Insights
        </span>
        <h1 className="text-4xl sm:text-6xl font-black font-display text-slate-950 tracking-tight leading-none mb-4">
          The Client Reporting Blog
        </h1>
        <h2 className="text-slate-550 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Tips, templates, and strategies for freelancers and agencies
        </h2>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <div className="w-10 h-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
          <p className="text-slate-400 font-mono text-[10px] uppercase tracking-widest animate-pulse">
            Loading Articles...
          </p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-100 rounded-3xl p-8 max-w-md mx-auto text-center space-y-3.5 shadow-2xs">
          <p className="text-rose-700 text-sm font-semibold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs border-none"
          >
            Retry Loading
          </button>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-2xs">
          <Sparkles className="w-8 h-8 text-indigo-400/80 mb-3 animate-pulse mx-auto" />
          <p className="text-sm font-bold text-slate-800">No posts yet — check back soon</p>
          <p className="text-xs text-slate-500 mt-1">We are currently writing fresh guides to help scale your client relationships.</p>
        </div>
      ) : (
        /* Grid of posts cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col group hover:border-indigo-200"
            >
              {/* Cover image with fallback gradient */}
              <a 
                href={`/blog/${post.slug}`}
                className="block h-48 w-full overflow-hidden relative cursor-pointer"
                onClick={(e) => handleNavigate(`/blog/${post.slug}`, e)}
              >
                {post.cover_image_url ? (
                  <img
                    src={post.cover_image_url}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      // fallback if image fails
                      (e.target as any).src = '';
                      (e.target as any).className = 'hidden';
                    }}
                  />
                ) : null}
                {/* Fallback pattern overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-85 flex items-center justify-center p-6 text-white text-center font-bold font-display z-0">
                  <Sparkles className="w-12 h-12 text-white/20 absolute -right-4 -bottom-4 rotate-12" />
                  <span className="text-sm line-clamp-2 leading-snug">{post.title}</span>
                </div>
              </a>

              {/* Card body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  {/* Tag list */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3.5">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md px-1.5 py-0.5"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <h3 className="font-extrabold font-display text-slate-950 text-base leading-tight mb-2.5 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    <a
                      href={`/blog/${post.slug}`}
                      onClick={(e) => handleNavigate(`/blog/${post.slug}`, e)}
                      className="no-underline text-inherit hover:text-indigo-600"
                    >
                      {post.title}
                    </a>
                  </h3>

                  <p className="text-slate-550 text-xs leading-relaxed line-clamp-3 mb-4 font-sans">
                    {post.excerpt || 'No summary available.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col gap-4">
                  {/* Author / Date info line */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono font-medium">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-350" />
                      {post.author || 'ReportIQ Team'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-350" />
                      {formatDate(post.published_at)}
                    </span>
                  </div>

                  <a
                    href={`/blog/${post.slug}`}
                    onClick={(e) => handleNavigate(`/blog/${post.slug}`, e)}
                    className="w-full py-2 bg-slate-50 hover:bg-indigo-600 text-slate-700 hover:text-white border border-slate-200 hover:border-indigo-600 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs no-underline"
                  >
                    Read More
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Global Bottom Marketing CTA banner */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
        <div className="space-y-1">
          <span className="inline-flex px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-md border border-indigo-500/20 text-[9px] font-mono font-bold uppercase tracking-wider">
            All-In-One Workspace
          </span>
          <h3 className="text-lg font-bold font-display text-white mt-1">
            Want AI to automate your entire client reporting?
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed max-w-lg">
            Unlock automatic data integrations, white-labeled client portal URLs, and unlimited generated reports.
          </p>
        </div>
        <button
          onClick={() => handleNavigate('/')}
          className="w-full sm:w-auto py-3 px-6 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs shrink-0 shadow-md border-none"
        >
          Automate your client reports &rarr; reportiq.xyz
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
