import { randomUUID } from "crypto";
import { getDb } from "./db";
import type {
  User, UpsertUser, Salon, Service, Queue, Offer, Visit,
  InsertSalon, InsertService, InsertQueue, InsertOffer, InsertVisit,
} from "./schemas";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT - mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Salon operations
  getAllSalons(): Promise<Salon[]>;
  getSalon(id: string): Promise<Salon | undefined>;
  getSalonsByOwner(ownerId: string): Promise<Salon[]>;
  createSalon(salon: InsertSalon): Promise<Salon>;
  updateSalon(id: string, updates: Partial<InsertSalon>): Promise<Salon | undefined>;
  
  // Service operations
  getServicesBySalon(salonId: string): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  
  // Queue operations
  getQueueBySalon(salonId: string): Promise<Queue[]>;
  joinQueue(queue: InsertQueue): Promise<Queue>;
  updateQueueStatus(id: string, status: string, position?: number): Promise<Queue | undefined>;
  removeFromQueue(id: string): Promise<boolean>;
  getQueuePosition(userId: string, salonId: string): Promise<Queue | undefined>;
  
  // Offer operations
  getOffersBySalon(salonId: string): Promise<Offer[]>;
  createOffer(offer: InsertOffer): Promise<Offer>;
  updateOfferClicks(id: string): Promise<void>;
  
  // Visit operations
  getVisitsByUser(userId: string): Promise<Visit[]>;
  createVisit(visit: InsertVisit): Promise<Visit>;
  
  // Analytics operations
  getSalonAnalytics(salonId: string): Promise<{
    totalCustomers: number;
    avgWaitTime: number;
    offerClicks: number;
    revenue: number;
    customerFlow: number[];
    servicePopularity: { name: string; count: number }[];
    peakHours: number[];
  }>;
}

export class MongoStorage implements IStorage {
  constructor() {}

  private col<T extends Record<string, any>>(name: string) {
    return getDb().collection<T>(name);
  }

  // User operations (IMPORTANT - mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    return await this.col<User>('users').findOne({ id }) || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return await this.col<User>('users').findOne({ email }) || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const id = userData.id || randomUUID();
    const existing = await this.col<User>('users').findOne({ id });
    if (existing) {
      const updated = { ...existing, ...userData, id, updatedAt: new Date() } as User;
      await this.col<User>('users').updateOne({ id }, { $set: updated }, { upsert: true });
      return updated;
    }
    const newUser: User = {
      id,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      phone: userData.phone || null,
      loyaltyPoints: userData.loyaltyPoints || 0,
      isAdmin: userData.isAdmin || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await this.col<User>('users').insertOne(newUser as any);
    return newUser;
  }

  // Salon operations
  async getAllSalons(): Promise<Salon[]> {
    return await this.col<Salon>('salons').find({}).toArray();
  }

  async getSalon(id: string): Promise<Salon | undefined> {
    return await this.col<Salon>('salons').findOne({ id }) || undefined;
  }

  async getSalonsByOwner(ownerId: string): Promise<Salon[]> {
    return await this.col<Salon>('salons').find({ ownerId }).toArray();
  }

