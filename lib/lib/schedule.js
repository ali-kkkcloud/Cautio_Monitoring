// ── PASTE YOUR CLIENT_TIMINGS AND EMPLOYEE_SPECIFIC_CLIENTS FROM YOUR APPS SCRIPT HERE ──
// Below is the structure — copy the full objects from your Google Apps Script

export const EMPLOYEE_SPECIFIC_CLIENTS = {
  GUNASAGARI: {
    8: ["CF-Mumbai"],
    9: ["CF-Chennai", "CF-Delhi"],
    10: ["CF-Hyderabad"],
    11: ["CF-Kolkata"],
    12: ["CF-Mumbai"],
    13: ["CF-Delhi"],
    14: ["CF-Hyderabad"],
    15: ["CF-Kolkata"],
    16: ["CF-Mumbai"],
    17: ["CF-Delhi", "CF-Hyderabad"],
  },
  BRINDA: {
    8: ["CF-Mumbai"],
    9: ["CF-Chennai", "CF-Delhi"],
  },
  Naveen: {
    20: ["CF-Mumbai", "CF-Kolkata"],
  },
  HARI: {
    12: ["DNR Express", "SHIV SAI TRAVEL AGENCY", "Leafy Bus"],
    13: ["Baba Travels", "Eco Mobility"],
    14: ["Naveen Travels", "Manish Travels", "New India Travels", "Pranjal Travels"],
  },
  Hariprasad: {
    21: ["Zingbus", "Prasanna Purple Mobility Solutions", "INF_ONE CAMPUS"],
    22: ["Kuehne Nagel", "Zingbus"],
    23: ["Prasanna Purple Mobility Solutions", "ABR Roadlines", "Leafy Bus", "Shree Sairam Travels"],
    0: ["Kuehne Nagel", "Zingbus"],
    1: ["Prasanna Purple Mobility Solutions", "ABR Roadlines", "Leafy Bus", "Shree Sairam Travels"],
    2: ["Kuehne Nagel", "Zingbus", "INF_ONE CAMPUS"],
    3: ["Prasanna Purple Mobility Solutions", "ABR Roadlines", "Leafy Bus", "Shree Sairam Travels"],
    4: ["Kuehne Nagel", "Zingbus"],
    5: ["Prasanna Purple Mobility Solutions", "ABR Roadlines", "Leafy Bus", "INF_ONE CAMPUS", "Zingbus"],
  },
};

export const EMPLOYEE_CUSTOM_TEXT = {
  BRINDA: { 10: "CALL", 11: "CALL", 12: "CALL", 13: "CALL", 14: "CALL", 15: "CALL", 16: "CALL", 17: "CALL" },
  Shashi: { 14: "Infants OFFLINE Calling" },
  Naveen: { 12: "DAMAGE FORM", 13: "DAMAGE FORM" },
  HARI: { 22: "OFFLINE REPORTS" },
};

// PASTE YOUR FULL CLIENT_TIMINGS OBJECT FROM YOUR APPS SCRIPT BELOW:
export const CLIENT_TIMINGS = {
  // ... paste all entries from your Apps Script here ...
  "Eco Mobility": [8, 9, 10, 12, 13, 14, 15, 17, 19, 20, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7],
  "Leafy Bus": [9, 10, 12, 14, 18, 20, 22, 23, 0, 1, 2, 3, 4, 5, 6],
  "Zingbus": [8, 13, 19, 22, 0, 2, 4, 5],
  "Kuehne Nagel": [8, 10, 12, 14, 15, 16, 18, 20, 22, 2, 4, 6],
  // Add all your clients...
};

// Get all clients active at a given hour
export function getClientsForHour(hour) {
  return Object.entries(CLIENT_TIMINGS)
    .filter(([_, hours]) => hours.includes(hour))
    .map(([name]) => name);
}

// Get all available employees at a given hour
export function getAvailableEmployees(employees, hour) {
  return employees.filter(emp => {
    if (emp.isNight) {
      return hour >= emp.start || hour < emp.end;
    }
    return hour >= emp.start && hour < emp.end;
  });
}

// Round-robin distribution (matches Apps Script logic exactly)
export function distributeRoundRobin(availableEmps, clients, hour, dayOfMonth, month) {
  const dist = {};
  availableEmps.forEach(e => (dist[e.name] = []));
  if (!availableEmps.length || !clients.length) return dist;
  const offset = ((dayOfMonth + month) + hour) % availableEmps.length;
  clients.forEach((c, i) => dist[availableEmps[(i + offset) % availableEmps.length].name].push(c));
  return dist;
}

// Main function: get clients for a specific employee at a specific hour
export function getEmployeeClientsForHour(employeeName, hour, date = new Date()) {
  const { EMPLOYEES } = require("./employees");

  // Custom text check
  const customText = EMPLOYEE_CUSTOM_TEXT[employeeName]?.[hour];
  if (customText) {
    return { type: "text", value: customText, clients: [] };
  }

  // Specific clients check
  const specificClients = EMPLOYEE_SPECIFIC_CLIENTS[employeeName]?.[hour];
  if (specificClients) {
    return { type: "clients", clients: specificClients };
  }

  // Get all available employees at this hour
  const availableEmps = getAvailableEmployees(EMPLOYEES, hour);
  const empIndex = availableEmps.findIndex(e => e.name === employeeName);
  if (empIndex === -1) {
    return { type: "inactive", clients: [] };
  }

  // Get clients for this hour, remove those assigned to specific employees
  let clients = getClientsForHour(hour);
  // Remove clients that are already specifically assigned to other employees
  Object.entries(EMPLOYEE_SPECIFIC_CLIENTS).forEach(([empName, hourMap]) => {
    if (empName !== employeeName && hourMap[hour]) {
      clients = clients.filter(c => !hourMap[hour].includes(c));
    }
  });

  // Distribute round-robin
  const dayOfMonth = date.getDate();
  const month = date.getMonth();
  const dist = distributeRoundRobin(
    availableEmps.filter(e => !EMPLOYEE_SPECIFIC_CLIENTS[e.name]?.[hour] && !EMPLOYEE_CUSTOM_TEXT[e.name]?.[hour]),
    clients,
    hour,
    dayOfMonth,
    month
  );

  return { type: "clients", clients: dist[employeeName] || [] };
}

export const TIME_SLOT_LABELS = {
  7: "7:00–8:00 AM", 8: "8:00–9:00 AM", 9: "9:00–10:00 AM", 10: "10:00–11:00 AM",
  11: "11:00–12:00 PM", 12: "12:00–1:00 PM", 13: "1:00–2:00 PM", 14: "2:00–3:00 PM",
  15: "3:00–4:00 PM", 16: "4:00–5:00 PM", 17: "5:00–6:00 PM", 18: "6:00–7:00 PM",
  19: "7:00–8:00 PM", 20: "8:00–9:00 PM", 21: "9:00–10:00 PM", 22: "10:00–11:00 PM",
  23: "11:00–12:00 AM", 0: "12:00–1:00 AM", 1: "1:00–2:00 AM", 2: "2:00–3:00 AM",
  3: "3:00–4:00 AM", 4: "4:00–5:00 AM", 5: "5:00–6:00 AM", 6: "6:00–7:00 AM",
};
