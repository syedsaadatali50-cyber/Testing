import { prisma } from "./prisma";

/**
 * Generates a unique placement drive registration ID, e.g. "PD-2026-00124"
 */
export async function generateRegistrationId(year: number = new Date().getFullYear()): Promise<string> {
  const prefix = `PD-${year}-`;
  
  // Count how many registrations already exist for this year prefix
  const count = await prisma.placementRegistration.count({
    where: {
      registrationId: {
        startsWith: prefix,
      },
    },
  });

  const nextSeq = count + 1;
  const padded = nextSeq.toString().padStart(5, "0");
  const candidate = `${prefix}${padded}`;

  // Double check uniqueness
  const existing = await prisma.placementRegistration.findUnique({
    where: { registrationId: candidate },
  });

  if (!existing) {
    return candidate;
  }

  // Fallback to timestamp-based if duplicate found
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${nextSeq + 100}-${randomSuffix}`;
}
