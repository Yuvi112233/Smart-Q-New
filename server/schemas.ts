import { z } from 'zod';

export const insertSalonSchema = z.object({
  ownerId: z.string().nullable().optional(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  location: z.string().min(1),
  phone: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  operatingHours: z.string().nullable().optional(),
});

export const insertServiceSchema = z.object({
  salonId: z.string().nullable().optional(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  price: z.number().nonnegative(),
  duration: z.number().positive(),
});

export const insertQueueSchema = z.object({
  salonId: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  serviceId: z.string().nullable().optional(),
  status: z.enum(["waiting", "in-progress", "completed", "no-show"]).optional(),
});

export const insertOfferSchema = z.object({
  salonId: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  discount: z.number().nullable().optional(),
  validUntil: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

export const insertVisitSchema = z.object({
  userId: z.string().nullable().optional(),
  salonId: z.string().nullable().optional(),
  serviceId: z.string().nullable().optional(),
  queueId: z.string().nullable().optional(),
  totalAmount: z.number().nonnegative().nullable().optional(),
  pointsEarned: z.number().int().nonnegative().optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
});

export type InsertSalon = z.infer<typeof insertSalonSchema>;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertQueue = z.infer<typeof insertQueueSchema>;
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type InsertVisit = z.infer<typeof insertVisitSchema>;

export type User = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  phone: string | null;
  loyaltyPoints?: number | null;
  isAdmin?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type UpsertUser = Partial<User> & { id?: string };

export type Salon = {
  id: string;
  ownerId: string | null;
  name: string;
  description: string | null;
  location: string;
  phone: string | null;
  imageUrl: string | null;
  rating: number;
  reviewCount: number;
  operatingHours: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Service = {
  id: string;
  salonId: string | null;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  createdAt: Date;
};

export type Queue = {
  id: string;
  salonId: string | null;
  userId: string | null;
  serviceId: string | null;
  status: "waiting" | "in-progress" | "completed" | "no-show";
  position: number;
  joinedAt: Date;
  calledAt: Date | null;
  completedAt: Date | null;
};

export type Offer = {
  id: string;
  salonId: string | null;
  title: string;
  description: string | null;
  discount: number | null;
  validUntil: Date | null;
  isActive: boolean;
  clickCount?: number;
  createdAt: Date;
};

export type Visit = {
  id: string;
  userId: string | null;
  salonId: string | null;
  serviceId: string | null;
  queueId: string | null;
  totalAmount: number | null;
  pointsEarned: number | null;
  rating: number | null;
  visitDate: Date | null;
};

