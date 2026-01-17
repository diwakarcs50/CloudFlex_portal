import { getCurrentUser, JwtPayload } from './auth';
import { getDataSource } from './db';
import { User } from '@/entities/User';
import { ProjectUser } from '@/entities/ProjectUser';

/**
 * Custom error class for authentication/authorization errors
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Extended user type with full database info
 */
export interface AuthenticatedUser extends JwtPayload {
  id: string;
  email: string;
  role: string | null;
  clientId: string;
}

/**
 * requireAuth() - Returns current user or throws 401
 * 
 * Usage in API routes:
 * ```
 * const user = await requireAuth();
 * console.log(user.email);
 * ```
 * 
 * @throws {AuthError} 401 if not authenticated or user not found
 * @returns {Promise<AuthenticatedUser>} The authenticated user
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  try {
    // Get JWT payload from cookie
    const payload = await getCurrentUser();
    
    // Fetch full user from database to ensure they still exist
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

/**
 * requireRole(allowedRoles) - Checks if user has required global role
 * 
 * Usage:
 * ```
 * const user = await requireRole(['admin']);
 * // Only admins get past this point
 * ```
 * 
 * @param {string[]} allowedRoles - Array of allowed role names (e.g., ['admin', 'member'])
 * @throws {AuthError} 401 if not authenticated, 403 if insufficient permissions
 * @returns {Promise<AuthenticatedUser>} The authenticated user
 */
export async function requireRole(allowedRoles: string[]): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  
  // Check if user has one of the allowed roles
  if (!user.role || !allowedRoles.includes(user.role)) {
    throw new AuthError(
      `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`,
      403
    );
  }
  
  return user;
}

/**
 * requireProjectAccess(projectId, allowedRoles) - Checks if user has access to project with specific role
 * 
 * Usage:
 * ```
 * const user = await requireProjectAccess(projectId, ['owner', 'developer']);
 * // User has access to this project as owner or developer
 * ```
 * 
 * Note: Global admins automatically have access to all projects
 * 
 * @param {string} projectId - The project ID to check access for
 * @param {string[]} allowedRoles - Array of allowed project roles (e.g., ['owner', 'developer', 'viewer'])
 * @throws {AuthError} 401 if not authenticated, 403 if no access or insufficient project role
 * @returns {Promise<AuthenticatedUser>} The authenticated user
 */
export async function requireProjectAccess(
  projectId: string,
  allowedRoles: string[]
): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  
  // Global admins have access to all projects
  if (user.role === 'admin') {
    return user;
  }
  
  // Check if user has access to this project with required role
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

/**
 * isProjectOwnerOrAdmin(projectId, userId) - Returns true if user is project owner or global admin
 * 
 * Usage:
 * ```
 * if (await isProjectOwnerOrAdmin(projectId, userId)) {
 *   // Allow deletion
 * }
 * ```
 * 
 * @param {string} projectId - The project ID to check
 * @param {string} userId - The user ID to check
 * @returns {Promise<boolean>} True if user is owner or admin, false otherwise
 */
export async function isProjectOwnerOrAdmin(
  projectId: string,
  userId: string
): Promise<boolean> {
  try {
    const dataSource = await getDataSource();
    
    // Check if user is global admin
    const userRepo = dataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { id: userId }
    });
    
    if (user?.role === 'admin') {
      return true;
    }
    
    // Check if user is project owner
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
