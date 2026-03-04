
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export default async function CheckEnvPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Check</h1>
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold">NextAuth Configuration</h2>
          <p>NEXTAUTH_URL: {process.env.NEXTAUTH_URL || '(Not Set)'}</p>
          <p>NEXTAUTH_SECRET: {process.env.NEXTAUTH_SECRET ? '(Set)' : '(Not Set)'}</p>
          <p>VERCEL_URL: {process.env.VERCEL_URL || '(Not Set)'}</p>
        </div>
        
        <div className="p-4 border rounded">
            <h2 className="font-semibold">Current Session</h2>
            <pre>{JSON.stringify(session, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
