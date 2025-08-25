import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone"),
  loyaltyPoints: integer("loyalty_points").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const salons = pgTable("salons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  location: varchar("location").notNull(),
  phone: varchar("phone"),
  imageUrl: varchar("image_url"),
  rating: integer("rating").default(0), // stored as integer (0-50 for 0.0-5.0)
  reviewCount: integer("review_count").default(0),
  operatingHours: varchar("operating_hours").default("9 AM - 7 PM"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").references(() => salons.id),
  name: varchar("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // stored in cents
  duration: integer("duration").notNull(), // duration in minutes
  createdAt: timestamp("created_at").defaultNow(),
});

export const queues = pgTable("queues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").references(() => salons.id),
  userId: varchar("user_id").references(() => users.id),
  serviceId: varchar("service_id").references(() => services.id),
  status: varchar("status").notNull().default("waiting"), // waiting, in-progress, completed, no-show
  position: integer("position").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  calledAt: timestamp("called_at"),
  completedAt: timestamp("completed_at"),
});

export const offers = pgTable("offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").references(() => salons.id),
  title: varchar("title").notNull(),
  description: text("description"),
  discount: integer("discount"), // percentage
  validUntil: timestamp("valid_until"),
  isActive: boolean("is_active").default(true),
  clickCount: integer("click_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const visits = pgTable("visits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  salonId: varchar("salon_id").references(() => salons.id),
  serviceId: varchar("service_id").references(() => services.id),
  queueId: varchar("queue_id").references(() => queues.id),
  totalAmount: integer("total_amount"), // stored in cents
  pointsEarned: integer("points_earned").default(10),
  rating: integer("rating"), // 1-5 stars
  visitDate: timestamp("visit_date").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSalonSchema = createInsertSchema(salons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
});

export const insertQueueSchema = createInsertSchema(queues).omit({
  id: true,
  joinedAt: true,
  calledAt: true,
  completedAt: true,
});

export const insertOfferSchema = createInsertSchema(offers).omit({
  id: true,
  createdAt: true,
});

export const insertVisitSchema = createInsertSchema(visits).omit({
  id: true,
  visitDate: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Salon = typeof salons.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Queue = typeof queues.$inferSelect;
export type Offer = typeof offers.$inferSelect;
export type Visit = typeof visits.$inferSelect;

export type InsertSalon = z.infer<typeof insertSalonSchema>;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertQueue = z.infer<typeof insertQueueSchema>;
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type InsertVisit = z.infer<typeof insertVisitSchema>;
