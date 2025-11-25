#!/bin/bash
# Test script for POST /api/bookings/create

echo "Testing POST /api/bookings/create endpoint..."
echo ""

# Test with pay_now (should return checkoutUrl)
echo "=== Test 1: pay_now booking ==="
curl -X POST http://localhost:3000/api/bookings/create \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "+82-10-1234-5678"
    },
    "items": [
      {
        "type": "tour",
        "id": "tour-123",
        "name": "Hidden Gems Tour",
        "unit_price_krw": 289000,
        "quantity": 1
      }
    ],
    "payment_option": "pay_now",
    "date": "2025-12-01",
    "pickup_location": "Haeundae Beach"
  }' | jq '.'

echo ""
echo "=== Test 2: pay_after booking ==="
curl -X POST http://localhost:3000/api/bookings/create \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "name": "Test User 2",
      "email": "test2@example.com",
      "phone": "+82-10-9876-5432"
    },
    "items": [
      {
        "type": "tour",
        "id": "tour-456",
        "name": "K-Drama Tour",
        "unit_price_krw": 150000,
        "quantity": 2
      }
    ],
    "payment_option": "pay_after",
    "date": "2025-12-15",
    "pickup_location": "Gamcheon Culture Village"
  }' | jq '.'

echo ""
echo "Tests completed!"
