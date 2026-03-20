"""
Generate the WBS Tracker Marketing Document as a PDF.
Run: python generate_marketing_pdf.py
"""
import io
import os
import sys

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import Flowable

# ── Colours ──────────────────────────────────────────────────────────
MAROON     = HexColor('#7b1e2c')
GOLD       = HexColor('#b8860b')
LIGHT_GOLD = HexColor('#fffbeb')
LIGHT_MAROON = HexColor('#f9f0f2')
STONE_50   = HexColor('#fafaf9')
STONE_100  = HexColor('#f5f5f4')
STONE_300  = HexColor('#d6d3d1')
STONE_600  = HexColor('#57534e')
STONE_900  = HexColor('#1c1917')
DARK_TEXT  = HexColor('#1c1917')
MID_GREY   = HexColor('#78716c')
WHITE      = white
BLUE       = HexColor('#2563eb')

# ── Document ──────────────────────────────────────────────────────────
output_path = "/app/frontend/public/WBS_TRACKER_MARKETING_DOCUMENT.pdf"
doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    rightMargin=18*mm,
    leftMargin=18*mm,
    topMargin=20*mm,
    bottomMargin=20*mm,
    title="WBS Transcript & Recommendation Tracker – Marketing Document",
    author="Wolmer's Boys' School",
)

W = A4[0] - 36*mm   # usable width

styles = getSampleStyleSheet()

# ── Custom Styles ──────────────────────────────────────────────────────
H1 = ParagraphStyle('H1', fontName='Helvetica-Bold', fontSize=24, textColor=MAROON,
                    spaceAfter=6, leading=28, alignment=TA_LEFT)
H2 = ParagraphStyle('H2', fontName='Helvetica-Bold', fontSize=15, textColor=MAROON,
                    spaceBefore=14, spaceAfter=4, leading=20)
H3 = ParagraphStyle('H3', fontName='Helvetica-Bold', fontSize=11, textColor=GOLD,
                    spaceBefore=10, spaceAfter=3, leading=15)
BODY = ParagraphStyle('BODY', fontName='Helvetica', fontSize=9.5, textColor=DARK_TEXT,
                      leading=14, spaceAfter=6, alignment=TA_JUSTIFY)
BODY_SMALL = ParagraphStyle('BODY_SMALL', fontName='Helvetica', fontSize=8.5, textColor=STONE_600,
                             leading=13, spaceAfter=4)
BULLET = ParagraphStyle('BULLET', fontName='Helvetica', fontSize=9.5, textColor=DARK_TEXT,
                         leading=14, leftIndent=14, spaceAfter=3,
                         bulletFontName='Helvetica', bulletFontSize=9)
CODE = ParagraphStyle('CODE', fontName='Courier', fontSize=8, textColor=DARK_TEXT,
                      leading=11, leftIndent=10, spaceAfter=2,
                      backColor=STONE_100)
MOTTO = ParagraphStyle('MOTTO', fontName='Helvetica-Oblique', fontSize=11,
                        textColor=GOLD, spaceAfter=4, alignment=TA_CENTER)
CAPTION = ParagraphStyle('CAPTION', fontName='Helvetica-Oblique', fontSize=8,
                          textColor=MID_GREY, spaceAfter=4, alignment=TA_CENTER)
TABLE_HDR = ParagraphStyle('THDR', fontName='Helvetica-Bold', fontSize=9,
                             textColor=WHITE)
TABLE_CELL = ParagraphStyle('TCELL', fontName='Helvetica', fontSize=9,
                              textColor=DARK_TEXT, leading=13)
HIGHLIGHT = ParagraphStyle('HIGHLIGHT', fontName='Helvetica', fontSize=9,
                             textColor=DARK_TEXT, leading=14, leftIndent=10,
                             rightIndent=10, spaceAfter=6)

def section_rule():
    return HRFlowable(width='100%', thickness=1, color=MAROON, spaceAfter=8, spaceBefore=2)

def sub_rule():
    return HRFlowable(width='100%', thickness=0.4, color=STONE_300, spaceAfter=4, spaceBefore=2)

