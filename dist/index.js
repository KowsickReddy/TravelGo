var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  bookings: () => bookings,
  bookingsRelations: () => bookingsRelations,
  createBookingSchema: () => createBookingSchema,
  insertBookingSchema: () => insertBookingSchema,
  insertServiceSchema: () => insertServiceSchema,
  insertUserSchema: () => insertUserSchema,
  searchServicesSchema: () => searchServicesSchema,
  services: () => services,
  servicesRelations: () => servicesRelations,
  sessions: () => sessions,
  users: () => users,
  usersRelations: () => usersRelations
});
import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  date
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  // 'hotel', 'bus'
  description: text("description"),
  location: varchar("location", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  totalReviews: integer("total_reviews").default(0),
  images: jsonb("images").default([]),
  amenities: jsonb("amenities").default([]),
  availability: integer("availability").notNull().default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Hotel specific fields
  checkInTime: varchar("check_in_time"),
  checkOutTime: varchar("check_out_time"),
  // Bus specific fields
  departureTime: varchar("departure_time"),
  arrivalTime: varchar("arrival_time"),
  route: varchar("route"),
  duration: varchar("duration")
});
var bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  serviceId: integer("service_id").notNull().references(() => services.id),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  // 'pending', 'confirmed', 'cancelled'
  checkInDate: date("check_in_date"),
  checkOutDate: date("check_out_date"),
  guests: integer("guests").default(1),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  bookingDetails: jsonb("booking_details").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings)
}));
var servicesRelations = relations(services, ({ many }) => ({
  bookings: many(bookings)
}));
var bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id]
  }),
  service: one(services, {
    fields: [bookings.serviceId],
    references: [services.id]
  })
}));
var insertUserSchema = createInsertSchema(users);
var insertServiceSchema = createInsertSchema(services);
var insertBookingSchema = createInsertSchema(bookings);
var searchServicesSchema = z.object({
  destination: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guests: z.number().optional(),
  type: z.enum(["hotel", "bus"]).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  rating: z.number().optional(),
  amenities: z.array(z.string()).optional()
});
var createBookingSchema = insertBookingSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and, gte, lte, desc, sql, ilike } from "drizzle-orm";
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  // Service operations
  async getServices(params) {
    let query = db.select().from(services).where(eq(services.isActive, true));
    const conditions = [];
    if (params.destination) {
      conditions.push(ilike(services.location, `%${params.destination}%`));
    }
    if (params.type) {
      conditions.push(eq(services.type, params.type));
    }
    if (params.minPrice) {
      conditions.push(gte(services.price, params.minPrice.toString()));
    }
    if (params.maxPrice) {
      conditions.push(lte(services.price, params.maxPrice.toString()));
    }
    if (params.rating) {
      conditions.push(gte(services.rating, params.rating.toString()));
    }
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    return await query.orderBy(desc(services.rating));
  }
  async getService(id) {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }
  async createService(service) {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }
  async updateServiceAvailability(id, availability) {
    await db.update(services).set({ availability, updatedAt: /* @__PURE__ */ new Date() }).where(eq(services.id, id));
  }
  // Booking operations
  async getBookings(userId) {
    return await db.select({
      id: bookings.id,
      userId: bookings.userId,
      serviceId: bookings.serviceId,
      status: bookings.status,
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      guests: bookings.guests,
      totalPrice: bookings.totalPrice,
      bookingDetails: bookings.bookingDetails,
      createdAt: bookings.createdAt,
      updatedAt: bookings.updatedAt,
      service: services
    }).from(bookings).leftJoin(services, eq(bookings.serviceId, services.id)).where(eq(bookings.userId, userId)).orderBy(desc(bookings.createdAt));
  }
  async getBooking(id) {
    const [booking] = await db.select({
      id: bookings.id,
      userId: bookings.userId,
      serviceId: bookings.serviceId,
      status: bookings.status,
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      guests: bookings.guests,
      totalPrice: bookings.totalPrice,
      bookingDetails: bookings.bookingDetails,
      createdAt: bookings.createdAt,
      updatedAt: bookings.updatedAt,
      service: services
    }).from(bookings).leftJoin(services, eq(bookings.serviceId, services.id)).where(eq(bookings.id, id));
    return booking;
  }
  async createBooking(booking) {
    return await db.transaction(async (tx) => {
      const [service] = await tx.select().from(services).where(eq(services.id, booking.serviceId));
      if (!service || service.availability <= 0) {
        throw new Error("Service not available");
      }
      const [newBooking] = await tx.insert(bookings).values(booking).returning();
      await tx.update(services).set({
        availability: service.availability - 1,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(services.id, booking.serviceId));
      return newBooking;
    });
  }
  async updateBookingStatus(id, status) {
    await db.update(bookings).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(bookings.id, id));
  }
  async cancelBooking(id, userId) {
    await db.transaction(async (tx) => {
      const [booking] = await tx.select().from(bookings).where(and(eq(bookings.id, id), eq(bookings.userId, userId)));
      if (!booking) {
        throw new Error("Booking not found");
      }
      await tx.update(bookings).set({ status: "cancelled", updatedAt: /* @__PURE__ */ new Date() }).where(eq(bookings.id, id));
      await tx.update(services).set({
        availability: sql`${services.availability} + 1`,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(services.id, booking.serviceId));
    });
  }
  // Seed data
  async seedServices() {
    const existingServices = await db.select().from(services).limit(1);
    if (existingServices.length > 0) {
      return;
    }
    const seedData = [
      // Hotels
      {
        name: "Grand Plaza Hotel",
        type: "hotel",
        description: "Modern hotel with stunning city views, spa, and rooftop restaurant.",
        location: "Downtown, New York",
        price: "89.00",
        rating: "4.2",
        totalReviews: 124,
        images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945"],
        amenities: ["Free WiFi", "Free Breakfast", "Spa", "Gym", "Restaurant"],
        availability: 15,
        checkInTime: "3:00 PM",
        checkOutTime: "11:00 AM"
      },
      {
        name: "Boutique Inn",
        type: "hotel",
        description: "Stylish boutique hotel in trendy SoHo with artisanal amenities.",
        location: "SoHo, New York",
        price: "145.00",
        rating: "4.7",
        totalReviews: 89,
        images: ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa"],
        amenities: ["Free WiFi", "Pet Friendly", "Concierge", "Restaurant"],
        availability: 8,
        checkInTime: "3:00 PM",
        checkOutTime: "12:00 PM"
      },
      {
        name: "City Center Hotel",
        type: "hotel",
        description: "Comfortable hotel in the heart of the city with excellent connectivity.",
        location: "Midtown, New York",
        price: "65.00",
        rating: "4.0",
        totalReviews: 156,
        images: ["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4"],
        amenities: ["Free WiFi", "Free Parking", "Business Center"],
        availability: 20,
        checkInTime: "2:00 PM",
        checkOutTime: "11:00 AM"
      },
      // Buses
      {
        name: "Express Bus Lines",
        type: "bus",
        description: "Premium bus service with comfortable seating and modern amenities.",
        location: "New York",
        price: "24.00",
        rating: "4.8",
        totalReviews: 245,
        images: ["https://images.unsplash.com/photo-1544620347-c4fd4a3d5957"],
        amenities: ["WiFi", "AC", "Reclining Seats", "USB Charging"],
        availability: 35,
        departureTime: "8:00 AM",
        arrivalTime: "12:30 PM",
        route: "New York \u2192 Boston",
        duration: "4h 30m"
      },
      {
        name: "Comfort Coach",
        type: "bus",
        description: "Reliable bus service with affordable fares and good connectivity.",
        location: "New York",
        price: "18.00",
        rating: "4.3",
        totalReviews: 178,
        images: ["https://images.unsplash.com/photo-1544620347-c4fd4a3d5957"],
        amenities: ["AC", "Reclining Seats", "Reading Lights"],
        availability: 28,
        departureTime: "10:30 AM",
        arrivalTime: "3:15 PM",
        route: "New York \u2192 Philadelphia",
        duration: "4h 45m"
      },
      {
        name: "Luxury Liner",
        type: "bus",
        description: "Premium bus experience with first-class amenities and service.",
        location: "New York",
        price: "45.00",
        rating: "4.9",
        totalReviews: 92,
        images: ["https://images.unsplash.com/photo-1544620347-c4fd4a3d5957"],
        amenities: ["WiFi", "AC", "Leather Seats", "Snacks", "Entertainment"],
        availability: 12,
        departureTime: "6:00 PM",
        arrivalTime: "11:00 PM",
        route: "New York \u2192 Washington DC",
        duration: "5h 00m"
      }
    ];
    await db.insert(services).values(seedData);
  }
};
var storage = new DatabaseStorage();

