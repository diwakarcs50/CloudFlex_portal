import { NextRequest, NextResponse } from 'next/server';
import { requireRole, requireAuth, AuthError } from '@/lib/middleware';
import { getDataSource } from '@/lib/db';
import { Project } from '@/entities/Project';
import { ProjectUser } from '@/entities/ProjectUser';
import { User } from '@/entities/User';

interface CreateProjectRequest {
  name: string;
  description?: string;
}

interface ProjectResponse {
  id: string;
  name: string;
  description: string | null;
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
  teamMemberCount: number;
  userRole?: string;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const dataSource = await getDataSource();
    const projectRepo = dataSource.getRepository(Project);
    const projectUserRepo = dataSource.getRepository(ProjectUser);
    
    let projects: Project[] = [];
    
    if (user.role === 'admin') {
      projects = await projectRepo.find({
        where: { clientId: user.clientId },
        order: { createdAt: 'DESC' }
      });
    } else {
      const userAssignments = await projectUserRepo.find({
        where: { userId: user.id }
      });
      
      if (userAssignments.length > 0) {
        const projectIds = userAssignments.map(a => a.projectId);
        projects = await projectRepo
          .createQueryBuilder('project')
          .where('project.id IN (:...projectIds)', { projectIds })
          .andWhere('project.clientId = :clientId', { clientId: user.clientId })
          .orderBy('project.createdAt', 'DESC')
          .getMany();
      }
    }
    
    const projectsWithDetails: ProjectResponse[] = await Promise.all(
      projects.map(async (project) => {
        const teamCount = await projectUserRepo.count({
          where: { projectId: project.id }
        });
        
        const userAssignment = await projectUserRepo.findOne({
          where: {
            projectId: project.id,
            userId: user.id
          }
        });
        
        return {
          id: project.id,
          name: project.name,
          description: project.description,
          clientId: project.clientId,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          teamMemberCount: teamCount,
          userRole: userAssignment?.role
        };
      })
    );
    
    return NextResponse.json(projectsWithDetails);
    
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin']);
    
    const body: CreateProjectRequest = await request.json();
    
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Project name is required and must be a string' },
        { status: 400 }
      );
    }
    
    if (body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Project name cannot be empty' },
        { status: 400 }
      );
    }
    
    if (body.name.length > 255) {
      return NextResponse.json(
        { error: 'Project name must be 255 characters or less' },
        { status: 400 }
      );
    }
    
    if (body.description && typeof body.description !== 'string') {
      return NextResponse.json(
        { error: 'Description must be a string' },
        { status: 400 }
      );
    }
    
    const dataSource = await getDataSource();
    const projectRepo = dataSource.getRepository(Project);
    const projectUserRepo = dataSource.getRepository(ProjectUser);
    
    const project = projectRepo.create({
      name: body.name.trim(),
      description: body.description?.trim() || null,
      clientId: user.clientId
    });
    
    await projectRepo.save(project);
    
    const projectUser = projectUserRepo.create({
      projectId: project.id,
      userId: user.id,
      role: 'owner'
    });
    
    await projectUserRepo.save(projectUser);
    
    return NextResponse.json(
      {
        id: project.id,
        name: project.name,
        description: project.description,
        clientId: project.clientId,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      },
      { status: 201 }
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
    
    console.error('Error creating project:', error);
    
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
