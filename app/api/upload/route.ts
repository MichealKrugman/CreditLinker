import { NextRequest, NextResponse } from 'next/server';
import { getBusinessId } from '@/lib/auth/session';
import { uploadFile } from '@/lib/storage/minio';
import { prisma } from '@/lib/database/prisma';

const ALLOWED_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user's business
    const businessId = await getBusinessId();

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Only CSV and Excel files are allowed.',
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: 'File too large. Maximum size is 10MB.',
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${businessId}/${timestamp}_${sanitizedName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to MinIO
    const uploadResult = await uploadFile(filename, buffer, file.type);

    // Create Import record in database
    const importRecord = await prisma.import.create({
      data: {
        businessId,
        filename: file.name,
        fileSize: file.size,
        fileType: file.type,
        storagePath: uploadResult.key,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        importId: importRecord.id,
        filename: importRecord.filename,
        fileSize: importRecord.fileSize,
        status: importRecord.status,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch upload history
export async function GET(request: NextRequest) {
  try {
    const businessId = await getBusinessId();

    const imports = await prisma.import.findMany({
      where: { businessId },
      orderBy: { uploadedAt: 'desc' },
      take: 20,
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: imports.map((imp) => ({
        id: imp.id,
        filename: imp.filename,
        fileSize: imp.fileSize,
        status: imp.status,
        uploadedAt: imp.uploadedAt,
        processedAt: imp.processedAt,
        transactionCount: imp._count.transactions,
        error: imp.errorMessage,
      })),
    });
  } catch (error) {
    console.error('Fetch imports error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch imports',
      },
      { status: 500 }
    );
  }
}
