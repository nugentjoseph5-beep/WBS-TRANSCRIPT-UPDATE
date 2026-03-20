# WBS Transcript & Recommendation Tracker
## Official Product Marketing Document
### Wolmer's Boys' School — Digital Request Management System

---

> **"Age Quod Agis: Whatever you do, do it to the best of your ability."**
> — Wolmer's Boys' School Motto

---

## Executive Summary

The **WBS Transcript & Recommendation Tracker** is a purpose-built, cloud-hosted digital platform that transforms how Wolmer's Boys' School manages academic transcript requests and recommendation letter requests. Replacing paper-based and ad-hoc email workflows, the system delivers a transparent, auditable, and fast experience for students, graduates, and alumni — while giving the Bursary, Guidance Department, and school administration complete operational control.

Designed exclusively for Wolmer's Boys' School, the platform integrates **Microsoft 365 authentication** so current students can sign in instantly with their school credentials — no passwords to remember, no separate registration.

---

## The Problem We Solve

Before this system, requesting a transcript or recommendation letter at WBS meant:

- Walking to the Bursary or Guidance Department in person
- Submitting a handwritten or paper form
- Following up by phone — often multiple times — to check on progress
- No guaranteed timeline for completion
- No digital record of what was requested, by whom, or when
- Staff manually tracking hundreds of requests with spreadsheets

**The result:** delays, miscommunication, lost requests, and frustration for students abroad or in the diaspora who could not visit in person.

---

## What the System Does

The WBS Tracker provides **three fully integrated portals** for Students, Staff, and Administrators — all accessible via a single URL, from any device, anywhere in the world.

---

## Process Flows

### Flow 1: Student Login — Microsoft 365 (Current Students & Recent Graduates)

```
Student visits the platform
        ↓
Clicks "Login" → Sees two tabs: "Student" | "Staff / Admin"
        ↓
Student tab is selected by default
        ↓
Sees the message:
  "Students must sign in using their official Wolmer's Microsoft 365 account (@wolmers.org)."
        ↓
Clicks "Sign in with Microsoft 365"
        ↓
Microsoft 365 popup / redirect opens
Student enters: student@wolmers.org + their Microsoft password
        ↓
Microsoft authenticates → Returns ID token to the platform
        ↓
Platform validates:
  ✅ Email ends in @wolmers.org?
  ✅ Token is valid?
        ↓
  If new user → Account is automatically created in the system
  If returning user → Logged in seamlessly
        ↓
Student lands on their Dashboard
```

**What if the student doesn't have a @wolmers.org email?**
> On the login page, there is a highlighted callout box:
> *"Don't have a Wolmer's email? Request access here →"*
> Clicking this link opens the **official Google Form** where the student can request a Wolmer's Microsoft 365 account. This ensures every alumnus, graduate, or past student can eventually access the system.

---

### Flow 2: Staff / Admin Login (Email + Password)

```
Staff or Admin visits the platform
        ↓
Clicks "Login" → Selects "Staff / Admin" tab
        ↓
Enters their Wolmer's email address + password
        ↓
Clicks "Sign In"
        ↓
System authenticates via JWT
        ↓
  Staff → Lands on Staff Dashboard (assigned requests only)
  Admin → Lands on Admin Dashboard (full analytics + all requests)
```

**Forgot your password?**
> Staff and admins can click "Forgot password?" on the login page. An email is sent with a secure, time-limited password reset link. The link expires after 1 hour for security.

---

### Flow 3: Complete Transcript Request Journey

