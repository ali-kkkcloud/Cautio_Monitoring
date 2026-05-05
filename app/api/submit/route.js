import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { appendRow, getSheetData, getTodayIST, formatDateIST, getCurrentHourIST } from "@/lib/sheets";
import { TIME_SLOT_LABELS } from "@/lib/schedule";

export async function POST(request) {
  const session = await getServerSession();
  if (!session?.user?.employeeName) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { clientName, misalignmentVehicles, alertCount, fatigueStatus, fatigueCount, hour } = body;

  if (!clientName) {
    return NextResponse.json({ error: "Client name required" }, { status: 400 });
  }

  const employeeName = session.user.employeeName;
  const today = getTodayIST();
  const timestamp = formatDateIST(new Date());
  const currentHour = hour ?? getCurrentHourIST();
  const timeSlot = TIME_SLOT_LABELS[currentHour] || `${currentHour}:00`;

  const results = { misalignment: false, alert: false, fatigue: false };

  try {
    // Write misalignment
    if (misalignmentVehicles && misalignmentVehicles.trim()) {
      const vehicles = misalignmentVehicles.split(",").map(v => v.trim()).filter(Boolean);
      if (vehicles.length > 0) {
        // Check for existing row
        const existing = await getSheetData("Misalignment_Tracking");
        let existingRowIdx = -1;
        for (let i = existing.length - 1; i >= 1; i--) {
          const row = existing[i];
          if (
            row[0]?.toString() === today &&
            row[1] === clientName &&
            row[4] === employeeName &&
            row[5] === timeSlot
          ) {
            existingRowIdx = i + 1; // 1-indexed
            break;
          }
        }

        if (existingRowIdx > 0) {
          // Update existing — append new unique vehicles
          const existingVehicles = (existing[existingRowIdx - 1][2] || "").split(",").map(v => v.trim());
          const newVehicles = vehicles.filter(v => !existingVehicles.includes(v));
          if (newVehicles.length > 0) {
            const combined = [...existingVehicles, ...newVehicles].filter(Boolean);
            const { google } = await import("googleapis");
            const { getSheets } = await import("@/lib/sheets-internal");
            // Fallback: just append a new row with new vehicles
            await appendRow("Misalignment_Tracking", [
              today, clientName, newVehicles.join(", "), newVehicles.length, employeeName, timeSlot, timestamp,
            ]);
          }
        } else {
          await appendRow("Misalignment_Tracking", [
            today, clientName, vehicles.join(", "), vehicles.length, employeeName, timeSlot, timestamp,
          ]);
        }
        results.misalignment = true;
      }
    }

    // Write alerts
    const alertNum = parseInt(alertCount) || 0;
    if (alertNum > 0) {
      await appendRow("Alert_Tracking", [
        today, clientName, alertNum, alertNum, employeeName, timeSlot, timestamp,
      ]);
      results.alert = true;
    }

    // Write fatigue
    const fatigueNum = parseInt(fatigueCount) || 0;
    if (fatigueStatus === "Yes" && fatigueNum > 0) {
      await appendRow("Fatigue_Alerts_Tracking", [
        today, clientName, "Yes", fatigueNum, employeeName, timeSlot, timestamp,
      ]);
      results.fatigue = true;
    }

    return NextResponse.json({ success: true, results, timestamp });
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
