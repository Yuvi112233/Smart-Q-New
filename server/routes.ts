import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  isAuthenticated, 
  setAuthCookie, 
  clearAuthCookie, 
  optionalAuth 
} from "./auth";
import { 
  insertSalonSchema, 
  insertServiceSchema, 
  insertQueueSchema, 
  insertOfferSchema,
  insertVisitSchema 
} from "./schemas";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password, isAdmin } = req.body;
      
      console.log('Login attempt:', { email, isAdmin });
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log('User not found:', email);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      console.log('User found:', { id: user.id, email: user.email, isAdmin: user.isAdmin });
      
      // Check if user type matches (admin vs regular user)
      if (isAdmin && !user.isAdmin) {
        console.log('Admin access denied for user:', user.id);
        return res.status(401).json({ message: "Admin access required" });
      }
      
      // For development, accept any password
      // In production, validate password hash
      
      // Set auth cookie (JWT)
      setAuthCookie(res, user.id, !!user.isAdmin);
      
      console.log('Login successful for user:', user.id);
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        phone: user.phone,
        loyaltyPoints: user.loyaltyPoints,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName, phone, isAdmin } = req.body;
      
      console.log('Registration attempt:', { email, firstName, lastName, isAdmin });
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        console.log('User already exists:', email);
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      // Create new user
      const userData = {
        email,
        firstName,
        lastName,
        phone,
        profileImageUrl: null,
        loyaltyPoints: 0,
        isAdmin: isAdmin || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log('Creating user with data:', userData);
      
      const user = await storage.upsertUser(userData);
      
      console.log('User created successfully:', { id: user.id, isAdmin: user.isAdmin });
      
      res.status(201).json({ 
        message: "User registered successfully",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin
        }
      });
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post('/api/auth/logout', async (req, res) => {
    try {
      clearAuthCookie(res);
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Error during logout:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', optionalAuth, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      let user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      return res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Salon routes
  app.get('/api/salons', async (req, res) => {
    try {
      const salons = await storage.getAllSalons();
      
      // Get additional data for each salon
      const salonsWithDetails = await Promise.all(
        salons.map(async (salon) => {
          const services = await storage.getServicesBySalon(salon.id);
          const offers = await storage.getOffersBySalon(salon.id);
          const queue = await storage.getQueueBySalon(salon.id);
          const waitingCount = queue.filter(q => q.status === "waiting").length;
          
          return {
            ...salon,
            services: services.slice(0, 3).map(s => s.name), // First 3 services
            currentOffer: offers[0]?.title || null,
            currentOfferDiscount: offers[0]?.discount || null,
            queueCount: waitingCount,
          };
        })
      );
      
      res.json(salonsWithDetails);
    } catch (error) {
      console.error("Error fetching salons:", error);
      res.status(500).json({ message: "Failed to fetch salons" });
    }
  });

  app.get('/api/salons/:id', async (req, res) => {
    try {
      const salon = await storage.getSalon(req.params.id);
      if (!salon) {
        return res.status(404).json({ message: "Salon not found" });
      }
      
      const services = await storage.getServicesBySalon(salon.id);
      const offersAll = await storage.getOffersBySalon(salon.id);
      const offers = offersAll.filter(o => o.isActive);
      const queue = await storage.getQueueBySalon(salon.id);
      const waitingCount = queue.filter(q => q.status === "waiting").length;
      
      res.json({
        ...salon,
        services,
        offers,
        queueCount: waitingCount,
      });
    } catch (error) {
      console.error("Error fetching salon:", error);
      res.status(500).json({ message: "Failed to fetch salon" });
    }
  });

  app.post('/api/salons', isAuthenticated, async (req: any, res) => {
    try {
      const ownerId = req.user.claims.sub;
      const salonData = insertSalonSchema.parse({ ...req.body, ownerId });
      const salon = await storage.createSalon(salonData);
      res.status(201).json(salon);
    } catch (error) {
      console.error("Error creating salon:", error);
      res.status(400).json({ message: "Failed to create salon" });
    }
  });

  app.get('/api/my-salons', isAuthenticated, async (req: any, res) => {
    try {
      const ownerId = req.user.claims.sub;
      const salons = await storage.getSalonsByOwner(ownerId);
      res.json(salons);
    } catch (error) {
      console.error("Error fetching user salons:", error);
      res.status(500).json({ message: "Failed to fetch salons" });
    }
  });

  // Service routes
  app.get('/api/salons/:salonId/services', async (req, res) => {
    try {
      const services = await storage.getServicesBySalon(req.params.salonId);
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post('/api/salons/:salonId/services', isAuthenticated, async (req: any, res) => {
    try {
      const serviceData = insertServiceSchema.parse({
        ...req.body,
        salonId: req.params.salonId,
      });
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(400).json({ message: "Failed to create service" });
    }
  });

  // Queue routes
  app.get('/api/queue/:salonId', async (req, res) => {
    try {
      const queue = await storage.getQueueBySalon(req.params.salonId);
      
      // Get user details for each queue entry
      const queueWithUsers = await Promise.all(
        queue.map(async (entry) => {
          const user = entry.userId ? await storage.getUser(entry.userId) : null;
          const service = entry.serviceId && entry.salonId ? await storage.getServicesBySalon(entry.salonId) : null;
          const serviceName = service?.find(s => s.id === entry.serviceId)?.name || "General Service";
          
          return {
            ...entry,
            userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous' : 'Unknown User',
            serviceName,
          };
        })
      );
      
      res.json(queueWithUsers);
    } catch (error) {
      console.error("Error fetching queue:", error);
      res.status(500).json({ message: "Failed to fetch queue" });
    }
  });

  app.post('/api/queue/join', async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || null;

      
      // Get the first service for this salon if serviceId is default
      let serviceId = req.body.serviceId;
      if (serviceId === 'default-service-id' && req.body.salonId) {
        const services = await storage.getServicesBySalon(req.body.salonId);
        if (services && services.length > 0) {
          serviceId = services[0].id;
          console.log("Using first available service:", serviceId);
        }
      }
      
      const queueData = insertQueueSchema.parse({
        ...req.body,
        userId,
        serviceId,
      });
      
      // Check if user is already in queue for this salon
      const existingPosition = queueData.salonId ? await storage.getQueuePosition(userId, queueData.salonId) : null;
      if (existingPosition) {
        return res.status(400).json({ message: "You are already in the queue for this salon" });
      }
      
      const queue = await storage.joinQueue(queueData);
      // Return structured response matching QueueResponse interface
      res.status(201).json({
        id: queue.id,
        position: queue.position,
        status: queue.status,
      });
    } catch (error) {
      console.error("Error joining queue:", error);
      res.status(500).json({ message: "Failed to join queue", details: error.message });
    }
  });

  app.post('/api/queue/:id/call', isAuthenticated, async (req: any, res) => {
    try {
      const queue = await storage.updateQueueStatus(req.params.id, "in-progress");
      if (!queue) {
        return res.status(404).json({ message: "Queue entry not found" });
      }
      
      // Mock WhatsApp notification (UI display instead of actual SMS)
      const user = queue.userId ? await storage.getUser(queue.userId) : null;
      const salon = queue.salonId ? await storage.getSalon(queue.salonId) : null;
      const mockNotification = {
        message: `Hi ${user?.firstName || 'Customer'}, it's your turn at ${salon?.name || 'the salon'}. Please come in!`,
        phone: user?.phone,
        timestamp: new Date(),
      };
      
      res.json({ queue, notification: mockNotification });
    } catch (error) {
      console.error("Error calling customer:", error);
      res.status(500).json({ message: "Failed to call customer" });
    }
  });

  app.post('/api/queue/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const queue = await storage.updateQueueStatus(req.params.id, "completed");
      if (!queue) {
        return res.status(404).json({ message: "Queue entry not found" });
      }
      
      // Create visit record and award loyalty points
      if (queue.serviceId && queue.salonId) {
        const service = await storage.getServicesBySalon(queue.salonId);
        const serviceDetail = service.find(s => s.id === queue.serviceId);
        
        await storage.createVisit({
          userId: queue.userId,
          salonId: queue.salonId,
          serviceId: queue.serviceId,
          queueId: queue.id,
          totalAmount: serviceDetail?.price || 0,
          pointsEarned: 10,
          rating: null,
        });
      }
      
      res.json(queue);
    } catch (error) {
      console.error("Error completing queue entry:", error);
      res.status(500).json({ message: "Failed to complete queue entry" });
    }
  });

  app.post('/api/queue/:id/no-show', isAuthenticated, async (req: any, res) => {
    try {
      const queue = await storage.updateQueueStatus(req.params.id, "no-show");
      if (!queue) {
        return res.status(404).json({ message: "Queue entry not found" });
      }
      res.json(queue);
    } catch (error) {
      console.error("Error marking no-show:", error);
      res.status(500).json({ message: "Failed to mark no-show" });
    }
  });

  app.delete('/api/queue/:id', isAuthenticated, async (req: any, res) => {
    try {
      const success = await storage.removeFromQueue(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Queue entry not found" });
      }
      res.json({ message: "Removed from queue" });
    } catch (error) {
      console.error("Error removing from queue:", error);
      res.status(500).json({ message: "Failed to remove from queue" });
    }
  });

  // User profile routes
  app.get('/api/user/visits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const visits = await storage.getVisitsByUser(userId);
      
      // Get salon and service details for each visit
      const visitsWithDetails = await Promise.all(
        visits.map(async (visit) => {
          const salon = visit.salonId ? await storage.getSalon(visit.salonId) : null;
          const services = visit.salonId ? await storage.getServicesBySalon(visit.salonId) : [];
          const service = services.find(s => s.id === visit.serviceId);
          
          return {
            ...visit,
            salonName: salon?.name || 'Unknown Salon',
            serviceName: service?.name || 'Unknown Service',
          };
        })
      );
      
      res.json(visitsWithDetails);
    } catch (error) {
      console.error("Error fetching visits:", error);
      res.status(500).json({ message: "Failed to fetch visits" });
    }
  });

  app.get('/api/user/queue-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { salonId } = req.query;
      
      if (!salonId) {
        return res.status(400).json({ message: "Salon ID required" });
      }
      
      const queuePosition = await storage.getQueuePosition(userId, salonId as string);
      res.json(queuePosition);
    } catch (error) {
      console.error("Error fetching queue status:", error);
      res.status(500).json({ message: "Failed to fetch queue status" });
    }
  });

  // Offer routes
  app.get('/api/salons/:salonId/offers', async (req, res) => {
    try {
      const offers = await storage.getOffersBySalon(req.params.salonId);
      res.json(offers);
    } catch (error) {
      console.error("Error fetching offers:", error);
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });

  app.post('/api/salons/:salonId/offers', isAuthenticated, async (req: any, res) => {
    try {
      const { salonId } = req.params;
      console.log('Creating offer for salon:', salonId);
      console.log('Request body:', req.body);
      
      // Ensure salonId is set correctly
      const offerData = insertOfferSchema.parse({
        ...req.body,
        salonId: salonId
      });
      
      console.log('Parsed offer data:', offerData);
      const offer = await storage.createOffer(offerData);
      console.log('Created offer:', offer);
      
      res.status(201).json(offer);
    } catch (error) {
      console.error("Error creating offer:", error);
      res.status(400).json({ message: "Failed to create offer", details: error.message });
    }
  });

  app.patch('/api/salons/:salonId/offers/:offerId', isAuthenticated, async (req: any, res) => {
    try {
      const { offerId } = req.params;
      const updates = req.body;
      const updatedOffer = await storage.updateOffer(offerId, updates);
      if (!updatedOffer) {
        return res.status(404).json({ message: "Offer not found" });
      }
      res.json(updatedOffer);
    } catch (error) {
      console.error("Error updating offer:", error);
      res.status(400).json({ message: "Failed to update offer" });
    }
  });

  app.delete('/api/salons/:salonId/offers/:offerId', isAuthenticated, async (req: any, res) => {
    try {
      const { offerId } = req.params;
      console.log(`Received delete request for offer: ${offerId}`);
      await storage.deleteOffer(offerId);
      console.log(`Successfully deleted offer: ${offerId}`);
      res.json({ message: "Offer deleted successfully" });
    } catch (error) {
      console.error("Error deleting offer:", error);
      res.status(400).json({ message: "Failed to delete offer", details: error.message });
    }
  });

  app.post('/api/offers/:id/click', async (req, res) => {
    try {
      await storage.updateOfferClicks(req.params.id);
      res.json({ message: "Offer click recorded" });
    } catch (error) {
      console.error("Error recording offer click:", error);
      res.status(500).json({ message: "Failed to record offer click" });
    }
  });

  // Analytics routes
  app.get('/api/salons/:salonId/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const analytics = await storage.getSalonAnalytics(req.params.salonId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}