import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getSheetData, getTodayIST, getCurrentHourIST } from "@/lib/sheets";
import { EMPLOYEE_NAMES } from "@/lib/employees";

const COLS_PER_EMP = 9;

export async function GET(request) {
  const session = await getServerSession();
  if (!session?.user?.employeeName) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedHour = searchParams.get("hour");
  const hour = requestedHour !== null ? parseInt(requestedHour) : getCurrentHourIST();

  try {
    const today = getTodayIST();
    const sheetName = `Schedule_${today}`;
    const data = await getSheetData(sheetName);

    if (!data || data.length === 0) {
      return NextResponse.json({
        clients: [],
        timeSlot: null,
        hour,
        message: "Schedule not generated yet for today. Run the Apps Script first.",
      });
    }

    const empName = session.user.employeeName;
    const empIndex = EMPLOYEE_NAMES.findIndex(
      n => n.toLowerCase() === empName.toLowerCase()
    );

    if (empIndex === -1) {
      return NextResponse.json({ clients: [], hour, message: "Employee not found in schedule." });
    }

    // Column for this employee (0-indexed in the data array)
    const empCol = 1 + empIndex * COLS_PER_EMP;

    // Find the time slot label for the given hour
    const TIME_SLOT_LABELS = {
      7: "7:00-8:00 AM", 8: "8:00-9:00 AM", 9: "9:00-10:00 AM", 10: "10:00-11:00 AM",
      11: "11:00-12:00 PM", 12: "12:00-1:00 PM", 13: "1:00-2:00 PM", 14: "2:00-3:00 PM",
      15: "3:00-4:00 PM", 16: "4:00-5:00 PM", 17: "5:00-6:00 PM", 18: "6:00-7:00 PM",
      19: "7:00-8:00 PM", 20: "8:00-9:00 PM", 21: "9:00-10:00 PM", 22: "10:00-11:00 PM",
      23: "11:00-12:00 AM", 0: "12:00-1:00 AM", 1: "1:00-2:00 AM", 2: "2:00-3:00 AM",
      3: "3:00-4:00 AM", 4: "4:00-5:00 AM", 5: "5:00-6:00 AM", 6: "6:00-7:00 AM",
    };

    const targetLabel = TIME_SLOT_LABELS[hour];
    const clients = [];
    let timeSlot = targetLabel;
    let inBlock = false;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const colZero = (row[0] || "").toString().trim();

      if (colZero === targetLabel) {
        inBlock = true;
      } else if (inBlock && colZero && colZero !== targetLabel) {
        break; // moved to next slot
      }

      if (inBlock) {
        const cellVal = (row[empCol] || "").toString().trim();
        if (
          cellVal &&
          !["⏸️ INACTIVE", "🌴 WEEK OFF", "✅ FREE", "⏸️ SHIFT NOT ACTIVE"].includes(cellVal) &&
          !cellVal.includes("INACTIVE") &&
          !cellVal.includes("WEEK OFF")
        ) {
          clients.push(cellVal);
        }
      }
    }

    return NextResponse.json({ clients, timeSlot, hour, sheetName });
  } catch (error) {
    console.error("Schedule route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
