"""
WBS Transcript & Recommendation Tracker — Test Data Seeder
Run: python seed_test_data.py
"""
import asyncio
import uuid
import bcrypt
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Load env
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME   = os.environ.get('DB_NAME', 'wbs_tracker')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

now = datetime.now(timezone.utc)

def uid(): return str(uuid.uuid4())

def past(days=0, hours=0):
    return (now - timedelta(days=days, hours=hours)).isoformat()

def future(days=10):
    return (now + timedelta(days=days)).strftime('%m/%d/%Y')

def hash_pw(pw): return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def timeline_entry(status, actor="System", days_ago=0):
    return {
        "status": status,
        "timestamp": past(days=days_ago),
        "updated_by": actor,
        "note": f"Status updated to {status}"
    }

# ─────────────────────────────────────────────
# USERS
# ─────────────────────────────────────────────
STAFF_ID   = uid()
STAFF2_ID  = uid()

students = [
    {"id": uid(), "email": "jbrown2023@wolmers.org",    "full_name": "Jordan Brown",    "role": "student"},
    {"id": uid(), "email": "mthompson2022@wolmers.org", "full_name": "Marcus Thompson", "role": "student"},
    {"id": uid(), "email": "dwhite2021@wolmers.org",    "full_name": "Damion White",    "role": "student"},
    {"id": uid(), "email": "ksmith2024@wolmers.org",    "full_name": "Kyle Smith",      "role": "student"},
    {"id": uid(), "email": "tjohnson2020@wolmers.org",  "full_name": "Tristan Johnson", "role": "student"},
    {"id": uid(), "email": "amorris2023@wolmers.org",   "full_name": "Andre Morris",    "role": "student"},
    {"id": uid(), "email": "rclark2019@wolmers.org",    "full_name": "Ricardo Clark",   "role": "student"},
    {"id": uid(), "email": "orichards2022@wolmers.org", "full_name": "Omar Richards",   "role": "student"},
]

staff_users = [
    {
        "id": STAFF_ID,
        "email": "m.campbell@wolmers.org",
        "full_name": "Mrs. Monica Campbell",
        "role": "staff",
        "password_hash": hash_pw("Staff123!"),
        "created_at": past(days=90),
    },
    {
        "id": STAFF2_ID,
        "email": "r.henry@wolmers.org",
        "full_name": "Mr. Robert Henry",
        "role": "staff",
        "password_hash": hash_pw("Staff123!"),
        "created_at": past(days=90),
    },
]

student_docs = []
for s in students:
    student_docs.append({
        **s,
        "password_hash": None,
        "created_at": past(days=60),
    })

# ─────────────────────────────────────────────
# TRANSCRIPT REQUESTS
# ─────────────────────────────────────────────
def transcript(student, status, days_submitted, assigned_staff_id=None, assigned_staff_name=None,
               collection="pickup", rejection_reason=None, staff_notes=None,
               clearance=None, extra_timeline=None, needed_days=15,
               reason="employment", copies=1, received_before="NO",
               institution_name="University of Technology, Jamaica",
               institution_address="237 Old Hope Road, Kingston 6",
               institution_phone="876-927-1680",
               institution_email="admissions@utech.edu.jm",
               exams=None):
    tl = [timeline_entry("Pending", "System", days_submitted)]
    if extra_timeline:
        tl += extra_timeline
    return {
        "id": uid(),
        "student_id": student["id"],
        "student_name": student["full_name"],
        "student_email": student["email"],
        "first_name": student["full_name"].split()[0],
        "middle_name": "",
        "last_name": " ".join(student["full_name"].split()[1:]),
        "date_of_birth": "05/14/2001",
        "school_id": f"WBS{uid()[:5].upper()}",
        "enrollment_status": "graduate",
        "academic_years": [{"from_year": "2016", "to_year": "2021"}],
        "wolmers_email": student["email"],
        "personal_email": student["email"].replace("@wolmers.org", "@gmail.com"),
        "phone_number": f"876-499-{str(days_submitted+1001)}",
        "last_form_class": "5W",
        "reason": reason,
        "other_reason": "",
        "needed_by_date": future(needed_days),
        "collection_method": collection,
        "delivery_address": "42 Constant Spring Road, Kingston 10" if collection == "delivery" else "",
        "institution_name": institution_name,
        "institution_address": institution_address,
        "institution_phone": institution_phone,
        "institution_email": institution_email,
        "number_of_copies": copies,
        "received_transcript_before": received_before,
        "external_exams": exams or [
            {"exam": "CSEC", "year": "2021"},
            {"exam": "CAPE", "year": "2023"},
        ],
        "administrative_clearance": clearance,
        "status": status,
        "assigned_staff_id": assigned_staff_id,
        "assigned_staff_name": assigned_staff_name,
        "rejection_reason": rejection_reason,
        "staff_notes": staff_notes,
        "documents": [],
        "timeline": tl,
        "submitted_at": past(days=days_submitted),
        "updated_at": past(days=max(0, days_submitted - 1)),
        "created_at": past(days=days_submitted),
    }


