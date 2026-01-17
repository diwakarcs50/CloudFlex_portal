'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/src/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface TeamMember {
  userId: string;
  email: string;
  role: string;
  assignedAt: string;
}

interface ProjectDetails {
  id: string;
  name: string;
  description: string | null;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  teamMembers: TeamMember[];
}

interface User {
  id: string;
  email: string;
  role: string;
  clientId: string;
}

export default function ProjectDetailsPage() {
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingProject, setLoadingProject] = useState(true);
  const [error, setError] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'owner' | 'developer' | 'viewer'>('developer');
  const [assigning, setAssigning] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState('');
  const [editingUserEmail, setEditingUserEmail] = useState('');
  const [newRole, setNewRole] = useState<'owner' | 'developer' | 'viewer'>('developer');
  const [updatingRole, setUpdatingRole] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && projectId) {
      fetchProjectDetails();
      fetchCompanyUsers();
    }
  }, [isAuthenticated, projectId]);

  const fetchProjectDetails = async () => {
    try {
      setLoadingProject(true);
      const response = await fetch(`/api/projects/${projectId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setProject(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load project');
      }
    } catch (err) {
      console.error('Error fetching project:', err);
      setError('Failed to load project');
    } finally {
      setLoadingProject(false);
    }
  };

  const fetchCompanyUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleAssignUser = async () => {
    if (!selectedUserId) return;

    try {
      setAssigning(true);
      const response = await fetch(`/api/projects/${projectId}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: selectedUserId,
          role: selectedRole
        })
      });

      if (response.ok) {
        setShowAssignModal(false);
        setSelectedUserId('');
        await fetchProjectDetails();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to assign user');
      }
    } catch (err) {
      console.error('Error assigning user:', err);
      alert('Failed to assign user');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user from the project?')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchProjectDetails();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to remove user');
      }
    } catch (err) {
      console.error('Error removing user:', err);
      alert('Failed to remove user');
    }
  };

  const handleUpdateRole = async () => {
    if (!editingUserId) return;

    try {
      setUpdatingRole(true);
      const response = await fetch(`/api/projects/${projectId}/users/${editingUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          role: newRole
        })
      });

      if (response.ok) {
        setShowEditRoleModal(false);
        setEditingUserId('');
        setEditingUserEmail('');
        await fetchProjectDetails();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update role');
      }
    } catch (err) {
      console.error('Error updating role:', err);
      alert('Failed to update role');
    } finally {
      setUpdatingRole(false);
    }
  };

  const openEditRoleModal = (userId: string, email: string, currentRole: string) => {
    setEditingUserId(userId);
    setEditingUserEmail(email);
    setNewRole(currentRole as 'owner' | 'developer' | 'viewer');
    setShowEditRoleModal(true);
  };

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete project');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project');
    }
  };

  const canManageProject = () => {
    if (!currentUser || !project) return false;
    if (currentUser.role === 'admin') return true;
    
    const userMembership = project.teamMembers.find(m => m.userId === currentUser.id);
    return userMembership?.role === 'owner';
  };

  const canEditProject = () => {
    if (!currentUser || !project) return false;
    if (currentUser.role === 'admin') return true;
    
    const userMembership = project.teamMembers.find(m => m.userId === currentUser.id);
    return userMembership?.role === 'owner' || userMembership?.role === 'developer';
  };

  const availableUsers = users.filter(user => 
    !project?.teamMembers.some(member => member.userId === user.id)
  );

  if (isLoading || loadingProject) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#666' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !project) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 2rem'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link href="/dashboard" style={{ fontSize: '1.5rem', fontWeight: 'bold', textDecoration: 'none', color: 'inherit' }}>
            ← CloudFlex Portal
          </Link>
          
          <span style={{ color: '#666' }}>{currentUser.email}</span>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}>
        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#fee',
            color: '#c33',
            borderRadius: '6px',
            marginBottom: '1.5rem'
          }}>
            {error}
          </div>
        )}

        {/* Project Header */}
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {project.name}
              </h1>
              <p style={{ color: '#666', fontSize: '1rem', marginBottom: '1rem' }}>
                {project.description || 'No description'}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#999' }}>
                Created {new Date(project.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {canEditProject() && (
                <Link
                  href={`/projects/${projectId}/edit`}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Edit
                </Link>
              )}
              {canManageProject() && (
                <button
                  onClick={handleDeleteProject}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              Team Members ({project.teamMembers.length})
            </h2>
            
            {canManageProject() && availableUsers.length > 0 && (
              <button
                onClick={() => setShowAssignModal(true)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                + Assign User
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {project.teamMembers.map((member) => (
              <div
                key={member.userId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              >
                <div>
                  <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                    {member.email}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#999' }}>
                    Joined {new Date(member.assignedAt).toLocaleDateString()}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {/* Show Creator badge for admin users */}
                  {users.find(u => u.id === member.userId)?.role === 'admin' && (
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#f3e8ff',
                      color: '#7c3aed',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      Creator
                    </span>
                  )}
                  
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: member.role === 'owner' ? '#dbeafe' : member.role === 'developer' ? '#d1fae5' : '#e0e7ff',
                    color: member.role === 'owner' ? '#1e40af' : member.role === 'developer' ? '#065f46' : '#4338ca',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {member.role}
                  </span>

                  {/* Edit Role button - only for non-admin users, shown to owner/admin */}
                  {canManageProject() && users.find(u => u.id === member.userId)?.role !== 'admin' && (member.role === 'developer' || member.role === 'viewer') && (
                    <button
                      onClick={() => openEditRoleModal(member.userId, member.email, member.role)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}
                    >
                      Edit Role
                    </button>
                  )}

                  {canManageProject() && (currentUser.role === 'admin' || member.role !== 'owner') && (
                    <button
                      onClick={() => handleRemoveUser(member.userId)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#fee',
                        color: '#c33',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Assign User Modal */}
      {showAssignModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowAssignModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '100%',
              margin: '1rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              Assign User to Project
            </h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Select User
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              >
                <option value="">Choose a user...</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.email}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              >
                <option value="owner">Owner - Full project control</option>
                <option value="developer">Developer - Can edit and view</option>
                <option value="viewer">Viewer - Read-only access</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAssignModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignUser}
                disabled={!selectedUserId || assigning}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: selectedUserId && !assigning ? '#2563eb' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: selectedUserId && !assigning ? 'pointer' : 'not-allowed',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                {assigning ? 'Assigning...' : 'Assign User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditRoleModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowEditRoleModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              Edit User Role
            </h3>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ marginBottom: '1rem', color: '#666' }}>
                Update role for: <strong>{editingUserEmail}</strong>
              </p>

              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                New Role:
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'owner' | 'developer' | 'viewer')}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              >
                <option value="owner">Owner - Full project control</option>
                <option value="developer">Developer - Can edit project</option>
                <option value="viewer">Viewer - Read-only access</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEditRoleModal(false)}
                disabled={updatingRole}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: updatingRole ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRole}
                disabled={updatingRole}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: updatingRole ? '#93c5fd' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: updatingRole ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                {updatingRole ? 'Updating...' : 'Update Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
