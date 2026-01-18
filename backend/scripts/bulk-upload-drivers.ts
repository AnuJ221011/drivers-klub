import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import csvParser from "csv-parser";
import { prisma } from "@driversklub/database";
import { UserRole } from "@prisma/client";

type CliOptions = {
  file: string;
  fleetId: string;
  hubId?: string;
  dryRun: boolean;
  updateExisting: boolean;
};

type UploadRow = Record<string, string | undefined>;

function usage(): string {
  return `
Bulk upload drivers from a Google Sheet CSV export.

Required:
  --file <path>         Path to CSV file
  --fleetId <uuid>      Fleet ID to assign drivers to

Optional:
  --hubId <uuid>        Hub ID to assign drivers to (default: none)
  --dryRun              Validate + show actions, but do not write to DB
  --updateExisting      Update existing driver/user fields if already present

Example:
  npx tsx scripts/bulk-upload-drivers.ts --file ./drivers.csv --fleetId <FLEET_UUID> --hubId <HUB_UUID> --updateExisting

Expected CSV headers (case-insensitive; extra columns are ignored):
  firstName
  lastName
  profilePic
  mobile
  driverLicenseFront
  driverLicenseBack
  adharFrontSide
  adharBackSide
  panCardFrontSide
  identityLivePhoto
  bankDetails.bankIdProof
`;
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    file: "",
    fleetId: "",
    hubId: undefined,
    dryRun: false,
    updateExisting: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") {
      console.log(usage());
      process.exit(0);
    }
    if (a === "--dryRun") {
      opts.dryRun = true;
      continue;
    }
    if (a === "--updateExisting") {
      opts.updateExisting = true;
      continue;
    }
    if (a === "--file") {
      opts.file = String(argv[++i] || "");
      continue;
    }
    if (a === "--fleetId") {
      opts.fleetId = String(argv[++i] || "");
      continue;
    }
    if (a === "--hubId") {
      opts.hubId = String(argv[++i] || "");
      continue;
    }
  }

  if (!opts.file || !opts.fleetId) {
    console.error(usage());
    process.exit(1);
  }

  return opts;
}

function normalizeHeaderKey(k: string): string {
  return (k || "").trim().toLowerCase();
}

function getValue(row: UploadRow, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim() !== "") return v.trim();
  }
  return undefined;
}

