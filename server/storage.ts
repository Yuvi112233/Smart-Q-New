import {
  users,
  salons,
  services,
  queues,
  offers,
  visits,
  type User,
  type UpsertUser,
  type Salon,
  type Service,
  type Queue,
  type Offer,
  type Visit,
  type InsertSalon,
  type InsertService,
  type InsertQueue,
  type InsertOffer,
  type InsertVisit,
} from "@shared/schema";
import { randomUUID } from "crypto";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT - mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private salons: Map<string, Salon>;
  private services: Map<string, Service>;
  private queues: Map<string, Queue>;
  private offers: Map<string, Offer>;
  private visits: Map<string, Visit>;

  constructor() {
    this.users = new Map();
    this.salons = new Map();
    this.services = new Map();
    this.queues = new Map();
    this.offers = new Map();
    this.visits = new Map();
    
    // Initialize with some sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample salons
    const salon1: Salon = {
      id: "salon1",
      ownerId: "owner1",
      name: "Elegance Beauty Salon",
      description: "Located in the heart of downtown, Elegance Beauty Salon has been serving the community for over 10 years. Our experienced stylists are passionate about making you look and feel your best.",
      location: "Downtown, 0.8 mi",
      phone: "(555) 123-4567",
      imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
      rating: 48, // 4.8 stars
      reviewCount: 234,
      operatingHours: "9 AM - 7 PM",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const salon2: Salon = {
      id: "salon2",
      ownerId: "owner2",
      name: "Glamour Studio",
      description: "Modern salon specializing in hair color and cutting-edge styling techniques.",
      location: "Midtown, 1.2 mi",
      phone: "(555) 234-5678",
      imageUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
      rating: 49, // 4.9 stars
      reviewCount: 156,
      operatingHours: "10 AM - 8 PM",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const salon3: Salon = {
      id: "salon3",
      ownerId: "owner3",
      name: "Pure Beauty Lounge",
      description: "Full-service beauty lounge offering premium treatments in a relaxing atmosphere.",
      location: "Uptown, 2.1 mi",
      phone: "(555) 345-6789",
      imageUrl: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
      rating: 47, // 4.7 stars
      reviewCount: 189,
      operatingHours: "9 AM - 6 PM",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.salons.set("salon1", salon1);
    this.salons.set("salon2", salon2);
    this.salons.set("salon3", salon3);

    // Sample services
    const services1: Service[] = [
      { id: "service1", salonId: "salon1", name: "Haircut & Style", description: "Professional cut with styling", price: 6500, duration: 60, createdAt: new Date() },
      { id: "service2", salonId: "salon1", name: "Hair Color", description: "Full color or touch-up", price: 12000, duration: 120, createdAt: new Date() },
      { id: "service3", salonId: "salon1", name: "Manicure", description: "Classic manicure with polish", price: 3500, duration: 45, createdAt: new Date() },
    ];

    const services2: Service[] = [
      { id: "service4", salonId: "salon2", name: "Color & Highlights", description: "Professional coloring service", price: 15000, duration: 150, createdAt: new Date() },
      { id: "service5", salonId: "salon2", name: "Hair Treatment", description: "Deep conditioning treatment", price: 8000, duration: 90, createdAt: new Date() },
    ];

    const services3: Service[] = [
      { id: "service6", salonId: "salon3", name: "Facial Treatment", description: "Relaxing facial with premium products", price: 9500, duration: 75, createdAt: new Date() },
      { id: "service7", salonId: "salon3", name: "Pedicure", description: "Complete pedicure service", price: 4500, duration: 60, createdAt: new Date() },
    ];

    [...services1, ...services2, ...services3].forEach(service => {
      this.services.set(service.id, service);
    });

    // Sample offers
    const offer1: Offer = {
      id: "offer1",
      salonId: "salon1",
      title: "20% Off First Visit",
      description: "Valid for new customers only",
      discount: 20,
      validUntil: new Date("2024-12-31"),
      isActive: true,
      clickCount: 45,
      createdAt: new Date(),
    };

    const offer2: Offer = {
      id: "offer2",
      salonId: "salon2",
      title: "Free Consultation",
      description: "Complimentary hair consultation",
      discount: null,
      validUntil: new Date("2024-12-31"),
      isActive: true,
      clickCount: 23,
      createdAt: new Date(),
    };

    this.offers.set("offer1", offer1);
    this.offers.set("offer2", offer2);
  }

  // User operations (IMPORTANT - mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id || "");
    if (existingUser) {
      const updatedUser = { ...existingUser, ...userData, updatedAt: new Date() };
      this.users.set(updatedUser.id, updatedUser);
      return updatedUser;
    } else {
      const newUser: User = {
        id: userData.id || randomUUID(),
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
        phone: userData.phone || null,
        loyaltyPoints: userData.loyaltyPoints || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(newUser.id, newUser);
      return newUser;
    }
  }

  // Salon operations
  async getAllSalons(): Promise<Salon[]> {
    return Array.from(this.salons.values());
  }

  async getSalon(id: string): Promise<Salon | undefined> {
    return this.salons.get(id);
  }

  async getSalonsByOwner(ownerId: string): Promise<Salon[]> {
    return Array.from(this.salons.values()).filter(salon => salon.ownerId === ownerId);
  }

  async createSalon(salonData: InsertSalon): Promise<Salon> {
    const salon: Salon = {
      id: randomUUID(),
      ...salonData,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.salons.set(salon.id, salon);
    return salon;
  }

  async updateSalon(id: string, updates: Partial<InsertSalon>): Promise<Salon | undefined> {
    const salon = this.salons.get(id);
    if (!salon) return undefined;
    
    const updatedSalon = { ...salon, ...updates, updatedAt: new Date() };
    this.salons.set(id, updatedSalon);
    return updatedSalon;
  }

  // Service operations
  async getServicesBySalon(salonId: string): Promise<Service[]> {
    return Array.from(this.services.values()).filter(service => service.salonId === salonId);
  }

  async createService(serviceData: InsertService): Promise<Service> {
    const service: Service = {
      id: randomUUID(),
      ...serviceData,
      createdAt: new Date(),
    };
    this.services.set(service.id, service);
    return service;
  }

  // Queue operations
  async getQueueBySalon(salonId: string): Promise<Queue[]> {
    return Array.from(this.queues.values())
      .filter(queue => queue.salonId === salonId)
      .sort((a, b) => a.position - b.position);
  }

  async joinQueue(queueData: InsertQueue): Promise<Queue> {
    // Get current queue size for position
    const currentQueue = await this.getQueueBySalon(queueData.salonId);
    const waitingCount = currentQueue.filter(q => q.status === "waiting").length;
    
    const queue: Queue = {
      id: randomUUID(),
      ...queueData,
      position: waitingCount + 1,
      joinedAt: new Date(),
      calledAt: null,
      completedAt: null,
    };
    this.queues.set(queue.id, queue);
    return queue;
  }

  async updateQueueStatus(id: string, status: string, position?: number): Promise<Queue | undefined> {
    const queue = this.queues.get(id);
    if (!queue) return undefined;
    
    const updates: Partial<Queue> = { status };
    if (position !== undefined) updates.position = position;
    if (status === "in-progress") updates.calledAt = new Date();
    if (status === "completed" || status === "no-show") updates.completedAt = new Date();
    
    const updatedQueue = { ...queue, ...updates };
    this.queues.set(id, updatedQueue);
    return updatedQueue;
  }

  async removeFromQueue(id: string): Promise<boolean> {
    return this.queues.delete(id);
  }

  async getQueuePosition(userId: string, salonId: string): Promise<Queue | undefined> {
    return Array.from(this.queues.values()).find(
      queue => queue.userId === userId && queue.salonId === salonId && queue.status === "waiting"
    );
  }

  // Offer operations
  async getOffersBySalon(salonId: string): Promise<Offer[]> {
    return Array.from(this.offers.values()).filter(
      offer => offer.salonId === salonId && offer.isActive
    );
  }

  async createOffer(offerData: InsertOffer): Promise<Offer> {
    const offer: Offer = {
      id: randomUUID(),
      ...offerData,
      clickCount: 0,
      createdAt: new Date(),
    };
    this.offers.set(offer.id, offer);
    return offer;
  }

  async updateOfferClicks(id: string): Promise<void> {
    const offer = this.offers.get(id);
    if (offer) {
      offer.clickCount = (offer.clickCount || 0) + 1;
      this.offers.set(id, offer);
    }
  }

  // Visit operations
  async getVisitsByUser(userId: string): Promise<Visit[]> {
    return Array.from(this.visits.values())
      .filter(visit => visit.userId === userId)
      .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
  }

  async createVisit(visitData: InsertVisit): Promise<Visit> {
    const visit: Visit = {
      id: randomUUID(),
      ...visitData,
      visitDate: new Date(),
    };
    this.visits.set(visit.id, visit);
    
    // Award loyalty points to user
    const user = await this.getUser(visitData.userId);
    if (user) {
      await this.upsertUser({
        ...user,
        loyaltyPoints: (user.loyaltyPoints || 0) + (visitData.pointsEarned || 10)
      });
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
    const visits = Array.from(this.visits.values()).filter(v => v.salonId === salonId);
    const offers = Array.from(this.offers.values()).filter(o => o.salonId === salonId);
    
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

export const storage = new MemStorage();
