# Booking Schema Validation

## INSERT Statement Fields (from createBooking.js)

The following fields are inserted into the `bookings` table:

1. `name` - TEXT (from cleanName)
2. `email` - TEXT (from cleanEmail)
3. `phone` - TEXT (from cleanPhone)
4. `tour` - TEXT (from cleanTour)
5. `date` - TEXT (from cleanDate, format: YYYY-MM-DD)
6. `people` - INTEGER (from cleanPeople)
7. `addons` - TEXT (from cleanAddons, comma-separated string)
8. `total_price` - INTEGER (from cleanTotal)

## Required Schema

```sql
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    name TEXT,
    email TEXT,
    phone TEXT,
    tour TEXT,
    date TEXT,
    people INTEGER,
    addons TEXT,
    total_price INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## SQL Update Script

The `update_bookings_schema.sql` file contains ALTER TABLE statements that:
- Add the `id` column if it doesn't exist (as PRIMARY KEY)
- Add all required columns using `ADD COLUMN IF NOT EXISTS`
- Set appropriate data types
- Add `created_at` with default value

## Validation Checklist

After running the SQL script, verify:

- [ ] `id` column exists and is PRIMARY KEY (SERIAL/INTEGER)
- [ ] `name` column exists (TEXT)
- [ ] `email` column exists (TEXT)
- [ ] `phone` column exists (TEXT)
- [ ] `tour` column exists (TEXT)
- [ ] `date` column exists (TEXT)
- [ ] `people` column exists (INTEGER)
- [ ] `addons` column exists (TEXT)
- [ ] `total_price` column exists (INTEGER)
- [ ] `created_at` column exists (TIMESTAMP with DEFAULT NOW())
- [ ] All 10 columns match the INSERT statement fields
- [ ] No errors when running the ALTER TABLE statements
- [ ] Existing data is preserved (no data loss)

## Field Mapping Validation

| INSERT Field | SQL Column | Data Type | Status |
|-------------|------------|-----------|--------|
| cleanName | name | TEXT | ✅ |
| cleanEmail | email | TEXT | ✅ |
| cleanPhone | phone | TEXT | ✅ |
| cleanTour | tour | TEXT | ✅ |
| cleanDate | date | TEXT | ✅ |
| cleanPeople | people | INTEGER | ✅ |
| cleanAddons | addons | TEXT | ✅ |
| cleanTotal | total_price | INTEGER | ✅ |
| (auto) | id | SERIAL | ✅ |
| (auto) | created_at | TIMESTAMP | ✅ |

**Result: All fields match! ✅**