clearance_paid = {
    "no_fees_outstanding": True,
    "no_admin_obligations": True,
    "amount_paid": 3500.00,
    "receipt_number": "BUR-2024-1147",
    "payment_date": "03/10/2024",
    "updated_by": "Mrs. Monica Campbell",
    "updated_at": past(days=5),
}

clearance_partial = {
    "no_fees_outstanding": True,
    "no_admin_obligations": False,
    "amount_paid": 1500.00,
    "receipt_number": "BUR-2024-1201",
    "payment_date": "03/15/2024",
    "updated_by": "Mr. Robert Henry",
    "updated_at": past(days=3),
}

transcript_requests = [
    # 1. Pending — fresh UWI submission
    transcript(students[0], "Pending", days_submitted=2,
               reason="further_studies",
               institution_name="The University of the West Indies",
               institution_address="Mona Campus, Kingston 7",
               institution_phone="876-927-1660",
               institution_email="admissions@uwimona.edu.jm",
               needed_days=14),

    # 2. In Progress — assigned to Mrs. Campbell
    transcript(students[1], "In Progress", days_submitted=7,
               assigned_staff_id=STAFF_ID, assigned_staff_name="Mrs. Monica Campbell",
               institution_name="Northern Caribbean University",
               institution_address="Manchester Road, Mandeville",
               institution_phone="876-625-0333",
               institution_email="registrar@ncu.edu.jm",
               extra_timeline=[
                   timeline_entry("In Progress", "Mrs. Monica Campbell", 5),
               ],
               needed_days=10),

    # 3. Processing — with staff notes
    transcript(students[2], "Processing", days_submitted=10,
               assigned_staff_id=STAFF_ID, assigned_staff_name="Mrs. Monica Campbell",
               staff_notes="CSEC results verified. Awaiting Bursary clearance sign-off.",
               institution_name="University of Technology, Jamaica",
               institution_address="237 Old Hope Road, Kingston 6",
               institution_phone="876-927-1680",
               institution_email="admissions@utech.edu.jm",
               extra_timeline=[
                   timeline_entry("In Progress",  "Mrs. Monica Campbell", 8),
                   timeline_entry("Processing",   "Mrs. Monica Campbell", 5),
               ],
               needed_days=7),

    # 4. Ready — cleared and ready for pickup
    transcript(students[3], "Ready", days_submitted=14,
               assigned_staff_id=STAFF2_ID, assigned_staff_name="Mr. Robert Henry",
               clearance=clearance_paid,
               staff_notes="Transcript printed and sealed. Student notified via email.",
               institution_name="Edna Manley College of Visual and Performing Arts",
               institution_address="1 Arthur Wint Drive, Kingston 5",
               institution_phone="876-929-3330",
               institution_email="info@ednamanley.edu.jm",
               extra_timeline=[
                   timeline_entry("In Progress",  "Mr. Robert Henry", 12),
                   timeline_entry("Processing",   "Mr. Robert Henry", 9),
                   timeline_entry("Ready",        "Mr. Robert Henry", 6),
               ],
               needed_days=5),

    # 5. Completed — DHL delivery to USA
    transcript(students[4], "Completed", days_submitted=21,
               assigned_staff_id=STAFF_ID, assigned_staff_name="Mrs. Monica Campbell",
               collection="delivery",
               clearance=clearance_paid,
               staff_notes="Dispatched via DHL on March 12. Tracking: JM123456789DHL.",
               institution_name="Florida International University",
               institution_address="11200 SW 8th St, Miami, FL 33199, USA",
               institution_phone="+1-305-348-2000",
               institution_email="admissions@fiu.edu",
               received_before="YES",
               extra_timeline=[
                   timeline_entry("In Progress",  "Mrs. Monica Campbell", 18),
                   timeline_entry("Processing",   "Mrs. Monica Campbell", 15),
                   timeline_entry("Ready",        "Mrs. Monica Campbell", 12),
                   timeline_entry("Completed",    "Mrs. Monica Campbell", 10),
               ],
               needed_days=2),

    # 6. Rejected — outstanding fees
    transcript(students[5], "Rejected", days_submitted=9,
               assigned_staff_id=STAFF2_ID, assigned_staff_name="Mr. Robert Henry",
               rejection_reason="Student has an outstanding library fine of $2,500. Please clear this balance at the Bursary and resubmit your request.",
               extra_timeline=[
                   timeline_entry("In Progress",  "Mr. Robert Henry", 7),
                   timeline_entry("Rejected",     "Mr. Robert Henry", 5),
               ],
               needed_days=8),

    # 7. Pending — emailed to Canadian university
    transcript(students[6], "Pending", days_submitted=1,
               collection="emailed",
               reason="migration",
               institution_name="Toronto Metropolitan University",
               institution_address="350 Victoria St, Toronto, ON M5B 2K3, Canada",
               institution_phone="+1-416-979-5000",
               institution_email="international@torontomu.ca",
               exams=[
                   {"exam": "CSEC", "year": "2019"},
                   {"exam": "CAPE", "year": "2021"},
                   {"exam": "SAT",  "year": "2021"},
               ],
               copies=2,
               needed_days=20),

    # 8. In Progress — assigned to Mr. Henry, partial clearance
    transcript(students[7], "In Progress", days_submitted=5,
               assigned_staff_id=STAFF2_ID, assigned_staff_name="Mr. Robert Henry",
               reason="personal_record",
               clearance=clearance_partial,
               institution_name="Caribbean School of Business",
               institution_address="15 Knutsford Blvd, New Kingston",
               institution_phone="876-920-5678",
               institution_email="admissions@csb.edu.jm",
               extra_timeline=[
                   timeline_entry("In Progress", "Mr. Robert Henry", 3),
               ],
               needed_days=12),
]