def h2(text): return Paragraph(text, H2)
def h3(text): return Paragraph(text, H3)
def p(text):  return Paragraph(text, BODY)
def small(text): return Paragraph(text, BODY_SMALL)
def bullet(text): return Paragraph(f"• &nbsp; {text}", BULLET)
def code(text): return Paragraph(text, CODE)
def sp(n=6): return Spacer(1, n)

def info_box(text, bg=LIGHT_GOLD, color=GOLD):
    """A highlighted callout box."""
    t = Table([[Paragraph(text, ParagraphStyle('IB', fontName='Helvetica', fontSize=9,
                textColor=DARK_TEXT, leading=13, leftIndent=4))]], colWidths=[W])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LINEAFTER', (0,0), (0,-1), 3, color),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [bg]),
    ]))
    return t

def make_table(headers, rows, col_widths=None):
    data = [[Paragraph(h, TABLE_HDR) for h in headers]]
    for row in rows:
        data.append([Paragraph(str(c), TABLE_CELL) for c in row])
    if col_widths is None:
        col_widths = [W / len(headers)] * len(headers)
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), MAROON),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, STONE_50]),
        ('GRID', (0,0), (-1,-1), 0.4, STONE_300),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 7),
        ('RIGHTPADDING', (0,0), (-1,-1), 7),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    return t


# ══════════════════════════════════════════════════════════════════════
# BUILD STORY
# ══════════════════════════════════════════════════════════════════════
story = []

# ─── COVER HEADER ────────────────────────────────────────────────────
cover_data = [[
    Paragraph("<b>WBS Transcript &amp; Recommendation Tracker</b>",
              ParagraphStyle('Cover', fontName='Helvetica-Bold', fontSize=22,
                             textColor=WHITE, leading=28)),
    Paragraph("Official Product Marketing Document<br/>"
              "<font size=10>Wolmer's Boys' School — Digital Request Management System</font>",
              ParagraphStyle('CoverSub', fontName='Helvetica', fontSize=12,
                             textColor=HexColor('#ffe08a'), leading=18)),
]]
cover_t = Table(cover_data, colWidths=[W*0.58, W*0.42])
cover_t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), MAROON),
    ('TOPPADDING', (0,0), (-1,-1), 22),
    ('BOTTOMPADDING', (0,0), (-1,-1), 22),
    ('LEFTPADDING', (0,0), (-1,-1), 16),
    ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
story.append(cover_t)
story.append(sp(10))
story.append(Paragraph('"Age Quod Agis: Whatever you do, do it to the best of your ability."', MOTTO))
story.append(Paragraph("— Wolmer's Boys' School Motto", CAPTION))
story.append(section_rule())

# ─── EXECUTIVE SUMMARY ───────────────────────────────────────────────
story.append(h2("Executive Summary"))
story.append(p(
    "The <b>WBS Transcript &amp; Recommendation Tracker</b> is a purpose-built, cloud-hosted digital platform "
    "that transforms how Wolmer's Boys' School manages academic transcript requests and recommendation letter requests. "
    "Replacing paper-based and ad-hoc email workflows, the system delivers a transparent, auditable, and fast experience "
    "for students, graduates, and alumni — while giving the Bursary, Guidance Department, and school administration "
    "complete operational control."
))
story.append(p(
    "Designed exclusively for Wolmer's Boys' School, the platform integrates <b>Microsoft 365 authentication</b> "
    "so current students can sign in instantly with their school credentials — no passwords to remember, no separate registration."
))
story.append(sp())

# ─── THE PROBLEM ─────────────────────────────────────────────────────
story.append(h2("The Problem We Solve"))
story.append(p("Before this system, requesting a transcript or recommendation letter at WBS meant:"))
for item in [
    "Walking to the Bursary or Guidance Department in person",
    "Submitting a handwritten or paper form",
    "Following up by phone — often multiple times — to check on progress",
    "No guaranteed timeline or SLA for completion",
    "No digital record of what was requested, by whom, or when",
    "Staff manually tracking hundreds of requests with spreadsheets",
    "Students abroad or in the diaspora unable to submit requests remotely",
]:
    story.append(bullet(item))
