import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  logOut: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInPromise = React.useRef<Promise<any> | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const signIn = async () => {
    if (signInPromise.current) return; // Prevent double-clicks
    
    setIsSigningIn(true);
    try {
      // Execute immediately in the same tick as the user gesture
      signInPromise.current = signInWithPopup(auth, googleProvider);
      const result = await signInPromise.current;
      
      // Explicitly set the user to break out of the LandingView instantly
      setUser(result.user);
      
      // Extract the Google Access Token (for Gmail API)
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken && result.user.email) {
         // Store tokens per email to support switching
         const tokensStr = localStorage.getItem('gmail_tokens') || '{}';
         const tokens = JSON.parse(tokensStr);
         tokens[result.user.email.toLowerCase()] = credential.accessToken;
         localStorage.setItem('gmail_tokens', JSON.stringify(tokens));
         
         // Set current for immediate use
         localStorage.setItem('gmail_access_token', credential.accessToken);
      }
      
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request') {
        console.warn('Popup request was cancelled by a newer request or the user.');
        alert(`Sign-in cancelled. If the popup showed "ERR_CONNECTION_REFUSED" or "Site can't be reached", your mobile network (or an ad-blocker/Private DNS) is blocking Firebase authentication domains. Please try switching networks, turning off private DNS, or using a VPN.`);
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.warn('Popup was closed before completing sign in.');
        // Don't alert aggressively here, the user knows they closed it.
      } else if (error.code === 'auth/network-request-failed') {
        console.error('Network request failed during sign in.');
        alert('Network connection failed. Please check your internet connection or ensure your VPN is still active, then try again. Your mobile provider may be blocking the connection.');
      } else if (error.code === 'auth/popup-blocked') {
        alert('Your browser blocked the sign-in popup. Please allow popups for this site and try again.');
      } else {
        console.error("Error signing in with Google:", error);
        alert(`Sign in error: ${error.message}`);
      }
    } finally {
      setIsSigningIn(false);
      signInPromise.current = null;
    }
  };

  const logOut = async () => {
    try {
      localStorage.removeItem('gmail_access_token');
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};
