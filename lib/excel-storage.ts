import path from "path";
import fs from "fs";
import { mkdir, writeFile, readFile } from "fs/promises";
import * as XLSX from "xlsx";

export interface ExcelRegistrationRecord {
  registrationId: string;
  registrationDate: string;
  studentName: string;
  email: string;
  phone: string;
  gender: string;
  qualification: string;
  branch: string;
  graduationYear: number | string;
  cgpa: number;
  backlogs: number;
  selectedCompanies: string; // The user's chosen companies
  allEligibleCompanies: string;
  technicalSkills: string;
  resumeUrl: string;
  interviewSchedule: string; // Date, day and time
  interviewVenue: string;
  status: string;
  placementDrive: string;
}

const EXCEL_DIR = path.join(process.cwd(), "public", "data");
const EXCEL_FILE_PATH = path.join(EXCEL_DIR, "Placement_Registrations_Master.xlsx");
const CSV_FILE_PATH = path.join(EXCEL_DIR, "Placement_Registrations_Master.csv");

/**
 * Appends or updates a registration entry in the master Excel sheet
 */
export async function saveRegistrationToExcel(record: ExcelRegistrationRecord): Promise<void> {
  try {
    await mkdir(EXCEL_DIR, { recursive: true });

    let existingRows: any[] = [];

    if (fs.existsSync(EXCEL_FILE_PATH)) {
      try {
        const fileBuffer = await readFile(EXCEL_FILE_PATH);
        const workbook = XLSX.read(fileBuffer, { type: "buffer" });
        const firstSheetName = workbook.SheetNames[0];
        if (firstSheetName) {
          existingRows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName]);
        }
      } catch (err) {
        console.warn("Could not read existing Excel file, creating fresh:", err);
      }
    }

    // Prepare formatted row
    const newRow = {
      "Registration ID": record.registrationId,
      "Submitted At": record.registrationDate,
      "Student Name": record.studentName,
      "Email Address": record.email,
      "Phone Number": record.phone,
      "Gender": record.gender,
      "Qualification": record.qualification,
      "Branch / Dept (From Resume)": record.branch,
      "Graduation Year (From Resume)": record.graduationYear,
      "CGPA": record.cgpa,
      "Backlogs (From Resume)": record.backlogs,
      "User-Selected Companies (Choice)": record.selectedCompanies,
      "All Eligible Companies": record.allEligibleCompanies,
      "Technical Skills (Extracted)": record.technicalSkills,
      "Resume Link": record.resumeUrl,
      "Interview Date & Time": record.interviewSchedule,
      "Interview Venue": record.interviewVenue,
      "Drive Name": record.placementDrive,
      "Status": record.status,
    };

    // Replace if registrationId already exists, else append
    const existingIndex = existingRows.findIndex(
      (r: any) => r["Registration ID"] === record.registrationId
    );

    if (existingIndex >= 0) {
      existingRows[existingIndex] = newRow;
    } else {
      existingRows.push(newRow);
    }

    // Build workbook
    const worksheet = XLSX.utils.json_to_sheet(existingRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

    // Write .xlsx file
    const xlsxBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    await writeFile(EXCEL_FILE_PATH, xlsxBuffer);

    // Write .csv mirror
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    await writeFile(CSV_FILE_PATH, csvContent, "utf-8");

    console.log(`✓ Stored registration ${record.registrationId} in Master Excel Sheet: ${EXCEL_FILE_PATH}`);
  } catch (error) {
    console.error("Error saving registration to Excel:", error);
  }
}