story.append(section_rule())

# ─── PROCESS FLOWS ───────────────────────────────────────────────────
story.append(h2("Process Flows"))
story.append(sub_rule())

# Flow 1 – Student Login
story.append(h3("Flow 1: Student Login — Microsoft 365"))
story.append(p("Current students and graduates with a @wolmers.org email use Microsoft 365 single sign-on:"))

flow1_steps = [
    "Student visits the platform and clicks <b>Login</b>",
    "Two tabs appear: <b>Student</b> | <b>Staff / Admin</b> — Student tab selected by default",
    'Info shown: <i>"Students must sign in using their official Wolmer\'s Microsoft 365 account (@wolmers.org)."</i>',
    "Student clicks <b>Sign in with Microsoft 365</b>",
    "Microsoft 365 login opens — student enters school credentials",
    "Microsoft authenticates and returns a secure token to the platform",
    "Platform validates: (a) email ends in @wolmers.org, (b) token is valid",
    "<b>New user?</b> → Account auto-created in the system",
    "<b>Returning user?</b> → Logged in seamlessly, lands on Dashboard",
]
for s in flow1_steps:
    story.append(bullet(s))
story.append(sp(4))
story.append(info_box(
    "⭐  <b>No Wolmers email?</b>  On the login page, a highlighted callout reads: "
    "<i>\"Don't have a Wolmer's email? Request access here →\"</i> — clicking this opens the official "
    "Google Form to request a Microsoft 365 account. Every alumnus can eventually access the system.",
    bg=LIGHT_GOLD, color=GOLD
))
story.append(sp(8))

# Flow 2 – Staff Login
story.append(h3("Flow 2: Staff / Admin Login (Email + Password)"))
for s in [
    "Staff / Admin visits the platform and clicks <b>Login</b>",
    "Selects the <b>Staff / Admin</b> tab",
    "Enters email address and password → clicks <b>Sign In</b>",
    "<b>Staff</b> → lands on Staff Dashboard (only their assigned requests shown)",
    "<b>Admin</b> → lands on Admin Dashboard (full analytics + all requests)",
]:
    story.append(bullet(s))
story.append(sp(4))
story.append(info_box(
    "🔑  <b>Forgot password?</b> Staff and admins click \"Forgot password?\" → receive a secure, "
    "time-limited password reset email. The link expires after 1 hour for security.",
    bg=LIGHT_MAROON, color=MAROON
))
story.append(sp(8))

# Flow 3 – Transcript Request
story.append(h3("Flow 3: Complete Transcript Request Journey"))
story.append(p("<b>STUDENT SIDE</b>"))
transcript_steps = [
    "Login (Microsoft 365) → Dashboard → <b>New Request</b>",
    "Choose service: <b>Transcript Request</b>",
    "Fill in the form: Personal info (name, DOB, school ID, enrollment status, academic years, last form class)",
    "Contact info: Wolmer's email, personal email, phone number",
    "External examinations: CSEC, CAPE, NCSE, SAT, CCSLC, Other",
    "Request details: Reason, number of copies, received before? (Yes/No)",
    "<b>Date Needed By</b> — minimum 5 working days enforced",
    "Collection method: Pickup at Bursary / Email to Institution / DHL Courier",
    "Destination institution: Name, address, phone, email (all required)",
    "Submit → confirmation shown → in-app notification created",
    "Student tracks status from Dashboard",
]
for s in transcript_steps:
    story.append(bullet(s))

story.append(sp(6))
story.append(info_box(
    "📦  <b>DHL Delivery Highlight:</b>  When \"Courier Delivery (DHL)\" is selected, a special information "
    "panel appears: <i>\"Your transcript will be sent via DHL courier service. Please provide the complete "
    "delivery address below. Additional courier fees may apply.\"</i> — A mandatory Delivery Address field then appears.",
    bg=LIGHT_GOLD, color=GOLD
))
story.append(sp(6))

