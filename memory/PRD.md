# Adelphi Menopause Companion - Product Requirements Document

## Overview
Adelphi Menopause Companion is a cross-platform mobile app (iOS and Android) that helps women understand and manage menopause symptoms while supporting partners, family, and community members.

## Technology Stack
- **Frontend**: React Native + Expo (file-based routing with expo-router)
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT-based email/password authentication

## Brand Colors
- **Primary**: #C85A5A (soft red/coral)
- **Secondary/Accent**: #5AB88F (sage green)
- **Background**: #FFF9F7 (warm white)

## User Roles
1. **Primary User**: Woman in any menopause stage
2. **Partner User**: Linked partner/spouse with limited view access
3. **Admin**: Content management (future enhancement)

## Core Features Implemented

### A. Authentication & Onboarding
- [x] Email/password registration and login
- [x] Partner registration flow with invite code system
- [x] GDPR-aware onboarding with:
  - Age range selection
  - Ethnicity (dropdown)
  - Country/region
  - Menopause stage
  - Medical conditions (multi-select)
  - Consent checkboxes
  - Medical disclaimer

### B. Home Dashboard
- [x] Personalized greeting
- [x] Today's check-in status (mood, symptoms, lifestyle)
- [x] Quick action tiles
- [x] AI-free rule-based suggestions
- [x] Quick links to key features

### C. Symptom Tracking
- [x] Pre-populated symptom library (20 symptoms in 3 categories)
  - Physical: Hot flushes, night sweats, sleep problems, etc.
  - Emotional: Anxiety, low mood, irritability, etc.
  - Cognitive: Brain fog, memory issues, concentration
- [x] Symptom logging with:
  - Severity slider (1-10)
  - Frequency selection
  - Optional notes
- [x] Custom symptom creation (flagged for review)
- [x] History and timeline view

### D. Mood Check-in ("How I Feel")
- [x] Mood score selection (1-10 with visual feedback)
- [x] Emotion tags selection
- [x] Free-text description ("I feel somehow...")
- [x] Mood history tracking

### E. Lifestyle Tracking
- [x] Sleep (hours + quality)
- [x] Food & drink (tags + water intake)
- [x] Exercise (intensity + duration)
- [x] Stress (level + source)
- [x] Work/day overview

### F. Information Library
- [x] Pre-populated articles about menopause
- [x] Category filtering (symptoms, stages, lifestyle, partner)
- [x] Search functionality
- [x] Bookmark system
- [x] Article detail view with formatted content

### G. Partner Support
- [x] Invite code generation
- [x] Privacy controls (what to share)
- [x] Partner dashboard showing:
  - Daily status (easier/challenging day)
  - Mood trend
  - Suggested supportive actions
  - Quick emoji reactions
- [x] Link revocation

### H. Community Features
- [x] Topic-based groups
- [x] Join/leave groups
- [x] Post creation
- [x] Reactions and comments
- [x] Events and workshops listing

### I. Specialists Directory
- [x] Searchable specialist list
- [x] Filter by specialty and online availability
- [x] Specialist profiles with:
  - Credentials and bio
  - Specialties and services
  - Contact options (website, phone, email)
  - External booking links

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Onboarding & Profile
- `POST /api/onboarding/complete` - Complete onboarding
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile

### Symptoms
- `GET /api/symptoms` - List all symptoms (with filters)
- `POST /api/symptoms` - Create custom symptom
- `POST /api/symptom-logs` - Log symptom entry
- `GET /api/symptom-logs` - Get symptom history
- `GET /api/symptom-logs/today` - Get today's symptoms

### Mood
- `POST /api/mood-logs` - Log mood entry
- `GET /api/mood-logs` - Get mood history
- `GET /api/mood-logs/today` - Get today's mood

### Lifestyle
- `POST /api/lifestyle-logs` - Log lifestyle entry
- `GET /api/lifestyle-logs` - Get lifestyle history
- `GET /api/lifestyle-logs/today` - Get today's lifestyle

### Reminders
- `POST /api/reminders` - Create reminder
- `GET /api/reminders` - List reminders
- `PUT /api/reminders/{id}` - Update reminder
- `DELETE /api/reminders/{id}` - Delete reminder

### Library
- `GET /api/articles` - List articles (with filters)
- `GET /api/articles/{id}` - Get article detail
- `POST /api/articles/bookmark/{id}` - Bookmark article
- `DELETE /api/articles/bookmark/{id}` - Remove bookmark
- `GET /api/articles/bookmarks/list` - List bookmarked articles

### Partner
- `POST /api/partner/invite` - Create partner invite
- `POST /api/partner/accept/{code}` - Accept invite
- `GET /api/partner/link` - Get partner link status
- `DELETE /api/partner/link` - Revoke partner access
- `GET /api/partner/dashboard` - Partner dashboard
- `PUT /api/partner/settings` - Update sharing settings

### Community
- `GET /api/groups` - List groups
- `POST /api/groups/{id}/join` - Join group
- `DELETE /api/groups/{id}/leave` - Leave group
- `GET /api/groups/joined` - List joined groups
- `GET /api/groups/{id}/posts` - Get group posts
- `POST /api/posts` - Create post
- `POST /api/posts/{id}/react/{reaction}` - React to post
- `GET /api/posts/{id}/comments` - Get comments
- `POST /api/posts/{id}/comments` - Add comment

### Events
- `GET /api/events` - List events
- `GET /api/events/{id}` - Get event detail

### Specialists
- `GET /api/specialists` - List specialists (with filters)
- `GET /api/specialists/{id}` - Get specialist detail

### Dashboard & Insights
- `GET /api/dashboard` - Get dashboard data
- `GET /api/insights` - Get personalized insights

### Seed Data
- `POST /api/seed` - Seed initial data (symptoms, articles, groups, events, specialists)

## Database Collections
- `users` - User accounts
- `profiles` - User profiles with onboarding data
- `symptoms` - Symptom library
- `symptom_logs` - User symptom entries
- `mood_logs` - User mood entries
- `lifestyle_logs` - User lifestyle entries
- `reminders` - User reminders
- `articles` - Educational content
- `bookmarks` - User article bookmarks
- `partner_invites` - Partner invitation codes
- `partner_links` - Active partner connections
- `groups` - Community groups
- `group_members` - Group memberships
- `posts` - Community posts
- `comments` - Post comments
- `events` - Workshops and events
- `specialists` - Healthcare provider directory
- `push_tokens` - Push notification tokens

## Future Enhancements (Phase 2+)
- [ ] AI-powered personalized recommendations
- [ ] Advanced analytics and pattern detection
- [ ] In-app specialist booking
- [ ] Push notifications for reminders and partner alerts
- [ ] Google social login
- [ ] Admin content management interface
- [ ] HRT tracking features
- [ ] Medication reminders with scheduling
- [ ] Export health data reports
- [ ] Multi-language support

## Notes
- All sensitive health data is stored securely
- Partner access respects strict privacy controls
- Medical disclaimer shown during onboarding
- App does not provide medical advice, only tracking and educational content
