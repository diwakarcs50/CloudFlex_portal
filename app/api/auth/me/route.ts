import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDataSource } from '@/lib/db';
import { User } from '@/entities/User';
import { Client } from '@/entities/Client';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    const dataSource = await getDataSource();
    const userRepository = dataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { id: currentUser.userId },
      relations: ['client'],
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          clientId: user.clientId,
          clientName: user.client.name,
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.message === 'No token found' || error.message === 'Invalid token' || error.message === 'Token expired') {
      return NextResponse.json(
        { error: 'Unauthorized', message: error.message },
        { status: 401 }
      );
    }

    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
