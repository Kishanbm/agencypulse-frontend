import type { Role } from "@/types/auth";

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  isActive: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface InviteStaffDto {
  email: string;
  firstName: string;
  lastName: string;
}

export interface StaffAssignment {
  id: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
    isActive: boolean;
  };
}