story.append(p("<b>STAFF / ADMIN SIDE</b>"))
for s in [
    "New request appears in Staff/Admin Dashboard with status <b>Pending</b>",
    "Admin assigns request to a staff member → staff receives notification → status → <b>In Progress</b>",
    "Staff reviews all details, updates Administrative Clearance (fees, receipt number)",
    "Status workflow: Pending → In Progress → Processing → Ready → Completed",
    "At any point staff can <b>Reject</b> with a written reason (reason sent to student in email)",
    "At each status change: rich HTML email sent to student + in-app notification created",
    "Final status <b>Completed</b> → email confirms completion to student",
]:
    story.append(bullet(s))
story.append(sp(8))

# Flow 4 – Recommendation
story.append(h3("Flow 4: Recommendation Letter Request Journey"))
for s in [
    "Login → Dashboard → New Request → <b>Recommendation Letter</b>",
    "Fill personal info: name, DOB, email, phone, address, years attended, last form class",
    "Co-curricular activities and positions of responsibility (clubs, prefect, sports, community service)",
    "External examinations (CSEC, CAPE, etc.)",
    "Request details: reason, collection method (Pickup / Email / DHL)",
    "Destination institution: name, address, program name, whom letter directed to (optional)",
    "Submit → same staff workflow and email notification system as transcripts",
]:
    story.append(bullet(s))
story.append(sp(8))

# Flow 5 – Edit
story.append(h3("Flow 5: Editing a Pending Request"))
story.append(p(
    "Students can edit their request while it is still in <b>Pending</b> status. "
    "Once a request moves to In Progress or beyond, editing is locked — students must contact staff for changes."
))
for s in [
    "Dashboard → find request with status <b>Pending</b>",
    "Click <b>Edit Request</b> — form pre-filled with current values",
    "Update any field and save",
]:
    story.append(bullet(s))
story.append(section_rule())

# ─── STATUS WORKFLOW ─────────────────────────────────────────────────
story.append(h2("Status Workflow"))
status_data = [
    ["Status", "Meaning", "Who Sets It"],
    ["Pending", "Request submitted, awaiting assignment", "Auto (on submission)"],
    ["In Progress", "Request assigned to staff member", "Auto (on assignment)"],
    ["Processing", "Active work on the document", "Staff / Admin"],
    ["Ready", "Document ready for pickup / dispatch", "Staff / Admin"],
    ["Completed", "Document collected / delivered", "Staff / Admin"],
    ["Rejected", "Request rejected — reason provided", "Staff / Admin"],
]
story.append(make_table(status_data[0], status_data[1:], col_widths=[W*0.22, W*0.48, W*0.30]))
story.append(sp(4))
story.append(p(
    "At <b>every</b> status change, the student receives an in-app notification AND a rich HTML email "
    "to both their @wolmers.org and personal email address."
))
story.append(section_rule())

# ─── FEATURE TABLE ───────────────────────────────────────────────────
story.append(h2("Full Feature Set by Portal"))

story.append(h3("Student Portal"))
student_rows = [
    ["Microsoft 365 Single Sign-On", "One-click login with @wolmers.org school credentials"],
    ["Transcript Request Form", "20+ fields: personal info, academic history, institution details"],
    ["Recommendation Letter Form", "Includes co-curricular activities and program details"],
    ["DHL Delivery Option", "Info panel + mandatory address field when courier selected"],
    ["5-Day Minimum Enforcement", "\"Date Needed By\" auto-enforces 5 working days minimum"],
    ["Request Dashboard", "All submitted requests with colour-coded status badges"],
    ["Real-Time Status Timeline", "Step-by-step timeline of every status change"],
    ["In-App Notifications", "Bell icon with unread count; full notifications history page"],
    ["Email Notifications", "Rich HTML emails to @wolmers.org and personal email on every update"],
    ["Edit Pending Requests", "Modify any request before it moves to In Progress"],
    ["No Wolmers Email?", "Link to Google Form to request a Microsoft 365 account"],
]
story.append(make_table(["Feature", "Details"], student_rows, col_widths=[W*0.38, W*0.62]))
story.append(sp(8))

