export const ADMIN_PASSWORD = 'grodan2025';

export function readAdminAuthed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem('admin_authed') === 'true';
  } catch {
    return false;
  }
}

export function writeAdminAuthed(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem('admin_authed', 'true');
  } catch {
    // Safari private mode can block sessionStorage writes
  }
}

export function clearAdminAuthed(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem('admin_authed');
  } catch {
    // no-op
  }
}
