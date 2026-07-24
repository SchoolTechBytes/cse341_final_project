# cse341_final_project
# Ticket Support System API: Technical Specification

## Overview

REST API for a support ticketing system with four user roles (customer, support, manager, admin), OAuth and local authentication, and role-based access control enforced via middleware. Data layer is MongoDB.

---

## Roles and Permissions

| Action | Customer | Support | Manager | Admin |
|---|---|---|---|---|
| Create ticket | Yes | Yes | Yes | Yes |
| Comment (public) | Yes | Yes | Yes | Yes |
| Comment (internal) | No | Yes | Yes | Yes |
| Update status (in_progress / rejected / closed) | No | Yes | Yes | Yes |
| Reopen a closed ticket | No | No | Yes | Yes |
| Manually assign/reassign ticket | No | No | Yes | Yes |
| Set/change priority | No | Yes | Yes | Yes |
| Create users | No | No | No | Yes |
| Delete users | No | No | No | Yes |
| Assign/change roles | No | No | No | Yes |

**Core business rules:**
- New accounts always start as `customer`; only admin can change a role afterward.
- A ticket is created with status `new` and priority `medium`, then auto-assigned to a support user.
- Auto-assignment goes to whichever support user has gone longest without a new ticket (tracked via `lastAssignedAt` on the user document).
- Priority is set by support during triage, not by the customer at creation.
- Reopening a `closed` ticket to any other status requires manager or admin.
- Customers see only their own tickets and public comments. Support and above see everything, including internal comments and ticket history.
- If no support users exist in the system, ticket creation returns a 503 rather than creating an unassigned ticket. Deployments must always seed at least one support user.

---

## Authentication

- Local login: email + password.
- OAuth login: GitHub.
- Session-based, not JWT.
- Session ends when the browser is closed (no persistent cookie) or after 1.5 hours from creation, whichever comes first. The 1.5 hour expiry is enforced server-side on every request, independent of the client-side cookie.
- New users via either method default to role `customer`.

---

## Database Collections (MongoDB)

All `_id` fields are ObjectId by default and omitted from the tables below unless noted otherwise. Cross-document references are stored as ObjectId, not enforced at the database level; integrity is the application's responsibility.

### `users`
| Field | Type | Notes |
|---|---|---|
| name | String | required |
| email | String | required, unique index |
| passwordHash | String | nullable, null if OAuth-only account |
| authProvider | String | enum: 'local', 'github', required, default 'local' |
| providerId | String | nullable, GitHub user id |
| role | String | enum: 'customer', 'support', 'manager', 'admin', required, default 'customer' |
| lastAssignedAt | Date | nullable, used for round-robin ticket assignment |
| createdAt | Date | default now |
| updatedAt | Date | default now |

Indexes: unique on `email`; index on `role` (used by the round-robin assignment query); index on `lastAssignedAt`.

### `sessions`
| Field | Type | Notes |
|---|---|---|
| _id | String | session token, used as primary key |
| userId | ObjectId | ref: users, required |
| createdAt | Date | default now |
| expiresAt | Date | createdAt + 1.5 hours |
| lastSeenAt | Date | default now |

Indexes: TTL index on `expiresAt` so MongoDB auto-purges expired sessions.

### `tickets`
| Field | Type | Notes |
|---|---|---|
| title | String | required |
| description | String | required |
| status | String | enum: 'new', 'in_progress', 'rejected', 'closed', required, default 'new' |
| priority | String | enum: 'low', 'medium', 'high', 'urgent', required, default 'medium' |
| createdBy | ObjectId | ref: users, required |
| assignedTo | ObjectId | ref: users, set on creation via round-robin |
| createdAt | Date | default now |
| updatedAt | Date | default now |
| closedAt | Date | nullable |

Indexes: on `createdBy`, `assignedTo`, `status`, and a compound index on `status + priority` for filtered list queries.

### `comments`
| Field | Type | Notes |
|---|---|---|
| ticketId | ObjectId | ref: tickets, required |
| userId | ObjectId | ref: users, required |
| body | String | required |
| isInternal | Boolean | default false |
| createdAt | Date | default now |

Indexes: on `ticketId` (every read is scoped to a single ticket).

### `ticketHistory`
| Field | Type | Notes |
|---|---|---|
| ticketId | ObjectId | ref: tickets, required |
| changedBy | ObjectId | ref: users, required |
| fieldChanged | String | e.g. 'status', 'assignedTo', 'priority' |
| oldValue | String | |
| newValue | String | |
| changedAt | Date | default now |

Indexes: on `ticketId`.

---

## Endpoints

Route params like `:id` are MongoDB ObjectId strings (24-character hex). Validate them as such before querying, an invalid ObjectId passed to a query throws a cast error rather than returning a clean 404.

### Auth
| Method | Path | Access | Behavior |
|---|---|---|---|
| POST | /auth/register | public | local signup, always role=customer |
| POST | /auth/login | public | creates session, sets cookie |
| GET | /auth/github | public | redirect to GitHub OAuth |
| GET | /auth/github/callback | public | create/find user (role=customer if new), create session |
| POST | /auth/logout | authenticated | destroys session |
| GET | /auth/me | authenticated | current user info and session status |

### Users
| Method | Path | Access | Behavior |
|---|---|---|---|
| GET | /users | admin | list all users |
| GET | /users/:id | self, support+ | support+ needed to view requester info on a ticket |
| POST | /users | admin | manually create a user with any role |
| PUT | /users/:id | self | update own name/email |
| PUT | /users/:id/role | admin | change a user's role |
| DELETE | /users/:id | admin | remove/deactivate a user |

