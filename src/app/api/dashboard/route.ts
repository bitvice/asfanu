import { NextResponse } from 'next/server';
import { getDashboardMetrics } from '@/services/dashboard.service';

export async function GET() {
  try {
    const metrics = await getDashboardMetrics();
    return NextResponse.json(metrics);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || 'Eroare la generarea metricilor panoului principal.' },
      { status: 500 }
    );
  }
}
