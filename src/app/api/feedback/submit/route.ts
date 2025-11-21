import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rating, category, message, user_email, user_id } = body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid rating. Must be between 1 and 5.' },
        { status: 400 }
      );
    }

    if (!category || !['bug', 'feature', 'improvement', 'general'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category.' },
        { status: 400 }
      );
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required.' },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: 'Message is too long. Maximum 1000 characters.' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Check if feedback table exists, if not, store in a JSON file or alternative storage
    // For now, we'll try to insert into a feedback table
    const { data, error } = await supabase
      .from('feedback')
      .insert([
        {
          rating,
          category,
          message: message.trim(),
          user_email: user_email || null,
          user_id: user_id || null,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      // If table doesn't exist, log to console for now
      if (error.code === '42P01') {
        console.log('Feedback submission (table not found, logging to console):', {
          rating,
          category,
          message,
          user_email,
          user_id,
          timestamp: new Date().toISOString()
        });

        // Return success anyway since feedback was "captured"
        return NextResponse.json({
          success: true,
          message: 'Feedback received and logged',
          note: 'Feedback table not yet created in database'
        });
      }

      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      data
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      {
        error: 'Failed to submit feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

