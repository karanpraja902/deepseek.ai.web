import { NextRequest, NextResponse } from 'next/server';
import { analyzePDFFromUrl } from '../../../../lib/pdf-service';

export async function POST(request: NextRequest) {
  try {
    const { url, filename } = await request.json();
    
    if (!url || !filename) {
      return NextResponse.json(
        { error: 'Missing required fields: url and filename' },
        { status: 400 }
      );
    }
    
    const analysis = await analyzePDFFromUrl(url, filename);
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('PDF analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze PDF' },
      { status: 500 }
    );
  }
}