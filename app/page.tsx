"use client";

import { useState, useEffect } from 'react';
import styles from './page.module.css';

// Add this interface above your component
interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
}

export default function Home() {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [tokens, setTokens] = useState<TokenResponse | null>(null);
  const [error, setError] = useState('');
  const [isCallback, setIsCallback] = useState(false);
  
  // Get the current URL to use as redirect URI
  const redirectUri = typeof window !== 'undefined' ? 
    `${window.location.origin}` : '';
  
  // Check if we're on the callback page with a code
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      if (code) {
        setAuthCode(code);
        setIsCallback(true);
        // Remove the code from the URL to prevent accidental sharing
        window.history.replaceState({}, document.title, '/');
      }
    }
  }, []);
  
  // Function to start the OAuth flow
  const startAuth = () => {
    if (!clientId) {
      setError('Client ID is required');
      return;
    }
    
    const authParams = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'offline_access openid',
      audience: 'gateway.stockx.com',
      state: 'stockx-auth-' + Math.random().toString(36).substring(2, 15)
    });
    
    const authUrl = `https://accounts.stockx.com/authorize?${authParams.toString()}`;
    window.location.href = authUrl;
  };
  
  // Function to exchange the auth code for tokens
  const exchangeCode = async () => {
    if (!authCode || !clientId || !clientSecret) {
      setError('Authorization code, Client ID, and Client Secret are required');
      return;
    }
    
    try {
      setError('');
      
      // Instead of using a separate API route, we'll make the token exchange request directly
      const tokenResponse = await fetch('https://accounts.stockx.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          code: authCode,
          redirect_uri: redirectUri,
        }),
      });
      
      const data = await tokenResponse.json();
      
      if (!tokenResponse.ok) {
        throw new Error(data.error_description || data.error || 'Failed to exchange code for tokens');
      }
      
      setTokens(data);
    } catch (err) {
      setError(err.message);
    }
  };
  
  // If we just received a code, show a special message
  if (isCallback && authCode) {
    setTimeout(() => {
      setIsCallback(false);
    }, 3000);
    
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <h1 className={styles.title}>Authentication Successful!</h1>
          <p>Authorization code received. Redirecting back to the main page...</p>
        </main>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>StockX OAuth Helper</h1>
        
        <div className={styles.card}>
          <h2>Step 1: Enter Your Credentials</h2>
          <p>Enter the credentials from your StockX developer account:</p>
          
          <div className={styles.formGroup}>
            <label>Client ID:</label>
            <input 
              type="text" 
              value={clientId} 
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Your StockX Client ID"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Client Secret:</label>
            <input 
              type="password" 
              value={clientSecret} 
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Your StockX Client Secret"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>API Key:</label>
            <input 
              type="text" 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Your StockX API Key"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Redirect URI (automatically set):</label>
            <input 
              type="text" 
              value={redirectUri} 
              readOnly
            />
            <p className={styles.note}>
              Important: Add this exact URL to your StockX application's allowed redirect URIs.
            </p>
          </div>
        </div>
        
        <div className={styles.card}>
          <h2>Step 2: Authenticate with StockX</h2>
          <button 
            className={styles.button} 
            onClick={startAuth}
            disabled={!clientId}
          >
            Start Authentication
          </button>
          
          {authCode && (
            <div className={styles.codeBox}>
              <p>Authorization Code Received:</p>
              <code>{authCode}</code>
            </div>
          )}
        </div>
        
        {authCode && (
          <div className={styles.card}>
            <h2>Step 3: Exchange Code for Tokens</h2>
            <button 
              className={styles.button} 
              onClick={exchangeCode}
              disabled={!authCode || !clientId || !clientSecret}
            >
              Get Access Token
            </button>
          </div>
        )}
        
        {error && (
          <div className={styles.error}>
            <p>Error: {error}</p>
          </div>
        )}
        
        {tokens && (
          <div className={styles.card}>
            <h2>Your Tokens</h2>
            <div className={styles.tokenBox}>
              <h3>Access Token:</h3>
              <textarea 
                readOnly 
                value={tokens.access_token}
                rows={3}
              />
              
              <h3>Refresh Token:</h3>
              <textarea 
                readOnly 
                value={tokens.refresh_token || 'No refresh token provided'}
                rows={3}
              />
              
              <h3>Token Type:</h3>
              <p>{tokens.token_type}</p>
              
              <h3>Expires In:</h3>
              <p>{tokens.expires_in} seconds</p>
              
              <div className={styles.apiExample}>
                <h3>API Request Example:</h3>
                <code>
                  curl --location --request GET 'https://api.stockx.com/v2/catalog/products' \<br/>
                  --header 'Content-Type: application/json' \<br/>
                  --header 'Authorization: Bearer {tokens.access_token}' \<br/>
                  --header 'x-api-key: {apiKey}'
                </code>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
