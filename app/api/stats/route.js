import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getSheetData, getTodayIST } from "@/lib/sheets";

function parseDate(dateStr) {
  const [day, month, year] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isInRange(dateStr, range) {
  try {
    const date = parseDate(dateStr);
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    if (range === "today") {
      const today = getTodayIST();
      return dateStr === today;
    }
    if (range === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return date >= weekAgo && date <= now;
    }
    if (range === "month") {
      const monthAgo = new Date(now);
      monthAgo.setDate(now.getDate() - 30);
      return date >= monthAgo && date <= now;
    }
    return true; // "all"
  } catch {
    return false;
  }
}

export async function GET(request) {
  const session = await getServerSession();
  if (!session?.user?.employeeName) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "today";
  const employeeName = session.user.employeeName;

  try {
    const [misalignData, alertData, fatigueData] = await Promise.all([
      getSheetData("Misalignment_Tracking"),
      getSheetData("Alert_Tracking"),
      getSheetData("Fatigue_Alerts_Tracking"),
    ]);

    // Misalignment stats
    // Cols: [Date, ClientName, VehicleNumbers, Count, Employee, TimeSlot, LastModified]
    let misalignCount = 0;
    let misalignByClient = {};
    const recentMisalign = [];

    misalignData.slice(1).forEach(row => {
      if (row[4] !== employeeName) return;
      if (!isInRange(row[0]?.toString(), range)) return;
      const count = parseInt(row[3]) || 0;
      misalignCount += count;
      const client = row[1] || "Unknown";
      misalignByClient[client] = (misalignByClient[client] || 0) + count;
      recentMisalign.push({
        date: row[0], client, vehicles: row[2], count, timeSlot: row[5]
      });
    });

    // Alert stats
    // Cols: [Date, ClientName, AlertCount, CountTotal, Employee, TimeSlot, LastModified]
    let alertCount = 0;
    let alertByClient = {};
    const recentAlerts = [];

    alertData.slice(1).forEach(row => {
      if (row[4] !== employeeName) return;
      if (!isInRange(row[0]?.toString(), range)) return;
      const count = parseInt(row[3]) || 0;
      alertCount += count;
      const client = row[1] || "Unknown";
      alertByClient[client] = (alertByClient[client] || 0) + count;
      recentAlerts.push({
        date: row[0], client, count, timeSlot: row[5]
      });
    });

    // Fatigue stats
    // Cols: [Date, ClientName, FatigueStatus, Count, Employee, TimeSlot, LastModified]
    let fatigueCount = 0;
    let fatigueByClient = {};
    const recentFatigue = [];

    fatigueData.slice(1).forEach(row => {
      if (row[4] !== employeeName) return;
      if (!isInRange(row[0]?.toString(), range)) return;
      const count = parseInt(row[3]) || 0;
      fatigueCount += count;
      const client = row[1] || "Unknown";
      fatigueByClient[client] = (fatigueByClient[client] || 0) + count;
      recentFatigue.push({
        date: row[0], client, status: row[2], count, timeSlot: row[5]
      });
    });

    // Top clients
    const allClients = new Set([
      ...Object.keys(misalignByClient),
      ...Object.keys(alertByClient),
      ...Object.keys(fatigueByClient),
    ]);
    const clientBreakdown = [...allClients].map(client => ({
      client,
      misalignments: misalignByClient[client] || 0,
      alerts: alertByClient[client] || 0,
      fatigue: fatigueByClient[client] || 0,
    })).sort((a, b) => (b.misalignments + b.alerts + b.fatigue) - (a.misalignments + a.alerts + a.fatigue));

    return NextResponse.json({
      totals: { misalignments: misalignCount, alerts: alertCount, fatigue: fatigueCount },
      clientBreakdown: clientBreakdown.slice(0, 20),
      recent: {
        misalignments: recentMisalign.slice(-10).reverse(),
        alerts: recentAlerts.slice(-10).reverse(),
        fatigue: recentFatigue.slice(-10).reverse(),
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
