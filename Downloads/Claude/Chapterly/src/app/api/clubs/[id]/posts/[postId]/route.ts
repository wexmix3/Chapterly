export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// DELETE — remove a post (post author or club owner only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; postId: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch the post
  const { data: post, error: fetchError } = await supabase
    .from('club_posts')
    .select('user_id, club_id')
    .eq('id', params.postId)
    .eq('club_id', params.id)
    .maybeSingle();

  if (fetchError || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  // Allow if user is the post author
  const isAuthor = post.user_id === user.id;

  // Allow if user is the club owner
  let isOwner = false;
  if (!isAuthor) {
    const { data: club } = await supabase
      .from('clubs')
      .select('owner_id')
      .eq('id', params.id)
      .maybeSingle();
    isOwner = club?.owner_id === user.id;
  }

  if (!isAuthor && !isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error: deleteError } = await supabase
    .from('club_posts')
    .delete()
    .eq('id', params.postId);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
