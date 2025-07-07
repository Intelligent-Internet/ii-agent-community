import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      destination,
      startDate,
      endDate,
      budget,
      interests,
      travelStyle,
      additionalRequirements,
    } = await request.json();

    // Validate required fields
    if (!destination || !startDate || !endDate || !budget) {
      return NextResponse.json(
        { error: 'Missing required fields: destination, startDate, endDate, budget' },
        { status: 400 }
      );
    }

    // Calculate trip duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (duration <= 0) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Create the AI prompt
    const prompt = `You are a world-class travel expert and AI assistant for TripGenius. Create a detailed, personalized itinerary for a traveler.

**Trip Details:**
- Destination: ${destination}
- Duration: ${duration} days (${startDate} to ${endDate})
- Budget Level: ${budget}
- Travel Style: ${travelStyle || 'flexible'}
- Interests: ${interests?.join(', ') || 'general sightseeing'}
- Additional Requirements: ${additionalRequirements || 'None'}

**Instructions:**
1. Create a day-by-day itinerary with specific activities, attractions, and experiences
2. Include timing suggestions (morning, afternoon, evening)
3. Suggest restaurants and local food experiences
4. Include transportation tips and approximate costs
5. Recommend accommodations that fit the budget level
6. Add cultural insights and local tips
7. Consider the travel style and interests when making recommendations
8. Include estimated costs for major activities and meals
9. Suggest backup activities for bad weather

**Response Format:**
Provide a comprehensive itinerary in a structured format that includes:
- Daily schedules with specific activities
- Restaurant recommendations
- Accommodation suggestions
- Transportation options
- Cultural tips and local insights
- Budget breakdown
- Essential packing items
- Best time to visit specific attractions

Please make this itinerary engaging, practical, and tailored to their preferences. Focus on creating memorable experiences while being mindful of the budget level.`;

    // Generate itinerary using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are TripGenius AI, a world-class travel planning assistant that creates amazing, personalized itineraries.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 3000,
      temperature: 0.8,
    });

    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('Failed to generate itinerary');
    }

    // Create the itinerary in the database
    const itinerary = await db.itinerary.create({
      data: {
        title: `${destination} Adventure`,
        description: `AI-generated ${duration}-day itinerary for ${destination}`,
        destination,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        budget: budget === 'budget' ? 500 : budget === 'mid-range' ? 1500 : 3000,
        currency: 'USD',
        status: 'draft',
        aiGenerated: true,
        userId: session.user.id,
      },
    });

    // Parse the AI response to extract activities (simplified version)
    const activities = [];
    const lines = aiResponse.split('\n');
    let currentDay = 1;
    
    for (let i = 0; i < Math.min(lines.length, 20); i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('#') && line.length > 10) {
        // Create sample activities based on the response
        const activity = await db.activity.create({
          data: {
            title: line.substring(0, 100).trim(),
            description: `AI-suggested activity: ${line}`,
            location: destination,
            category: 'sightseeing',
            date: new Date(start.getTime() + (currentDay - 1) * 24 * 60 * 60 * 1000),
            startTime: currentDay % 2 === 1 ? '09:00' : '14:00',
            endTime: currentDay % 2 === 1 ? '12:00' : '17:00',
            cost: budget === 'budget' ? 25 : budget === 'mid-range' ? 50 : 100,
            aiSuggested: true,
            itineraryId: itinerary.id,
          },
        });
        activities.push(activity);
        
        if (activities.length >= duration * 2) break; // 2 activities per day max
        if (i % 3 === 0) currentDay++;
      }
    }

    // Return the complete itinerary with activities
    const completeItinerary = await db.itinerary.findUnique({
      where: { id: itinerary.id },
      include: {
        activities: {
          orderBy: { date: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      itinerary: completeItinerary,
      aiResponse,
      suggestions: [
        'Consider booking accommodations in advance for better rates',
        'Check local weather forecasts before your trip',
        'Download offline maps for easier navigation',
        'Learn a few basic phrases in the local language',
        'Research local customs and etiquette',
      ],
    });
  } catch (error) {
    console.error('AI Itinerary Generation Error:', error);
    
    if (error instanceof Error && error.message.includes('OpenAI')) {
      return NextResponse.json(
        { error: 'AI service temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate itinerary. Please try again.' },
      { status: 500 }
    );
  }
}