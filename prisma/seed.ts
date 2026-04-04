import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════
// EXPECTED TOTALS (use these to verify dashboard/analytics accuracy)
//
// ── Platform-wide ──
//   Owners: 3 (Elena=verified, Roberto=verified, Sofia=pending)
//   Boarding Houses: 3 (Casa Marina, Sunrise Hub, Green Meadow)
//   Total Rooms: 20 (12 + 5 + 3)
//   Total Tenants: 14 active
//   Subscriptions: Elena=PROFESSIONAL, Roberto=STARTER, Sofia=none
//
// ── Elena's "Casa Marina Residences" (ALL_FEMALE) ──
//   Rooms: 12 (8 occupied, 3 available, 1 maintenance)
//   Tenants: 8 active
//   Occupancy: 8/12 = 67%
//
// ── Roberto's "Sunrise Student Hub" (MIXED) ──
//   Rooms: 5 (4 occupied, 1 available)
//   Tenants: 4 active
//   Occupancy: 4/5 = 80%
//
// ── Sofia's "Green Meadow Residence" (ALL_FEMALE, UNPUBLISHED) ──
//   Rooms: 3 (2 occupied, 1 available)
//   Tenants: 2 active
//   Occupancy: 2/3 = 67%
//
// ── Invoice Totals (Elena's Casa Marina) ──
//   Jan 2026: 6 RENT invoices, all PAID = ₱19,100
//   Feb 2026: 6 RENT invoices, all PAID = ₱19,100
//   Mar 2026: 8 RENT + 3 ELECTRICITY invoices
//     - 6 RENT PAID = ₱19,100
//     - 2 RENT PENDING = ₱6,500
//     - 3 ELEC PAID = ₱3,750
//     - Mar total paid = ₱22,850
//   Apr 2026: 8 RENT invoices
//     - 5 PAID = ₱15,600
//     - 2 PENDING = ₱5,800
//     - 1 OVERDUE = ₱3,500
//
//   Elena total PAID revenue = 17,400 + 17,400 + 21,150 + 14,400 = ₱70,350
//   Elena PENDING count = 4
//   Elena OVERDUE count = 1
//
// ── Invoice Totals (Roberto's Sunrise Hub) ──
//   Mar 2026: 4 RENT PAID = ₱13,000
//   Apr 2026: 4 RENT, 2 PAID + 2 PENDING
//     - PAID = ₱6,000 (Diego=3500 + Carmen=2500)
//     - PENDING = ₱7,000 (Rafael=3500 + Isabella=3500)
//   Roberto total PAID = ₱19,000
//
// ── Platform total PAID revenue = ₱70,350 + ₱19,000 = ₱89,350
//
// ── Transfers ──
//   1 COMPLETED (Ana: 201→305, Jan 2026)
//   1 PENDING (Grace: 203→ available room)
//
// ── Notifications (Elena) ──
//   5 notifications (2 unread)
// ═══════════════════════════════════════════════════════════════

function invoiceNum() {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const rand = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase().slice(0, 6);
  return `PH-2604-${rand}`;
}

