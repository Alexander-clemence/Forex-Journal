# Testing and Feedback System

This document describes the Selenium IDE tests and feedback system for the Forex Journal application.

## 📋 Table of Contents

- [Selenium IDE Tests](#selenium-ide-tests)
- [Feedback System](#feedback-system)
- [Setup Instructions](#setup-instructions)
- [Database Migrations](#database-migrations)

---

## 🧪 Selenium IDE Tests

### Overview

Comprehensive end-to-end tests for the entire Forex Journal application using Selenium IDE.

### Test Files Location

All test files are located in the `/test` directory:

```
test/
├── README.md                           # Test documentation
├── forex-journal-test-suite.side      # Complete test suite
├── 01-authentication-tests.side       # Login/Register tests
├── 02-trade-management-tests.side     # Trade CRUD operations
├── 03-dashboard-tests.side            # Dashboard functionality
├── 04-analytics-tests.side            # Analytics and reports
└── 05-user-management-tests.side      # Admin user management
```

### Test Coverage

#### 1. Authentication Tests (`01-authentication-tests.side`)
- ✅ Login with valid credentials
- ✅ Login with invalid credentials
- ✅ Register new user
- ✅ Logout user

#### 2. Trade Management Tests (`02-trade-management-tests.side`)
- ✅ Create new trade
- ✅ View all trades
- ✅ Filter trades by pair
- ✅ Search trades
- ✅ Edit existing trade
- ✅ Delete trade

#### 3. Dashboard Tests (`03-dashboard-tests.side`)
- ✅ View dashboard statistics
- ✅ View today's performance
- ✅ Test quick actions
- ✅ View recent trades widget
- ✅ Manage account balance
- ✅ Test sidebar navigation
- ✅ Test mobile menu toggle

#### 4. Analytics Tests (`04-analytics-tests.side`)
- ✅ View analytics page
- ✅ Filter by date range
- ✅ View P&L chart
- ✅ View trade timeline
- ✅ View win rate statistics
- ✅ Export analytics data

#### 5. User Management Tests (`05-user-management-tests.side`)
- ✅ View users management page (Admin only)
- ✅ Create new user
- ✅ Search for users
- ✅ Edit user details
- ✅ Change user role
- ✅ Delete user
- ✅ View user statistics

### How to Run Tests

#### Install Selenium IDE

1. **Chrome**: https://chrome.google.com/webstore/detail/selenium-ide/mooikfkahbdckldjjndioackbalphokd
2. **Firefox**: https://addons.mozilla.org/en-US/firefox/addon/selenium-ide/

#### Import and Run

1. Open Selenium IDE browser extension
2. Click "Open an existing project"
3. Navigate to `/test` folder
4. Select `forex-journal-test-suite.side` (or individual test files)
5. Configure base URL (default: `http://localhost:3000`)
6. Click "Run all tests" or select individual tests

#### Test Credentials

Update these in Selenium IDE or your environment:

```
Test User:
- Email: test@example.com
- Password: TestPassword123!

Admin User:
- Email: admin@example.com
- Password: AdminPassword123!
```

### CI/CD Integration

To run these tests in CI/CD pipelines, use `selenium-side-runner`:

```bash
npm install -g selenium-side-runner
npm install -g chromedriver

# Run all tests
selenium-side-runner test/*.side

# Run specific test
selenium-side-runner test/01-authentication-tests.side

# Run with specific browser
selenium-side-runner -c "browserName=firefox" test/*.side
```

---

## 💬 Feedback System

### Overview

A comprehensive user feedback system allowing users to submit ratings, categorized feedback, and messages directly from the application.

### Features

- ⭐ 5-star rating system
- 📁 Categorized feedback (Bug, Feature Request, Improvement, General)
- ✍️ Text-based feedback (up to 1000 characters)
- 🔐 User authentication tracking
- 📊 Admin dashboard for viewing feedback
- 🎨 Beautiful, accessible UI with dark mode support

### User Interface

The feedback button is located in the dashboard header, accessible from all dashboard pages.

**Button Location**: Dashboard Header (top-right, next to "Guide me" button)

### How to Submit Feedback

1. Click the "Feedback" button in the dashboard header
2. Rate your experience (1-5 stars)
3. Select a category:
   - **General Feedback**: Overall thoughts and comments
   - **Report a Bug**: Technical issues or errors
   - **Feature Request**: New feature suggestions
   - **Improvement Suggestion**: Enhancement ideas
4. Write your feedback (required, max 1000 characters)
5. Click "Send Feedback"

### Components

#### FeedbackDialog Component

Located at: `src/components/feedback/FeedbackDialog.tsx`

```tsx
import { FeedbackDialog } from '@/components/feedback/FeedbackDialog';

// Use with custom trigger
<FeedbackDialog
  trigger={
    <Button>Give Feedback</Button>
  }
/>

// Use with default trigger
<FeedbackDialog />
```

### API Endpoints

#### Submit Feedback

**Endpoint**: `POST /api/feedback/submit`

**Request Body**:
```json
{
  "rating": 5,
  "category": "feature",
  "message": "Great app! Would love to see...",
  "user_email": "user@example.com",
  "user_id": "uuid-here"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "data": { /* feedback record */ }
}
```

#### List Feedback (Admin Only)

**Endpoint**: `GET /api/feedback/list`

**Query Parameters**:
- `limit` (optional, default: 50): Number of results
- `offset` (optional, default: 0): Pagination offset
- `category` (optional): Filter by category

**Response**:
```json
{
  "success": true,
  "data": [ /* array of feedback */ ],
  "count": 100,
  "limit": 50,
  "offset": 0
}
```

### Database Schema

The feedback table stores all user submissions:

```sql
Table: feedback
├── id (UUID, Primary Key)
├── user_id (UUID, Foreign Key to auth.users)
├── user_email (TEXT)
├── rating (INTEGER, 1-5)
├── category (TEXT, enum: bug|feature|improvement|general)
├── message (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

**Indexes**:
- `idx_feedback_created_at` - For sorting by date
- `idx_feedback_category` - For filtering by category
- `idx_feedback_user_id` - For user-specific queries

**Row Level Security**:
- Users can insert feedback (anyone)
- Users can view their own feedback
- Admins can view all feedback

---

## 🚀 Setup Instructions

### 1. Database Setup

Run the SQL migration to create the feedback table:

```bash
# Using Supabase CLI
supabase migration new create_feedback_table
# Copy contents from supabase-migrations/create-feedback-table.sql

# Or run directly in Supabase SQL Editor
# Copy and paste the contents of:
# supabase-migrations/create-feedback-table.sql
```

**File**: `supabase-migrations/create-feedback-table.sql`

### 2. Environment Variables

No additional environment variables needed! The feedback system uses your existing Supabase configuration.

### 3. Test User Setup

Create test users in your Supabase database for running tests:

```sql
-- Create test user (via Supabase Dashboard or Auth API)
-- Email: test@example.com
-- Password: TestPassword123!

-- Create admin user
-- Email: admin@example.com
-- Password: AdminPassword123!

-- Update profile role
UPDATE profiles 
SET role = 'admin' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');
```

---

## 📊 Viewing Feedback (Admin)

### Option 1: Via API

Use the list endpoint with admin credentials:

```bash
curl -X GET 'http://localhost:3000/api/feedback/list' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN'
```

### Option 2: Create Admin Dashboard Page

Create a new page at `src/app/(pages)/dashboard/feedback/page.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState([]);
  const { hasPermission } = useAuth();

  useEffect(() => {
    if (!hasPermission('users.manage')) return;
    
    fetch('/api/feedback/list')
      .then(res => res.json())
      .then(data => setFeedback(data.data || []));
  }, [hasPermission]);

  // Render feedback list...
}
```

---

## 🔧 Troubleshooting

### Tests

**Issue**: Tests fail to find elements
- **Solution**: Increase wait times in Selenium IDE settings (10-20 seconds)

**Issue**: Login fails
- **Solution**: Verify test users exist in database with correct credentials

**Issue**: Timeout errors
- **Solution**: Ensure app is running at the correct URL (default: `http://localhost:3000`)

### Feedback System

**Issue**: "Feedback table not found" error
- **Solution**: Run the SQL migration from `supabase-migrations/create-feedback-table.sql`

**Issue**: Feedback submissions not saving
- **Solution**: Check Supabase connection and RLS policies

**Issue**: Admin can't view feedback
- **Solution**: Verify admin user has `role = 'admin'` in profiles table

---

## 📝 Best Practices

### Testing

1. Run tests regularly during development
2. Update test credentials before running
3. Test on multiple browsers (Chrome, Firefox)
4. Run tests against staging environment before production
5. Keep test data separate from production data

### Feedback

1. Review feedback regularly
2. Respond to critical bugs quickly
3. Categorize and prioritize feature requests
4. Track feedback trends over time
5. Use feedback to inform product roadmap

---

## 🤝 Contributing

When adding new features:

1. **Tests**: Create corresponding Selenium IDE tests
2. **Feedback**: Ensure feedback button is accessible on new pages
3. **Documentation**: Update this file with new test cases or features

---

## 📄 License

This testing and feedback system is part of the Forex Journal application.

---

## 📞 Support

For issues or questions:
- Check the troubleshooting section above
- Review test logs in Selenium IDE
- Check browser console for feedback API errors
- Verify database migrations have been run

