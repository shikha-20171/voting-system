# PostgreSQL Database & Prisma ORM Architecture Documentation
## Project: `kondapi-tdp-connect`

---

## 1. Executive Summary

This document describes the production-grade PostgreSQL relational database schema for the **Kondapi TDP Connect** political campaign and field operations platform. The database is modeled using **Prisma ORM** with **UUID primary keys**, strictly normalized relationships, hierarchical role-based access control (RBAC), real-time live election day turnout rollups, comprehensive demographic analytics (caste, profession, age, gender), fake-voter verification workflows, and AI-driven strategic intelligence.

---

## 2. Core 9-Level Political & Geographical Hierarchy

The system models the operational command structure from State leadership down to individual voters:

```
STATE (e.g. Andhra Pradesh)
  └── ZONE (e.g. Prakasam South Zone)
        └── PARLIAMENT (e.g. Ongole Lok Sabha - No. 34)
              └── CONSTITUENCY (e.g. Kondapi AC - No. 107)
                    └── MANDAL (e.g. Singarayakonda, Kondapi, Tangutur, Ponnaluru, Marripudi, Jarugumalli)
                          └── VILLAGE / PANCHAYAT (e.g. Ponnaluru Village, Kondapi Village, Alakurapadu)
                                └── BOOTH / POLLING STATION (e.g. Booth 145 - ZPHS North)
                                      └── 100-VOTER CLUSTER / IN-CHARGE (e.g. Team A: Voters 1-100)
                                            └── VOTERS (Individual Citizens & Electoral Records)
```

### 2.1 Automatic Upward Aggregation Engine
- **Single Source of Truth**: All metrics (turnout percentage, party preference splits, fake voter alerts, migration numbers) originate at the leaf level (`Voter`, `VoteTracking`, `FakeVoterFlag`, `VoterMigration`).
- **Dynamic Recursive Queries**: The parent tiers dynamically aggregate child metrics without manual duplication, preventing data divergence.
- **Sub-10ms Snapshot Caching**: High command dashboards query `AggregateCache` / `AnalyticsSnapshot` which are invalidated in real time on any voter mutation event.

---

## 3. Normalized Relational Models (42 Models Catalog)

The database schema defines 42 normalized entities partitioned into 10 cohesive domains:

### Domain A: Multi-Tenancy & Party Branding
| Model | Description | Primary Key | Key Relations |
|---|---|---|---|
| `Organisation` | Multi-tenant parent organization | UUID | `PoliticalParty`, `State`, `User`, `Role`, `CMSConfiguration` |
| `PoliticalParty` | Dynamic party entity (TDP, YSRCP, JSP, BJP, INC, NEUTRAL, OTH) | UUID | `PartyBranding`, `Voter`, `PartyPerformance` |
| `PartyBranding` | Party-specific visual assets, slogans, themes, and leadership roster | UUID | `PoliticalParty` (onDelete: Cascade) |
| `CMSConfiguration` | System settings, custom hierarchy labels, feature toggles, and AI flags | UUID | `Organisation` (onDelete: SetNull) |

### Domain B: Geographical & Administrative Hierarchy
| Model | Level | Description | Key Relations |
|---|---|---|---|
| `State` | Level 1 | State jurisdiction (e.g. Andhra Pradesh) | `Organisation`, `Zone` |
| `Zone` | Level 2 | Regional political zone | `State`, `Parliament` |
| `Parliament` | Level 3 | Parliamentary constituency (Lok Sabha) | `Zone`, `Constituency` |
| `Constituency` | Level 4 | Assembly constituency (Vidhan Sabha) | `Parliament`, `Mandal`, `Voter`, `Task`, `GroundReport`, `AIInsight` |
| `Mandal` | Level 5 | Mandal / Tehsil administrative block | `Constituency`, `Village`, `Voter`, `GroundReport`, `Task` |
| `Village` | Level 6 | Gram Panchayat / Village / Municipal Ward | `Mandal`, `Booth`, `Voter`, `GroundReport`, `Task` |
| `Booth` | Level 7 | Polling station booth unit | `Village`, `VoterGroup`, `Voter`, `CadreAssignment`, `PollingReport` |
| `VoterGroup` | Level 8 | Micro-unit / 100-Voter Cluster | `Booth`, `User` (assigned incharge), `Voter` |
| `OrganizationUnit` | Unified | Polymorphic recursive node for unified tree traversal & aggregations | Self-referencing (`parentId`), `AggregateCache`, `ImportJob` |

