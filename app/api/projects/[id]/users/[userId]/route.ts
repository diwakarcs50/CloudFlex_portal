import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isProjectOwnerOrAdmin, AuthError } from '@/lib/middleware';
import { getDataSource } from '@/lib/db';
import { Project } from '@/entities/Project';
import { ProjectUser } from '@/entities/ProjectUser';

interface UpdateUserRoleRequest {
  role: 'owner' | 'developer' | 'viewer';
}

interface UpdateUserRoleResponse {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  assignedAt: Date;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const user = await requireAuth();
    
    const { id: projectId, userId } = await params;
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!projectId || !uuidRegex.test(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID format' },
        { status: 400 }
      );
    }
    
    if (!userId || !uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
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
    
    const isAuthorized = await isProjectOwnerOrAdmin(projectId, user.id);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Access denied: Only project owners or admins can update user roles' },
        { status: 403 }
      );
    }
    
    const body: UpdateUserRoleRequest = await request.json();
    
    if (!body.role) {
      return NextResponse.json(
        { error: 'Missing required field: role' },
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
    
    const projectUser = await projectUserRepo.findOne({
      where: {
        projectId: project.id,
        userId: userId
      }
    });
    
    if (!projectUser) {
      return NextResponse.json(
        { error: 'User assignment not found' },
        { status: 404 }
      );
    }
    
    projectUser.role = body.role;
    await projectUserRepo.save(projectUser);
    
    const response: UpdateUserRoleResponse = {
      id: projectUser.id,
      projectId: projectUser.projectId,
      userId: projectUser.userId,
      role: projectUser.role,
      assignedAt: projectUser.createdAt
    };
    
    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    console.error('Error updating user role:', error);
    
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const user = await requireAuth();
    
    const { id: projectId, userId } = await params;
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!projectId || !uuidRegex.test(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID format' },
        { status: 400 }
      );
    }
    
    if (!userId || !uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
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
    
    const isAuthorized = await isProjectOwnerOrAdmin(projectId, user.id);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Access denied: Only project owners or admins can remove users' },
        { status: 403 }
      );
    }
    
    const projectUser = await projectUserRepo.findOne({
      where: {
        projectId: project.id,
        userId: userId
      }
    });
    
    if (!projectUser) {
      return NextResponse.json(
        { error: 'User assignment not found' },
        { status: 404 }
      );
    }
    
    if (projectUser.role === 'owner' && user.role !== 'admin') {
      const ownerCount = await projectUserRepo.count({
        where: {
          projectId: project.id,
          role: 'owner'
        }
      });
      
      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner. At least one owner must remain.' },
          { status: 400 }
        );
      }
    }
    
    await projectUserRepo.remove(projectUser);
    
    return new NextResponse(null, { status: 204 });
    
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    console.error('Error removing user from project:', error);
    
    return NextResponse.json(
      { error: 'Failed to remove user from project' },
      { status: 500 }
    );
  }
}
