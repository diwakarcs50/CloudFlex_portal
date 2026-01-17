export interface User {
  id: string;
  email: string;
  role: 'admin' | 'member';
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectUser {
  id: string;
  projectId: string;
  userId: string;
  role: 'owner' | 'developer' | 'viewer';
  createdAt: Date;
}

export interface ProjectTeamMember {
  id: string;
  email: string;
  role: 'owner' | 'developer' | 'viewer';
  assignedAt: Date;
}

export interface ApiError {
  error: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: 'admin' | 'member';
  clientId: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

export interface AssignUserRequest {
  userId: string;
  role: 'owner' | 'developer' | 'viewer';
}

export interface UpdateUserRoleRequest {
  role: 'owner' | 'developer' | 'viewer';
}