story.append(h3("Staff Portal"))
staff_rows = [
    ["Staff Dashboard", "Shows only requests assigned to the logged-in staff member"],
    ["Full Request Detail", "All student info, institution details, clearance section, timeline"],
    ["Status Workflow", "Move through: Pending → In Progress → Processing → Ready → Completed"],
    ["Rejection with Reason", "Reject a request with mandatory written explanation"],
    ["Administrative Clearance", "Record fee payment, receipt number, clearance checkboxes"],
    ["Document Upload", "Attach PDF, Word, or image files to any request"],
    ["Staff Notes", "Internal notes visible only to staff and admin"],
    ["PDF / DOCX Export", "Export individual requests as formatted PDF or Word documents"],
    ["Notifications Page", "Full notification history with read/unread management"],
]
story.append(make_table(["Feature", "Details"], staff_rows, col_widths=[W*0.38, W*0.62]))
story.append(sp(8))

story.append(h3("Admin Portal"))
admin_rows = [
    ["Analytics Dashboard", "8+ charts: trends, status distribution, enrollment breakdown, workload"],
    ["Clickable Summary Tiles", "Click any stat tile to instantly filter the request list"],
    ["All Transcripts & Recommendations", "View, search, filter, sort, and manage all requests"],
    ["Advanced Filtering", "Filter by status (including Overdue), staff, enrollment type, search"],
    ["Sortable Columns", "Sort by student name, status, submission date, needed-by date"],
    ["Staff Assignment", "Assign/reassign requests to staff members with one click"],
    ["User Management", "Create staff/admin accounts, reset passwords, delete users"],
    ["Overdue Alerts", "Automatic daily in-app notifications for overdue requests"],
    ["PDF / DOCX Export", "Export individual requests as formatted documents"],
    ["Bulk PDF Export", "Export all transcript and recommendation data to one PDF"],
    ["JSON Backup & Restore", "Export entire database to .json; import to rebuild or migrate"],
    ["Clear All Data", "Wipe all data (except admin) with typed confirmation safeguard"],
]
story.append(make_table(["Feature", "Details"], admin_rows, col_widths=[W*0.38, W*0.62]))
story.append(section_rule())

# ─── COLLECTION METHODS ──────────────────────────────────────────────
story.append(h2("Collection Methods"))
coll_rows = [
    ["📦 Pickup at Bursary", "Student or representative collects in person at the Bursary", "None"],
    ["📧 Email to Institution", "PDF document sent directly to the institution email address", "Institution email required"],
    ["🚚 Courier Delivery (DHL)", "Shipped via DHL to any local or international address", "Delivery address + DHL fees"],
]
story.append(make_table(["Method", "Description", "Additional Requirements"], coll_rows,
             col_widths=[W*0.28, W*0.48, W*0.24]))
story.append(section_rule())

# ─── EMAIL NOTIFICATIONS ─────────────────────────────────────────────
story.append(h2("Email Notification System"))
story.append(p("Every status change triggers a beautifully formatted HTML email powered by <b>Resend</b>:"))
for item in [
    "<b>Dual delivery:</b> Sent simultaneously to the student's @wolmers.org AND personal email",
    "<b>Status colour coding:</b> Yellow=Pending, Blue=In Progress, Purple=Processing, Green=Ready/Completed, Red=Rejected",
    "<b>Rejection reason included:</b> If rejected, the reason appears prominently in the email",
    "<b>Action button:</b> \"View My Requests\" button links directly back to the student portal",
    "<b>Recommendation letters:</b> Gold-accent emails for recommendation requests; maroon for transcripts",
]:
    story.append(bullet(item))
story.append(section_rule())

# ─── PDF / DOCX EXPORT ───────────────────────────────────────────────
story.append(h2("PDF & DOCX Export (Single Record)"))
story.append(p(
    "Staff and admin can export any individual transcript or recommendation request as a professionally formatted document. "
    "Both PDF and Word (DOCX) formats are available."
))

