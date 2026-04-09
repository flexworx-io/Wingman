# Wingman.vip — Full Build TODO

## Phase 2: Foundation
- [x] DB schema — all tables (users, wingman_profiles, personality_traits, connections, activity_feed, virtual_spaces, conversations, trust_levels, travel_events, conference_events, notifications, admin_logs)
- [x] Global dark theme CSS with aurora gradients, OKLCH color tokens
- [x] App routing structure (all routes registered in App.tsx)
- [x] tRPC router scaffold (all routers stubbed)

## Phase 3: Backend (fully wired)
- [x] Auth router (me, logout, register, updateProfile)
- [x] SoulForge router (generateTraits, saveTraits, generateIdentity, saveWingman)
- [x] Wingman router (getWingman, updateWingman, getActivityFeed, getConnections, getCompatibility)
- [x] Discovery router (getSpaces, getMatches, initiateIntro, getDreamBoard)
- [x] Trust router (getTrustLadder, updateTrustLevel, getTrustScore)
- [x] Travel router (detectTravel, getFriendsNearby, getTravelHistory)
- [x] Events router (registerForEvent, getEventBriefing, getSchedule)
- [x] Notifications router (getNotifications, markRead, updatePreferences)
- [x] Admin router (getStats, getUsers, getWingmanActivity, getSystemHealth)
- [x] Murph.AI HSE API client (createHSE, getHSE, updateHSE, discover, introduce, getConversation)
- [x] WebSocket server for real-time activity streaming
- [x] AI Soul Forge trait generation via LLM
- [x] AI identity generation (name, tagline, about, catchphrase)
- [x] db.ts helpers for all tables

## Phase 4: Landing Page
- [x] Hero section with floating orb animation and aurora gradient
- [x] Value proposition section
- [x] Feature showcase (Soul Forge, Discovery, Trust Ladder, Wingman TV)
- [x] How It Works section (3-step flow)
- [x] Trust badge / OmniSeal-style verification display
- [x] Testimonials carousel
- [x] CTA buttons wired to onboarding

## Phase 5: Soul Forge Onboarding (7 steps)
- [x] Step 1: Account creation wired to auth
- [x] Step 2: 34-trait Soul Forge quiz with style selector — wired to LLM generation
- [x] Step 3: Interest selection (categories + tags) — wired to DB
- [x] Step 4: Avatar designer (style, aesthetic, color)
- [x] Step 5: Wingman naming + tagline + catchphrase — wired to LLM
- [x] Step 6: Goal setting (social modes: friendship, dating, business, family)
- [x] Step 7: Trust level configuration (Public → Inner Circle)
- [x] Activation ceremony (particle burst, dramatic reveal) — saves full wingman to DB
- [x] Progress stepper UI component
- [x] Onboarding state persisted across steps

## Phase 6: Wingman Dashboard
- [x] Real-time activity ticker (WebSocket connected)
- [x] Compatibility meters (animated radial progress)
- [x] Adventure stories feed (AI-generated summaries)
- [x] New connections log with trust level badges
- [x] Wingman TV player (video/story player UI)
- [x] Wingman profile card (name, tagline, avatar, signature strength)
- [x] Quick stats (connections made, introductions, compatibility avg)
- [x] All data wired to tRPC queries

## Phase 7: Discovery Engine
- [x] Virtual spaces grid (browsable by interest/location/mode)
- [x] Space detail view with active Wingmen
- [x] Wingman-to-Wingman introduction flow (modal + progress)
- [x] Compatibility score display (animated meter)
- [x] Dream Board gallery (potential connections grid)
- [x] Dream Board card (avatar, compatibility %, traits overlap)
- [x] Filter bar (social mode, location, interests)
- [x] All wired to discovery tRPC router

## Phase 8: Trust, Social Lounge, Travel, Conference
- [x] Trust Ladder visualization (5 levels: Public, Acquaintance, Connection, Trusted, Inner Circle)
- [x] Trust level upgrade flow (request + confirm)
- [x] Verification badge display (Bronze, Silver, Gold, Platinum)
- [x] Social Lounge page (active virtual rooms, join/leave)
- [x] Travel Intelligence page (detect location, show friends nearby)
- [x] Travel notification trigger
- [x] Conference Matching page (register event, get briefing, schedule meetings)
- [x] All wired to respective tRPC routers

## Phase 9: Admin Dashboard
- [x] Platform stats overview (users, wingmen, connections, introductions)
- [x] User management table (search, filter, view, suspend)
- [x] Wingman activity monitor (live feed)
- [x] System health indicators
- [x] Analytics charts (registrations, activity, compatibility scores)
- [x] All wired to admin tRPC router (admin role protected)

## Phase 10: React Native Companion App
- [x] Expo project scaffold with TypeScript
- [x] Shared API client (tRPC HTTP + WebSocket)
- [x] Auth screens (Login, Register)
- [x] Soul Forge onboarding flow (native)
- [x] Dashboard screen (activity ticker, connections)
- [x] Discovery screen (spaces, Dream Board)
- [x] Trust Ladder screen
- [x] Notifications screen
- [x] Profile / Wingman settings screen
- [x] Navigation (bottom tabs + stack)
- [x] Dark theme applied throughout
- [x] Push notification setup (Expo Notifications)