```
STUDENT SIDE:

1. Login (Microsoft 365)
        ↓
2. Dashboard → "New Request" button
        ↓
3. Choose Service: "Transcript Request" or "Recommendation Letter"
   [Student selects Transcript Request]
        ↓
4. Fill in the Transcript Request Form:
   Personal Information:
   - First Name, Middle Name, Last Name
   - Date of Birth
   - School ID Number
   - Enrollment Status (Enrolled / Graduate / Withdrawn)
   - Academic Years Attended
   - Last Form Class
   
   Contact Information:
   - Wolmer's Email, Personal Email
   - Phone Number
   
   External Examinations (CSEC, CAPE, NCSE, SAT, Other)
   
   Request Details:
   - Reason for Request
     (Employment, Further Studies, Migration, Personal Record, Other)
   - If "Other" is selected → a text field appears to specify reason
   - Number of Copies Required
   - Have you received a transcript from WBS before? (YES / NO)
   - Date Needed By
     ⚠️  Must be at least 5 working days from today
   
   Collection Method:
   - 📦 Pickup at Bursary (walk-in collection)
   - 📧 Emailed to Institution (PDF emailed directly)
   - 🚚 Courier Delivery via DHL
   
   ⭐ DELIVERY HIGHLIGHT: When "Courier Delivery (DHL)" is selected:
      A special info panel appears:
      ┌─────────────────────────────────────────────────────┐
      │  📦 DHL Courier Delivery                           │
      │  Your transcript will be sent via DHL courier      │
      │  service. Please provide the complete delivery      │
      │  address below. Additional courier fees may apply.  │
      └─────────────────────────────────────────────────────┘
      A mandatory "Delivery Address" field appears.
   
   Destination Institution:
   - Institution Name (required)
   - Institution Address (required)
   - Institution Phone (required)
   - Institution Email (required)
        ↓
5. Submit Request → Confirmation screen shown
        ↓
6. Student receives in-app notification: "Request submitted"
        ↓
7. Student can track request status from their Dashboard

---

STAFF / ADMIN SIDE:

8. New request appears in Staff/Admin Dashboard with status "Pending"
        ↓
9. Admin assigns request to a staff member
   → Staff member receives in-app notification: "You have been assigned a transcript request"
   → Status automatically changes to "In Progress"
        ↓
10. Staff reviews the request:
    - Views all personal, contact, institution details
    - Updates Administrative Clearance:
      ☑ No fees outstanding
      ☑ No outstanding administrative obligations
      Amount Paid: $___  |  Receipt #: ___  |  Date: ___
        ↓
11. Staff updates status:
    Pending → In Progress → Processing → Ready → Completed
    (At any point, staff can Reject with a written reason)
        ↓
12. At each status change:
    ✉️  Email sent to student's @wolmers.org AND personal email
    🔔  In-app notification created for the student

---

STUDENT NOTIFICATION (EMAIL):

Subject: WBS Tracker – Transcript Request: Ready
┌──────────────────────────────────────────────────────────┐
│              Wolmer's Boys' School                       │
│                  WBS Tracker                             │
├──────────────────────────────────────────────────────────┤
│  Transcript Request Status Update                        │
│                                                          │
│  Dear [Student Name],                                    │
│                                                          │
│  Your transcript request status has been updated.        │
│                                                          │
│  Previous Status: Processing → New Status: ✅ Ready      │
│                                                          │
│  [View My Requests] (Button)                            │
├──────────────────────────────────────────────────────────┤
│  Wolmer's Boys' School · National Heroes Circle, KGN 4  │
└──────────────────────────────────────────────────────────┘

13. Student collects / receives their transcript
        ↓
14. Staff marks as "Completed"
        ↓
    ✉️  Final email sent: "Your request has been Completed"
```

---

### Flow 4: Complete Recommendation Letter Request Journey

```
STUDENT SIDE:

1. Login → Dashboard → "New Request"
        ↓
2. Choose "Recommendation Letter"
        ↓
3. Fill in the Recommendation Letter Form:

   Personal Information:
   - First Name, Middle Name, Last Name
   - Date of Birth
   - Personal Email, Phone Number, Address
   - Years Attended Wolmer's
   - Enrollment Status
   - Last Form Class (e.g. 5W, 4R, 6AG2)
   
   Co-curricular Activities & Positions of Responsibility
   (Clubs, sports, prefect positions, community service)
   
   External Examinations (CSEC, CAPE, etc.)
   
   Request Details:
   - Reason for Recommendation
   - Collection Method (Pickup / Email / DHL Courier)
   - DHL info panel shown if Courier is selected
   
   Destination Institution:
   - Institution Name (required)
   - Institution Address (required)
   - Program Name (e.g. BSc Computer Science)
   - Whom to direct the letter to (optional)
        ↓
4. Submit → Status: Pending
        ↓
5. Admin/Staff process the request (same workflow as transcripts)
        ↓
6. Email + in-app notifications at every status change
```

---

### Flow 5: Editing a Pending Request

Students can **edit their request while it is still in Pending status**:

```
Dashboard → Find request with status "Pending"
        ↓
Click "Edit Request"
        ↓
Update any fields (form is pre-filled with current values)
        ↓
Save changes → Request updated
        ↓
In-app confirmation shown
```

> Once a request moves beyond "Pending" (e.g., In Progress), editing is locked. Students must contact staff to make changes.

---

## Feature Highlights

### 🔐 Authentication & Security
| Feature | Details |
|---------|---------|
| Microsoft 365 SSO | Students sign in with their @wolmers.org school account — no password stored in the system |
| JWT Tokens | Secure, 24-hour expiry session tokens for staff and admin |
| Role-Based Access | Students see only their own requests. Staff see only assigned requests. Admins see everything. |
| Password Reset | Secure email-based reset with 1-hour expiry token |
| Domain Validation | Only @wolmers.org emails accepted for Microsoft 365 login |