function normalizePhone(raw?: string): string | null {
  const s = String(raw || "").trim();
  if (!s) return null;
  const digits = s.replace(/[^\d]/g, "");
  if (!digits) return null;
  // Handle +91XXXXXXXXXX / 91XXXXXXXXXX
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  // Keep last 10 digits if longer (common copy/paste from sheets)
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

async function main() {
  const opts = parseArgs(process.argv);

  const csvPath = path.resolve(process.cwd(), opts.file);
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }

  // Validate fleet upfront
  const fleet = await prisma.fleet.findUnique({ where: { id: opts.fleetId } });
  if (!fleet) throw new Error(`Fleet not found: ${opts.fleetId}`);

  let total = 0;
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: Array<{ row: number; mobile?: string | null; error: string }> = [];

  console.log(`[bulk-upload-drivers] file=${csvPath}`);
  console.log(`[bulk-upload-drivers] fleetId=${opts.fleetId} hubId=${opts.hubId || "(none)"}`);
  console.log(`[bulk-upload-drivers] dryRun=${opts.dryRun} updateExisting=${opts.updateExisting}`);

  await new Promise<void>((resolve, reject) => {
    const stream = fs
      .createReadStream(csvPath)
      .pipe(
        csvParser({
          mapHeaders: ({ header }) => normalizeHeaderKey(header),
          mapValues: ({ value }) => (typeof value === "string" ? value.trim() : value),
        })
      );

    let rowNum = 1; // header line is 1

    stream.on("data", async (rawRow: UploadRow) => {
      stream.pause();
      rowNum++;
      total++;

      try {
        const firstName = getValue(rawRow, ["firstname", "first_name", "first name"]) || "";
        const lastName = getValue(rawRow, ["lastname", "last_name", "last name"]) || "";
        const mobileRaw = getValue(rawRow, ["mobile", "phone", "mobilenumber", "mobile number"]);
        const mobile = normalizePhone(mobileRaw);

        if (!firstName) throw new Error("Missing firstName");
        if (!mobile) throw new Error("Missing/invalid mobile");

        const profilePic = getValue(rawRow, ["profilepic", "profile_pic", "profile picture"]);
        const licenseFront = getValue(rawRow, ["driverlicensefront", "driver_license_front", "licensefront"]);
        const licenseBack = getValue(rawRow, ["driverlicenseback", "driver_license_back", "licenseback"]);
        const aadharFront = getValue(rawRow, ["adharfrontside", "aadharfront", "aadhar_front"]);
        const aadharBack = getValue(rawRow, ["adharbackside", "aadharback", "aadhar_back"]);
        const panCardImage = getValue(rawRow, ["pancardfrontside", "pancardimage", "pan_card_front"]);
        const livePhoto = getValue(rawRow, ["identitylivephoto", "livephoto", "identity_live_photo"]);
        const bankIdProof = getValue(rawRow, ["bankdetails.bankidproof", "bankidproof", "bank_id_proof"]);

        const fullName = `${firstName} ${lastName}`.trim();

        const existingUser = await prisma.user.findUnique({ where: { phone: mobile } });
        if (existingUser && existingUser.role !== UserRole.DRIVER) {
          throw new Error(`User with phone exists but role is ${existingUser.role} (expected DRIVER)`);
        }

        const createOrUpdate = async () => {
          // Ensure user exists
          const user = await prisma.user.upsert({
            where: { phone: mobile },
            create: {
              name: fullName,
              phone: mobile,
              role: UserRole.DRIVER,
              fleetId: opts.fleetId,
              hubIds: [],
              isActive: true,
            },
            update: opts.updateExisting
              ? {
                  name: fullName,
                  role: UserRole.DRIVER,
                  fleetId: opts.fleetId,
                  isActive: true,
                }
              : {
                  // keep existing fields; only ensure scope is set for data consistency
                  fleetId: existingUser?.fleetId ?? opts.fleetId,
                },
          });

          const driverUpdate: Record<string, any> = {
            fleetId: opts.fleetId,
            hubId: opts.hubId ?? null,
            firstName,
            lastName,
            mobile,
          };

          // Only set optional media fields if provided (or when updateExisting=true)
          const maybeSet = (key: string, val?: string) => {
            if (typeof val === "string" && val.trim() !== "") driverUpdate[key] = val.trim();
            else if (opts.updateExisting) driverUpdate[key] = val || null;
          };
          maybeSet("profilePic", profilePic);
          maybeSet("licenseFront", licenseFront);
          maybeSet("licenseBack", licenseBack);
          maybeSet("aadharFront", aadharFront);
          maybeSet("aadharBack", aadharBack);
          maybeSet("panCardImage", panCardImage);
          maybeSet("livePhoto", livePhoto);
          maybeSet("bankIdProof", bankIdProof);

          // Upsert driver by unique userId
          const existingDriver = await prisma.driver.findUnique({ where: { userId: user.id } });

          if (!existingDriver) {
            await prisma.driver.create({
              data: {
                userId: user.id,
                fleetId: opts.fleetId,
                hubId: opts.hubId ?? null,
                firstName,
                lastName,
                mobile,
                profilePic: profilePic || null,
                licenseFront: licenseFront || null,
                licenseBack: licenseBack || null,
                aadharFront: aadharFront || null,
                aadharBack: aadharBack || null,
                panCardImage: panCardImage || null,
                livePhoto: livePhoto || null,
                bankIdProof: bankIdProof || null,
              },
            });
            created++;
            return;
          }

          if (!opts.updateExisting) {
            skipped++;
            return;
          }

          await prisma.driver.update({
            where: { id: existingDriver.id },
            data: driverUpdate,
          });
          updated++;
        };

        if (opts.dryRun) {
          console.log(`[dryRun] row=${rowNum} mobile=${mobile} name=${fullName}`);
          stream.resume();
          return;
        }

        // Keep each row atomic
        await prisma.$transaction(async () => {
          await createOrUpdate();
        });
      } catch (e: any) {
        errors.push({
          row: rowNum,
          mobile: normalizePhone(getValue(rawRow, ["mobile", "phone"])) ?? null,
          error: e?.message || String(e),
        });
      } finally {
        stream.resume();
      }
    });

    stream.on("end", () => resolve());
    stream.on("error", (e) => reject(e));
  });

  console.log("\n[bulk-upload-drivers] done");
  console.log({ total, created, updated, skipped, errors: errors.length });
  if (errors.length) {
    console.log("\n[bulk-upload-drivers] errors:");
    for (const er of errors.slice(0, 50)) console.log(er);
    if (errors.length > 50) console.log(`...and ${errors.length - 50} more`);
  }

  await prisma.$disconnect();
  if (errors.length) process.exitCode = 1;
}

main().catch(async (e) => {
  console.error("[bulk-upload-drivers] fatal:", e);
  try {
    await prisma.$disconnect();
  } catch {}
  process.exit(1);
});