story.append(h3("PDF Export Highlights"))
for item in [
    "Wolmer's Boys' School header with official crest logo and full school contact details",
    "Status badge and submission / needed-by date line",
    "All personal, contact, academic, and institution details in formatted tables",
    "External examinations section",
    "Administrative Clearance section: neat small checkboxes, Amount Paid | Receipt # | Date columns",
    "Processed by (staff name) if applicable",
    "Staff notes section",
]:
    story.append(bullet(item))

story.append(h3("DOCX Export"))
story.append(p(
    "Same structured layout exported in Microsoft Word format — editable for staff who need to add annotations "
    "or submit to external systems requiring Word documents."
))
story.append(section_rule())

# ─── JSON BACKUP ─────────────────────────────────────────────────────
story.append(h2("JSON Data Backup & Restore"))
story.append(p(
    "A powerful data portability feature for administrators. Found in the <b>Data Management</b> section of the Admin Dashboard."
))

story.append(h3("Export JSON Backup"))
for item in [
    "Downloads a complete JSON file containing all users, transcript requests, recommendation requests, and notifications",
    "Includes export timestamp, version number, and record counts for verification",
    "Use to: create regular backups, migrate to a new environment, or rebuild the app from scratch",
]:
    story.append(bullet(item))

story.append(h3("Import JSON Backup"))
for item in [
    "Upload a previously exported JSON file via the admin dashboard",
    "System uses upsert logic — existing records are updated, new records are added (no duplicates)",
    "Admin account is never overwritten during import (protected)",
    "Import summary shown: total records imported with breakdown by type",
]:
    story.append(bullet(item))
story.append(section_rule())

# ─── ANALYTICS ───────────────────────────────────────────────────────
story.append(h2("Analytics Dashboard (Admin)"))
chart_rows = [
    ["1", "Monthly Request Trends", "Bar chart — transcripts vs. recommendations per month (last 6 months)"],
    ["2", "Transcripts by Enrollment Status", "Pie chart — Enrolled / Graduate / Withdrawn breakdown"],
    ["3", "Recommendations by Enrollment Status", "Pie chart — same breakdown for recommendation requests"],
    ["4", "Transcript Status Distribution", "Pie chart — all 6 statuses with colour coding"],
    ["5", "Recommendation Status Distribution", "Pie chart — same for recommendation requests"],
    ["6", "Staff Workload Distribution", "Bar chart — number of requests per staff member"],
    ["7", "Overdue Requests Breakdown", "Bar chart — days overdue: 1–3, 4–7, 8–14, 15+ days"],
    ["8", "Recent Activity", "Latest 5 transcripts and 5 recommendations with status badges"],
]
story.append(make_table(["#", "Chart Name", "Description"], chart_rows,
             col_widths=[W*0.06, W*0.36, W*0.58]))
story.append(section_rule())

# ─── SECURITY ────────────────────────────────────────────────────────
story.append(h2("Authentication & Security"))
sec_rows = [
    ["Microsoft 365 SSO", "Students sign in with @wolmers.org — no separate password stored in the system"],
    ["JWT Tokens", "Secure 24-hour session tokens for staff and admin"],
    ["Role-Based Access Control", "Students see only their requests. Staff see only assigned work. Admins see all."],
    ["Domain Validation", "Only @wolmers.org emails accepted for Microsoft 365 login"],
    ["Password Reset", "Secure email-based reset with 1-hour expiry token"],
    ["bcrypt Hashing", "Staff/admin passwords hashed with bcrypt — never stored in plain text"],
]
story.append(make_table(["Feature", "Details"], sec_rows, col_widths=[W*0.32, W*0.68]))
story.append(section_rule())