## Phase 11: Quality & Delivery
- [x] TypeScript check (pnpm tsc --noEmit) — 0 errors
- [x] Vitest tests for all tRPC routers — 31/31 passing
- [x] Final UI polish pass
- [x] Checkpoint saved
- [x] GitHub push to flexworx-io/Wingman

## Bug Fixes
- [x] Fix getMyWingman returning undefined for new users (must return null)
- [x] Fix all related procedures that may return undefined instead of null
- [x] Handle null wingman state gracefully in Dashboard (redirect to onboarding)
- [x] Fix all other dashboard queries that depend on wingman existing
- [x] Add null wingman guards to Discovery, DreamBoard, Events, SocialLounge pages

## Next Steps Execution
- [x] Auto-seed virtual spaces, conferences, personality traits on server startup
- [x] Add Murph.AI secrets and complete integration layer
- [x] Audit and fix Soul Forge 7-step onboarding flow end-to-end
- [x] Add demo wingman profiles for discovery engine
- [x] Wire seed endpoint accessible from Admin Dashboard
- [x] Fix Soul Forge: AI avatar generation (step 4), trust level selector (step 6), categorized interests (step 3)
- [x] Add immersive multi-phase activation ceremony animation
- [x] Fix all db.ts functions to return null instead of undefined (tRPC compliance)
- [x] 35/35 vitest tests passing after all fixes

## Gap Fixes
- [x] Add Murph.AI health-check tRPC procedure and Admin Dashboard status indicator
- [x] Add admin seed trigger endpoint + Admin Dashboard "Seed Data" button with feedback UI

## MAESTRO Personality Synthesis Engine (Master Spec Implementation)
- [ ] DB: Add 8 new tables (interviews, trait_evidence, user_trait_profiles, companion_needs_profiles, prediction_events, contradiction_events, social_memory_entries, wingman_interactions)
- [ ] DB: Update personality_traits to correct 34-trait taxonomy
- [ ] Server: personality-engine.ts — 6-layer synthesis engine with exact math formulas
- [ ] Server: New tRPC endpoints (interview start/answer/predict/confirm/resolve/synthesize)
- [ ] Server: Murph.AI Calibration Reference integration into Wingman identity generation
- [ ] Frontend: Rebuild Soul Forge — 4-layer adaptive interview with Prediction Magic Moments
- [ ] Frontend: Personality DNA Helix animation
- [ ] Frontend: Compatibility Radar chart (recharts radar)
- [ ] Frontend: Forge Reveal Cinematic sequence
- [ ] Frontend: Wingman Origin Card (shareable)
- [ ] Frontend: Why We Matched card
- [ ] Frontend: Friend Sync Challenge
- [ ] Frontend: Future You Mode
- [ ] Frontend: Confidence Meter delight animation
- [ ] Tests: Vitest for synthesis engine math

## Full Auth System + Multi-Tenant + Super-Admin
- [x] DB: organizations table (id, slug, name, plan, config, ownerId, maxUsers, createdAt)
- [x] DB: email_verifications table (id, userId, token, expiresAt, usedAt)
- [x] DB: oauth_accounts table (id, userId, provider, providerAccountId, accessToken, refreshToken)
- [x] DB: Add orgId FK to users, wingman_profiles, connections, virtual_spaces, conference_events, activity_feed, wingman_stories, admin_logs
- [x] DB: Add passwordHash, emailVerified, authProvider fields to users table
- [x] Backend: Install bcryptjs, nodemailer, @google-auth-library, @azure/msal-node
- [x] Backend: Email/password registration endpoint with bcrypt hashing
- [x] Backend: Email/password login endpoint with JWT session
- [x] Backend: Email verification token generation + validation endpoint
- [x] Backend: Google OAuth callback handler (Google Identity Services)
- [x] Backend: Microsoft OAuth callback handler (MSAL)
- [x] Backend: Unified auth router with all providers
- [x] Backend: Tenant-scoped auth middleware (inject orgId into tRPC context)
- [x] Backend: Tenant provisioning API (create org, assign owner, set plan, configure)
- [x] Backend: Per-tenant config storage and retrieval
- [x] Backend: Super-admin tRPC procedures (manage tenants, users, subscriptions, audit logs)
- [x] Backend: updateUserRole, suspendUser, changeSubscription, getAuditLogs procedures
- [x] Frontend: /auth page — unified provider selection (Email, Google, Microsoft)
- [x] Frontend: Email registration form with real-time validation
- [x] Frontend: Email verification page (/auth/verify)
- [x] Frontend: Google OAuth redirect handler
- [x] Frontend: Microsoft OAuth redirect handler
- [x] Frontend: /super-admin route (super_admin role only)
- [x] Frontend: Tenant management table (create, edit, suspend, delete orgs)
- [x] Frontend: User role management panel (promote, demote, suspend)
- [x] Frontend: Subscription tier management panel
- [x] Frontend: Audit log viewer with date/action/user filters
- [x] Frontend: Per-tenant Wingman monitoring panel
