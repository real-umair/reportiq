import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_utils/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const { data, error } = await supabase
      .from('blogs')
      .select('id, title, slug, excerpt, cover_image_url, author, tags, published_at, view_count')
      .eq('published', true)
      .order('published_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    return res.status(200).json(data || []);
  } catch (error: any) {
    console.error('Error fetching blog posts:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
