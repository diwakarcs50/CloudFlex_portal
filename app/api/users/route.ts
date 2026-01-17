import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/middleware';
import { getDataSource } from '@/lib/db';
import { User } from '@/entities/User';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    
    const dataSource = await getDataSource();
    const userRepo = dataSource.getRepository(User);
    
    const users = await userRepo.find({
      where: { clientId: currentUser.clientId },
      order: { email: 'ASC' }
    });
    
    const sanitizedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      clientId: user.clientId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    
    return NextResponse.json(sanitizedUsers);
    
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    console.error('Error fetching users:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