### Domain C: Security, RBAC & Users
| Model | Description | Key Relations |
|---|---|---|
| `Role` | System role definitions with permission matrix | `User` |
| `User` | Authenticated operators, leaders, and field in-charges (with bcrypt hash) | `Role`, `UserHierarchyAssignment`, `Cadre`, `Voter`, `Task` |
| `UserHierarchyAssignment` | Temporal assignment mapping users to specific geographical units | `User`, `State`, `Zone`, `Parliament`, `Constituency`, `Mandal`, `Village`, `Booth`, `VoterGroup` |
| `OTPVerification` | Mobile authentication OTP verification records with expiry and attempts | `User` |
| `LoginSession` | Active JWT access tokens and device fingerprints | `User` |

### Domain D: Voter Management, Verification & Tracking
| Model | Description | Key Fields & Relations |
|---|---|---|
| `Voter` | Core electoral record | `epicNumber`, `name`, `age`, `gender`, `relationType`, `houseNumber`, `mobileNumber`, `politicalPreference`, `voterStatus`, `surveyStatus`, `voteStatus`, `caste`, `subCaste`, `profession` |
| `VoterAssignment` | History of voter allocations to in-charges | `Voter`, `User` |
| `VoterStatusHistory` | Audit trail of voter status transitions | `Voter`, `VoterStatus` |
| `FakeVoterFlag` | Objections and duplicate voter flags | `Voter`, `User` (flaggedBy, resolvedBy), `FakeVoterStatus` |
| `VoterMigration` | Migrated voter destination tracking | `Voter`, `destinationCity`, `destinationState`, `transportArranged` |
| `VoteTracking` | Election-day ballot confirmation records | `Voter`, `User` (markedBy), `markedAt`, `verificationMethod` |
| `LiveVoteEvent` | WebSocket event log for hourly turnout charts | `Voter`, `OrganizationUnit`, `User` |

### Domain E: Cadre & Field Operations
| Model | Description | Key Relations |
|---|---|---|
| `Cadre` | Field worker profile, skills, badges, and rating | `User`, `performanceScore`, `tasksCompletedCount` |
| `CadreAssignment` | Slot assignment of cadres to specific booths | `Booth`, `OrganizationUnit`, `User` (assignee, assignedBy) |

### Domain F: Top-Down Task Management
| Model | Description | Key Relations |
|---|---|---|
| `Task` | Directives dispatched across command levels | `Constituency`, `Mandal`, `Village`, `Booth`, `OrganizationUnit`, `User` |
| `TaskAssignment` | Cadre-level acknowledgment and completion | `Task`, `User`, `status`, `completedAt` |
| `TaskStatusHistory` | State machine transition audit | `Task`, `TaskStatus` |

### Domain G: Training & Capacity Building
| Model | Description | Key Relations |
|---|---|---|
| `TrainingVideo` | Video master catalog (URL, YouTube ID, duration) | `OrganizationUnit`, `TrainingProgress`, `TrainingAssignment` |
| `TrainingAssignment` | Targeted courseware dispatch by role | `TrainingVideo`, `RoleType` |
| `TrainingProgress` | Cadre learning progression and quiz score | `User`, `TrainingVideo`, `TrainingStatus`, `quizScore` |