# ─────────────────────────────────────────────
# RECOMMENDATION REQUESTS
# ─────────────────────────────────────────────
def recommendation(student, status, days_submitted, assigned_staff_id=None, assigned_staff_name=None,
                   collection="pickup", rejection_reason=None, staff_notes=None,
                   clearance=None, extra_timeline=None, needed_days=14,
                   reason="further_studies",
                   institution_name="The University of the West Indies",
                   institution_address="Mona Campus, Kingston 7",
                   program_name="BSc Computer Science",
                   directed_to="The Admissions Committee",
                   activities="", exams=None, last_form_class="5W"):
    tl = [timeline_entry("Pending", "System", days_submitted)]
    if extra_timeline:
        tl += extra_timeline
    return {
        "id": uid(),
        "student_id": student["id"],
        "student_name": student["full_name"],
        "student_email": student["email"],
        "first_name": student["full_name"].split()[0],
        "middle_name": "",
        "last_name": " ".join(student["full_name"].split()[1:]),
        "date_of_birth": "09/22/2002",
        "email": student["email"].replace("@wolmers.org", "@gmail.com"),
        "phone_number": f"876-399-{str(days_submitted+2001)}",
        "address": "45 Half Way Tree Road, Kingston 10",
        "years_attended": [{"from_year": "2016", "to_year": "2022"}],
        "enrollment_status": "graduate",
        "last_form_class": last_form_class,
        "co_curricular_activities": activities or "Prefect 2021–2022; Debate Team Captain; Chess Club; Sixth Form Council Representative",
        "reason": reason,
        "other_reason": "",
        "institution_name": institution_name,
        "institution_address": institution_address,
        "directed_to": directed_to,
        "program_name": program_name,
        "needed_by_date": future(needed_days),
        "collection_method": collection,
        "delivery_address": "88 Red Hills Road, Kingston 19" if collection == "delivery" else "",
        "external_exams": exams or [
            {"exam": "CSEC", "year": "2022"},
            {"exam": "CAPE", "year": "2024"},
        ],
        "administrative_clearance": clearance,
        "status": status,
        "assigned_staff_id": assigned_staff_id,
        "assigned_staff_name": assigned_staff_name,
        "rejection_reason": rejection_reason,
        "staff_notes": staff_notes,
        "documents": [],
        "timeline": tl,
        "submitted_at": past(days=days_submitted),
        "updated_at": past(days=max(0, days_submitted - 1)),
        "created_at": past(days=days_submitted),
    }


