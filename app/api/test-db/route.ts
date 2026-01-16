import { NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';

export async function GET() {
  try {
    const dataSource = await getDataSource();
    
    return NextResponse.json({
      success: true,
      message: 'Database connected successfully',
      database: dataSource.options.database,
      isConnected: dataSource.isInitialized,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Database connection failed',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