### Tickets
| Method | Path | Access | Behavior |
|---|---|---|---|
| POST | /tickets | authenticated | createdBy taken from session; status set to 'new', priority to 'medium', assignedTo set via round-robin |
| GET | /tickets | authenticated | customers see only their own tickets; support+ see all; filterable by status/priority/assignedTo/createdBy |
| GET | /tickets/:id | authenticated | internal comments and history hidden from customer role |
| PUT | /tickets/:id/status | support+ | closed to any other status requires manager+ |
| PUT | /tickets/:id/assign | manager+ | manual reassignment to a specific support user |
| PUT | /tickets/:id/priority | support+ | sets priority during or after triage |

### Comments
| Method | Path | Access | Behavior |
|---|---|---|---|
| POST | /tickets/:id/comments | authenticated | customer submissions force isInternal=false; support+ submissions respect input |
| GET | /tickets/:id/comments | authenticated | customer sees public only; support+ sees all |

### History
| Method | Path | Access | Behavior |
|---|---|---|---|
| GET | /tickets/:id/history | support+ | full change log for the ticket |

### Stats
| Method | Path | Access | Behavior |
|---|---|---|---|
| GET | /tickets/stats | support+ | counts by status and priority, via aggregation pipeline |
| GET | /users/:id/tickets | self, support+ | tickets created by or assigned to a user |

---

## Middleware

1. **Session validation**: runs on every authenticated route. Confirms the cookie maps to a session document and `expiresAt` has not passed. Expired sessions are removed and the request returns 401.
2. **Role authorization**: runs after session validation. Roles are treated as a hierarchy (`customer < support < manager < admin`); each route declares a minimum role.
3. **Ownership checks**: for routes like `PUT /users/:id`, the request succeeds only if `req.user._id.equals(params.id)` or the requester is admin.
4. **Internal comment filtering**: on `GET /tickets/:id` and `GET /tickets/:id/comments`, documents with `isInternal: true` are excluded from the query or stripped from the response if the requester's role is `customer`.

---

## Status Transition Rules

```
new -> in_progress        (support+)
new -> rejected             (support+)
in_progress -> rejected     (support+)
in_progress -> closed       (support+)
rejected -> closed          (support+)
closed -> anything          (manager+ only)
```

Every status change is logged to `ticketHistory` with `fieldChanged: 'status'`.

---

## MongoDB-Specific Notes

- **ODM**: Mongoose. All collections below are defined as Mongoose schemas with `enum`, `required`, and `ref` doing the enforcement work that foreign keys and CHECK constraints would do in a relational database.
- **Timestamps**: use Mongoose's built-in `{ timestamps: true }` schema option to auto-manage `createdAt`/`updatedAt` instead of setting them manually.
- **No transactions by default across collections** unless using a replica set with multi-document transactions. Ticket assignment writes to both `tickets` (setting `assignedTo`) and `users` (updating `lastAssignedAt`); wrap this in a Mongoose session-based transaction if consistency between the two matters, otherwise a crash mid-operation can leave them out of sync.
- **Cascading deletes**: deleting a user does not delete their tickets, comments, or sessions automatically. Handle this with a `pre('findOneAndDelete')` hook on the `users` schema, or block deletion outright if the user has active tickets.
- **Round-robin query**: `User.findOne({ role: 'support' }).sort({ lastAssignedAt: 1 })`, treating documents with no `lastAssignedAt` (`null`) as highest priority since Mongo sorts `null`/missing values first in ascending order.
- **Population**: use `.populate()` on `createdBy`, `assignedTo`, `userId`, and `changedBy` fields when an endpoint needs the related user's name/email rather than just their ObjectId, instead of issuing a second query manually.

---

## Mongoose Schema Definitions

```javascript
// models/User.js
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, default: null },
  authProvider: { type: String, enum: ['local', 'github'], required: true, default: 'local' },
  providerId: { type: String, default: null },
  role: { type: String, enum: ['customer', 'support', 'manager', 'admin'], required: true, default: 'customer' },
  lastAssignedAt: { type: Date, default: null }
}, { timestamps: true });

// models/Session.js
const sessionSchema = new Schema({
  _id: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
  lastSeenAt: { type: Date, default: Date.now }
}, { timestamps: { createdAt: true, updatedAt: false }, _id: false });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto-purge

// models/Ticket.js
const ticketSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['new', 'in_progress', 'rejected', 'closed'], required: true, default: 'new' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], required: true, default: 'medium' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  closedAt: { type: Date, default: null }
}, { timestamps: true });
ticketSchema.index({ createdBy: 1 });
ticketSchema.index({ assignedTo: 1 });
ticketSchema.index({ status: 1, priority: 1 });

// models/Comment.js
const commentSchema = new Schema({
  ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  isInternal: { type: Boolean, default: false }
}, { timestamps: { createdAt: true, updatedAt: false } });
commentSchema.index({ ticketId: 1 });

// models/TicketHistory.js
const ticketHistorySchema = new Schema({
  ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
  changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fieldChanged: { type: String, required: true },
  oldValue: { type: String },
  newValue: { type: String }
}, { timestamps: { createdAt: 'changedAt', updatedAt: false } });
ticketHistorySchema.index({ ticketId: 1 });
```