recommendation_requests = [
    # 1. Pending — UWI Computer Science
    recommendation(students[0], "Pending", days_submitted=3,
                   institution_name="The University of the West Indies",
                   institution_address="Mona Campus, Kingston 7",
                   program_name="BSc Computer Science",
                   directed_to="The Admissions Committee",
                   last_form_class="6AG2",
                   activities="Computer Lab Monitor; Science Fair Gold Medal; Robotics Club Founder; National Mathematics Olympiad Finalist",
                   needed_days=18),

    # 2. In Progress — NCU Business Admin
    recommendation(students[1], "In Progress", days_submitted=8,
                   assigned_staff_id=STAFF_ID, assigned_staff_name="Mrs. Monica Campbell",
                   institution_name="Northern Caribbean University",
                   institution_address="Manchester Road, Mandeville",
                   program_name="BSc Business Administration",
                   directed_to="Dr. Patricia Hall, Dean of Admissions",
                   activities="School Choir President; Science Club; House Captain (Dunrobin); 1st Form Academic Prize Winner; Junior Achievement Programme",
                   last_form_class="5R",
                   extra_timeline=[
                       timeline_entry("In Progress", "Mrs. Monica Campbell", 6),
                   ]),

    # 3. Processing — UTech Civil Engineering
    recommendation(students[2], "Processing", days_submitted=12,
                   assigned_staff_id=STAFF2_ID, assigned_staff_name="Mr. Robert Henry",
                   institution_name="UTech Jamaica",
                   institution_address="237 Old Hope Road, Kingston 6",
                   program_name="BSc Civil Engineering",
                   directed_to="The Selection Committee",
                   staff_notes="Verified co-curricular records with Guidance Counsellor. Letter being drafted.",
                   activities="Football Team Captain; Prefect 2021–2022; Environment Club Secretary; Duke of Edinburgh Bronze Award; Regional Science Fair participant",
                   last_form_class="5C",
                   extra_timeline=[
                       timeline_entry("In Progress",  "Mr. Robert Henry", 10),
                       timeline_entry("Processing",   "Mr. Robert Henry", 7),
                   ],
                   needed_days=6),

    # 4. Ready — Edna Manley Fine Arts
    recommendation(students[3], "Ready", days_submitted=16,
                   assigned_staff_id=STAFF_ID, assigned_staff_name="Mrs. Monica Campbell",
                   clearance=clearance_paid,
                   institution_name="Edna Manley College",
                   institution_address="1 Arthur Wint Drive, Kingston 5",
                   program_name="Bachelor of Fine Arts",
                   directed_to="Ms. Karen Simpson, Admissions Officer",
                   activities="Art Club President; Drama Society Lead; School Musical Lead 2022 & 2023; JCDC Bronze Medal in Painting",
                   last_form_class="6AG1",
                   extra_timeline=[
                       timeline_entry("In Progress",  "Mrs. Monica Campbell", 14),
                       timeline_entry("Processing",   "Mrs. Monica Campbell", 11),
                       timeline_entry("Ready",        "Mrs. Monica Campbell", 8),
                   ],
                   needed_days=4),

    # 5. Completed — Florida State University (emailed)
    recommendation(students[4], "Completed", days_submitted=25,
                   assigned_staff_id=STAFF2_ID, assigned_staff_name="Mr. Robert Henry",
                   collection="emailed",
                   clearance=clearance_paid,
                   institution_name="Florida State University",
                   institution_address="600 W. College Ave, Tallahassee, FL 32306, USA",
                   program_name="MSc Information Technology",
                   directed_to="Graduate Admissions Office",
                   activities="Computer Science Club Founder; Debate Team National Champion; Head Boy 2022–2023; STEM Fair Winner (National); Volunteer IT Tutor",
                   last_form_class="6SC1",
                   exams=[
                       {"exam": "CSEC", "year": "2020"},
                       {"exam": "CAPE", "year": "2022"},
                       {"exam": "SAT",  "year": "2022"},
                   ],
                   extra_timeline=[
                       timeline_entry("In Progress",  "Mr. Robert Henry", 22),
                       timeline_entry("Processing",   "Mr. Robert Henry", 19),
                       timeline_entry("Ready",        "Mr. Robert Henry", 16),
                       timeline_entry("Completed",    "Mr. Robert Henry", 14),
                   ],
                   needed_days=3),

    # 6. Rejected — insufficient co-curricular info
    recommendation(students[5], "Rejected", days_submitted=6,
                   assigned_staff_id=STAFF_ID, assigned_staff_name="Mrs. Monica Campbell",
                   rejection_reason="Insufficient detail provided for co-curricular activities and positions of responsibility. Please resubmit with a complete list of school activities, clubs, and any leadership roles held.",
                   extra_timeline=[
                       timeline_entry("In Progress",  "Mrs. Monica Campbell", 4),
                       timeline_entry("Rejected",     "Mrs. Monica Campbell", 2),
                   ],
                   needed_days=9),

    # 7. Pending — York University (DHL)
    recommendation(students[6], "Pending", days_submitted=1,
                   collection="delivery",
                   institution_name="York University",
                   institution_address="4700 Keele St, Toronto, ON M3J 1P3, Canada",
                   program_name="BSc Psychology",
                   directed_to="International Admissions Office",
                   activities="Swimming Team Vice-Captain; Peer Counselling Club; Interact Club Treasurer; Community Service Award 2022; Volunteer at Sunlight Centre",
                   last_form_class="5B",
                   needed_days=21),

    # 8. In Progress — NCB employment recommendation
    recommendation(students[7], "In Progress", days_submitted=4,
                   assigned_staff_id=STAFF2_ID, assigned_staff_name="Mr. Robert Henry",
                   reason="employment",
                   institution_name="National Commercial Bank Jamaica",
                   institution_address="32 Trafalgar Road, Kingston 10",
                   program_name="Management Trainee Programme",
                   directed_to="Human Resources Department",
                   activities="Treasurer, Sixth Form Business Club; Model UN Delegate; School Cricket Team; Young Leaders Conference Participant; Junior Achievement Company of the Year nominee",
                   last_form_class="6SS1",
                   extra_timeline=[
                       timeline_entry("In Progress", "Mr. Robert Henry", 2),
                   ],
                   needed_days=10),
]

