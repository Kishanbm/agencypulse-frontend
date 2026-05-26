export type ClientStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type CampaignStatus = "ACTIVE" | "PAUSED" | "INACTIVE";

export interface Client {
  id: string;
  name: string;
  website: string | null;
  logoUrl: string | null;
  color: string | null;
  services: string[];
  campaigns?: { id: string }[];
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
  _count: {
    campaigns: number;
    staffAssignments: number;
    clientUserAssignments: number;
  };
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ClientsListResponse {
  data: Client[];
  meta: PaginatedMeta;
}

export interface CreateClientDto {
  name: string;
  website?: string;
  services?: string[];
}

export interface UpdateClientDto {
  name?: string;
  website?: string;
  services?: string[];
  status?: ClientStatus;
}

export interface Campaign {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  toolsLayout?: string[] | null;
  _count?: {
    dashboards?: number;
    reports?: number;
    integrationConnections?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CampaignsListResponse {
  data: Campaign[];
  meta: PaginatedMeta;
}

export interface CreateCampaignDto {
  name: string;
  description?: string;
}

export interface UpdateCampaignDto {
  name?: string;
  description?: string;
  status?: CampaignStatus;
}

export interface StaffAssignment {
  id: string;
  clientId: string;
  userId: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    avatarUrl: string | null;
  };
}

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatarUrl: string | null;
}