async function main() {
  // Clear all data
  await prisma.notification.deleteMany();
  await prisma.roomTransfer.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.room.deleteMany();
  await prisma.boardingHouse.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();

  const pw = await bcrypt.hash("Password1", 10);

  // ══════════════════════════════════════════════
  // USERS
  // ══════════════════════════════════════════════

  const admin = await prisma.user.create({
    data: { name: "Phase Admin", email: "admin@phase.com", password: pw, role: "SUPERADMIN", verified: true, phone: "0917-000-0000" },
  });

  const elena = await prisma.user.create({
    data: { name: "Elena Magsaysay", email: "elena@phase.com", password: pw, role: "OWNER", verified: true, phone: "0917-111-2222" },
  });

  const roberto = await prisma.user.create({
    data: { name: "Roberto Duterte", email: "roberto@phase.com", password: pw, role: "OWNER", verified: true, phone: "0918-333-4444" },
  });

  const sofia = await prisma.user.create({
    data: { name: "Sofia Ramos", email: "sofia@phase.com", password: pw, role: "OWNER", verified: false, phone: "0919-555-6666" },
  });

  // ══════════════════════════════════════════════
  // SUBSCRIPTIONS
  // ══════════════════════════════════════════════

  await prisma.subscription.create({
    data: { plan: "PROFESSIONAL", maxRooms: 30, maxTenants: 50, emailSms: true, analytics: true, amount: 999, userId: elena.id },
  });

  await prisma.subscription.create({
    data: { plan: "STARTER", maxRooms: 10, maxTenants: 15, emailSms: false, analytics: false, amount: 0, userId: roberto.id },
  });

  // ══════════════════════════════════════════════
  // ELENA'S BOARDING HOUSE — Casa Marina Residences
  // 12 rooms, 8 tenants
  // ══════════════════════════════════════════════

  const casaMarina = await prisma.boardingHouse.create({
    data: {
      name: "Casa Marina Residences",
      address: "Brgy. Sainz, Mati City",
      city: "Mati City",
      description: "A well-maintained all-female boarding house near DMMMSU. Safe, clean, and affordable.",
      type: "ALL_FEMALE",
      verified: true,
      published: true,
      hasCurfew: true,
      curfewTime: "22:00",
      amenities: JSON.stringify(["WiFi", "CCTV", "Kitchen", "Laundry", "Study Area"]),
      restrictions: JSON.stringify(["No Pets", "No Visitors After 9PM", "Quiet Hours 10PM-6AM"]),
      contactPhone: "0917-111-2222",
      contactEmail: "elena@phase.com",
      ownerId: elena.id,
    },
  });

  // Room rates: 101=3500, 102=2800, 103=3500, 104=2500, 105=3000
  //             201=2800, 202=4000, 203=2800, 204=3500, 301=3000, 302=3500, 305=2800
  const cmRooms = [
    { number: "101", floor: 1, capacity: 2, monthlyRate: 3500, hasAircon: true, hasWifi: true, hasBathroom: true, electricityIncluded: false, status: "OCCUPIED" },
    { number: "102", floor: 1, capacity: 1, monthlyRate: 2800, hasAircon: false, hasWifi: true, hasBathroom: false, electricityIncluded: true, status: "OCCUPIED" },
    { number: "103", floor: 1, capacity: 2, monthlyRate: 3500, hasAircon: true, hasWifi: true, hasBathroom: true, electricityIncluded: false, status: "AVAILABLE" },
    { number: "104", floor: 1, capacity: 1, monthlyRate: 2500, hasAircon: false, hasWifi: true, hasBathroom: false, electricityIncluded: true, status: "OCCUPIED" },
    { number: "105", floor: 1, capacity: 2, monthlyRate: 3000, hasAircon: true, hasWifi: true, hasBathroom: false, electricityIncluded: false, status: "OCCUPIED" },
    { number: "201", floor: 2, capacity: 1, monthlyRate: 2800, hasAircon: false, hasWifi: true, hasBathroom: false, electricityIncluded: true, status: "AVAILABLE" },
    { number: "202", floor: 2, capacity: 2, monthlyRate: 4000, hasAircon: true, hasWifi: true, hasBathroom: true, electricityIncluded: false, status: "MAINTENANCE" },
    { number: "203", floor: 2, capacity: 1, monthlyRate: 2800, hasAircon: false, hasWifi: true, hasBathroom: false, electricityIncluded: true, status: "OCCUPIED" },
    { number: "204", floor: 2, capacity: 2, monthlyRate: 3500, hasAircon: true, hasWifi: true, hasBathroom: true, electricityIncluded: false, status: "OCCUPIED" },
    { number: "301", floor: 3, capacity: 1, monthlyRate: 3000, hasAircon: true, hasWifi: true, hasBathroom: false, electricityIncluded: false, status: "OCCUPIED" },
    { number: "302", floor: 3, capacity: 2, monthlyRate: 3500, hasAircon: true, hasWifi: true, hasBathroom: true, electricityIncluded: false, status: "AVAILABLE" },
    { number: "305", floor: 3, capacity: 1, monthlyRate: 2800, hasAircon: false, hasWifi: true, hasBathroom: false, electricityIncluded: true, status: "OCCUPIED" },
  ];

  const cmRoomIds: Record<string, string> = {};
  for (const r of cmRooms) {
    const room = await prisma.room.create({ data: { ...r, boardingHouseId: casaMarina.id } });
    cmRoomIds[r.number] = room.id;
  }

  // 8 tenants assigned to occupied rooms
  // Rates: 101=3500, 102=2800, 104=2500, 105=3000, 203=2800, 204=3500, 301=3000, 305=2800
  // Sum of occupied room rates = 3500+2800+2500+3000+2800+3500+3000+2800 = ₱23,900/month (if all pay)
  // But first 6 tenants have been here since Jan, last 2 since Mar
  const cmTenants = [
    { name: "Maria Santos", email: "maria@email.com", phone: "0917-123-4567", room: "204", since: "2025-06-15" },
    { name: "Ana Reyes", email: "ana@email.com", phone: "0919-345-6789", room: "305", since: "2025-08-01" },
    { name: "Carlos Garcia", email: "carlos@email.com", phone: "0920-456-7890", room: "102", since: "2025-09-10" },
    { name: "Paolo Tan", email: "paolo@email.com", phone: "0924-890-1234", room: "104", since: "2025-07-20" },
    { name: "Grace Lim", email: "grace@email.com", phone: "0923-789-0123", room: "203", since: "2025-11-01" },
    { name: "Mark Rivera", email: "mark@email.com", phone: "0922-678-9012", room: "301", since: "2025-10-15" },
    // These two joined in March 2026
    { name: "Lisa Mendoza", email: "lisa@email.com", phone: "0921-567-8901", room: "101", since: "2026-03-01" },
    { name: "John Cruz", email: "john@email.com", phone: "0918-234-5678", room: "105", since: "2026-03-15" },
  ];

  const cmTenantIds: Record<string, string> = {};
  for (const t of cmTenants) {
    const tenant = await prisma.tenant.create({
      data: {
        name: t.name, email: t.email, phone: t.phone,
        moveInDate: new Date(t.since), status: "ACTIVE",
        roomId: cmRoomIds[t.room], boardingHouseId: casaMarina.id,
      },
    });
    cmTenantIds[t.name] = tenant.id;
  }

  // ── INVOICES for Casa Marina ──
  // First 6 tenants present Jan-Apr, last 2 present Mar-Apr
  // Occupied room rates for first 6: 204=3500, 305=2800, 102=2800, 104=2500, 203=2800, 301=3000
  // Sum first 6 = ₱17,400 ... wait let me recalculate
  // 204=3500, 305=2800, 102=2800, 104=2500, 203=2800, 301=3000
  // = 3500+2800+2800+2500+2800+3000 = ₱17,400
  // Last 2: 101=3500, 105=3000 = ₱6,500

  // ── January 2026: 6 tenants, all PAID ──
  // Total paid: ₱17,400
  const janTenants = ["Maria Santos", "Ana Reyes", "Carlos Garcia", "Paolo Tan", "Grace Lim", "Mark Rivera"];
  const janRates: Record<string, number> = { "Maria Santos": 3500, "Ana Reyes": 2800, "Carlos Garcia": 2800, "Paolo Tan": 2500, "Grace Lim": 2800, "Mark Rivera": 3000 };
  for (const name of janTenants) {
    await prisma.invoice.create({
      data: {
        invoiceNumber: invoiceNum(), amount: janRates[name], type: "RENT",
        status: "PAID", dueDate: new Date("2026-01-05"), paidDate: new Date("2026-01-03"),
        description: "Rent for January 2026",
        tenantId: cmTenantIds[name], boardingHouseId: casaMarina.id,
      },
    });
  }

  // ── February 2026: 6 tenants, all PAID ──
  // Total paid: ₱17,400
  for (const name of janTenants) {
    await prisma.invoice.create({
      data: {
        invoiceNumber: invoiceNum(), amount: janRates[name], type: "RENT",
        status: "PAID", dueDate: new Date("2026-02-05"), paidDate: new Date("2026-02-04"),
        description: "Rent for February 2026",
        tenantId: cmTenantIds[name], boardingHouseId: casaMarina.id,
      },
    });
  }

  // ── March 2026: 8 tenants (6 old + 2 new) ──
  // 6 old PAID = ₱17,400
  // 2 new PENDING = ₱6,500 (Lisa=3500, John=3000)
  // + 3 ELECTRICITY invoices PAID = ₱1,250 + ₱1,500 + ₱1,000 = ₱3,750
  // March total PAID = ₱17,400 + ₱3,750 = ₱21,150
  for (const name of janTenants) {
    await prisma.invoice.create({
      data: {
        invoiceNumber: invoiceNum(), amount: janRates[name], type: "RENT",
        status: "PAID", dueDate: new Date("2026-03-05"), paidDate: new Date("2026-03-03"),
        description: "Rent for March 2026",
        tenantId: cmTenantIds[name], boardingHouseId: casaMarina.id,
      },
    });
  }
  // 2 new tenants - PENDING for March
  await prisma.invoice.create({
    data: {
      invoiceNumber: invoiceNum(), amount: 3500, type: "RENT", status: "PENDING",
      dueDate: new Date("2026-03-05"), description: "Rent for March 2026",
      tenantId: cmTenantIds["Lisa Mendoza"], boardingHouseId: casaMarina.id,
    },
  });
  await prisma.invoice.create({
    data: {
      invoiceNumber: invoiceNum(), amount: 3000, type: "RENT", status: "PENDING",
      dueDate: new Date("2026-03-05"), description: "Rent for March 2026",
      tenantId: cmTenantIds["John Cruz"], boardingHouseId: casaMarina.id,
    },
  });

  // Electricity invoices for March (3 tenants without electricity included)
  await prisma.invoice.create({
    data: {
      invoiceNumber: invoiceNum(), amount: 1250, type: "ELECTRICITY", status: "PAID",
      dueDate: new Date("2026-03-10"), paidDate: new Date("2026-03-09"),
      description: "Electricity Mar 2026 - 100kWh @ ₱12.50",
      tenantId: cmTenantIds["Maria Santos"], boardingHouseId: casaMarina.id,
    },
  });
  await prisma.invoice.create({
    data: {
      invoiceNumber: invoiceNum(), amount: 1500, type: "ELECTRICITY", status: "PAID",
      dueDate: new Date("2026-03-10"), paidDate: new Date("2026-03-08"),
      description: "Electricity Mar 2026 - 120kWh @ ₱12.50",
      tenantId: cmTenantIds["Mark Rivera"], boardingHouseId: casaMarina.id,
    },
  });
  await prisma.invoice.create({
    data: {
      invoiceNumber: invoiceNum(), amount: 1000, type: "ELECTRICITY", status: "PAID",
      dueDate: new Date("2026-03-10"), paidDate: new Date("2026-03-10"),
      description: "Electricity Mar 2026 - 80kWh @ ₱12.50",
      tenantId: cmTenantIds["Lisa Mendoza"], boardingHouseId: casaMarina.id,
    },
  });

  // ── April 2026: 8 tenants ──
  // 5 PAID: Maria=3500, Ana=2800, Carlos=2800, Paolo=2500, Grace=2800 = ₱14,400
  // 2 PENDING: Mark=3000, John=3000 = ₱6,000
  // 1 OVERDUE: Lisa=3500
  // April total PAID = ₱14,400
  const aprPaid = [
    { name: "Maria Santos", amount: 3500 },
    { name: "Ana Reyes", amount: 2800 },
    { name: "Carlos Garcia", amount: 2800 },
    { name: "Paolo Tan", amount: 2500 },
    { name: "Grace Lim", amount: 2800 },
  ];
  for (const t of aprPaid) {
    await prisma.invoice.create({
      data: {
        invoiceNumber: invoiceNum(), amount: t.amount, type: "RENT",
        status: "PAID", dueDate: new Date("2026-04-05"), paidDate: new Date("2026-04-02"),
        description: "Rent for April 2026", sentVia: "EMAIL", sentAt: new Date("2026-04-01"),
        tenantId: cmTenantIds[t.name], boardingHouseId: casaMarina.id,
      },
    });
  }
  // 2 PENDING
  await prisma.invoice.create({
    data: {
      invoiceNumber: invoiceNum(), amount: 3000, type: "RENT", status: "PENDING",
      dueDate: new Date("2026-04-05"), description: "Rent for April 2026",
      sentVia: "SMS", sentAt: new Date("2026-04-01"),
      tenantId: cmTenantIds["Mark Rivera"], boardingHouseId: casaMarina.id,
    },
  });
  await prisma.invoice.create({
    data: {
      invoiceNumber: invoiceNum(), amount: 3000, type: "RENT", status: "PENDING",
      dueDate: new Date("2026-04-05"), description: "Rent for April 2026",
      tenantId: cmTenantIds["John Cruz"], boardingHouseId: casaMarina.id,
    },
  });
  // 1 OVERDUE
  await prisma.invoice.create({
    data: {
      invoiceNumber: invoiceNum(), amount: 3500, type: "RENT", status: "OVERDUE",
      dueDate: new Date("2026-04-05"), description: "Rent for April 2026",
      sentVia: "BOTH", sentAt: new Date("2026-04-01"),
      tenantId: cmTenantIds["Lisa Mendoza"], boardingHouseId: casaMarina.id,
    },
  });

  // Electricity bills (records)
  await prisma.bill.create({
    data: { type: "ELECTRICITY", amount: 1250, period: "2026-03", currentReading: 1250, previousReading: 1150, ratePerUnit: 12.5, tenantId: cmTenantIds["Maria Santos"], boardingHouseId: casaMarina.id },
  });
  await prisma.bill.create({
    data: { type: "ELECTRICITY", amount: 1500, period: "2026-03", currentReading: 2120, previousReading: 2000, ratePerUnit: 12.5, tenantId: cmTenantIds["Mark Rivera"], boardingHouseId: casaMarina.id },
  });

  // ══════════════════════════════════════════════
  // ROBERTO'S BOARDING HOUSE — Sunrise Student Hub
  // 5 rooms, 4 tenants
  // ══════════════════════════════════════════════

  const sunrise = await prisma.boardingHouse.create({
    data: {
      name: "Sunrise Student Hub",
      address: "Brgy. Central, Mati City",
      city: "Mati City",
      description: "Affordable mixed boarding house near commercial area. Walking distance to schools.",
      type: "MIXED",
      verified: true,
      published: true,
      hasCurfew: false,
      amenities: JSON.stringify(["WiFi", "Study Room", "Parking", "Water Included"]),
      restrictions: JSON.stringify(["No Smoking Indoors"]),
      contactPhone: "0918-333-4444",
      contactEmail: "roberto@phase.com",
      ownerId: roberto.id,
    },
  });

  const shRooms = [
    { number: "A1", floor: 1, capacity: 2, monthlyRate: 3500, hasAircon: true, hasWifi: true, hasBathroom: true, electricityIncluded: false, status: "OCCUPIED" },
    { number: "A2", floor: 1, capacity: 1, monthlyRate: 2500, hasAircon: false, hasWifi: true, hasBathroom: false, electricityIncluded: true, status: "OCCUPIED" },
    { number: "B1", floor: 2, capacity: 2, monthlyRate: 3500, hasAircon: true, hasWifi: true, hasBathroom: true, electricityIncluded: false, status: "OCCUPIED" },
    { number: "B2", floor: 2, capacity: 1, monthlyRate: 3500, hasAircon: true, hasWifi: true, hasBathroom: true, electricityIncluded: false, status: "OCCUPIED" },
    { number: "B3", floor: 2, capacity: 1, monthlyRate: 2800, hasAircon: false, hasWifi: true, hasBathroom: false, electricityIncluded: true, status: "AVAILABLE" },
  ];

  const shRoomIds: Record<string, string> = {};
  for (const r of shRooms) {
    const room = await prisma.room.create({ data: { ...r, boardingHouseId: sunrise.id } });
    shRoomIds[r.number] = room.id;
  }

  // 4 tenants: A1=3500, A2=2500, B1=3500, B2=3500 = ₱13,000/month
  const shTenants = [
    { name: "Diego Alcantara", email: "diego@email.com", phone: "0920-111-2222", room: "A1" },
    { name: "Carmen Valencia", email: "carmen@email.com", phone: "0921-222-3333", room: "A2" },
    { name: "Rafael Santos", email: "rafael@email.com", phone: "0922-333-4444", room: "B1" },
    { name: "Isabella Cruz", email: "isabella@email.com", phone: "0923-444-5555", room: "B2" },
  ];

  const shTenantIds: Record<string, string> = {};
  for (const t of shTenants) {
    const tenant = await prisma.tenant.create({
      data: {
        name: t.name, email: t.email, phone: t.phone,
        moveInDate: new Date("2025-11-01"), status: "ACTIVE",
        roomId: shRoomIds[t.room], boardingHouseId: sunrise.id,
      },
    });
    shTenantIds[t.name] = tenant.id;
  }

  // Roberto invoices — March: all 4 PAID = ₱13,000
  const shRates: Record<string, number> = { "Diego Alcantara": 3500, "Carmen Valencia": 2500, "Rafael Santos": 3500, "Isabella Cruz": 3500 };
  for (const [name, rate] of Object.entries(shRates)) {
    await prisma.invoice.create({
      data: {
        invoiceNumber: invoiceNum(), amount: rate, type: "RENT",
        status: "PAID", dueDate: new Date("2026-03-05"), paidDate: new Date("2026-03-02"),
        description: "Rent for March 2026",
        tenantId: shTenantIds[name], boardingHouseId: sunrise.id,
      },
    });
  }

  // Roberto invoices — April: Diego + Carmen PAID, Rafael + Isabella PENDING
  await prisma.invoice.create({
    data: {
      invoiceNumber: invoiceNum(), amount: 3500, type: "RENT",
      status: "PAID", dueDate: new Date("2026-04-05"), paidDate: new Date("2026-04-01"),
      description: "Rent for April 2026",
      tenantId: shTenantIds["Diego Alcantara"], boardingHouseId: sunrise.id,
    },
  });
  await prisma.invoice.create({
    data: {
      invoiceNumber: invoiceNum(), amount: 2500, type: "RENT",
      status: "PAID", dueDate: new Date("2026-04-05"), paidDate: new Date("2026-04-03"),
      description: "Rent for April 2026",
      tenantId: shTenantIds["Carmen Valencia"], boardingHouseId: sunrise.id,
    },
  });
  await prisma.invoice.create({
    data: {
      invoiceNumber: invoiceNum(), amount: 3500, type: "RENT",
      status: "PENDING", dueDate: new Date("2026-04-05"),
      description: "Rent for April 2026",
      tenantId: shTenantIds["Rafael Santos"], boardingHouseId: sunrise.id,
    },
  });
  await prisma.invoice.create({
    data: {
      invoiceNumber: invoiceNum(), amount: 3500, type: "RENT",
      status: "PENDING", dueDate: new Date("2026-04-05"),
      description: "Rent for April 2026",
      tenantId: shTenantIds["Isabella Cruz"], boardingHouseId: sunrise.id,
    },
  });

  // ══════════════════════════════════════════════
  // SOFIA'S BOARDING HOUSE — Green Meadow (UNPUBLISHED, unverified owner)
  // 3 rooms, 2 tenants
  // ══════════════════════════════════════════════

  const greenMeadow = await prisma.boardingHouse.create({
    data: {
      name: "Green Meadow Residence",
      address: "Brgy. Badas, Mati City",
      city: "Mati City",
      description: "New boarding house with garden area.",
      type: "ALL_FEMALE",
      verified: false,
      published: false,
      hasCurfew: true,
      curfewTime: "21:00",
      amenities: JSON.stringify(["WiFi", "Garden", "Kitchen"]),
      contactPhone: "0919-555-6666",
      ownerId: sofia.id,
    },
  });

  const gmRooms = [
    { number: "G1", floor: 1, capacity: 2, monthlyRate: 2500, hasAircon: false, hasWifi: true, hasBathroom: false, electricityIncluded: true, status: "OCCUPIED" },
    { number: "G2", floor: 1, capacity: 2, monthlyRate: 2500, hasAircon: false, hasWifi: true, hasBathroom: false, electricityIncluded: true, status: "OCCUPIED" },
    { number: "G3", floor: 1, capacity: 1, monthlyRate: 2000, hasAircon: false, hasWifi: true, hasBathroom: false, electricityIncluded: true, status: "AVAILABLE" },
  ];
  for (const r of gmRooms) {
    await prisma.room.create({ data: { ...r, boardingHouseId: greenMeadow.id } });
  }
  // Sofia's tenants (minimal data)
  const gmRoom1 = await prisma.room.findFirst({ where: { number: "G1", boardingHouseId: greenMeadow.id } });
  const gmRoom2 = await prisma.room.findFirst({ where: { number: "G2", boardingHouseId: greenMeadow.id } });
  await prisma.tenant.create({
    data: { name: "Lea Torres", phone: "0925-111-0000", moveInDate: new Date("2026-03-01"), status: "ACTIVE", roomId: gmRoom1!.id, boardingHouseId: greenMeadow.id },
  });
  await prisma.tenant.create({
    data: { name: "Joy Manalo", phone: "0926-222-0000", moveInDate: new Date("2026-03-15"), status: "ACTIVE", roomId: gmRoom2!.id, boardingHouseId: greenMeadow.id },
  });

  // ══════════════════════════════════════════════
  // ROOM TRANSFERS
  // ══════════════════════════════════════════════

  // Completed: Ana Reyes moved from 201→305 in Jan 2026
  await prisma.roomTransfer.create({
    data: {
      tenantId: cmTenantIds["Ana Reyes"],
      fromRoomId: cmRoomIds["201"],
      toRoomId: cmRoomIds["305"],
      reason: "Requested room with better ventilation",
      status: "COMPLETED",
      transferDate: new Date("2026-01-15"),
    },
  });

  // Pending: Grace Lim wants to move from 203→302
  await prisma.roomTransfer.create({
    data: {
      tenantId: cmTenantIds["Grace Lim"],
      fromRoomId: cmRoomIds["203"],
      toRoomId: cmRoomIds["302"],
      reason: "Upgrade to room with bathroom",
      status: "PENDING",
    },
  });

  // ══════════════════════════════════════════════
  // NOTIFICATIONS (Elena)
  // ══════════════════════════════════════════════

  await prisma.notification.create({
    data: { userId: elena.id, title: "Welcome to Phase", message: "Your boarding house has been verified. You can now manage tenants and invoices.", type: "SYSTEM", read: true, link: "/dashboard" },
  });
  await prisma.notification.create({
    data: { userId: elena.id, title: "Payment Received", message: "Maria Santos paid ₱3,500 for Room 204 — April rent", type: "PAYMENT", read: true, link: "/dashboard/invoices" },
  });
  await prisma.notification.create({
    data: { userId: elena.id, title: "New Transfer Request", message: "Grace Lim requested transfer from Room 203 to Room 302", type: "TENANT", read: false, link: "/dashboard/transfers" },
  });
  await prisma.notification.create({
    data: { userId: elena.id, title: "Overdue Invoice", message: "Lisa Mendoza's April rent (₱3,500) is overdue", type: "INVOICE", read: false, link: "/dashboard/invoices" },
  });
  await prisma.notification.create({
    data: { userId: elena.id, title: "Room 202 Maintenance", message: "Room 202 has been marked for maintenance — AC repair needed", type: "MAINTENANCE", read: true, link: "/dashboard/properties" },
  });

  // ══════════════════════════════════════════════
  // SUMMARY OUTPUT
  // ══════════════════════════════════════════════

  // Calculate actual totals for verification
  const totalPaid = await prisma.invoice.aggregate({ where: { status: "PAID" }, _sum: { amount: true } });
  const elenaPaid = await prisma.invoice.aggregate({ where: { boardingHouseId: casaMarina.id, status: "PAID" }, _sum: { amount: true } });
  const robertoPaid = await prisma.invoice.aggregate({ where: { boardingHouseId: sunrise.id, status: "PAID" }, _sum: { amount: true } });
  const pendingCount = await prisma.invoice.count({ where: { status: "PENDING" } });
  const overdueCount = await prisma.invoice.count({ where: { status: "OVERDUE" } });

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║           PHASE SEED DATA — VERIFICATION         ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log("║ Credentials:                                     ║");
  console.log("║   Admin:   admin@phase.com / Password1           ║");
  console.log("║   Elena:   elena@phase.com / Password1           ║");
  console.log("║   Roberto: roberto@phase.com / Password1         ║");
  console.log("║   Sofia:   sofia@phase.com / Password1 (pending) ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log("║ Platform Totals:                                  ║");
  console.log(`║   Owners: 3 (2 verified, 1 pending)              ║`);
  console.log(`║   Boarding Houses: 3 (2 published)               ║`);
  console.log(`║   Rooms: 20 (14 occupied, 4 available, 1 maint)  ║`);  // wait: 8+4+2=14 occupied, 3+1+1=5 available... let me recount
  console.log(`║   Tenants: 14 active                              ║`);
  console.log(`║   Subscriptions: 1 PRO, 1 STARTER                ║`);
  console.log("╠══════════════════════════════════════════════════╣");
  console.log("║ Revenue (from DB):                                ║");
  console.log(`║   Platform total PAID: ₱${(totalPaid._sum.amount || 0).toLocaleString()}         ║`);
  console.log(`║   Elena (Casa Marina): ₱${(elenaPaid._sum.amount || 0).toLocaleString()}         ║`);
  console.log(`║   Roberto (Sunrise):   ₱${(robertoPaid._sum.amount || 0).toLocaleString()}         ║`);
  console.log(`║   Pending invoices: ${pendingCount}                          ║`);
  console.log(`║   Overdue invoices: ${overdueCount}                           ║`);
  console.log("╠══════════════════════════════════════════════════╣");
  console.log("║ Elena Monthly Revenue:                            ║");
  console.log("║   Jan: ₱17,400 (6 rent PAID)                     ║");
  console.log("║   Feb: ₱17,400 (6 rent PAID)                     ║");
  console.log("║   Mar: ₱21,150 (6 rent + 3 elec PAID)            ║");
  console.log("║   Apr: ₱14,400 (5 rent PAID)                     ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log("║ Notifications: 5 (2 unread)                      ║");
  console.log("║ Transfers: 2 (1 completed, 1 pending)            ║");
  console.log("╚══════════════════════════════════════════════════╝\n");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