---

### 🎓 Student Portal Features
| Feature | Details |
|---------|---------|
| Microsoft 365 Login | One-click sign-in with school credentials |
| Transcript Request Form | 20+ fields capturing all required information |
| Recommendation Letter Form | Complete academic and extracurricular profile |
| DHL Delivery Option | With informational callout and mandatory address field |
| 5-Day Minimum | "Date Needed By" enforces 5 working days minimum |
| Request Dashboard | View all submitted requests with status badges |
| Status Tracking | Real-time status timeline (Pending → Completed) |
| In-App Notifications | Bell icon with unread count; full notifications page |
| Email Notifications | Rich HTML emails to @wolmers.org and personal email |
| Edit Pending Requests | Students can modify requests before processing begins |
| No Wolmers Email? | Link to Google Form to request a Microsoft 365 account |

---

### 👨‍💼 Staff Portal Features
| Feature | Details |
|---------|---------|
| Staff Dashboard | Shows only requests assigned to the logged-in staff member |
| Transcript Detail View | All student info, institution details, administrative clearance |
| Recommendation Detail | Full student profile including co-curricular activities |
| Status Workflow | Move requests through: Pending → In Progress → Processing → Ready → Completed |
| Rejection with Reason | Reject a request with a mandatory written explanation |
| Administrative Clearance | Record fee payments, receipt numbers, clearance checkboxes |
| Document Upload | Attach PDF, Word, or image files to any request |
| Staff Notes | Internal notes visible to staff and admin only |
| Notifications Page | Full notification history with read/unread management |
| PDF / DOCX Export | Export individual requests as formatted PDF or Word documents |

---

### 🛠️ Admin Portal Features
| Feature | Details |
|---------|---------|
| Analytics Dashboard | Full data visualisation with 8+ charts |
| Clickable Summary Tiles | Click any stat tile (Total, Pending, Overdue, etc.) to filter the list |
| All Transcripts | View, filter, sort, and manage all transcript requests |
| All Recommendations | View, filter, sort, and manage all recommendation requests |
| Advanced Filtering | Filter by status, assigned staff, overdue, enrollment type |
| Sortable Columns | Sort by student name, status, submission date, needed-by date |
| Staff Assignment | Assign requests to specific staff members with one click |
| User Management | Create staff/admin accounts, reset passwords, delete users |
| Overdue Alerts | Automatic daily notifications for overdue requests |
| PDF / DOCX Export | Export individual requests as PDF or Word documents |
| Bulk Data Export (PDF) | Export all transcript and recommendation data to one PDF |
| **JSON Backup & Restore** | Export the entire database to a .json file; import to rebuild or migrate the app |
| Data Summary Panel | See record counts before clearing data |
| Clear All Data | Wipe all data (except admin account) with typed confirmation |
| Admin Notifications | Full notification management via bell icon |

---

### 📊 Analytics Charts (Admin Dashboard)
1. **Monthly Request Trends** — Bar chart showing transcripts + recommendations per month
2. **Transcripts by Enrollment Status** — Pie chart (Enrolled / Graduate / Withdrawn)
3. **Recommendations by Enrollment Status** — Pie chart
4. **Transcript Status Distribution** — Pie chart (all statuses with colour coding)
5. **Recommendation Status Distribution** — Pie chart
6. **Staff Workload Distribution** — Bar chart showing requests per staff member
7. **Overdue Requests Breakdown** — Days overdue categorised (1–3 days, 4–7, 8–14, 15+ days)
8. **Recent Activity** — Last 5 transcripts and recommendations on dashboard

---

### ✉️ Email Notification System
Every status change triggers a beautifully formatted HTML email:

- **Dual delivery**: Sent to both the student's @wolmers.org and personal email
- **Status colour coding**: Each status has a distinct colour (yellow=Pending, blue=In Progress, green=Completed, red=Rejected)
- **Rejection reason included**: If a request is rejected, the reason appears in the email
- **Action button**: "View My Requests" button links directly to the student portal
- **Powered by Resend**: Reliable transactional email delivery

---

### 📄 PDF & DOCX Export (Single Record)
Staff and admin can export any individual transcript or recommendation request as:

**PDF features:**
- Wolmer's Boys' School header with official crest logo
- School contact information (Bursary phone, WhatsApp, email; Guidance email)
- Status badge and submission/needed-by dates
- All personal, contact, academic, and institution details in formatted tables
- External examinations section
- Administrative Clearance section with:
  - Neat, properly-sized checkboxes (No fees outstanding / No admin obligations)
  - Amount Paid | Receipt Number | Payment Date — clearly separated
  - Processed by (staff name)
