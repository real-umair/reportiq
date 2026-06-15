import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_utils/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'OPTIONS') {
    res.setHeader('Allow', ['GET', 'OPTIONS']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  if (action === 'posts') {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('id, title, slug, excerpt, cover_image_url, author, tags, published_at, view_count')
        .eq('published', true)
        .order('published_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data || []);
    } catch (error: any) {
      console.error('Error fetching blog posts:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  } else if (action === 'post') {
    const { slug } = req.query;
    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ error: 'Slug parameter is required' });
    }

    try {
      const { data: post, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      if (!post) {
        return res.status(404).json({ error: 'Blog post not found' });
      }

      // Increment view count asynchronously
      supabase
        .from('blogs')
        .update({ view_count: (post.view_count || 0) + 1 })
        .eq('id', post.id)
        .then(({ error: updateError }) => {
          if (updateError) {
            console.error(`Error incrementing view count for post ${post.id}:`, updateError);
          }
        });

      return res.status(200).json(post);
    } catch (error: any) {
      console.error(`Error fetching blog post with slug ${slug}:`, error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  } else {
    return res.status(400).json({ error: 'Invalid action parameter' });
  }
}
