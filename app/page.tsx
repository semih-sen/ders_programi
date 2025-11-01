import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
        Welcome to Ders Programi
      </h1>
      
      {session ? (
        <div>
          <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
            Signed in as {session.user?.email}
          </p>
          <a 
            href="/api/auth/signout"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#dc2626',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.375rem',
              fontWeight: '500',
            }}
          >
            Sign Out
          </a>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
            You are not signed in
          </p>
          <a 
            href="/auth/signin"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#2563eb',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.375rem',
              fontWeight: '500',
            }}
          >
            Sign In
          </a>
        </div>
      )}

      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
          Setup Instructions
        </h2>
        <ol style={{ lineHeight: '2' }}>
          <li>Copy <code>.env.local.example</code> to <code>.env.local</code></li>
          <li>Fill in your Google OAuth credentials</li>
          <li>Set up your PostgreSQL database</li>
          <li>Run <code>npm run db:push</code> to create tables</li>
          <li>Sign in with Google to test</li>
        </ol>
        <p style={{ marginTop: '1rem' }}>
          See <code>SETUP.md</code> for detailed instructions.
        </p>
      </div>
    </main>
  );
}
