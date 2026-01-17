import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isProjectOwnerOrAdmin, isProjectOwnerDeveloperOrAdmin, AuthError } from '@/lib/middleware';
import { getDataSource } from '@/lib/db';
import { Project } from '@/entities/Project';
import { ProjectUser } from '@/entities/ProjectUser';
import { User } from '@/entities/User';

interface ProjectTeamMember {
  userId: string;
  email: string;
  role: string;
  assignedAt: Date;
}

interface ProjectDetailsResponse {
  id: string;
  name: string;
  description: string | null;
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
  teamMembers: ProjectTeamMember[];
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
    
    const projectUserRepo = dataSource.getRepository(ProjectUser);
    const projectUsers = await projectUserRepo.find({
      where: { projectId: project.id },
      relations: ['user'],
      order: {
        role: 'ASC',
        createdAt: 'ASC'
      }
    });
    
    const teamMembers: ProjectTeamMember[] = projectUsers.map(pu => ({
      userId: pu.userId,
      email: pu.user.email,
      role: pu.role,
      assignedAt: pu.createdAt
    }));
    
    const response: ProjectDetailsResponse = {
      id: project.id,
      name: project.name,
      description: project.description,
      clientId: project.clientId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      teamMembers
    };
    
    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    console.error('Error fetching project:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

export async function PUT(
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
    
    const isAuthorized = await isProjectOwnerDeveloperOrAdmin(projectId, user.id);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Access denied: Only project owners, developers, or admins can update this project' },
        { status: 403 }
      );
    }
    
    const body: UpdateProjectRequest = await request.json();
    
    if (!body.name && body.description === undefined) {
      return NextResponse.json(
        { error: 'At least one field (name or description) must be provided' },
        { status: 400 }
      );
    }
    
    if (body.name !== undefined) {
      if (typeof body.name !== 'string') {
        return NextResponse.json(
          { error: 'Name must be a string' },
          { status: 400 }
        );
      }
      
      const trimmedName = body.name.trim();
      if (!trimmedName) {
        return NextResponse.json(
          { error: 'Name cannot be empty' },
          { status: 400 }
        );
      }
      
      if (trimmedName.length > 255) {
        return NextResponse.json(
          { error: 'Name must be 255 characters or less' },
          { status: 400 }
        );
      }
      
      project.name = trimmedName;
    }
    
    if (body.description !== undefined) {
      if (body.description !== null && typeof body.description !== 'string') {
        return NextResponse.json(
          { error: 'Description must be a string or null' },
          { status: 400 }
        );
      }
      
      project.description = body.description;
    }
    
    await projectRepo.save(project);
    
    return NextResponse.json(
      {
        id: project.id,
        name: project.name,
        description: project.description,
        clientId: project.clientId,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      },
      { status: 200 }
    );
    
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    console.error('Error updating project:', error);
    
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    
    const isAuthorized = await isProjectOwnerOrAdmin(projectId, user.id);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Access denied: Only project owners or admins can delete this project' },
        { status: 403 }
      );
    }
    
    await projectUserRepo.delete({ projectId });
    await projectRepo.remove(project);
    
    return new NextResponse(null, { status: 204 });
    
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    console.error('Error deleting project:', error);
    
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
