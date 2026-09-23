import { AdminUser } from '@/types';
import { SEED_ADMIN_USERS } from './seed-data';

const STORAGE_KEYS = {
  CURRENT_ADMIN: 'clubselect_current_admin',
  ADMIN_USERS: 'clubselect_admin_users',
};

export const getAdminUsers = (): AdminUser[] => {
  if (typeof window === 'undefined') return SEED_ADMIN_USERS;
  const stored = localStorage.getItem(STORAGE_KEYS.ADMIN_USERS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.ADMIN_USERS, JSON.stringify(SEED_ADMIN_USERS));
    return SEED_ADMIN_USERS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return SEED_ADMIN_USERS;
  }
};

export const saveAdminUser = (user: AdminUser): void => {
  if (typeof window === 'undefined') return;
  const users = getAdminUsers();
  const idx = users.findIndex((u) => u.id === user.id || (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase()));
  if (idx >= 0) {
    users[idx] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(STORAGE_KEYS.ADMIN_USERS, JSON.stringify(users));
  fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'saveAdminUser', adminUser: user }),
  }).catch(() => {});
};

export const getCurrentAdmin = (): AdminUser | null => {
  if (typeof window === 'undefined') return null;
  const stored = sessionStorage.getItem(STORAGE_KEYS.CURRENT_ADMIN);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const setCurrentAdmin = (user: AdminUser | null): void => {
  if (typeof window === 'undefined') return;
  if (user) {
    sessionStorage.setItem(STORAGE_KEYS.CURRENT_ADMIN, JSON.stringify(user));
    localStorage.removeItem(STORAGE_KEYS.CURRENT_ADMIN);
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.CURRENT_ADMIN);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_ADMIN);
  }
};

export const loginAdmin = async (
  emailStr: string,
  passStr: string
): Promise<{ success: boolean; user?: AdminUser; error?: string }> => {
  // Always fetch the latest admin users from the server before login
  try {
    const res = await fetch('/api/data');
    if (res.ok) {
      const serverData = await res.json();
      if (serverData.adminUsers && Array.isArray(serverData.adminUsers)) {
        // Merge server users into localStorage so we have the latest data
        const localUsers = getAdminUsers();
        const mergedMap = new Map<string, AdminUser>();
        // Start with local users
        for (const u of localUsers) {
          mergedMap.set(u.email?.toLowerCase() ?? u.id, u);
        }
        // Server users overwrite local (server is source of truth)
        for (const u of serverData.adminUsers) {
          mergedMap.set(u.email?.toLowerCase() ?? u.id, u);
        }
        const merged = Array.from(mergedMap.values());
        localStorage.setItem(STORAGE_KEYS.ADMIN_USERS, JSON.stringify(merged));
      }
    }
  } catch {
    // If server is unavailable, fall back to localStorage
  }

  const users = getAdminUsers();
  const user = users.find((u) => u.email && emailStr && u.email.toLowerCase() === emailStr.trim().toLowerCase());

  if (!user) {
    return { success: false, error: 'No admin account found with this email address.' };
  }

  if (user.password && user.password !== passStr) {
    return { success: false, error: 'Invalid password. Please try again.' };
  }

  if (user.status === 'REJECTED') {
    return { success: false, error: 'Your admin account request was declined by the Super Admin.' };
  }

  setCurrentAdmin(user);
  return { success: true, user };
};

export const signUpAdmin = (
  nameStr: string,
  emailStr: string,
  passStr: string
): { success: boolean; user?: AdminUser; error?: string } => {
  const users = getAdminUsers();
  const normEmail = emailStr.trim().toLowerCase();
  const existing = users.find((u) => u.email && u.email.toLowerCase() === normEmail);

  if (existing) {
    return { success: false, error: 'An admin account with this email already exists.' };
  }

  const newAdmin: AdminUser = {
    id: `admin-${Date.now()}`,
    name: nameStr.trim(),
    email: normEmail,
    password: passStr,
    role: 'ADMIN',
    status: 'PENDING_APPROVAL',
    createdAt: new Date().toISOString(),
  };

  saveAdminUser(newAdmin);
  setCurrentAdmin(newAdmin);
  return { success: true, user: newAdmin };
};

export const createSuperAdmin = (
  nameStr: string,
  emailStr: string,
  passStr: string
): { success: boolean; error?: string } => {
  const users = getAdminUsers();
  const normEmail = emailStr.trim().toLowerCase();
  const existing = users.find((u) => u.email && u.email.toLowerCase() === normEmail);

  if (existing) {
    return { success: false, error: 'An account with this email already exists.' };
  }

  const newSuperAdmin: AdminUser = {
    id: `admin-super-${Date.now()}`,
    name: nameStr.trim(),
    email: normEmail,
    password: passStr,
    role: 'SUPER_ADMIN',
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
  };

  saveAdminUser(newSuperAdmin);
  return { success: true };
};

export const updateAdminPassword = (
  adminUserId: string,
  newPassword: string
): void => {
  if (typeof window === 'undefined') return;
  const users = getAdminUsers();
  const idx = users.findIndex((u) => u.id === adminUserId);
  if (idx >= 0) {
    users[idx].password = newPassword;
    localStorage.setItem(STORAGE_KEYS.ADMIN_USERS, JSON.stringify(users));
    
    // Sync with server if online
    fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveAdminUser', adminUser: users[idx] }),
    }).catch(console.error);

    // Update current admin if it's the logged-in user
    const current = getCurrentAdmin();
    if (current && current.id === adminUserId) {
      current.password = newPassword;
      setCurrentAdmin(current);
    }
  }
};

export const updateAdminStatus = (
  adminUserId: string,
  newStatus: 'APPROVED' | 'REJECTED'
): void => {
  if (typeof window === 'undefined') return;
  const users = getAdminUsers();
  const idx = users.findIndex((u) => u.id === adminUserId);
  if (idx >= 0) {
    users[idx].status = newStatus;
    localStorage.setItem(STORAGE_KEYS.ADMIN_USERS, JSON.stringify(users));

    const active = getCurrentAdmin();
    if (active && active.id === adminUserId) {
      active.status = newStatus;
      setCurrentAdmin(active);
    }
  }

  fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'updateAdminStatus', adminUserId, status: newStatus }),
  }).catch(() => {});
};

export const logoutAdmin = (): void => {
  setCurrentAdmin(null);
};
