import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isProjectOwnerOrAdmin, AuthError } from '@/lib/middleware';
import { getDataSource } from '@/lib/db';
import { Project } from '@/entities/Project';
import { ProjectUser } from '@/entities/ProjectUser';
import { User } from '@/entities/User';

interface ProjectUserResponse {
  id: string;
  email: string;
  role: string;
  assignedAt: Date;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    
    const { id: projectId } = await params;
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!projectId || !uuidRegex.test(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID format' },
        { status: 400 }
      );
    }
    
    const dataSource = await getDataSource();
    const projectRepo = dataSource.getRepository(Project);
    const projectUserRepo = dataSource.getRepository(ProjectUser);
    
    const project = await projectRepo.findOne({
      where: { id: projectId }
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    if (project.clientId !== user.clientId) {
      return NextResponse.json(
        { error: 'Access denied: This project belongs to a different company' },
        { status: 403 }
      );
    }
    
    const projectUsers = await projectUserRepo.find({
      where: { projectId: project.id },
      relations: ['user'],
      order: {
        role: 'ASC',
        createdAt: 'ASC'
      }
    });
    
    const users: ProjectUserResponse[] = projectUsers.map(pu => ({
      id: pu.userId,
      email: pu.user.email,
      role: pu.role,
      assignedAt: pu.createdAt
    }));
    
    return NextResponse.json(users, { status: 200 });
    
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    console.error('Error fetching project users:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch project users' },
      { status: 500 }
    );
  }
}

interface AssignUserRequest {
  userId: string;
  role: 'owner' | 'developer' | 'viewer';
}

interface AssignUserResponse {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  assignedAt: Date;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    
    const { id: projectId } = await params;
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!projectId || !uuidRegex.test(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID format' },
        { status: 400 }
      );
    }
    
    const dataSource = await getDataSource();
    const projectRepo = dataSource.getRepository(Project);
    const projectUserRepo = dataSource.getRepository(ProjectUser);
    const userRepo = dataSource.getRepository(User);
    
    const project = await projectRepo.findOne({
      where: { id: projectId }
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    if (project.clientId !== user.clientId) {
      return NextResponse.json(
        { error: 'Access denied: This project belongs to a different company' },
        { status: 403 }
      );
    }
    
    const isAuthorized = await isProjectOwnerOrAdmin(projectId, user.id);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Access denied: Only project owners or admins can assign users' },
        { status: 403 }
      );
    }
    
    const body: AssignUserRequest = await request.json();
    
    if (!body.userId || !body.role) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and role are required' },
        { status: 400 }
      );
    }
    
    if (!uuidRegex.test(body.userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }
    
    const validRoles = ['owner', 'developer', 'viewer'];
    if (!validRoles.includes(body.role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: owner, developer, viewer' },
        { status: 400 }
      );
    }
    
    const targetUser = await userRepo.findOne({
      where: { id: body.userId }
    });
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    if (targetUser.clientId !== user.clientId) {
      return NextResponse.json(
        { error: 'Access denied: Cannot assign users from different companies' },
        { status: 403 }
      );
    }
    
    const existingAssignment = await projectUserRepo.findOne({
      where: {
        projectId: project.id,
        userId: targetUser.id
      }
    });
    
    if (existingAssignment) {
      return NextResponse.json(
        { error: 'User is already assigned to this project' },
        { status: 409 }
      );
    }
    
    const projectUser = projectUserRepo.create({
      projectId: project.id,
      userId: targetUser.id,
      role: body.role
    });
    
    await projectUserRepo.save(projectUser);
    
    const response: AssignUserResponse = {
      id: projectUser.id,
      projectId: projectUser.projectId,
      userId: projectUser.userId,
      role: projectUser.role,
      assignedAt: projectUser.createdAt
    };
    
    return NextResponse.json(response, { status: 201 });
    
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    console.error('Error assigning user to project:', error);
    
    return NextResponse.json(
      { error: 'Failed to assign user to project' },
      { status: 500 }
    );
  }
}
