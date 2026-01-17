import { getCurrentUser, JwtPayload } from './auth';
import { getDataSource } from './db';
import { User } from '@/entities/User';
import { ProjectUser } from '@/entities/ProjectUser';

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export interface AuthenticatedUser extends JwtPayload {
  id: string;
  email: string;
  role: string | null;
  clientId: string;
}

export async function requireAuth(): Promise<AuthenticatedUser> {
  try {
    const payload = await getCurrentUser();
    
    const dataSource = await getDataSource();
    const userRepo = dataSource.getRepository(User);
    
    const user = await userRepo.findOne({
      where: { id: payload.userId }
    });
    
    if (!user) {
      throw new AuthError('User not found', 401);
    }
    
    return {
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
      clientId: user.clientId
    };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError('Authentication required', 401);
  }
}

export async function requireRole(allowedRoles: string[]): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  
  if (!user.role || !allowedRoles.includes(user.role)) {
    throw new AuthError(
      `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`,
      403
    );
  }
  
  return user;
}

export async function requireProjectAccess(
  projectId: string,
  allowedRoles: string[]
): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  
  if (user.role === 'admin') {
    return user;
  }
  
  const dataSource = await getDataSource();
  const projectUserRepo = dataSource.getRepository(ProjectUser);
  
  const projectUser = await projectUserRepo.findOne({
    where: {
      projectId,
      userId: user.id
    }
  });
  
  if (!projectUser) {
    throw new AuthError('Access denied: You do not have access to this project', 403);
  }
  
  if (!allowedRoles.includes(projectUser.role)) {
    throw new AuthError(
      `Access denied: Insufficient project permissions. Required roles: ${allowedRoles.join(', ')}`,
      403
    );
  }
  
  return user;
}

export async function isProjectOwnerOrAdmin(
  projectId: string,
  userId: string
): Promise<boolean> {
  try {
    const dataSource = await getDataSource();
    
    const userRepo = dataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { id: userId }
    });
    
    if (user?.role === 'admin') {
      return true;
    }
    
    const projectUserRepo = dataSource.getRepository(ProjectUser);
    const projectUser = await projectUserRepo.findOne({
      where: {
        projectId,
        userId,
        role: 'owner'
      }
    });
    
    return !!projectUser;
  } catch (error) {
    console.error('Error checking project owner/admin status:', error);
    return false;
  }
}

export async function isProjectOwnerDeveloperOrAdmin(
  projectId: string,
  userId: string
): Promise<boolean> {
  try {
    const dataSource = await getDataSource();
    
    const userRepo = dataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { id: userId }
    });
    
    if (user?.role === 'admin') {
      return true;
    }
    
    const projectUserRepo = dataSource.getRepository(ProjectUser);
    const projectUser = await projectUserRepo.findOne({
      where: [
        { projectId, userId, role: 'owner' },
        { projectId, userId, role: 'developer' }
      ]
    });
    
    return !!projectUser;
  } catch (error) {
    console.error('Error checking project owner/developer/admin status:', error);
    return false;
  }
}
