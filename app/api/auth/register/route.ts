import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { User } from '@/entities/User';
import { Client } from '@/entities/Client';

interface RegisterRequestBody {
  email: string;
  password: string;
  clientId?: string;
  companyName?: string;
  role?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequestBody = await request.json();
    const { email, password, clientId, companyName, role } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!clientId && !companyName) {
      return NextResponse.json(
        { error: 'Either clientId or companyName must be provided' },
        { status: 400 }
      );
    }

    if (clientId && companyName) {
      return NextResponse.json(
        { error: 'Provide either clientId OR companyName, not both' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    if (role && !['admin', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be either "admin" or "member"' },
        { status: 400 }
      );
    }

    const dataSource = await getDataSource();
    const userRepository = dataSource.getRepository(User);
    const clientRepository = dataSource.getRepository(Client);

    const existingUser = await userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    let finalClientId = clientId;
    let isNewCompany = false;

    if (companyName) {
      const existingClient = await clientRepository.findOne({
        where: { name: companyName },
      });

      if (existingClient) {
        return NextResponse.json(
          { error: 'Company with this name already exists. Please join using clientId.' },
          { status: 409 }
        );
      }

      const newClient = clientRepository.create({
        name: companyName,
      });
      await clientRepository.save(newClient);
      finalClientId = newClient.id;
      isNewCompany = true;
    } else {
      const clientExists = await clientRepository.findOne({
        where: { id: clientId },
      });

      if (!clientExists) {
        return NextResponse.json(
          { error: 'Client company not found' },
          { status: 404 }
        );
      }
    }

    const passwordHash = await hashPassword(password);

    const finalRole = isNewCompany ? 'admin' : (role || 'member');

    const newUser = userRepository.create({
      email,
      passwordHash,
      clientId: finalClientId!,
      role: finalRole,
    });

    await userRepository.save(newUser);

    return NextResponse.json(
      {
        success: true,
        message: isNewCompany
          ? 'Company created and user registered as admin'
          : 'User registered successfully',
        userId: newUser.id,
        clientId: finalClientId,
        email: newUser.email,
        role: newUser.role,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