// server/replitAuth.ts
import * as client from "openid-client";
import { Strategy } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}
var getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID
    );
  },
  { maxAge: 3600 * 1e3 }
);
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl
    }
  });
}
function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}
async function upsertUser(claims) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"]
  });
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  const config = await getOidcConfig();
  const verify = async (tokens, verified) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };
  for (const domain of process.env.REPLIT_DOMAINS.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`
      },
      verify
    );
    passport.use(strategy);
  }
  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));
  app2.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"]
    })(req, res, next);
  });
  app2.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login"
    })(req, res, next);
  });
  app2.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`
        }).href
      );
    });
  });
}
var isAuthenticated = async (req, res, next) => {
  const user = req.user;
  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const now = Math.floor(Date.now() / 1e3);
  if (now <= user.expires_at) {
    return next();
  }
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// server/routes.ts
import { z as z2 } from "zod";
async function registerRoutes(app2) {
  await setupAuth(app2);
  await storage.seedServices();
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.get("/api/services", async (req, res) => {
    try {
      const params = searchServicesSchema.parse(req.query);
      const services2 = await storage.getServices(params);
      res.json(services2);
    } catch (error) {
      console.error("Error fetching services:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid search parameters", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to fetch services" });
      }
    }
  });
  app2.get("/api/services/:id", async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      if (isNaN(serviceId)) {
        return res.status(400).json({ message: "Invalid service ID" });
      }
      const service = await storage.getService(serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });
  app2.get("/api/bookings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookings2 = await storage.getBookings(userId);
      res.json(bookings2);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });
  app2.post("/api/bookings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookingData = createBookingSchema.parse({
        ...req.body,
        userId
      });
      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      } else if (error.message === "Service not available") {
        res.status(409).json({ message: "Service is no longer available" });
      } else {
        res.status(500).json({ message: "Failed to create booking" });
      }
    }
  });
  app2.get("/api/bookings/:id", isAuthenticated, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      if (isNaN(bookingId)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      const userId = req.user.claims.sub;
      if (booking.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });
  app2.put("/api/bookings/:id/cancel", isAuthenticated, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      if (isNaN(bookingId)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }
      const userId = req.user.claims.sub;
      await storage.cancelBooking(bookingId, userId);
      res.json({ message: "Booking cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      if (error.message === "Booking not found") {
        res.status(404).json({ message: "Booking not found" });
      } else {
        res.status(500).json({ message: "Failed to cancel booking" });
      }
    }
  });
  app2.get("/api/services/:id/availability", async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      if (isNaN(serviceId)) {
        return res.status(400).json({ message: "Invalid service ID" });
      }
      const service = await storage.getService(serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json({
        available: service.availability > 0,
        count: service.availability
      });
    } catch (error) {
      console.error("Error checking availability:", error);
      res.status(500).json({ message: "Failed to check availability" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
