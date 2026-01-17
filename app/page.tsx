import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '600px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#1f2937'
        }}>
          CloudFlex Portal
        </h1>
        
        <p style={{
          fontSize: '1.25rem',
          color: '#6b7280',
          marginBottom: '3rem'
        }}>
          Multi-tenant project management with role-based access control
        </p>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link
            href="/login"
            style={{
              padding: '1rem 2rem',
              backgroundColor: '#2563eb',
              color: 'white',
              borderRadius: '8px',
              fontSize: '1.125rem',
              fontWeight: '500',
              textDecoration: 'none',
              transition: 'background-color 0.2s'
            }}
          >
            Sign In
          </Link>
          
          <Link
            href="/register"
            style={{
              padding: '1rem 2rem',
              backgroundColor: 'white',
              color: '#2563eb',
              border: '2px solid #2563eb',
              borderRadius: '8px',
              fontSize: '1.125rem',
              fontWeight: '500',
              textDecoration: 'none',
              transition: 'background-color 0.2s'
            }}
          >
            Register
          </Link>
        </div>

        <div style={{
          marginTop: '4rem',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: '#1f2937'
          }}>
            Features
          </h2>
          
          <ul style={{
            textAlign: 'left',
            color: '#4b5563',
            lineHeight: '1.75'
          }}>
            <li>✅ Secure authentication with JWT</li>
            <li>✅ Role-based access control (Admin, Member)</li>
            <li>✅ Project-level permissions (Owner, Developer, Viewer)</li>
            <li>✅ Multi-tenant architecture</li>
            <li>✅ Team collaboration tools</li>
            <li>✅ User and client management</li>
          </ul>
        </div>

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#dbeafe',
          borderRadius: '8px',
          fontSize: '0.875rem',
          color: '#1e40af'
        }}>
          <strong>Test Credentials:</strong>
          <div style={{ marginTop: '0.5rem' }}>
            Admin: admin@test.com / Test123!
          </div>
        </div>
      </div>
    </div>
  );
}
