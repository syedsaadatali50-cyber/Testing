import nodemailer from "nodemailer";

export interface InterviewSchedule {
  dayAndDate: string; // e.g. "Wednesday, November 25, 2026"
  time: string; // e.g. "09:30 AM IST"
  venue: string; // e.g. "TGMSC&CCC Campus, Hyderabad"
}

export interface EmailParams {
  toEmail: string;
  studentName: string;
  registrationId: string;
  selectedCompanies: string[];
  schedule: InterviewSchedule;
  placementDriveName: string;
}

/**
 * Calculates interview schedule based on drive date
 */
export function calculateInterviewSchedule(driveDate?: Date | string | null): InterviewSchedule {
  let targetDate = new Date();
  if (driveDate) {
    targetDate = new Date(driveDate);
  } else {
    targetDate.setDate(targetDate.getDate() + 14); // 2 weeks ahead
  }

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = daysOfWeek[targetDate.getDay()];
  const formattedDate = targetDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return {
    dayAndDate: `${dayName}, ${formattedDate}`,
    time: "09:30 AM IST",
    venue: "TGMSC&CCC Central Career Centre, Minorities Study Circle Complex, Hyderabad, Telangana",
  };
}

/**
 * Sends automated placement registration confirmation email
 */
export async function sendRegistrationConfirmationEmail(
  params: EmailParams
): Promise<{ success: boolean; messageId?: string; simulated?: boolean }> {
  const { toEmail, studentName, registrationId, selectedCompanies, schedule, placementDriveName } =
    params;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4fbf7; color: #1e293b; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #d1fae5; overflow: hidden; box-shadow: 0 4px 12px rgba(10, 61, 36, 0.08); }
        .header { background: linear-gradient(135deg, #0a3d24 0%, #0f6e4d 60%, #17835d 100%); color: #ffffff; padding: 26px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: #ffffff; }
        .header p { margin: 6px 0 0 0; font-size: 13px; color: #a7f3d0; font-weight: 500; }
        .dept-tag { display: inline-block; background: rgba(200, 153, 44, 0.25); color: #fde68a; font-size: 11px; padding: 2px 10px; border-radius: 9999px; margin-top: 8px; border: 1px solid #c8992c; }
        .content { padding: 28px; font-size: 14px; line-height: 1.6; }
        .badge { display: inline-block; background: #dcfce7; color: #166534; font-weight: bold; padding: 5px 14px; border-radius: 9999px; font-size: 12px; margin-bottom: 16px; border: 1px solid #86efac; }
        .schedule-box { background: #f0fdf4; border: 2px solid #34d399; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .schedule-box h3 { margin: 0 0 10px 0; color: #065f46; font-size: 16px; font-weight: 700; }
        .schedule-row { margin-bottom: 8px; font-size: 13px; }
        .schedule-label { font-weight: bold; color: #047857; width: 130px; display: inline-block; }
        .companies-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 18px 0; }
        .company-pill { display: inline-block; background: #ecfdf5; color: #065f46; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; margin: 3px 4px 3px 0; border: 1px solid #a7f3d0; }
        .instructions { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 10px; padding: 16px; font-size: 12px; color: #92400e; margin-top: 20px; }
        .footer { background: #064e3b; color: #a7f3d0; padding: 20px; text-align: center; font-size: 11px; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TGMSC&amp;CCC — Placement Drive</h1>
          <p>Telangana Minorities Study Circle &amp; Career Counselling Centre</p>
          <div class="dept-tag">Government of Telangana &bull; Minorities Welfare Department</div>
        </div>
        <div class="content">
          <div class="badge">&#10003; REGISTRATION CONFIRMED</div>
          <p>Dear <strong>${studentName}</strong>,</p>
          <p>
            Your placement drive registration for <strong>${placementDriveName}</strong> has been successfully confirmed.
            Your unique Registration ID is <strong style="color: #0f6e4d; font-family: monospace; font-size: 16px; background: #ecfdf5; padding: 2px 8px; border-radius: 4px; border: 1px solid #6ee7b7;">${registrationId}</strong>.
          </p>

          <div class="schedule-box">
            <h3>&#128197; Official Interview Schedule</h3>
            <p style="margin: 0 0 12px 0; font-size: 13.5px; color: #065f46; font-weight: 600;">
              Your registration has been confirmed and you can come to interview on the following day and time:
            </p>
            <div class="schedule-row">
              <span class="schedule-label">Interview Date:</span> <strong>${schedule.dayAndDate}</strong>
            </div>
            <div class="schedule-row">
              <span class="schedule-label">Reporting Time:</span> <strong>${schedule.time}</strong>
            </div>
            <div class="schedule-row">
              <span class="schedule-label">Venue:</span> <span>${schedule.venue}</span>
            </div>
          </div>

          <div class="companies-box">
            <strong style="display: block; margin-bottom: 8px; font-size: 13px; color: #334155;">
              Companies Selected for Interview (${selectedCompanies.length}):
            </strong>
            <div>
              ${selectedCompanies.map((c) => `<span class="company-pill">${c}</span>`).join("")}
            </div>
          </div>

          <div class="instructions">
            <strong>Important Guidelines for Drive Day:</strong>
            <ul style="margin: 8px 0 0 0; padding-left: 20px;">
              <li>Please report at the centre at least 30 minutes prior to scheduled time.</li>
              <li>Carry 2 printed copies of your resume, Government ID / Hall Ticket, and qualification certificates.</li>
              <li>Dress in formal attire for the recruitment interviews.</li>
            </ul>
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} TGMSC&amp;CCC &bull; Telangana Minorities Study Circle &amp; Career Counselling Centre<br/>
          Government of Telangana &bull; Minorities Welfare Department &bull; Hyderabad
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
TGMSC&CCC Placement Drive — Registration Confirmed
Telangana Minorities Study Circle & Career Counselling Centre
Government of Telangana

Dear ${studentName},

Your placement drive registration has been confirmed and you can come to interview on:
- Date & Day: ${schedule.dayAndDate}
- Reporting Time: ${schedule.time}
- Venue: ${schedule.venue}

Registration ID: ${registrationId}
Placement Drive: ${placementDriveName}
Selected Companies: ${selectedCompanies.join(", ")}

Please bring 2 copies of your resume, educational certificates, and photo ID.

TGMSC&CCC Placement & Career Counselling Cell
Government of Telangana
  `;

  // 1. Check if Resend API Key is provided (Modern REST API)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const fromEmail =
        process.env.EMAIL_FROM ||
        process.env.SMTP_FROM ||
        "TGMSC Placement Cell <onboarding@resend.dev>";

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: toEmail,
          subject: `Registration Confirmed: ${placementDriveName} [${registrationId}]`,
          html: htmlContent,
          text: textContent,
        }),
      });

      const data = await res.json();
      if (res.ok && data.id) {
        console.log(`✓ Real confirmation email sent via Resend API to ${toEmail}: ID ${data.id}`);
        return { success: true, messageId: data.id, simulated: false };
      } else {
        console.error("Resend API response error:", data);
      }
    } catch (err) {
      console.error("Resend fetch error:", err);
    }
  }

  // 2. Check if standard SMTP credentials exist (Gmail, SendGrid, Brevo, AWS SES, etc.)
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM || process.env.EMAIL_FROM || "placements@tgmsc.gov.in";

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: `"TGMSC&CCC Placement Cell" <${fromEmail}>`,
        to: toEmail,
        subject: `Registration Confirmed: ${placementDriveName} [${registrationId}]`,
        text: textContent,
        html: htmlContent,
      });

      console.log(`✓ Real confirmation email sent to ${toEmail}: MessageId ${info.messageId}`);
      return { success: true, messageId: info.messageId, simulated: false };
    } catch (err) {
      console.error("SMTP error sending email, logging confirmation fallback:", err);
    }
  }

  // Fallback logging simulation
  console.log(`\n======================================================`);
  console.log(`[AUTOMATIC EMAIL CONFIRMATION DISPATCHED]`);
  console.log(`To: ${toEmail}`);
  console.log(`Subject: Registration Confirmed: ${placementDriveName} [${registrationId}]`);
  console.log(`Message: Your registration has been confirmed and you can come to interview on ${schedule.dayAndDate} at ${schedule.time} at ${schedule.venue}`);
  console.log(`Selected Companies: ${selectedCompanies.join(", ")}`);
  console.log(`======================================================\n`);

  return { success: true, simulated: true };
}