# ─── TECHNICAL SPECS ─────────────────────────────────────────────────
story.append(h2("Technical Specifications"))
tech_rows = [
    ["Frontend", "React 19, Tailwind CSS, Shadcn/UI component library"],
    ["Backend", "FastAPI (Python), async/await, RESTful API"],
    ["Database", "MongoDB with motor async driver"],
    ["Authentication", "Microsoft MSAL.js (OAuth 2.0 / OIDC) + JWT"],
    ["Email", "Resend API — HTML template emails"],
    ["File Storage", "Server filesystem (PDF, DOCX, images)"],
    ["PDF Generation", "ReportLab"],
    ["DOCX Generation", "python-docx"],
    ["Charts", "Recharts"],
    ["Hosting", "Cloud (Kubernetes-based, supervisor-managed services)"],
]
story.append(make_table(["Component", "Technology"], tech_rows, col_widths=[W*0.28, W*0.72]))
story.append(section_rule())

# ─── DESIGN & BRANDING ───────────────────────────────────────────────
story.append(h2("Design & Branding"))
design_rows = [
    ["Primary Colour", "Maroon  #800000 / #7b1e2c"],
    ["Accent Colour", "Gold  #FFD700 / #b8860b"],
    ["Background", "Warm stone whites (#fafaf9, #f5f5f4)"],
    ["Headings Font", "Playfair Display (serif)"],
    ["Body Font", "Inter (sans-serif)"],
    ["Logo", "Official Wolmer's Schools crest — sun breaking through clouds, \"Age Quod Agis\" motto"],
    ["Hero Image", "Wolmer's school building with students"],
    ["School Motto", "\"Age Quod Agis: Whatever you do, do it to the best of your ability\""],
]
story.append(make_table(["Element", "Specification"], design_rows, col_widths=[W*0.3, W*0.7]))
story.append(section_rule())

# ─── BENEFITS SUMMARY ────────────────────────────────────────────────
story.append(h2("Key Benefits Summary"))
benefits = [
    ("<b>Students:</b>", "Submit requests from anywhere in the world, 24/7. Track status in real-time. Receive email updates automatically at every step."),
    ("<b>Staff:</b>", "Organised queue of assigned work. Clear workflow with structured forms. Digital clearance recording eliminates paper."),
    ("<b>Administration:</b>", "Complete visibility into all requests. Analytics to identify bottlenecks. Automated overdue alerts. Full data backup and restore."),
    ("<b>The School:</b>", "Professional, branded digital experience. Reduced phone enquiries. Auditable records. Disaster recovery via JSON export."),
]
for label, text in benefits:
    story.append(p(f"✅  {label}  {text}"))
story.append(section_rule())

# ─── CONTACT ─────────────────────────────────────────────────────────
story.append(h2("Support & Contact"))
story.append(p("For system support or to request a Wolmer's Microsoft 365 account:"))
contact_rows = [
    ["Bursary Phone", "876 922 4055 / 876 948 4807"],
    ["WhatsApp", "876 313 0915"],
    ["Bursary Email", "wbs.bursary@wolmers.org"],
    ["Guidance Department", "876 922 8254"],
    ["Guidance Email", "wbs.guidance@wolmers.org"],
]
story.append(make_table(["Contact", "Details"], contact_rows, col_widths=[W*0.3, W*0.7]))
story.append(sp(12))

# ─── FOOTER ──────────────────────────────────────────────────────────
footer_t = Table([[
    Paragraph("WBS Transcript &amp; Recommendation Tracker", ParagraphStyle('FTL', fontName='Helvetica-Bold',
              fontSize=9, textColor=WHITE)),
    Paragraph("© 2025–2026 Wolmer's Boys' School. All rights reserved.",
              ParagraphStyle('FTR', fontName='Helvetica', fontSize=8, textColor=HexColor('#ffe08a'),
                             alignment=TA_RIGHT)),
]], colWidths=[W*0.6, W*0.4])
footer_t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), MAROON),
    ('TOPPADDING', (0,0), (-1,-1), 12),
    ('BOTTOMPADDING', (0,0), (-1,-1), 12),
    ('LEFTPADDING', (0,0), (-1,-1), 14),
    ('RIGHTPADDING', (0,0), (-1,-1), 14),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
story.append(footer_t)

# ══════════════════════════════════════════════════════════════════════
doc.build(story)
print(f"✅ PDF generated: {output_path}")
