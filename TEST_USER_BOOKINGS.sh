#!/bin/bash
# Test script for GET /api/users/:id/bookings

echo "Testing GET /api/users/:id/bookings endpoint..."
echo ""

# Replace {user-id} with actual user ID from your database
USER_ID="your-user-id-here"

echo "=== Test: Get bookings for user ==="
curl -X GET "http://localhost:3000/api/users/${USER_ID}/bookings" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "Test completed!"
echo ""
echo "Note: Replace USER_ID with an actual user ID from your database"
