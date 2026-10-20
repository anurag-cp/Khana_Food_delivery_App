const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isGoogleAuthConfigured = Object.values(firebaseConfig).every(Boolean);

function getAuth() {
  if (!isGoogleAuthConfigured) throw new Error('Add the Firebase web config and enable Google sign-in to connect your account.');
  const firebase = window.firebase;
  if (!firebase) throw new Error('Google sign-in could not load. Check your internet connection and try again.');

  const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
  return app.auth();
}

export function watchAuth(onChange, onError) {
  if (!isGoogleAuthConfigured || !window.firebase) return () => {};
  try {
    return getAuth().onAuthStateChanged(onChange, onError);
  } catch (error) {
    onError?.(error);
    return () => {};
  }
}

export async function signInWithGoogle() {
  const auth = getAuth();
  const provider = new window.firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  // Use a redirect on touch devices so mobile browsers can complete the flow reliably.
  if (window.matchMedia('(pointer: coarse)').matches) {
    await auth.signInWithRedirect(provider);
    return null;
  }
  const result = await auth.signInWithPopup(provider);
  return result.user;
}

export async function signOut() {
  await getAuth().signOut();
}

export function explainAuthError(error) {
  if (error?.code === 'auth/popup-closed-by-user') return 'Sign-in was closed. Your chit is still here.';
  if (error?.code === 'auth/unauthorized-domain') return 'This app address is not authorized in Firebase yet.';
  if (error?.code === 'auth/network-request-failed') return 'The kitchen lost its connection. Try again when you are back online.';
  return error?.message || 'Google sign-in did not finish. Please try again.';
}