- Staff notes section

**DOCX features:**
- Same structured layout in Microsoft Word format
- Editable for staff who need to add annotations

---

### 🗂️ JSON Data Backup & Restore
A powerful data portability feature for administrators:

**Export JSON Backup:**
- Downloads a complete JSON file containing all users, transcript requests, recommendation requests, and notifications
- Includes export timestamp, version, and record counts
- Use to: migrate to a new environment, create regular backups, or rebuild the app from scratch

**Import JSON Backup:**
- Upload a previously exported JSON file
- System uses upsert logic — existing records are updated, new records are added
- Admin account is never overwritten during import
- Import summary shown: "Successfully imported X records"

---

## Design & Branding

| Element | Specification |
|---------|--------------|
| Primary Colour | Maroon `#800000` / `#7b1e2c` |
| Accent Colour | Gold `#FFD700` / `#b8860b` |
| Background | Warm stone whites (`#fafaf9`, `#f5f5f4`) |
| Headings Font | Playfair Display (serif) |
| Body Font | Inter (sans-serif) |
| Logo | Official Wolmer's Schools crest (sun breaking through clouds with "Age Quod Agis" motto) |
| Hero Image | Wolmer's school building with students |
| School Motto | *"Age Quod Agis: Whatever you do, do it to the best of your ability"* — displayed on login page |

---

## Technical Specifications

| Component | Technology |
|-----------|-----------|
| Frontend | React 19, Tailwind CSS, Shadcn/UI, Recharts |
| Backend | FastAPI (Python), async/await throughout |
| Database | MongoDB (motor async driver) |
| Authentication | Microsoft MSAL.js (OAuth 2.0) + JWT |
| Email | Resend API (HTML templates) |
| File Storage | Server filesystem (PDF, DOCX, images) |
| PDF Generation | ReportLab |
| DOCX Generation | python-docx |
| Charts | Recharts |
| Hosting | Cloud (Kubernetes-based, supervisor-managed) |

---

## Status Workflow

```
                    ┌─────────────┐
                    │   Pending   │ ← Request submitted by student
                    └──────┬──────┘
                           │ Admin assigns to staff
                    ┌──────▼──────┐
                    │  In Progress│ ← Staff is reviewing
                    └──────┬──────┘
                           │ Processing started
                    ┌──────▼──────┐
                    │  Processing │ ← Active work on transcript/letter
                    └──────┬──────┘
                           │ Ready for collection/dispatch
                    ┌──────▼──────┐
                    │    Ready    │ ← Awaiting student pickup/dispatch
                    └──────┬──────┘
                           │ Collected/sent
                    ┌──────▼──────┐
                    │  Completed  │ ← Process finished ✅
                    └─────────────┘
                    
        At any stage → [Rejected] with written reason
```

---

## Collection Methods

| Method | Description | Additional Steps |
|--------|-------------|-----------------|
| 📦 Pickup at Bursary | Student or representative collects in person | None |
| 📧 Email to Institution | PDF sent directly to institution email | Requires institution email address |
| 🚚 Courier Delivery (DHL) | Shipped via DHL to any address | Delivery address required; courier fees may apply |

---

## User Roles & Access Control

| Role | What They Can Do |
|------|-----------------|
| **Student** | Submit requests, track own requests, receive notifications, edit pending requests |
| **Staff** | View & update assigned requests, update clearance, upload documents, add notes |
| **Admin** | Full access: all requests, user management, analytics, data export/import, clear data |

---

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@wolmers.org | Admin123! |
| Staff | Created by admin | Set by admin |
| Student | @wolmers.org (Microsoft 365) | Microsoft 365 password |

---

## Key Benefits Summary

✅ **For Students**: Submit requests from anywhere in the world, 24/7. Track status in real-time. Receive email updates automatically.

✅ **For Staff**: Organised queue of assigned work. Clear workflow with structured forms. Digital clearance recording eliminates paper.

✅ **For Administration**: Complete visibility into all requests. Analytics to identify bottlenecks. Automated overdue alerts. Full data backup and restore capability.

✅ **For the School**: Professional, branded digital experience. Reduced phone enquiries. Auditable records. Disaster recovery via JSON export.

---

## Support & Contact

For system support or to request a Wolmer's Microsoft 365 account, contact the WBS Tech Team: **wbsms@wolmers.org**
---

*WBS Transcript & Recommendation Tracker — Built for Wolmer's Boys' School*
*© 2025–2026 Wolmer's Boys' School. All rights reserved.*
