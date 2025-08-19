export type AdminSession = {
  loggedIn: boolean;
  expiresAt: number; // epoch ms
};

const ADMIN_SESSION_KEY = 'adminSession';

export function getExpectedAdminPassword(): string {
  const envPassword = import.meta.env?.VITE_ADMIN_PASSWORD as string | undefined;
  return envPassword && envPassword.length > 0 ? envPassword : 'admin123';
}

export function readAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    if (typeof parsed?.expiresAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isAdminLoggedIn(): boolean {
  const session = readAdminSession();
  if (!session || !session.loggedIn) return false;
  return Date.now() < session.expiresAt;
}

export function createAdminSession(hoursValid: number): void {
  const expiresAt = Date.now() + hoursValid * 60 * 60 * 1000;
  const session: AdminSession = { loggedIn: true, expiresAt };
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

export function clearAdminSession(): void {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}


