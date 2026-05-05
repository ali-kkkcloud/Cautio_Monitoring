export const EMPLOYEES = [
  { name: "Sunil",      start: 7,  end: 16, isNight: false },
  { name: "Ali",        start: 7,  end: 9,  isNight: false },
  { name: "Mahesh",     start: 7,  end: 16, isNight: false },
  { name: "Ritanjali",  start: 8,  end: 12, isNight: false },
  { name: "Nesiya",     start: 8,  end: 17, isNight: false },
  { name: "BRINDA",     start: 8,  end: 17, isNight: false },
  { name: "GUNASAGARI", start: 8,  end: 17, isNight: false },
  { name: "Rakesh",     start: 12, end: 21, isNight: false },
  { name: "RISHI",      start: 12, end: 21, isNight: false },
  { name: "Shashi",     start: 12, end: 21, isNight: false },
  { name: "Naveen",     start: 12, end: 21, isNight: false },
  { name: "Hariprasad", start: 21, end: 6,  isNight: true  },
  { name: "HARI",       start: 21, end: 6,  isNight: true  },
  { name: "KIRAN",      start: 21, end: 6,  isNight: true  },
  { name: "CHANDAN",    start: 22, end: 7,  isNight: true  },
  { name: "MANTU",      start: 22, end: 7,  isNight: true  },
];

export const EMPLOYEE_NAMES = EMPLOYEES.map(e => e.name);

export function getEmployeeByName(name) {
  return EMPLOYEES.find(e => e.name.toLowerCase() === name.toLowerCase());
}

export function isEmployeeOnShift(emp, hour) {
  if (emp.isNight) {
    return hour >= emp.start || hour < emp.end;
  }
  return hour >= emp.start && hour < emp.end;
}

export function getPasswordMap() {
  const raw = process.env.EMP_PASSWORDS || "";
  const map = {};
  raw.split(",").forEach(pair => {
    const [name, pass] = pair.split(":");
    if (name && pass) map[name.trim().toLowerCase()] = pass.trim();
  });
  return map;
}
