# AI-Powered College Placement Drive Registration System

An institutional-grade Campus Placement Drive Registration and Eligibility Engine built for **T.G.S. College of Engineering & Technology (Central Training & Placement Directorate)**.

The system allows students to register for upcoming placement drives, upload their resumes (PDF, DOC, DOCX), receive instant AI resume analysis and mismatch detection, and evaluate their eligibility across active participating companies and job roles.

---

## 🌟 Key Features

### 🎓 1. Student Portal (`/placements` & `/placements/register`)
- **Professional Academic Branding**: Styled to integrate seamlessly with the college website.
- **Form Fields & Validation**:
  - Full Name, Phone Number, Email, Gender
  - Qualification (B.Tech, B.E., M.Tech, MCA, BCA)
  - Branch / Department (CSE, IT, AI & ML, Data Science, ECE, EEE, Mechanical, Civil)
  - Graduation Year (2025, 2026, 2027, 2028)
  - CGPA / Percentage (Scale of 10.0)
  - Active Backlogs count (Strictly evaluated)
  - Technical Skills (interactive tags input & autocomplete)
- **Advanced Resume Uploader**:
  - Supports **PDF**, **DOC**, and **DOCX** files
  - Shows file name, file size (KB/MB), and live upload progress bar
  - Replace file and remove file controls
  - Client-side & server-side validation (file size max 10MB, safe sanitized storage)

### 🤖 2. AI Resume Analysis & Mismatch Detection
- **AI Extraction Pipeline**:
  - Extracts Name, Degree, Branch, Graduation Year, CGPA/percentage
  - Extracts Technical Skills, Programming Languages, Frameworks, Tools/Databases
  - Extracts Certifications, Academic Projects, Internships, Work Experience, and Achievements
  - Integrates **Google Gemini AI** (`gemini-1.5-flash`) when `GEMINI_API_KEY` is provided, paired with a robust heuristic semantic extraction engine for 100% offline accuracy and zero latency.
- **Cross-Verification & Mismatch Warnings**:
  - Automatically compares student-entered registration form values with extracted resume data.
  - If any discrepancy is found (e.g. entered CGPA 8.5 vs detected 7.9 on resume), displays a clear amber warning card for student review before final submission.

### ⚖️ 3. Strict Rule-Based Eligibility Engine
> **CRITICAL ARCHITECTURAL GUARANTEE**: Mandatory eligibility requirements are **100% rule-based**. The AI is **never** permitted to override mandatory criteria.
- **Mandatory Requirements (Rule-Based)**:
  - Minimum CGPA cutoff
  - Allowed Qualifications
  - Eligible Branches
  - Graduation Year / Batch
  - Maximum Backlogs allowed
- **AI / Skill Matching**:
  - Skill coverage (Required Skills vs Preferred Skills)
  - Fuzzy synonym matching (e.g., DSA matches Data Structures & Algorithms, React matches React.js)
- **Three Organized Categories**:
  1. **Eligible Companies**: All mandatory criteria passed + all required skills matched (Eligibility Score: 85%–99%). Displays detailed "Why you are eligible" reasons.
  2. **Partially Eligible**: Mandatory criteria passed, but missing 1 or 2 required skills (Eligibility Score: 50%–75%). Highlights missing skills to brush up.
  3. **Not Eligible**: Any mandatory criterion failed (e.g. CGPA 7.8 vs minimum 8.0). AI cannot override this! Clearly explains the exact failure reason.

### 📄 4. Submission & Registration ID Generation
- Summary confirmation screen with checklist: *"☐ I confirm that the information provided by me is correct."*
- Generates a unique, sequential Registration ID: **`PD-2026-00001`**.
- Success screen with action links to the Student Dashboard and instant PDF download.

### 📊 5. Student Dashboard (`/placements/dashboard`)
- Instant status cards:
  - Placement Drive Status: **Registered ✓**
  - Resume: **Uploaded ✓**
  - Eligibility Analysis: **Completed ✓**
  - Eligible Companies count
  - Partially Eligible count
  - Not Eligible count
  - Registration ID
- **"Download Registration Details"**: Generates a formatted institutional PDF slip using `jsPDF` and `jspdf-autotable`.
- "View Eligibility" and "View Registration" breakdowns.

### 🛡️ 6. Secure Admin Directorate Portal (`/admin/placements`)
- **Secure Authentication**: Protected routes with HTTP-only JWT session cookies and bcrypt password hashing.
  - Default Admin: `admin@college.edu`
  - Default Password: `adminPassword123!`
- **Overview & Statistics**:
  - Total registered students
  - Total resumes analyzed
  - Total eligible students
  - Total participating companies & job roles
  - Live feed of recent registrations
- **Company Management ("Manage Placement Companies")**:
  - Dynamic company management without touching code.
  - Add, edit, activate/deactivate companies.
  - Configure Job Roles and criteria:
    - Minimum Qualification, Eligible Branches, Minimum CGPA, Graduation Year
    - Backlog Requirement, Required Skills, Preferred Skills, Package / CTC
  - Statuses: **Active**, **Inactive**, **Registration Closed**.
- **Placement Drive Management**:
  - Create new drives, configure drive dates, registration deadlines, and assign participating companies.
- **Student Candidate Management & Shortlisting**:
  - Search by Name, Email, Phone, Registration ID.
  - Filter by Branch, CGPA, Qualification, Registration Status.
  - **Company & Job Role Shortlist Filter**:
    - Select Company: `TCS` &bull; Select Job Role: `Software Developer`
    - Displays: **`Eligible Students: XX`**
    - Instant filtered shortlist ready for the placement cell.
  - **Export Data**: Single-click export of registered students or company shortlists to **Excel (`.xlsx`)** or **CSV**.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node.js v24)
- npm 10+

### Setup & Installation
```bash
# 1. Install dependencies
npm install

# 2. Synchronize SQLite / Prisma Database
npm run db:push

# 3. Seed active placement drive & sample companies
npm run db:seed
```

### Running the Application
```bash
npm run dev
```
Open [http://localhost:3000/placements](http://localhost:3000/placements) in your browser.

---

## 🗄️ Database Configuration (PostgreSQL / SQLite)

The system uses **Prisma ORM**. By default, it is configured with **SQLite** (`dev.db`) for immediate zero-configuration local operation.

To switch to **PostgreSQL**:
1. Open `prisma/schema.prisma` and update the datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/placement_db?schema=public"
   ```
3. Run `npx prisma db push && npm run db:seed`.

---

## 🧪 Testing

Run the automated end-to-end integration test:
```bash
npx tsx scripts/test-system.ts
```
Verifies:
- Strict Rule-Based CGPA and Backlog enforcement
- Resume mismatch warning detection
- Unique Registration ID sequential generator (`PD-2026-XXXXX`)
- Database drives, companies, and roles
- Admin user authentication