# ─────────────────────────────────────────────
# NOTIFICATIONS
# ─────────────────────────────────────────────
def notif(user_id, title, msg, ntype, days_ago, read=False):
    return {
        "id": uid(),
        "user_id": user_id,
        "title": title,
        "message": msg,
        "type": ntype,
        "read": read,
        "created_at": past(days=days_ago),
    }

notifications = []

status_labels = ["Pending", "In Progress", "Processing", "Ready", "Completed", "Rejected"]
for i, s in enumerate(students[:6]):
    st = status_labels[i]
    notifications.append(notif(s["id"],
        "Transcript Request Status Updated",
        f"Your transcript request has been updated to '{st}'.",
        "status_update", days_ago=max(1, i*2), read=(i % 2 == 0)))
    notifications.append(notif(s["id"],
        "Recommendation Letter Status Updated",
        f"Your recommendation letter request has been updated to '{st}'.",
        "recommendation_status_update", days_ago=max(1, i*3), read=(i % 3 == 0)))

for staff_id in [STAFF_ID, STAFF2_ID]:
    notifications.append(notif(staff_id,
        "New Request Assigned",
        "A new transcript request has been assigned to you.",
        "assignment", days_ago=3, read=False))
    notifications.append(notif(staff_id,
        "Overdue Request Alert",
        "One or more of your assigned requests are approaching their needed-by date.",
        "overdue_alert", days_ago=1, read=False))


# ─────────────────────────────────────────────
# RUN SEEDER
# ─────────────────────────────────────────────
async def seed():
    print("🌱  Seeding WBS Tracker test data...\n")

    for u in staff_users:
        await db.users.update_one({"id": u["id"]}, {"$set": u}, upsert=True)
    print(f"  ✅  {len(staff_users)} staff users created")
    for u in staff_users:
        print(f"       → {u['full_name']}  |  {u['email']}  |  pw: Staff123!")

    for s in student_docs:
        await db.users.update_one({"id": s["id"]}, {"$set": s}, upsert=True)
    print(f"  ✅  {len(student_docs)} student accounts created (Microsoft 365 logins)\n")

    for t in transcript_requests:
        await db.transcript_requests.update_one({"id": t["id"]}, {"$set": t}, upsert=True)
    print(f"  ✅  {len(transcript_requests)} transcript requests seeded")

    for r in recommendation_requests:
        await db.recommendation_requests.update_one({"id": r["id"]}, {"$set": r}, upsert=True)
    print(f"  ✅  {len(recommendation_requests)} recommendation requests seeded\n")

    for n in notifications:
        await db.notifications.update_one({"id": n["id"]}, {"$set": n}, upsert=True)
    print(f"  ✅  {len(notifications)} notifications seeded\n")

    print("📊  Status breakdown:")
    for col_name, label in [("transcript_requests", "Transcripts"), ("recommendation_requests", "Recommendations")]:
        col = db[col_name]
        row = []
        for status in ["Pending", "In Progress", "Processing", "Ready", "Completed", "Rejected"]:
            count = await col.count_documents({"status": status})
            if count:
                row.append(f"{status}:{count}")
        print(f"       {label}: {' | '.join(row)}")

    print("\n🎉  Done! Login credentials:")
    print("       Admin:   admin@wolmers.org        / Admin123!")
    print("       Staff 1: m.campbell@wolmers.org   / Staff123!")
    print("       Staff 2: r.henry@wolmers.org      / Staff123!")
    print("       Students: via Microsoft 365 @wolmers.org\n")
    client.close()

asyncio.run(seed())
