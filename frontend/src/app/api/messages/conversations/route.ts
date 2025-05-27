import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participant1:profiles!conversations_participant1_id_fkey(id, full_name),
        participant2:profiles!conversations_participant2_id_fkey(id, full_name)
      `)
      .or(`participant1_id.eq.${session.user.id},participant2_id.eq.${session.user.id}`)
      .order('last_message_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform the data to include participant names
    const transformedConversations = conversations.map(conv => ({
      ...conv,
      participant1_name: conv.participant1.full_name,
      participant2_name: conv.participant2.full_name,
    }));

    return NextResponse.json(transformedConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
} 