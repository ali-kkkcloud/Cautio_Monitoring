import { google } from "googleapis";

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function getSheetData(sheetName) {
  try {
    const auth = await getAuth();
    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
    });
    return response.data.values || [];
  } catch (e) {
    console.error("getSheetData error:", e.message);
    return [];
  }
}

export async function appendRow(sheetName, values) {
  try {
    const auth = await getAuth();
    const sheets = google.sheets({ version: "v4", auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    });
    return true;
  } catch (e) {
    console.error("appendRow error:", e.message);
    return false;
  }
}

export async function updateRow(sheetName, rowIndex, values) {
  try {
    const auth = await getAuth();
    const sheets = google.sheets({ version: "v4", auth });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${rowIndex}:G${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    });
    return true;
  } catch (e) {
    console.error("updateRow error:", e.message);
    return false;
  }
}

// Get today's date in dd-MM-yyyy (IST)
export function getTodayIST() {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .format(new Date())
    .replace(/\//g, "-");
}

// Get current IST hour (0–23)
export function getCurrentHourIST() {
  return parseInt(
    new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
    }).format(new Date())
  );
}

export function formatDateIST(dateObj) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .format(dateObj)
    .replace(/\//g, "-");
}
