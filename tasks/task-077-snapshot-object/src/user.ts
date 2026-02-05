/**
 * User creation utilities with dynamic value generation.
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user" | "guest";
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    loginCount: number;
    lastLogin: Date | null;
    preferences: {
      theme: "light" | "dark";
      notifications: boolean;
    };
  };
}

/**
 * Generates a UUID v4 string.
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Creates a new user with auto-generated ID and timestamps.
 */
export function createUser(data: {
  name: string;
  email: string;
  role?: "admin" | "user" | "guest";
}): User {
  const now = new Date();

  return {
    id: generateUUID(),
    name: data.name,
    email: data.email,
    role: data.role ?? "user",
    createdAt: now,
    updatedAt: now,
    metadata: {
      loginCount: 0,
      lastLogin: null,
      preferences: {
        theme: "light",
        notifications: true,
      },
    },
  };
}

/**
 * Creates a user profile summary for display.
 */
export function createUserProfile(user: User): {
  displayName: string;
  email: string;
  memberSince: string;
  userId: string;
} {
  return {
    displayName: user.name,
    email: user.email,
    memberSince: user.createdAt.toISOString(),
    userId: user.id,
  };
}

/**
 * Creates an audit log entry.
 */
export function createAuditLog(
  userId: string,
  action: string,
  details: Record<string, unknown>
): {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  details: Record<string, unknown>;
  hash: string;
} {
  const timestamp = new Date();
  const hash = `${timestamp.getTime()}-${Math.random().toString(36).substring(2, 15)}`;

  return {
    id: generateUUID(),
    timestamp,
    userId,
    action,
    details,
    hash,
  };
}
