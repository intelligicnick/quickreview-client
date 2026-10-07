export type PublicUser = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  isActive: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
};

export type Business = {
  id: string;
  name: string;
  category: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  googleReviewUrl: string | null;
  isActive: boolean;
  ownerUserId: string;
  createdAt: string;
};

export type Location = {
  id: string;
  businessId: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  googleReviewUrl: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
};

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = { success: false; error: { code: string; message: string } };
