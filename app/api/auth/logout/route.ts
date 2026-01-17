import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * Logs out the user by clearing the JWT token cookie
 */
export async function POST(request: NextRequest) {
  try {
    // Create response with success message
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );

    // Clear the token cookie by setting it to expire immediately
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