  async createSalon(salonData: InsertSalon): Promise<Salon> {
    const salon: Salon = {
      id: randomUUID(),
      ownerId: salonData.ownerId || null,
      name: salonData.name,
      description: salonData.description || null,
      location: salonData.location,
      phone: salonData.phone || null,
      imageUrl: salonData.imageUrl || null,
      operatingHours: salonData.operatingHours || "9 AM - 7 PM",
      rating: 0,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await this.col<Salon>('salons').insertOne(salon as any);
    return salon;
  }

  async updateSalon(id: string, updates: Partial<InsertSalon>): Promise<Salon | undefined> {
    const salon = await this.getSalon(id);
    if (!salon) return undefined;
    const updatedSalon = { ...salon, ...updates, updatedAt: new Date() } as Salon;
    await this.col<Salon>('salons').updateOne({ id }, { $set: updatedSalon });
    return updatedSalon;
  }

  // Service operations
  async getServicesBySalon(salonId: string): Promise<Service[]> {
    return await this.col<Service>('services').find({ salonId }).toArray();
  }

  async createService(serviceData: InsertService): Promise<Service> {
    const service: Service = {
      id: randomUUID(),
      salonId: serviceData.salonId || null,
      name: serviceData.name,
      description: serviceData.description || null,
      price: serviceData.price,
      duration: serviceData.duration,
      createdAt: new Date(),
    };
    await this.col<Service>('services').insertOne(service as any);
    return service;
  }

  // Queue operations
  async getQueueBySalon(salonId: string): Promise<Queue[]> {
    return await this.col<Queue>('queues').find({ salonId }).sort({ position: 1 }).toArray();
  }

  async joinQueue(queueData: InsertQueue): Promise<Queue> {
    // Get current queue size for position
    const currentQueue = await this.getQueueBySalon(queueData.salonId || "");
    const waitingCount = currentQueue.filter(q => q.status === "waiting").length;
    
    const queue: Queue = {
      id: randomUUID(),
      salonId: queueData.salonId || null,
      userId: queueData.userId || null,
      serviceId: queueData.serviceId || null,
      status: queueData.status || "waiting",
      position: waitingCount + 1,
      joinedAt: new Date(),
      calledAt: null,
      completedAt: null,
    };
    await this.col<Queue>('queues').insertOne(queue as any);
    return queue;
  }

  async updateQueueStatus(id: string, status: Queue["status"], position?: number): Promise<Queue | undefined> {
    const queue = await this.col<Queue>('queues').findOne({ id });
    if (!queue) return undefined;
    const updates: Partial<Queue> = { status };
    if (position !== undefined) updates.position = position;
    if (status === "in-progress") updates.calledAt = new Date();
    if (status === "completed" || status === "no-show") updates.completedAt = new Date();
    const updatedQueue = { ...queue, ...updates } as Queue;
    await this.col<Queue>('queues').updateOne({ id }, { $set: updatedQueue });
    return updatedQueue;
  }

  async removeFromQueue(id: string): Promise<boolean> {
    const res = await this.col<Queue>('queues').deleteOne({ id });
    return res.deletedCount === 1;
  }

  async getQueuePosition(userId: string, salonId: string): Promise<Queue | undefined> {
    return await this.col<Queue>('queues').findOne({ userId, salonId, status: 'waiting' }) || undefined;
  }

  // Offer operations
  async getOffersBySalon(salonId: string): Promise<Offer[]> {
    console.log(`Fetching offers for salon: ${salonId}`);
    const offers = await this.col<Offer>('offers')
      .find({ salonId })
      .sort({ createdAt: -1 })
      .toArray() as unknown as Offer[];
    
    console.log(`Found ${offers.length} offers for salon ${salonId}`);
    return offers;
  }

  async createOffer(offerData: InsertOffer): Promise<Offer> {
    const offer: Offer = {
      id: randomUUID(),
      salonId: offerData.salonId,
      title: offerData.title,
      description: offerData.description || null,
      discount: offerData.discount || null,
      validUntil: offerData.validUntil || null,
      isActive: true,
      clickCount: 0,
      createdAt: new Date(),
    };
    
    console.log("Creating offer:", offer);
    
    try {
      await this.col<Offer>('offers').insertOne(offer as any);
      console.log("Offer created successfully");
      return offer;
    } catch (error) {
      console.error("Error creating offer:", error);
      throw error;
    }
  }

  async updateOfferClicks(id: string): Promise<void> {
    await this.col<Offer>('offers').updateOne({ id }, { $inc: { clickCount: 1 } });
  }

  async updateOffer(id: string, updates: Partial<Offer>): Promise<Offer | undefined> {
    const offer = await this.col<Offer>('offers').findOne({ id });
    if (!offer) return undefined;
    const updatedOffer = { ...offer, ...updates } as Offer;
    await this.col<Offer>('offers').updateOne({ id }, { $set: updatedOffer });
    return updatedOffer;
  }

  async deleteOffer(offerId: string): Promise<void> {
    console.log(`Deleting offer with ID: ${offerId}`);
    const result = await this.col<Offer>('offers').deleteOne({ id: offerId });
    console.log(`Delete result: ${result.deletedCount} document(s) deleted`);
    if (result.deletedCount === 0) {
      console.error(`No offer found with ID: ${offerId}`);
    }
  }

  // Visit operations
  async getVisitsByUser(userId: string): Promise<Visit[]> {
    return await this.col<Visit>('visits').find({ userId }).sort({ visitDate: -1 }).toArray();
  }

  async createVisit(visitData: InsertVisit): Promise<Visit> {
    const visit: Visit = {
      id: randomUUID(),
      userId: visitData.userId || null,
      salonId: visitData.salonId || null,
      serviceId: visitData.serviceId || null,
      queueId: visitData.queueId || null,
      totalAmount: visitData.totalAmount || null,
      pointsEarned: visitData.pointsEarned || 10,
      rating: visitData.rating || null,
      visitDate: new Date(),
    };
    await this.col<Visit>('visits').insertOne(visit as any);
    if (visitData.userId) {
      await this.col<User>('users').updateOne(
        { id: visitData.userId },
        { $inc: { loyaltyPoints: visit.pointsEarned || 10 } },
      );
    }
    return visit;
  }

  // Analytics operations
  async getSalonAnalytics(salonId: string): Promise<{
    totalCustomers: number;
    avgWaitTime: number;
    offerClicks: number;
    revenue: number;
    customerFlow: number[];
    servicePopularity: { name: string; count: number }[];
    peakHours: number[];
  }> {
    const visits = await this.col<Visit>('visits').find({ salonId }).toArray();
    const offers = await this.col<Offer>('offers').find({ salonId }).toArray();
    
    return {
      totalCustomers: visits.length,
      avgWaitTime: 22, // Mock average wait time
      offerClicks: offers.reduce((sum, offer) => sum + (offer.clickCount || 0), 0),
      revenue: visits.reduce((sum, visit) => sum + (visit.totalAmount || 0), 0),
      customerFlow: [12, 19, 15, 25, 22, 30, 18], // Mock data for 7 days
      servicePopularity: [
        { name: "Haircut", count: 35 },
        { name: "Color", count: 25 },
        { name: "Manicure", count: 20 },
        { name: "Facial", count: 15 },
        { name: "Other", count: 5 },
      ],
      peakHours: [3, 5, 8, 12, 15, 18, 22, 20, 15, 8], // Mock hourly data
    };
  }
}

export const storage = new MongoStorage();
