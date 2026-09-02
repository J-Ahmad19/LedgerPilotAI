import { db } from "../db/index.js";
import { 
  exceptions, 
  auditLogs, 
  reconciliationMatches, 
  reconciliationRuns, 
  transactions, 
  rawTransactions, 
  dataSources 
} from "../db/schema.js";

async function resetDemo() {
  console.log("Starting demo reset...");

  try {
    // Delete in reverse dependency order to avoid foreign key constraint violations
    console.log("Deleting exceptions...");
    await db.delete(exceptions);
    
    console.log("Deleting audit logs...");
    await db.delete(auditLogs);
    
    console.log("Deleting reconciliation matches...");
    await db.delete(reconciliationMatches);
    
    console.log("Deleting reconciliation runs...");
    await db.delete(reconciliationRuns);
    
    console.log("Deleting transactions...");
    await db.delete(transactions);
    
    console.log("Deleting raw transactions...");
    await db.delete(rawTransactions);
    
    console.log("Deleting data sources...");
    await db.delete(dataSources);

    console.log("Demo environment reset successfully!");
  } catch (error) {
    console.error("Error resetting demo environment:", error);
    process.exit(1);
  }

  process.exit(0);
}

resetDemo();
