import fs from "fs";
import path from "path";

// Deterministic PRNG (Mulberry32)
function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// Fixed seed
const seed = 123456789;
const random = mulberry32(seed);

function generate() {
  const baseDate = new Date("2026-08-18");
  
  const payments: any[] = [];
  const settlements: any[] = [];
  const bank: any[] = [];
  const ledgers: any[] = [];
  const groundTruth: any[] = [];

  let nextId = 1;

  function addMatch(source: string, target: string, expectedMatch: boolean = true) {
    groundTruth.push({ source_transaction: source, target_transaction: target, expected_match: expectedMatch.toString() });
  }

  // 1. Exact matches (40)
  for (let i = 0; i < 40; i++) {
    const id = nextId++;
    const ref = `PAY-${1000 + id}`;
    const amount = (random() * 10000 + 100).toFixed(2);
    const dateStr = baseDate.toISOString().split("T")[0];
    
    payments.push({
      externalId: `P-${id}`, amount, currency: "INR", transactionDate: dateStr, referenceId: ref, merchantName: "Acme Ltd"
    });
    settlements.push({
      externalId: `S-${id}`, amount, currency: "INR", transactionDate: dateStr, referenceId: ref, description: "ACME LTD SETTLEMENT"
    });
    bank.push({
      externalId: `B-${id}`, amount, currency: "INR", transactionDate: dateStr, referenceId: ref, description: "ACH SETTLEMENT ACME"
    });
    ledgers.push({
      externalId: `L-${id}`, amount, currency: "INR", transactionDate: dateStr, referenceId: `INV-${900 + id}`, customerName: "Acme Limited"
    });

    addMatch(`P-${id}`, `S-${id}`);
    addMatch(`S-${id}`, `B-${id}`);
    addMatch(`B-${id}`, `L-${id}`);
  }

  // 2. Date offsets (T+1, T+2) (15)
  for (let i = 0; i < 15; i++) {
    const id = nextId++;
    const ref = `PAY-${1000 + id}`;
    const amount = (random() * 10000 + 100).toFixed(2);
    const pDate = new Date(baseDate);
    const sDate = new Date(baseDate); sDate.setDate(sDate.getDate() + 1); // T+1
    const bDate = new Date(baseDate); bDate.setDate(bDate.getDate() + 2); // T+2
    const lDate = new Date(baseDate);

    payments.push({
      externalId: `P-${id}`, amount, currency: "INR", transactionDate: pDate.toISOString().split("T")[0], referenceId: ref, merchantName: "Acme Ltd"
    });
    settlements.push({
      externalId: `S-${id}`, amount, currency: "INR", transactionDate: sDate.toISOString().split("T")[0], referenceId: ref, description: "ACME LTD SETTLEMENT"
    });
    bank.push({
      externalId: `B-${id}`, amount, currency: "INR", transactionDate: bDate.toISOString().split("T")[0], referenceId: ref, description: "ACH SETTLEMENT ACME"
    });
    ledgers.push({
      externalId: `L-${id}`, amount, currency: "INR", transactionDate: lDate.toISOString().split("T")[0], referenceId: `INV-${900 + id}`, customerName: "Acme Limited"
    });

    addMatch(`P-${id}`, `S-${id}`);
    addMatch(`S-${id}`, `B-${id}`);
    addMatch(`B-${id}`, `L-${id}`);
  }

  // 3. Amount mismatches (fees, entry errors) (10)
  for (let i = 0; i < 10; i++) {
    const id = nextId++;
    const ref = `PAY-${1000 + id}`;
    const baseAmount = random() * 10000 + 100;
    const dateStr = baseDate.toISOString().split("T")[0];

    payments.push({
      externalId: `P-${id}`, amount: baseAmount.toFixed(2), currency: "INR", transactionDate: dateStr, referenceId: ref, merchantName: "Acme Ltd"
    });
    settlements.push({
      externalId: `S-${id}`, amount: (baseAmount - 1.5).toFixed(2), currency: "INR", transactionDate: dateStr, referenceId: ref, description: "ACME LTD SETTLEMENT (NET)" // Fee deducted
    });
    bank.push({
      externalId: `B-${id}`, amount: (baseAmount - 1.5).toFixed(2), currency: "INR", transactionDate: dateStr, referenceId: ref, description: "ACH SETTLEMENT ACME"
    });
    ledgers.push({
      externalId: `L-${id}`, amount: baseAmount.toFixed(2), currency: "INR", transactionDate: dateStr, referenceId: `INV-${900 + id}`, customerName: "Acme Limited"
    });

    addMatch(`P-${id}`, `S-${id}`);
    addMatch(`S-${id}`, `B-${id}`);
    addMatch(`B-${id}`, `L-${id}`);
  }

  // 4. Missing references (10)
  for (let i = 0; i < 10; i++) {
    const id = nextId++;
    const ref = `PAY-${1000 + id}`;
    const amount = (random() * 10000 + 100).toFixed(2);
    const dateStr = baseDate.toISOString().split("T")[0];

    payments.push({
      externalId: `P-${id}`, amount, currency: "INR", transactionDate: dateStr, referenceId: ref, merchantName: "Acme Ltd"
    });
    settlements.push({
      externalId: `S-${id}`, amount, currency: "INR", transactionDate: dateStr, referenceId: ref, description: "ACME LTD SETTLEMENT"
    });
    bank.push({
      externalId: `B-${id}`, amount, currency: "INR", transactionDate: dateStr, referenceId: "", description: "ACH SETTLEMENT ACME" // Missing ref
    });
    ledgers.push({
      externalId: `L-${id}`, amount, currency: "INR", transactionDate: dateStr, referenceId: `INV-${900 + id}`, customerName: "Acme Limited"
    });

    addMatch(`P-${id}`, `S-${id}`);
    addMatch(`S-${id}`, `B-${id}`);
    addMatch(`B-${id}`, `L-${id}`);
  }

  // 5. Description variations (10)
  for (let i = 0; i < 10; i++) {
    const id = nextId++;
    const ref = `PAY-${1000 + id}`;
    const amount = (random() * 10000 + 100).toFixed(2);
    const dateStr = baseDate.toISOString().split("T")[0];

    payments.push({
      externalId: `P-${id}`, amount, currency: "INR", transactionDate: dateStr, referenceId: ref, merchantName: "Stripe Inc"
    });
    settlements.push({
      externalId: `S-${id}`, amount, currency: "INR", transactionDate: dateStr, referenceId: ref, description: "STRIPE PAYMENT SETTLEMENT"
    });
    bank.push({
      externalId: `B-${id}`, amount, currency: "INR", transactionDate: dateStr, referenceId: ref, description: "MISC DEPOSIT STRIPE.COM 88392"
    });
    ledgers.push({
      externalId: `L-${id}`, amount, currency: "INR", transactionDate: dateStr, referenceId: `INV-${900 + id}`, customerName: "Stripe Corporation"
    });

    addMatch(`P-${id}`, `S-${id}`);
    addMatch(`S-${id}`, `B-${id}`);
    addMatch(`B-${id}`, `L-${id}`);
  }

  // 6. Duplicate-like records (10)
  for (let i = 0; i < 5; i++) { // 5 pairs = 10 records
    const id1 = nextId++;
    const id2 = nextId++;
    const amount = (random() * 10000 + 100).toFixed(2);
    const dateStr = baseDate.toISOString().split("T")[0];

    // True duplicate in payments (same ref, same amount)
    payments.push({
      externalId: `P-${id1}`, amount, currency: "INR", transactionDate: dateStr, referenceId: `PAY-DUP-${i}`, merchantName: "Acme Ltd"
    });
    payments.push({
      externalId: `P-${id2}`, amount, currency: "INR", transactionDate: dateStr, referenceId: `PAY-DUP-${i}`, merchantName: "Acme Ltd"
    });
    
    // Only one settlement and bank record
    settlements.push({
      externalId: `S-${id1}`, amount, currency: "INR", transactionDate: dateStr, referenceId: `PAY-DUP-${i}`, description: "ACME LTD SETTLEMENT"
    });
    bank.push({
      externalId: `B-${id1}`, amount, currency: "INR", transactionDate: dateStr, referenceId: `PAY-DUP-${i}`, description: "ACH SETTLEMENT ACME"
    });

    addMatch(`P-${id1}`, `S-${id1}`);
    addMatch(`S-${id1}`, `B-${id1}`);
  }

  // 7. Truly unmatched transactions (10)
  for (let i = 0; i < 5; i++) {
    const id = nextId++;
    const amount = (random() * 10000 + 100).toFixed(2);
    const dateStr = baseDate.toISOString().split("T")[0];

    // Orphan payment
    payments.push({
      externalId: `P-${id}`, amount, currency: "INR", transactionDate: dateStr, referenceId: `PAY-ORPHAN-${id}`, merchantName: "Lost Corp"
    });
    
    // Orphan bank (e.g. unknown fee)
    const id2 = nextId++;
    bank.push({
      externalId: `B-${id2}`, amount: "25.00", currency: "INR", transactionDate: dateStr, referenceId: `FEE-${id2}`, description: "MONTHLY MAINTENANCE FEE"
    });
  }

  // 8. Medium-confidence fuzzy matches (5)
  for (let i = 0; i < 5; i++) {
    const id = nextId++;
    const ref = `PAY-${1000 + id}`;
    const amount = (random() * 10000 + 100).toFixed(2);
    const dateStr = baseDate.toISOString().split("T")[0];

    // Missing ref + wrong date + messy desc
    payments.push({
      externalId: `P-${id}`, amount, currency: "INR", transactionDate: dateStr, referenceId: ref, merchantName: "Acme Ltd"
    });
    
    const offsetDate = new Date(baseDate); offsetDate.setDate(offsetDate.getDate() + 5);
    
    settlements.push({
      externalId: `S-${id}`, amount, currency: "INR", transactionDate: offsetDate.toISOString().split("T")[0], referenceId: "", description: "A.C.M.E SETT."
    });
    
    addMatch(`P-${id}`, `S-${id}`);
  }

  // 9. Settlement timing differences (weekend delays) (5)
  for (let i = 0; i < 5; i++) {
    const id = nextId++;
    const ref = `PAY-${1000 + id}`;
    const amount = (random() * 10000 + 100).toFixed(2);
    const friDate = new Date("2026-08-21"); // Friday
    const monDate = new Date("2026-08-24"); // Monday

    payments.push({
      externalId: `P-${id}`, amount, currency: "INR", transactionDate: friDate.toISOString().split("T")[0], referenceId: ref, merchantName: "Weekend Corp"
    });
    settlements.push({
      externalId: `S-${id}`, amount, currency: "INR", transactionDate: friDate.toISOString().split("T")[0], referenceId: ref, description: "WEEKEND CORP SETTLEMENT"
    });
    bank.push({
      externalId: `B-${id}`, amount, currency: "INR", transactionDate: monDate.toISOString().split("T")[0], referenceId: ref, description: "ACH SETTLEMENT WEEKEND CORP"
    });

    addMatch(`P-${id}`, `S-${id}`);
    addMatch(`S-${id}`, `B-${id}`);
  }

  // 10. Records contributing to cash variance (missing ledger entries for bank deposits) (5)
  for (let i = 0; i < 5; i++) {
    const id = nextId++;
    const amount = (random() * 10000 + 100).toFixed(2);
    const dateStr = baseDate.toISOString().split("T")[0];

    // Bank deposit that has no corresponding ledger entry
    bank.push({
      externalId: `B-${id}`, amount, currency: "INR", transactionDate: dateStr, referenceId: `UNEXPECTED-${id}`, description: "WIRE TRANSFER FROM UNKNOWN"
    });
  }

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  function toCsv(arr: any[]) {
    if (arr.length === 0) return "";
    const headers = Object.keys(arr[0]).join(",");
    const rows = arr.map(obj => Object.values(obj).map(v => typeof v === 'string' && v.includes(',') ? `"${v}"` : v).join(",")).join("\n");
    return `${headers}\n${rows}`;
  }

  fs.writeFileSync(path.join(dataDir, "payments.csv"), toCsv(payments));
  fs.writeFileSync(path.join(dataDir, "settlements.csv"), toCsv(settlements));
  fs.writeFileSync(path.join(dataDir, "bank.csv"), toCsv(bank));
  fs.writeFileSync(path.join(dataDir, "ledger.csv"), toCsv(ledgers));
  fs.writeFileSync(path.join(dataDir, "ground_truth.csv"), toCsv(groundTruth));

  const total = payments.length + settlements.length + bank.length + ledgers.length;
  console.log(`Synthetic data generated deterministically in /data folder. Total records: ${total}`);
}

generate();
