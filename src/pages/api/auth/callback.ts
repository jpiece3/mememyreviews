import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url, redirect }) => {
  const code = url.searchParams.get('code');

  if (code) {
    // The Supabase client-side library handles the code exchange automatically
    // This endpoint just redirects to the app after OAuth completes
    return redirect('/app');
  }

  return redirect('/login');
};
