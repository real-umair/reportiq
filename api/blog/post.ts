import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_utils/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

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

    if (error) {
      throw error;
    }

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

    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    return res.status(200).json(post);
  } catch (error: any) {
    console.error(`Error fetching blog post with slug ${slug}:`, error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
