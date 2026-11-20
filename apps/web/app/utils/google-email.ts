// The email typed on Sign in before "Continue with Google". The page reloads when it leaves for
// Google, so the email is kept in this tab's sessionStorage; if Google returns an error, Sign in
// shows it again (docs/UCs/authentication.md, GO-04). It is not put in the URL, which logs could keep.
const KEY = 'auth:google-email';

export function saveEmailBeforeGoogle(email: string) {
  try {
    if (email) sessionStorage.setItem(KEY, email);
    else sessionStorage.removeItem(KEY);
  } catch {
    // Storage can be unavailable (private mode, blocked site data); the form then starts empty.
  }
}

/** Returns the saved email once and removes it. */
export function takeEmailAfterGoogle(): string {
  try {
    const email = sessionStorage.getItem(KEY) ?? '';
    sessionStorage.removeItem(KEY);
    return email;
  } catch {
    return '';
  }
}
