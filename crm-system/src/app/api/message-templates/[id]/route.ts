import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get a single message template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.messageTemplate.findUnique({
      where: { id: params.id }
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      template
    });
  } catch (error: any) {
    console.error('Error fetching message template:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update a message template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const {
      subject,
      content,
      ctaLink,
      ctaText,
      isActive
    } = body;

    // Update the template
    const template = await prisma.messageTemplate.update({
      where: { id: params.id },
      data: {
        ...(subject !== undefined && { subject }),
        ...(content !== undefined && { content }),
        ...(ctaLink !== undefined && { ctaLink }),
        ...(ctaText !== undefined && { ctaText }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json({
      success: true,
      template
    });
  } catch (error: any) {
    console.error('Error updating message template:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a message template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.messageTemplate.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting message template:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
