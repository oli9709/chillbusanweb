# Prisma Custom Tour Models Setup

## ✅ Models Created

### 1. CustomTourRequest
Stores custom tour booking requests with full itinerary and pricing details.

**Fields:**
- `id` (String, UUID) - Primary key
- `userId` (String, optional) - Links to user if authenticated
- `itinerary` (JSON) - Array of chosen locations, activities, times
- `travelers` (Int) - Number of travelers
- `startTime` (DateTime) - Tour start time
- `durationHours` (Int) - Tour duration in hours
- `basePrice` (Int) - Base price in cents
- `addons` (JSON, optional) - Array of add-ons (lunch, services, etc.)
- `totalPrice` (Int) - Total price including add-ons
- `status` (Enum) - pending, approved, rejected, paid, cancelled
- `createdAt` (DateTime) - Auto-generated
- `updatedAt` (DateTime) - Auto-updated

**Indexes:**
- `userId` - For user-specific queries
- `status` - For filtering by status
- `createdAt` - For sorting by date

### 2. CustomTourPayment
Tracks payment transactions for custom tours via Stripe.

**Fields:**
- `id` (String, UUID) - Primary key
- `customTourId` (String) - Foreign key to CustomTourRequest
- `stripePaymentIntentId` (String, optional) - Stripe payment intent ID
- `amount` (Int) - Payment amount in cents
- `paymentStatus` (Enum) - succeeded, failed, refunded
- `createdAt` (DateTime) - Auto-generated

**Indexes:**
- `customTourId` - For joining with tour requests
- `stripePaymentIntentId` - For Stripe webhook lookups
- `paymentStatus` - For filtering by payment status

**Foreign Key:**
- `customTourId` → `CustomTourRequest.id` (CASCADE delete)

---

## 📁 Files Created

1. **`prisma/schema.prisma`** - Prisma schema with both models
2. **`prisma/migrations/20250101_add_custom_tour_models/migration.sql`** - Prisma migration SQL
3. **`db/migrations/2025_01_add_custom_tour_models.sql`** - Standalone SQL migration for Supabase

---

## 🚀 Setup Instructions

### Option 1: Using Prisma Migrate (Recommended)

1. **Set DATABASE_URL in `.env`:**
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
   ```
   For Supabase, use your connection string from: Supabase Dashboard → Settings → Database → Connection string

2. **Run migration:**
   ```bash
   npm run prisma:migrate
   ```

3. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

### Option 2: Using Supabase SQL Editor (Direct)

1. **Open Supabase Dashboard:**
   - Go to SQL Editor
   - Create new query

2. **Run migration:**
   - Copy contents of `db/migrations/2025_01_add_custom_tour_models.sql`
   - Paste into SQL editor
   - Click "Run"

---

## 📝 Usage Examples

### Create Custom Tour Request

```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const customTour = await prisma.customTourRequest.create({
  data: {
    userId: 'user-uuid-here',
    itinerary: {
      locations: ['gamcheon', 'haeundae', 'gwangalli'],
      activities: ['lunch', 'photo-service'],
      times: ['09:00', '12:00', '15:00']
    },
    travelers: 4,
    startTime: new Date('2025-02-01T09:00:00Z'),
    durationHours: 6,
    basePrice: 20000, // $200.00 in cents
    addons: {
      lunch: true,
      services: ['photo-service']
    },
    totalPrice: 25000, // $250.00 in cents
    status: 'pending'
  }
});
```

### Create Payment Record

```javascript
const payment = await prisma.customTourPayment.create({
  data: {
    customTourId: customTour.id,
    stripePaymentIntentId: 'pi_1234567890',
    amount: 25000,
    paymentStatus: 'succeeded'
  }
});
```

### Query with Relations

```javascript
const tourWithPayments = await prisma.customTourRequest.findUnique({
  where: { id: 'tour-id' },
  include: {
    payments: true
  }
});
```

### Update Status

```javascript
await prisma.customTourRequest.update({
  where: { id: 'tour-id' },
  data: {
    status: 'approved'
  }
});
```

---

## 🔗 Foreign Key Relations

- **CustomTourPayment.customTourId** → **CustomTourRequest.id**
  - Cascade delete: When a tour request is deleted, all associated payments are automatically deleted
  - Required: Payment must have a valid tour request

---

## 📊 Database Schema

### Tables Created:
- `custom_tour_requests` (mapped from CustomTourRequest)
- `custom_tour_payments` (mapped from CustomTourPayment)

### Enums Created:
- `custom_tour_status` (pending, approved, rejected, paid, cancelled)
- `payment_status` (succeeded, failed, refunded)

---

## ✅ Verification

After running the migration, verify:

1. **Tables exist:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('custom_tour_requests', 'custom_tour_payments');
   ```

2. **Enums exist:**
   ```sql
   SELECT typname FROM pg_type 
   WHERE typname IN ('custom_tour_status', 'payment_status');
   ```

3. **Foreign key exists:**
   ```sql
   SELECT conname, conrelid::regclass, confrelid::regclass
   FROM pg_constraint
   WHERE conname = 'custom_tour_payments_customTourId_fkey';
   ```

---

## 🎯 Next Steps

1. ✅ Run migration in Supabase SQL Editor
2. ✅ Generate Prisma Client: `npm run prisma:generate`
3. ✅ Create API endpoints for custom tour requests
4. ✅ Integrate with Stripe payment flow
5. ✅ Add admin panel for approving/rejecting tours

---

## 📚 Prisma Scripts

Added to `package.json`:
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Create and apply migrations
- `npm run prisma:migrate:deploy` - Deploy migrations (production)
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

EOF
cat PRISMA_CUSTOM_TOUR_SETUP.md
