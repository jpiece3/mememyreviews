import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface Brand {
  id: string;
  name: string;
  product_url: string;
  brand_vibe: string;
  meme_style: string;
  created_at: string;
}

export function useBrand() {
  const { user } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchBrands() {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setBrands(data);
      }
      setLoading(false);
    }

    fetchBrands();
  }, [user]);

  return { brands, loading };
}