### Domain H: Caste Demographics & Ground Intelligence
| Model | Description | Key Relations |
|---|---|---|
| `CasteCategory` | Broad categories (OC, BC-A, BC-B, BC-D, SC, ST, Minorities) | `VoterCaste`, `Voter` |
| `VoterCaste` | Granular sub-caste and community master catalog | `CasteCategory`, `Voter` |
| `GroundReport` | Field issue logging and incident tracking | `Constituency`, `Mandal`, `Village`, `Booth`, `User`, `reportType`, `status` |
| `PollingReport` | Polling station booth-level party vote tallies | `Booth`, `User`, `tdpVotes`, `ysrcpVotes`, `jspVotes`, `totalVotes` |

### Domain I: AI Strategic Intelligence, News & Trends
| Model | Description | Key Relations |
|---|---|---|
| `PartyPerformance` | Historical and projected party vote shares | `Constituency`, `PoliticalParty`, `swingPercentage` |
| `ElectionProjection` | AI-generated scenario models and margin forecasts | `Constituency`, `totalElectorate`, `leadMarginVotes`, `confidenceScore` |
| `AIInsight` | Automated strategic recommendations & anomaly alerts | `Constituency`, `sentimentScore`, `recommendedAction` |
| `NewsArticle` | Media articles and press monitoring | `Constituency`, `headline`, `sentiment` |
| `SocialTrend` | Social media hashtag velocity and narrative tracking | `Constituency`, `hashtag`, `mentionCount`, `sentimentPct` |

### Domain J: Governance, Ingestion & Caching
| Model | Description | Key Relations |
|---|---|---|
| `Announcement` | High Command broadcasts and field alerts | `priority`, `targetRole`, `targetLevel` |
| `Notification` | Push alerts for tasks, votes, and assignments | `User`, `NotificationType`, `readAt` |
| `AuditLog` | Immutable audit log of all data modifications | `User`, `AuditAction`, `entityType`, `entityId`, `changes` |
| `ImportJob` | Asynchronous voter CSV ingestion pipeline | `OrganizationUnit`, `User`, `status`, `successCount`, `errorCount` |
| `AggregateCache` | Precomputed hierarchy rollup snapshots | `OrganizationUnit`, `snapshot`, `expiresAt` |

---

## 4. Indexing & Query Optimization Strategy

The schema includes explicit composite and single-column B-Tree indexes:

```prisma
// High-Frequency Lookups
@@index([epicNumber])                 // Voter EPIC search
@@index([mobileNumber])               // Mobile number lookups
@@index([constituencyId, mandalId])   // Hierarchical drill-downs
@@index([boothId, voterStatus])       // Booth-level voter filtering
@@index([voterStatus, voteStatus])    // Live election day counting
@@index([caste])                      // Caste demographic analytics
@@index([destinationCity])            // Migrated voter logistics
```

---

## 5. Security & RBAC Guard Rails

1. **Password Security**: Passwords stored using industry-standard bcrypt hashing (`$2b$10$...`).
2. **JWT Authorization**: Bearer token authentication with configurable TTL and session revoking.
3. **Hierarchical Scope Enforcement**: Every read/write operation is checked against the user's unit scope. An in-charge can only access records in their subtree.
4. **Audit Trails**: Every update to voter status, political preference, or task assignment writes an immutable record to `AuditLog`.

---

## 6. Seed Data Guidelines

Run the database seeder using:
```bash
npm run prisma:seed
```

The seed script initializes:
- **1 State**: Andhra Pradesh (`AP`)
- **1 Zone**: Prakasam South Zone (`PRK-S`)
- **1 Parliament**: Ongole Parliament (`ONGOLE-PAR`)
- **1 Assembly Constituency**: Kondapi Assembly Constituency (`KONDAPI-AC`, No. 107)
- **6 Mandals**: Singarayakonda, Kondapi, Tangutur, Jarugumalli, Ponnaluru, Marripudi
- **15 Villages & 19 Booths** with **38 100-Voter Clusters**
- **200+ Demo Voters** with complete Telugu names, EPIC numbers, castes, professions, political preferences, migration destinations, and live vote tracking events.
- **Tasks, Trainings, Ground Reports, Polling Reports, AI Insights, and Social Trends**.
