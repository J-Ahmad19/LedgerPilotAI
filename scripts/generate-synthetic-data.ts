import fs from "fs";
import path from "path";

function generate() {
  const baseDate = new Date("2026-08-18");
  
  const payments: any[] = [];
  const settlements: any[] = [];
  const ledgers: any[] = [];
  const groundTruth: any[] = [];

  let nextId = 1;

  // Case 1: Exact matches (60)
  for (let i = 0; i < 60; i++) {
    const id = nextId++;
    const ref = `PAY-${1000 + id}`;
    const amount = (Math.random() * 10000 + 100).toFixed(2);
    
    payments.push({
      externalId: `P-${id}`,
      amount,
      currency: "INR",
      transactionDate: baseDate.toISOString().split("T")[0],
      referenceId: ref,
      merchantName: "Acme Ltd"
    });

    settlements.push({
      externalId: `S-${id}`,
      amount,
      currency: "INR",
      transactionDate: baseDate.toISOString().split("T")[0],
      referenceId: ref,
      description: "ACME LTD SETTLEMENT"
    });

    ledgers.push({
      externalId: `L-${id}`,
      amount,
      currency: "INR",
      transactionDate: baseDate.toISOString().split("T")[0],
      referenceId: `INV-${900 + id}`,
      customerName: "Acme Limited"
    });

    groundTruth.push({ source_transaction: `P-${id}`, target_transaction: `S-${id}`, is_match: "true" });
    groundTruth.push({ source_transaction: `S-${id}`, target_transaction: `L-${id}`, is_match: "true" });
  }

  // Case 2: Date offsets (15)
  for (let i = 0; i < 15; i++) {
    const id = nextId++;
    const ref = `PAY-${1000 + id}`;
    const amount = (Math.random() * 10000 + 100).toFixed(2);
    
    const offsetDate = new Date(baseDate);
    offsetDate.setDate(offsetDate.getDate() + 1);

    payments.push({
      externalId: `P-${id}`,
      amount,
      currency: "INR",
      transactionDate: baseDate.toISOString().split("T")[0],
      referenceId: ref,
      merchantName: "Acme Ltd"
    });

    settlements.push({
      externalId: `S-${id}`,
      amount,
      currency: "INR",
      transactionDate: offsetDate.toISOString().split("T")[0],
      referenceId: ref,
      description: "ACME LTD SETTLEMENT"
    });

    ledgers.push({
      externalId: `L-${id}`,
      amount,
      currency: "INR",
      transactionDate: baseDate.toISOString().split("T")[0],
      referenceId: `INV-${900 + id}`,
      customerName: "Acme Limited"
    });

    groundTruth.push({ source_transaction: `P-${id}`, target_transaction: `S-${id}`, is_match: "true" });
    groundTruth.push({ source_transaction: `S-${id}`, target_transaction: `L-${id}`, is_match: "true" });
  }

  // Case 3: Description mismatches (8)
  for (let i = 0; i < 8; i++) {
    const id = nextId++;
    const ref = `PAY-${1000 + id}`;
    const amount = (Math.random() * 10000 + 100).toFixed(2);

    payments.push({
      externalId: `P-${id}`,
      amount,
      currency: "INR",
      transactionDate: baseDate.toISOString().split("T")[0],
      referenceId: ref,
      merchantName: "Acme Corp"
    });

    settlements.push({
      externalId: `S-${id}`,
      amount,
      currency: "INR",
      transactionDate: baseDate.toISOString().split("T")[0],
      referenceId: ref,
      description: "A.C.M.E. CORP"
    });

    ledgers.push({
      externalId: `L-${id}`,
      amount,
      currency: "INR",
      transactionDate: baseDate.toISOString().split("T")[0],
      referenceId: `INV-${900 + id}`,
      customerName: "Acme Corporation"
    });

    groundTruth.push({ source_transaction: `P-${id}`, target_transaction: `S-${id}`, is_match: "true" });
    groundTruth.push({ source_transaction: `S-${id}`, target_transaction: `L-${id}`, is_match: "true" });
  }

  // Case 4: Amount mismatches (5)
  for (let i = 0; i < 5; i++) {
    const id = nextId++;
    const ref = `PAY-${1000 + id}`;
    const baseAmount = Math.random() * 10000 + 100;
    
    payments.push({
      externalId: `P-${id}`,
      amount: baseAmount.toFixed(2),
      currency: "INR",
      transactionDate: baseDate.toISOString().split("T")[0],
      referenceId: ref,
      merchantName: "Acme Ltd"
    });

    settlements.push({
      externalId: `S-${id}`,
      amount: (baseAmount - 2).toFixed(2), // Minor difference
      currency: "INR",
      transactionDate: baseDate.toISOString().split("T")[0],
      referenceId: ref,
      description: "ACME LTD SETTLEMENT"
    });

    ledgers.push({
      externalId: `L-${id}`,
      amount: baseAmount.toFixed(2),
      currency: "INR",
      transactionDate: baseDate.toISOString().split("T")[0],
      referenceId: `INV-${900 + id}`,
      customerName: "Acme Limited"
    });

    groundTruth.push({ source_transaction: `P-${id}`, target_transaction: `S-${id}`, is_match: "true" }); // Should match via tolerance
    groundTruth.push({ source_transaction: `S-${id}`, target_transaction: `L-${id}`, is_match: "true" });
  }

  // Case 5: Duplicates (4)
  for (let i = 0; i < 4; i++) {
    const id = nextId++;
    const ref = `PAY-${1000 + id}`;
    const amount = (Math.random() * 10000 + 100).toFixed(2);
    
    const payment = {
      externalId: `P-${id}`,
      amount,
      currency: "INR",
      transactionDate: baseDate.toISOString().split("T")[0],
      referenceId: ref,
      merchantName: "Acme Ltd"
    };

    payments.push(payment);
    payments.push(payment); // Duplicate

    settlements.push({
      externalId: `S-${id}`,
      amount,
      currency: "INR",
      transactionDate: baseDate.toISOString().split("T")[0],
      referenceId: ref,
      description: "ACME LTD SETTLEMENT"
    });

    ledgers.push({
      externalId: `L-${id}`,
      amount,
      currency: "INR",
      transactionDate: baseDate.toISOString().split("T")[0],
      referenceId: `INV-${900 + id}`,
      customerName: "Acme Limited"
    });
    
    groundTruth.push({ source_transaction: `P-${id}`, target_transaction: `S-${id}`, is_match: "true" });
  }

  // Case 6: Missing ledger entries (5)
  for (let i = 0; i < 5; i++) {
    const id = nextId++;
    const ref = `PAY-${1000 + id}`;
    const amount = (Math.random() * 10000 + 100).toFixed(2);
    
    payments.push({
      externalId: `P-${id}`,
      amount,
      currency: "INR",
      transactionDate: baseDate.toISOString().split("T")[0],
      referenceId: ref,
      merchantName: "Acme Ltd"
    });

    settlements.push({
      externalId: `S-${id}`,
      amount,
      currency: "INR",
      transactionDate: baseDate.toISOString().split("T")[0],
      referenceId: ref,
      description: "ACME LTD SETTLEMENT"
    });
    
    groundTruth.push({ source_transaction: `P-${id}`, target_transaction: `S-${id}`, is_match: "true" });
    // No ledger pushed!
  }

  // Case 7: Ambiguous candidates (3)
  for (let i = 0; i < 3; i++) {
    const id = nextId++;
    const ref = `PAY-${1000 + id}`;
    const amount = "5000.00"; // Exact same amount
    
    payments.push({
      externalId: `P-${id}`,
      amount,
      currency: "INR",
      transactionDate: baseDate.toISOString().split("T")[0],
      referenceId: ref,
      merchantName: "Acme Ltd"
    });

    settlements.push({
      externalId: `S-${id}-1`,
      amount,
      currency: "INR",
      transactionDate: baseDate.toISOString().split("T")[0],
      referenceId: `REF-${Math.random()}`, // Messy reference
      description: "ACME LTD SETTLEMENT 1"
    });
    
    settlements.push({
      externalId: `S-${id}-2`,
      amount,
      currency: "INR",
      transactionDate: baseDate.toISOString().split("T")[0],
      referenceId: `REF-${Math.random()}`, // Messy reference
      description: "ACME LTD SETTLEMENT 2"
    });
    
    groundTruth.push({ source_transaction: `P-${id}`, target_transaction: `S-${id}-1`, is_match: "true" });
  }

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  function toCsv(arr: any[]) {
    if (arr.length === 0) return "";
    const headers = Object.keys(arr[0]).join(",");
    const rows = arr.map(obj => Object.values(obj).join(",")).join("\n");
    return `${headers}\n${rows}`;
  }

  fs.writeFileSync(path.join(dataDir, "payments.csv"), toCsv(payments));
  fs.writeFileSync(path.join(dataDir, "settlements.csv"), toCsv(settlements));
  fs.writeFileSync(path.join(dataDir, "ledger.csv"), toCsv(ledgers));
  fs.writeFileSync(path.join(dataDir, "ground_truth.csv"), toCsv(groundTruth));

  console.log("Synthetic data generated in /data folder.");
}

generate();
