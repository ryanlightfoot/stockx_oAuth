import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Callback() {
  const router = useRouter();
  
  useEffect(() => {
    // Just redirect to the main page with the code
    // The main page will handle extracting the code
    if (router.query.code) {
      router.push(`/?code=${router.query.code}&state=${router.query.state || ''}`);
    } else {
      router.push('/');
    }
  }, [router]);
  
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Processing Authentication...</h1>
      <p>Please wait while we complete the authentication process.</p>
    </div>
  );
}
