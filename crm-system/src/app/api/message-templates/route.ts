import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - List all message templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operatorId = searchParams.get('operatorId');
    const journeyType = searchParams.get('journeyType');
    const isActive = searchParams.get('isActive');

    const where: any = {};

    if (operatorId) {
      where.operatorId = operatorId;
    }

    if (journeyType) {
      where.journeyType = journeyType;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const templates = await prisma.messageTemplate.findMany({
      where,
      orderBy: [
        { journeyType: 'asc' },
        { dayNumber: 'asc' },
        { channel: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      templates,
      count: templates.length
    });
  } catch (error: any) {
    console.error('Error fetching message templates:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new message template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      operatorId,
      journeyType,
      messageType,
      dayNumber,
      channel,
      subject,
      content,
      ctaLink,
      ctaText,
      isActive = true
    } = body;

    // Validate required fields
    if (!operatorId || !journeyType || !messageType || dayNumber === undefined || !channel || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the template
    const template = await prisma.messageTemplate.create({
      data: {
        operatorId,
        journeyType,
        messageType,
        dayNumber: parseInt(dayNumber),
        channel,
        subject,
        content,
        ctaLink,
        ctaText,
        isActive
      }
    });

    return NextResponse.json({
      success: true,
      template
    });
  } catch (error: any) {
    console.error('Error creating message template:', error);

    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A template with this combination already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
