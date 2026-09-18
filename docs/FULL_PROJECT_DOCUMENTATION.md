# 📖 COMPLETE PROJECT MASTER DOCUMENTATION & FEATURE MANUAL
## Kondapi TDP Connect & Multi-Tenant Election Management SaaS Platform

---

# TABLE OF CONTENTS
1. [Executive Overview & Platform Architecture](#1-executive-overview--platform-architecture)
2. [Authentication, Security & Session Management](#2-authentication-security--session-management)
   - 2.1 Role Selection Screen & Security Modal
   - 2.2 OTP Login System & Test Identity Verification
   - 2.3 Master Passcode Protection & Workspace Lock Barrier
3. [Super Admin SaaS Management Studio](#3-super-admin-saas-management-studio)
   - 3.1 Global Overview & Tenant Metrics
   - 3.2 Multi-Organisation Provisioning
   - 3.3 Dynamic Party Profiles & Branding Engine
   - 3.4 AI Token Consumption & Latency Monitor
   - 3.5 Storage & Audit Security Trails
   - 3.6 System Health Diagnostics
4. [Dynamic CMS Studio (Multi-Tenant Customizer)](#4-dynamic-cms-studio-multi-tenant-customizer)
   - 4.1 Data Assignment & Bulk Excel Ingestion Engine
   - 4.2 Hierarchical In-Charge Assignment Tree
   - 4.3 1-Click Party Theme Presets (TDP, YSRCP, JSP, BJP, INC)
   - 4.4 Granular Feature Toggles & Hierarchy Terminology Localization
5. [Constituency In-Charge Command Center](#5-constituency-in-charge-command-center)
   - 5.1 Executive KPI Dashboard & Real-Time Pulse
   - 5.2 Mandal Directory & Interactive Drill-Down
   - 5.3 Village Rollup Directory
   - 5.4 Strategic Task Management & Proof-of-Execution
   - 5.5 Caste Demographics & Preference Crosstab Matrix
   - 5.6 Hierarchical Cadre Network & Direct Communication Hub
   - 5.7 Fake, Duplicate & Doubtful Voter Verification Hub
   - 5.8 AI Strategic Intelligence Center (12 Sub-Engines)
   - 5.9 Training Academy Analytics & Certification
   - 5.10 Live Polling Day Turnout & Heatmaps
   - 5.11 Migrated & Outstation Voter Logistics
6. [Mandal In-Charge Command Dashboard](#6-mandal-in-charge-command-dashboard)
   - 6.1 Mandal KPIs & Village Status Matrix
   - 6.2 Village Directory & Booth President Contacts
   - 6.3 Mandal Voter Master Explorer & Filters
   - 6.4 Mandal Live Polling Day Tracker
   - 6.5 Mandal Fake Vote Eradication Desk
   - 6.6 Mandal Task Dispatch & Execution
   - 6.7 Mandal Caste Intelligence Matrix
   - 6.8 Mandal Cadre Communication Hub
   - 6.9 Training Video Hub & Progress
7. [Village In-Charge Command Dashboard](#7-village-in-charge-command-dashboard)
   - 7.1 Village Overview & Booth Comparative Analysis
   - 7.2 Village Voter Records & Inline Surveying
   - 7.3 Village Live Turnout Queue Monitor
   - 7.4 Ground Grievance & Issue Reporting
   - 7.5 Village Cadre Activation & Task Dispatch
8. [Booth In-Charge & Polling Agent Dashboard](#8-booth-in-charge--polling-agent-dashboard)
   - 8.1 Booth Summary & Demographics
   - 8.2 Voter Directory, Advanced Search & Digital Slips
   - 8.3 Polling Day Live EVM Digital Register
   - 8.4 Form-7 Deletion & Objection Desk
   - 8.5 Micro Task Execution & Verification
9. [100-Voter In-Charge (Karyakartha) Mobile Command](#9-100-voter-in-charge-karyakartha-mobile-command)
   - 9.1 Mobile-First 100-Voter Card Directory
   - 9.2 Door-to-Door Canvassing Modal & Scheme Feedback
   - 9.3 1-Tap Polling Day "Mark as Voted" Counter
   - 9.4 Daily Karyakartha Tasks & Leaflet Proof Submission
   - 9.5 Video Training Academy & Field Guidance
10. [AI Strategic Intelligence Center (12 Gemini-Powered Engines)](#10-ai-strategic-intelligence-center-12-gemini-powered-engines)
11. [Real-Time WebSocket Sync, Security & Audit Architecture](#11-real-time-websocket-sync-security--audit-architecture)
12. [End-to-End Operational Walkthroughs & Pitch Guide](#12-end-to-end-operational-walkthroughs--pitch-guide)

---

# 1. EXECUTIVE OVERVIEW & PLATFORM ARCHITECTURE

**Kondapi TDP Connect** is a multi-tier political election intelligence, cadre mobilization, voter relationship management (VRM), and real-time polling command platform. 

### Key Architectural Strengths:
1. **8-Level Hierarchical Role-Based Access Control (RBAC)**: Supports roles from Super Admin and State In-charge down to 100-Voter booth workers.
2. **Dynamic Multi-Tenant SaaS & CMS**: Switch themes, logos, color palettes, slogans, and hierarchy labels for any political party (TDP, YSRCP, JSP, BJP, INC) in seconds.
3. **Automated Excel Bulk Ingestion Engine**: Automatically parses government electoral roll spreadsheets, creating mandals, villages, polling booths, and voter groups dynamically.
4. **AI Strategic Intelligence**: Powered by Google Gemini models to generate daily campaign briefs, rally speeches, booth-level turnaround strategies, and natural language query responses.
5. **Real-Time Polling Day EVM Tracking**: WebSocket-powered live turnout calculation with instant alerts for non-voted party supporters before polling closes.

---

# 2. AUTHENTICATION, SECURITY & SESSION MANAGEMENT

### 2.1 Role Selection Screen (`RoleSelection.tsx`)
When any user opens the application, they land on the **Central Command Portal**:
* **Hero Banner**: Displays the dynamic election banner, party symbol, candidate photos, and official slogan.
* **Role Grid**: Distinct, styled cards for each command tier:
  1. *Super Admin (SaaS Studio)*
  2. *State In-Charge*
  3. *Zone / Parliament In-Charge*
  4. *Constituency In-Charge*
  5. *Mandal In-Charge*
  6. *Village In-Charge*
  7. *Booth President / Polling Agent*
  8. *100-Voter In-Charge (Karyakartha)*
* **Top Security Controls**:
  - **Lock Button (`Lock`)**: Instantly locks the screen with the Master Passcode Barrier.
  - **Passcode Settings (`Key`)**: Allows changing the Master Admin Passcode.
  - **Live Hierarchy Pulse**: Real-time ticker showing active units across all levels.

### 2.2 OTP Login Modal (`OtpLoginModal.tsx`)
Clicking any role opens the identity authentication modal:
* **Mobile Number Input**: 10-digit Indian phone number validation.
* **One-Click Quick Test Accounts**: For testing and demonstration, clicking preset names auto-fills verified phone numbers.
* **OTP Input Screen**: 4-digit or 6-digit verification code with resend timer.
* **JWT Token Issuance**: On successful OTP verification, the backend issues an HTTP-only/Bearer JWT token storing the user's role, hierarchy assignment, and unit scope.

### 2.3 Master Passcode Protection & Workspace Lock (`PasscodeModal.tsx`)
* **Emergency Lockdown**: Chief Operators can lock the screen during sensitive strategy meetings.
* **Master Passcode Modal**: Supports two modes:
  - `unlock`: Prompts for the 4-digit master passcode to restore dashboard access.
  - `change`: Prompts for old passcode, new passcode, and confirmation to update security keys.

---

# 3. SUPER ADMIN SAAS MANAGEMENT STUDIO (`SuperAdminDashboard.tsx`)

*Designed for platform owners and multi-constituency campaign agencies.*

### 3.1 Overview Tab
* **Global KPI Ribbon**: Total registered voters across all constituencies, total cadre leaders onboarded, active tenants, AI token usage, and system uptime.
* **Health & Latency Metric**: Real-time ping to PostgreSQL/Prisma backend and Redis cache.

### 3.2 Organisations Tab
* **Tenant Provisioning**: Add and manage distinct election organizations (e.g., "Kondapi Assembly", "Ongole Parliament", "Kavali Assembly").
* **Constituency Scope Assignment**: Bind database instances, quotas, and admin emails to organizations.

### 3.3 Parties & Branding Engine
* Customize party symbols, candidate avatars, primary/secondary colors, and regional language slogans.

### 3.4 AI Token Consumption & Latency Monitor
* Real-time monitoring of Google Gemini Pro/Flash token counts, query latency (avg ~420ms), and API cost estimations.

### 3.5 Storage & Audit Trails
* View timestamped records of administrative actions: voter roll uploads, user role escalations, data export requests, and passcode updates.

---

# 4. DYNAMIC CMS STUDIO (`CmsStudio.tsx`)

*Accessible from the top header or Super Admin dashboard to customize the platform live.*

### 4.1 Data Assignment & Bulk Excel Ingestion Engine
* **Excel / CSV Drag & Drop**: Accepts official voter roll spreadsheets (`.xlsx`, `.xls`, `.csv`).
* **Intelligent Auto-Mapping**: Maps columns for EPIC Number, Name, Father/Spouse Name, Age, Gender, House No, Section, Mandal, Village, Booth No.
* **Dynamic Hierarchy Generation**: Automatically creates missing Mandals, Villages, Booths, and assigns voters into 100-voter groups without manual setup.
* **Execution Summary**: Displays new voters added, updated records, duplicates handled, and nodes created.

### 4.2 In-Charge Assignment Tree
* Interactive organizational tree (Constituency ➔ Mandal ➔ Village ➔ Booth ➔ 100-Voter Group).
* Assign leadership names, contact numbers, and login credentials to any node.

### 4.3 1-Click Party Theme Presets
* **Pre-configured Styles**:
  - **TDP**: Sunburst Yellow (`#eab308`), Red accents, Telugu Desam branding.
  - **YSRCP**: Royal Blue (`#2563eb`), Green accents.
  - **JSP**: Crimson Red (`#dc2626`), White accents.
  - **BJP**: Saffron Orange (`#f97316`), Green accents.
  - **INC**: Sky Blue (`#38bdf8`), Tricolor accents.
* **Instant Dynamic Restyling**: Updates headers, sidebars, badges, button gradients, and voter slips across the entire application instantly.

### 4.4 Feature Toggles & Terminology Localization
* Enable/disable sub-modules (AI Strategic Center, Live Turnout, Fake Vote Verification, Caste Matrix).
* Customize terminology (e.g., rename "Mandal" to "Block/Tehsil", "Village" to "Panchayat/Ward").

---

# 5. CONSTITUENCY IN-CHARGE COMMAND CENTER (`ConstituencyInchargeDashboard.tsx`)

*The central operational nerve center for candidates and campaign managers.*

### 5.1 Executive KPI Dashboard (`dashboard`)
* **Top Metric Cards**:
  - **Total Registered Voters**: E.g., `2,28,450`.
  - **Projected TDP Core Votes**: Real-time aggregation of supporters.
  - **Opposition Strength**: Projected rival votes.
  - **Swing / Neutral Margin**: Deciding voter base.
  - **Projected Winning Margin**: Calculated dynamically based on field survey updates.
* **Mandal Performance Cards**: Color-coded status (`WINNING`, `CLOSE CONTEST`, `TRAILING`) for each Mandal.
* **Live Activity Ticker**: Feed of real-time field survey updates, newly completed tasks, and verified doubtful voters.

### 5.2 Mandal Directory & Interactive Drill-Down (`mandal_list`)
* Comprehensive table of all Mandals showing: Total Voters, Villages, Booths, TDP vs Rival counts, Net Lead.
* **Instant Drill-Down Action**: Clicking "Open Mandal Command" switches the dashboard context into that Mandal's full management interface.

### 5.3 Village Rollup Directory (`village_list`)
* Searchable and filterable master list of all 114+ villages across the constituency.
* Filter by Mandal or by contest status (`Winning`, `Trailing`, `Battleground`).

### 5.4 Strategic Task Management (`tasks`)
* **Create Task Directive Modal**:
  - Task Title, Instructions, Priority (`Urgent`, `High`, `Medium`).
  - Target Scope: Entire Constituency, Specific Mandal, Specific Village, or Specific Booth.
  - Due Date & Task Category (Pamphlet Distribution, Voter Verification, Rally Mobilization).
* **Task Tracker**: Visual status columns (`Pending`, `In Progress`, `Completed`, `Overdue`) with attached field photo proofs.

### 5.5 Caste Demographics & Preference Matrix (`caste_analytics`)
* Community-wise voter distribution (Kamma, Reddy, Kapu, BC Communities, SC/ST, Minorities).
* **Interactive Crosstab Correlation**: Shows percentage of support for TDP, YSRCP, JSP, and Neutral voters within each specific caste, enabling targeted outreach.

### 5.6 Hierarchical Cadre Network (`cadre_network`)
* Complete phonebook and hierarchical tree of all party leaders:
  - Mandal In-Charges, Village In-Charges, Booth Presidents, and 100-Voter Karyakarthas.
* **Direct Actions**: 1-Tap Phone Call (`tel:`), 1-Tap WhatsApp outreach, and cadre performance grading.

### 5.7 Fake, Duplicate & Doubtful Voter Verification (`fake_votes`)
* Centralized registry of suspicious voters flagged by field workers or AI algorithms:
  - Duplicate EPIC numbers, deceased voters still on rolls, shifted/migrated individuals.
* **Verification Lifecycle**: `Flagged` ➔ `Under Physical Verification` ➔ `Verified Issue` ➔ `Form-7 Objection Submitted` ➔ `Resolved`.

### 5.8 AI Strategic Intelligence Center (`strategic_intelligence`)
* Embedded full access to the 12-engine Gemini AI strategic decision system (detailed in Section 10).

### 5.9 Training Academy Analytics (`training_analytics`)
* Cadre readiness score across all mandals.
* Tracks completion percentages of mandatory polling agent training video modules.

### 5.10 Live Polling Day Turnout Tracker (`live_voter_tracking`)
* Real-time polling day dashboard connected via WebSockets.
* Hourly turnout velocity graph, booth-by-booth turnout heatmap, and emergency mobilization alerts.

### 5.11 Migrated & Outstation Voter Logistics (`migrated_voters`)
* Tracks non-resident voters living in Hyderabad, Bengaluru, Chennai, or overseas.
* Records current location, contact number, travel arrangement status, and return-to-vote confirmation.

---

# 6. MANDAL IN-CHARGE COMMAND DASHBOARD (`MandalInchargeDashboard.tsx`)

*Operational command for Mandal Presidents and campaign managers.*

### 6.1 Mandal Overview & Status Matrix (`dashboard`)
* Aggregated metrics for all villages and polling booths within the Mandal.
* Projected margin calculation with win/loss status tracking.

### 6.2 Village Directory & Booth In-Charge List (`village_list` & `booth_incharge_list`)
* Direct management of all village leaders and booth presidents within the Mandal.
* Direct phone call and messaging buttons for rapid mobilization.

### 6.3 Mandal Voter Master Explorer (`voters`)
* High-performance searchable voter table for the entire Mandal.
* Filter by Village, Booth Number, Caste, Profession, Age Bracket, and Political Tilt.
* Edit voter record details with automatic backend synchronization.

### 6.4 Mandal Live Polling Day Tracker (`live_track`)
* Real-time EVM vote counter for all booths in the Mandal on election day.

### 6.5 Mandal Fake Vote Desk (`fake_votes`)
* Review and assign physical verification tasks for flagged duplicate/deceased voters in the Mandal.

### 6.6 Mandal Task Hub (`tasks`)
* Receive tasks from Constituency Command and create sub-tasks for Village and Booth in-charges.

### 6.7 Mandal Caste Intelligence Matrix (`caste_analytics`)
* Mandal-specific caste breakdown and political preference distribution.

### 6.8 Mandal Cadre Communication Hub (`cadre_network`)
* Complete contact directory of all grassroots workers in the Mandal.

### 6.9 Training Hub (`training` & `training_analytics`)
* Access to training videos and tracking of booth agent certifications within the Mandal.

---

# 7. VILLAGE IN-CHARGE COMMAND DASHBOARD (`VillageInchargeDashboard.tsx`)

*Grassroots leadership hub for Village / Panchayat presidents.*

### 7.1 Village Dashboard (`dashboard`)
* Village-level summary: Total voters, favorable vote count, neutral margin, and booth comparisons.

### 7.2 Village Voter Records & Inline Survey (`voters`)
* Full voter list for all households in the village.
* Quick-edit drawer to update voter preference, mobile number, caste, profession, and welfare scheme notes.

### 7.3 Village Live Turnout Queue Monitor (`live_track`)
* Polling day queue tracking across all booths located in the village.

### 7.4 Ground Grievance & Issue Reporting (`reports`)
* Submit ground reports directly to Mandal and Constituency command:
  - Categories: Infrastructure, drinking water, pensions, local disputes, opposition activities.
  - Priority flags and resolution status tracking.

### 7.5 Village Cadre & Task Hub (`cadre_network` & `tasks`)
* Direct coordination with Booth Presidents and 100-Voter In-Charges in the village.

---

# 8. BOOTH IN-CHARGE & POLLING AGENT DASHBOARD (`BoothInchargeDashboard.tsx`)

*Field command for Booth Presidents and Polling Station Agents (~1,000 Voters).*

### 8.1 Booth Summary (`dashboard`)
* Booth demographics: Total voters, Male/Female ratio, verified voters, favorable vs neutral counts.

### 8.2 Voter Directory & Digital Voter Slips (`voters`)
* Comprehensive booth electoral roll with serial number search.
* **Digital Voter Slip Generator**:
  - Generates official-format voter slips containing: Serial Number, Part Number, Voter Name, Guardian Name, Polling Station location, and EPIC number.
  - Printable and shareable via WhatsApp.

### 8.3 Polling Day Live EVM Digital Register (`live-track`)
* **Real-time Digital Polling Register**:
  - Polling agents click **"Mark Voted"** as voters cast ballots.
  - Instant turnout percentage calculations.
  - **Critical Filter**: *"Show Pending Favorable Voters"* — allows mobilization teams to bring remaining supporters to the booth before 5:00 PM.

### 8.4 Form-7 Deletion & Objection Desk (`fake-votes`)
* Flag impersonators, bogus entries, or deceased names directly from the polling room table.

### 8.5 Micro Task Execution (`tasks`) & Training Videos (`videos`)
* Check off booth-level assignments and watch polling agent guideline videos (Form 17C, EVM Mock Poll rules).

---

# 9. 100-VOTER IN-CHARGE (KARYAKARTHA) MOBILE COMMAND (`Voter100Dashboard.tsx`)

*Mobile-first interface for grassroots field workers managing ~100 specific voter households.*

### 9.1 Mobile Voter Card Directory (`dashboard` & `voters`)
* Clean, card-based list of the 100 assigned voters with house numbers and family groupings.
* Quick search by name, house number, or serial number.

### 9.2 Door-to-Door Canvassing Modal
* Clicking any voter card opens the interactive survey modal:
  - **Political Preference**: TDP, YSRCP, JSP, BJP, INC, Neutral, Undecided.
  - **Voter Status**: Active, Migrated, Deceased, Doubtful, Fake.
  - **Demographics**: Caste, Sub-Caste, Profession.
  - **Welfare Scheme Notes**: Record interest in specific schemes (e.g., *Super Six*).

### 9.3 1-Tap Polling Day "Mark as Voted" Counter (`live-track`)
* On election day, Karyakarthas stand near polling booths and tap **"Voted ✅"** as their 100 assigned voters enter.
* Instant progress ring showing completion (e.g., `82 / 100 Voted (82%)`).

### 9.4 Daily Karyakartha Tasks & Proof Submission (`tasks`)
* View daily tasks assigned by Booth or Village in-charges.
* Mark tasks as complete and attach photo proof of leaflet distribution or door visits.

### 9.5 Video Training Academy (`videos`)
* 2-minute video guides on canvassing etiquette, voter convincing techniques, and election rules.

---

# 10. AI STRATEGIC INTELLIGENCE CENTER (`AIStrategicIntelligenceCenter.tsx`)

*Deep Gemini-powered AI strategist containing 12 specialized sub-engines:*

```
┌─────────────────────────────────────────────────────────────┐
│                 AI Strategic Intelligence Hub                │
├──────────────────────┬──────────────────────┬───────────────┤
│ 1. Daily Intel Brief │ 2. Mandal Intel      │ 3. Village AI │
├──────────────────────┼──────────────────────┼───────────────┤
│ 4. Booth Operations  │ 5. Ground Issues AI  │ 6. News Pulse │
├──────────────────────┼──────────────────────┼───────────────┤
│ 7. Social Media AI   │ 8. Govt Development  │ 9. Cadre Perf │
├──────────────────────┼──────────────────────┼───────────────┤
│ 10. AI Red Alerts    │ 11. Custom Reports   │ 12. Ask AI    │
└──────────────────────┴──────────────────────┴───────────────┘
```

1. **Daily Strategic Intel Brief (`daily_brief`)**: Generates an automated morning strategy brief highlighting swing shifts and top 3 priorities for the day.
2. **Mandal Intelligence (`mandal_intel`)**: In-depth strengths, weaknesses, opportunities, and threats (SWOT) analysis for each Mandal.
3. **Village Micro-Targeting (`village_intel`)**: Recommends targeted interventions for battleground villages.
4. **Booth Operations AI (`booth_operations`)**: Identifies low-turnout booths and suggests specific corrective actions.
5. **Ground Issues & Grievance AI (`ground_issues`)**: Categorizes voter complaints and drafts resolution plans.
6. **Local News Pulse (`news`)**: Synthesizes regional news reports for campaign impact.
7. **Social Media & Sentiment Trends (`social_trends`)**: Tracks digital sentiment and trending political topics.
8. **Government & Development Matrix (`govt_dev`)**: Compares current developmental works against community expectations.
9. **Cadre Performance & Health (`cadre_health`)**: Analyzes survey velocity and task completion rates across field teams.
10. **AI Red Alerts (`ai_alerts`)**: Instant warning radar for sudden voter swings or unverified voter clusters.
11. **Report & Speech Generator (`reports`)**: Generates tailored public rally speeches and press releases based on local mandal issues and demographics.
12. **Interactive "Ask AI" Strategy Chatbot (`ask_ai`)**: Natural language chat interface allowing leaders to ask complex campaign questions and receive data-driven answers.

---

# 11. REAL-TIME WEBSOCKET SYNC, SECURITY & AUDIT ARCHITECTURE

* **Real-Time WebSockets (`lib/realtime.ts`)**:
  - Live broadcast of voting events (`RealtimeVoteEvent`), task updates (`RealtimeTaskEvent`), and field ground reports (`RealtimeReportEvent`).
  - Automatic fallback to HTTP polling if WebSocket connection is unavailable.
* **Security & Encryption**:
  - JWT authentication tokens with role and unit scope validation on every API endpoint.
  - Granular data isolation: A Mandal In-Charge cannot view or modify data from other Mandals.
* **Audit Logging Engine (`backend/src/modules/audit`)**:
  - Tracks every write, update, delete, role escalation, and data export with timestamps, user IDs, and IP addresses.

---

# 12. END-TO-END OPERATIONAL WALKTHROUGHS & PITCH GUIDE

### How to Pitch and Demonstrate this Platform:

1. **Step 1: Role Selection & Security Lock**
   - Demonstrate the role selection screen and show the emergency **Master Passcode Lock** (`2026`).
2. **Step 2: Dynamic CMS & White-Labeling**
   - Open CMS Studio, switch between TDP, YSRCP, and JSP presets to show instant color and branding transformations.
   - Show the Excel Bulk Upload engine and how it builds the entire constituency hierarchy automatically.
3. **Step 3: Constituency Command Center**
   - Present the high-level KPI cards, lead forecasts, and Mandal rollups.
   - Open the **Caste Demographics Matrix** to show political correlation.
4. **Step 4: AI Strategic Intelligence**
   - Generate a Daily Strategic Brief and demonstrate the **Ask AI Chatbot** with a campaign strategy query.
5. **Step 5: Grassroots Drill-Down (Mandal ➔ Village ➔ Booth ➔ 100-Voter)**
   - Drill down from Mandal to Village, then open the **Booth In-Charge Dashboard** to generate a digital voter slip.
   - Switch to the **100-Voter Mobile View** to demonstrate door-to-door surveying and 1-tap polling day checkoffs.
6. **Step 6: Live Polling Day EVM Turnout**
   - Show how live votes cast at the booth level update the entire constituency command center in real time.
