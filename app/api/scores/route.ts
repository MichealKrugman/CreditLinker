import { NextRequest, NextResponse } from 'next/server';
import { getBusinessId } from '@/lib/auth/session';
import { calculateIdentityScore, getHistoricalScores } from '@/lib/scoring/algorithm';
import { cached } from '@/lib/cache/redis';
import { prisma } from '@/lib/database/prisma';
import { format } from 'date-fns';

/**
 * GET /api/scores
 * Calculate and return Financial Identity Score
 */
export async function GET(request: NextRequest) {
  try {
    const businessId = await getBusinessId();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const includeHistorical = searchParams.get('historical') === 'true';

    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    // Cache key
    const cacheKey = `score:${businessId}:${startDateParam || 'all'}:${endDateParam || 'all'}:${includeHistorical}`;

    const result = await cached(
      cacheKey,
      async () => {
        // Calculate current score
        const identityScore = await calculateIdentityScore(
          businessId,
          startDate,
          endDate
        );

        // Get historical scores if requested
        let historical = undefined;
        if (includeHistorical) {
          historical = await getHistoricalScores(businessId, 6);
        }

        // Save to database
        await saveScoreToDatabase(businessId, identityScore);

        return {
          current: identityScore,
          historical,
        };
      },
      3600 // Cache for 1 hour
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Score calculation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate score',
      },
      { status: 500 }
    );
  }
}

/**
 * Save score to database for historical tracking
 */
async function saveScoreToDatabase(
  businessId: string,
  identityScore: {
    score: number;
    components: any;
    dateRange: { start: string; end: string };
  }
) {
  try {
    // Parse period from date range (use first day of month)
    const month = new Date(identityScore.dateRange.start + '-01');

    // Check if score already exists for this period
    const existing = await prisma.identityScore.findFirst({
      where: {
        businessId,
        month,
      },
    });

    if (existing) {
      // Update existing score
      await prisma.identityScore.update({
        where: { id: existing.id },
        data: {
          totalScore: identityScore.score,
          positivityScore: identityScore.components.positivity,
          stabilityScore: identityScore.components.stability,
          growthScore: identityScore.components.growth,
          expenseControlScore: identityScore.components.expenseControl,
          bufferScore: identityScore.components.buffer,
        },
      });
    } else {
      // Create new score record
      await prisma.identityScore.create({
        data: {
          businessId,
          month,
          totalScore: identityScore.score,
          positivityScore: identityScore.components.positivity,
          stabilityScore: identityScore.components.stability,
          growthScore: identityScore.components.growth,
          expenseControlScore: identityScore.components.expenseControl,
          bufferScore: identityScore.components.buffer,
        },
      });
    }
  } catch (error) {
    console.error('Failed to save score to database:', error);
    // Don't throw - score calculation succeeded even if DB save failed
  }
}

/**
 * GET /api/scores/history
 * Get historical scores from database
 */
export async function getHistory(request: NextRequest) {
  try {
    const businessId = await getBusinessId();

    const scores = await prisma.identityScore.findMany({
      where: { businessId },
      orderBy: { month: 'desc' },
      take: 12, // Last 12 periods
    });

    const formattedScores = scores.map((s) => ({
      period: format(s.month, 'yyyy-MM'),
      score: s.totalScore,
      components: {
        positivity: s.positivityScore,
        stability: s.stabilityScore,
        growth: s.growthScore,
        expenseControl: s.expenseControlScore,
        buffer: s.bufferScore,
      },
      createdAt: s.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: formattedScores,
    });
  } catch (error) {
    console.error('Score history error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch score history',
      },
      { status: 500 }
    );
  }
}
