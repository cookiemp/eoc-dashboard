import { NextResponse } from 'next/server';
import { extractIncidentsFromPDF } from '@/ai/flows/extract-incidents-from-pdf-flow';
// @ts-expect-error - pdf-parse doesn't have TypeScript definitions
import pdf from 'pdf-parse/lib/pdf-parse';

/**
 * API Route: POST /api/process-pdf
 * 
 * Receives a PDF file, extracts text, and uses AI to extract structured incident data
 * 
 * Request body: FormData with 'pdf' file field
 * Response: JSON with extracted incidents
 */
export async function POST(request: Request) {
  try {
    console.log('📄 Processing PDF upload...');
    
    // Get the form data
    const formData = await request.formData();
    const file = formData.get('pdf') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No PDF file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PDF file.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    console.log(`📄 File received: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF
    console.log('🔍 Extracting text from PDF...');
    let pdfData;
    try {
      pdfData = await pdf(buffer);
    } catch (pdfError) {
      console.error('❌ PDF parsing error:', pdfError);
      return NextResponse.json(
        { error: 'Failed to parse PDF file. The file may be corrupted or password-protected.' },
        { status: 400 }
      );
    }

    const extractedText = pdfData.text;
    console.log(`✅ Extracted ${extractedText.length} characters from PDF`);
    console.log(`📄 Pages: ${pdfData.numpages}`);

    // Validate extracted text
    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text could be extracted from the PDF. The PDF may be image-based or empty.' },
        { status: 400 }
      );
    }

    if (extractedText.length < 50) {
      return NextResponse.json(
        { error: 'PDF contains very little text. Please ensure the PDF has readable content.' },
        { status: 400 }
      );
    }

    // Call AI to extract incidents
    console.log('🤖 Sending to AI for incident extraction...');
    const aiStartTime = Date.now();
    
    const aiResult = await extractIncidentsFromPDF({
      pdfText: extractedText,
      reportMetadata: {
        uploadedAt: new Date().toISOString(),
      },
    });

    const aiDuration = Date.now() - aiStartTime;
    console.log(`✅ AI extraction complete in ${aiDuration}ms`);
    console.log(`📊 Found ${aiResult.totalIncidentsFound} incidents`);

    // Return the extracted incidents
    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      extractedText: extractedText.substring(0, 500), // First 500 chars for debugging
      textLength: extractedText.length,
      incidents: aiResult.incidents,
      summary: aiResult.summary,
      reportDate: aiResult.reportDate,
      totalIncidentsFound: aiResult.totalIncidentsFound,
      processingTimeMs: aiDuration,
    });

  } catch (error) {
    console.error('❌ Error processing PDF:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error details:', { errorMessage, errorStack });
    
    return NextResponse.json(
      { 
        error: 'Failed to process PDF',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS (if needed)
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}