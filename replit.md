# SmartQ - Salon Queue Management System

## Overview

SmartQ is a full-stack web application designed for salon queue management, allowing customers to join virtual queues at salons and receive WhatsApp notifications when it's their turn. The system features a customer-facing interface for browsing salons and joining queues, plus a comprehensive salon owner dashboard for queue management, analytics, and business operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: TailwindCSS with custom design system featuring salon-themed colors (soft pink, white, pastel accents)
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent, accessible interface elements
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Design Pattern**: Mobile-first responsive design with component-based architecture

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured route organization
- **Development Server**: Custom Vite integration for hot module replacement in development
- **Error Handling**: Centralized error handling middleware with structured error responses
- **Session Management**: Express sessions with PostgreSQL session store

### Authentication System
- **Provider**: Replit Auth integration using OpenID Connect (OIDC)
- **Session Storage**: PostgreSQL-backed sessions with secure cookie configuration
- **Authorization**: JWT-based authentication with middleware protection for protected routes
- **User Management**: Automatic user creation and session management

### Database Architecture
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Design**: 
  - Users table with loyalty points system
  - Salons table with owner relationships
  - Services table linked to salons
  - Queue management with status tracking
  - Offers system for promotional campaigns
  - Visit history for analytics and loyalty tracking
- **Migration Strategy**: Drizzle Kit for schema migrations and database synchronization

### Data Models
- **Users**: Profile information, loyalty points, visit history
- **Salons**: Business details, owner relationships, operating information
- **Queue System**: Position-based queue with status management (waiting, completed, no-show)
- **Services**: Salon offerings with pricing and duration
- **Offers**: Promotional campaigns with click tracking
- **Analytics**: Visit tracking, customer flow, and business metrics

### Application Features
- **Customer Interface**: Salon discovery, queue joining, profile management with loyalty points
- **Salon Dashboard**: Queue management, customer communication, business analytics
- **Real-time Updates**: Polling-based queue status updates
- **Notification System**: WhatsApp integration for customer notifications
- **Analytics Dashboard**: Business metrics, customer flow analysis, revenue tracking

## External Dependencies

### Core Infrastructure
- **Database Hosting**: Neon PostgreSQL serverless database
- **Authentication**: Replit Auth OIDC provider
- **Session Storage**: PostgreSQL with connect-pg-simple adapter

### Development Tools
- **Package Management**: npm with package-lock.json for dependency consistency
- **Build System**: Vite with TypeScript compilation and React plugin
- **Development Environment**: Replit-specific tooling and error overlays

### UI and Styling
- **CSS Framework**: TailwindCSS with PostCSS processing
- **Component Library**: Radix UI primitives for accessible base components
- **Icons**: Lucide React icon library
- **Fonts**: Google Fonts integration (DM Sans, Geist Mono, Architects Daughter)

### State Management and API
- **HTTP Client**: Fetch API with custom request wrapper
- **Data Fetching**: TanStack React Query for caching and synchronization
- **Form Validation**: Zod schema validation with Drizzle integration

### Communication Services
- **Messaging**: WhatsApp Cloud API for customer notifications (configured for future implementation)
- **Real-time Updates**: Polling mechanism for queue status synchronization

### Utility Libraries
- **Date Handling**: date-fns for date manipulation and formatting
- **Styling Utilities**: clsx and tailwind-merge for conditional CSS classes
- **Development Utilities**: tsx for TypeScript execution, esbuild for production builds