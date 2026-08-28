import pandas as pd
import random
import os
from datetime import datetime, timedelta
from faker import Faker

# Use Faker for realistic names and references
fake = Faker()
Faker.seed(42)
random.seed(42)

def generate_synthetic_data():
    base_date = datetime.strptime("2026-08-18", "%Y-%m-%d")
    
    payments = []
    settlements = []
    ledgers = []
    ground_truth = []
    
    next_id = 1
    
    # Helper to format amounts properly
    def format_amount(amount):
        return f"{amount:.2f}"
    
    # 1. Exact Matches (60 records)
    for _ in range(60):
        t_id = next_id
        next_id += 1
        ref = f"PAY-{1000 + t_id}"
        amount = random.uniform(100.0, 10000.0)
        
        merchant = fake.company()
        customer = merchant + " Inc."
        
        payments.append({
            "externalId": f"P-{t_id}",
            "amount": format_amount(amount),
            "currency": "INR",
            "transactionDate": base_date.strftime("%Y-%m-%d"),
            "referenceId": ref,
            "merchantName": merchant
        })
        
        settlements.append({
            "externalId": f"S-{t_id}",
            "amount": format_amount(amount),
            "currency": "INR",
            "transactionDate": base_date.strftime("%Y-%m-%d"),
            "referenceId": ref,
            "description": f"{merchant.upper()} SETTLEMENT"
        })
        
        ledgers.append({
            "externalId": f"L-{t_id}",
            "amount": format_amount(amount),
            "currency": "INR",
            "transactionDate": base_date.strftime("%Y-%m-%d"),
            "referenceId": f"INV-{900 + t_id}",
            "customerName": customer
        })
        
        ground_truth.append({"source_transaction": f"P-{t_id}", "target_transaction": f"S-{t_id}", "is_match": "true"})
        ground_truth.append({"source_transaction": f"S-{t_id}", "target_transaction": f"L-{t_id}", "is_match": "true"})

    # 2. Date Offsets (15 records) - Bank settlement happens 1-2 days later
    for _ in range(15):
        t_id = next_id
        next_id += 1
        ref = f"PAY-{1000 + t_id}"
        amount = random.uniform(100.0, 10000.0)
        merchant = fake.company()
        
        offset_days = random.randint(1, 2)
        offset_date = base_date + timedelta(days=offset_days)
        
        payments.append({
            "externalId": f"P-{t_id}",
            "amount": format_amount(amount),
            "currency": "INR",
            "transactionDate": base_date.strftime("%Y-%m-%d"),
            "referenceId": ref,
            "merchantName": merchant
        })
        
        settlements.append({
            "externalId": f"S-{t_id}",
            "amount": format_amount(amount),
            "currency": "INR",
            "transactionDate": offset_date.strftime("%Y-%m-%d"),
            "referenceId": ref,
            "description": f"{merchant.upper()} SETTLEMENT"
        })
        
        ledgers.append({
            "externalId": f"L-{t_id}",
            "amount": format_amount(amount),
            "currency": "INR",
            "transactionDate": base_date.strftime("%Y-%m-%d"),
            "referenceId": f"INV-{900 + t_id}",
            "customerName": merchant + " Corp"
        })
        
        ground_truth.append({"source_transaction": f"P-{t_id}", "target_transaction": f"S-{t_id}", "is_match": "true"})
        ground_truth.append({"source_transaction": f"S-{t_id}", "target_transaction": f"L-{t_id}", "is_match": "true"})

    # 3. Description mismatches (8 records) - Messy string variations
    for _ in range(8):
        t_id = next_id
        next_id += 1
        ref = f"PAY-{1000 + t_id}"
        amount = random.uniform(100.0, 10000.0)
        merchant_base = fake.company()
        
        payments.append({
            "externalId": f"P-{t_id}",
            "amount": format_amount(amount),
            "currency": "INR",
            "transactionDate": base_date.strftime("%Y-%m-%d"),
            "referenceId": ref,
            "merchantName": merchant_base
        })
        
        # Strip vowels and add noise for messy description
        messy_desc = merchant_base.upper().replace('A', '').replace('E', '') + " STTLMNT"
        
        settlements.append({
            "externalId": f"S-{t_id}",
            "amount": format_amount(amount),
            "currency": "INR",
            "transactionDate": base_date.strftime("%Y-%m-%d"),
            "referenceId": ref,
            "description": messy_desc
        })
        
        ledgers.append({
            "externalId": f"L-{t_id}",
            "amount": format_amount(amount),
            "currency": "INR",
            "transactionDate": base_date.strftime("%Y-%m-%d"),
            "referenceId": f"INV-{900 + t_id}",
            "customerName": merchant_base + " LLC"
        })
        
        ground_truth.append({"source_transaction": f"P-{t_id}", "target_transaction": f"S-{t_id}", "is_match": "true"})
        ground_truth.append({"source_transaction": f"S-{t_id}", "target_transaction": f"L-{t_id}", "is_match": "true"})

    # 4. Amount mismatches / fees (5 records) - Minor variations (< 1%)
    for _ in range(5):
        t_id = next_id
        next_id += 1
        ref = f"PAY-{1000 + t_id}"
        base_amount = random.uniform(500.0, 10000.0)
        merchant = fake.company()
        
        payments.append({
            "externalId": f"P-{t_id}",
            "amount": format_amount(base_amount),
            "currency": "INR",
            "transactionDate": base_date.strftime("%Y-%m-%d"),
            "referenceId": ref,
            "merchantName": merchant
        })
        
        # Subtract a small fee for the bank settlement
        fee = random.uniform(1.0, 10.0)
        
        settlements.append({
            "externalId": f"S-{t_id}",
            "amount": format_amount(base_amount - fee),
            "currency": "INR",
            "transactionDate": base_date.strftime("%Y-%m-%d"),
            "referenceId": ref,
            "description": f"{merchant.upper()} SETTLEMENT (NET)"
        })
        
        ledgers.append({
            "externalId": f"L-{t_id}",
            "amount": format_amount(base_amount),
            "currency": "INR",
            "transactionDate": base_date.strftime("%Y-%m-%d"),
            "referenceId": f"INV-{900 + t_id}",
            "customerName": merchant
        })
        
        # This will test fuzzy logic based on tolerance
        ground_truth.append({"source_transaction": f"P-{t_id}", "target_transaction": f"S-{t_id}", "is_match": "true"})
        ground_truth.append({"source_transaction": f"S-{t_id}", "target_transaction": f"L-{t_id}", "is_match": "true"})

    # 5. Duplicates (4 records) - Same exact payment happens twice
    for _ in range(4):
        t_id = next_id
        next_id += 1
        ref = f"PAY-{1000 + t_id}"
        amount = format_amount(random.uniform(100.0, 10000.0))
        merchant = fake.company()
        
        payment = {
            "externalId": f"P-{t_id}",
            "amount": amount,
            "currency": "INR",
            "transactionDate": base_date.strftime("%Y-%m-%d"),
            "referenceId": ref,
            "merchantName": merchant
        }
        
        payments.append(payment)
        payments.append(payment.copy()) # Duplicate!
        
        settlements.append({
            "externalId": f"S-{t_id}",
            "amount": amount,
            "currency": "INR",
            "transactionDate": base_date.strftime("%Y-%m-%d"),
            "referenceId": ref,
            "description": f"{merchant.upper()} SETTLEMENT"
        })
        
        ledgers.append({
            "externalId": f"L-{t_id}",
            "amount": amount,
            "currency": "INR",
            "transactionDate": base_date.strftime("%Y-%m-%d"),
            "referenceId": f"INV-{900 + t_id}",
            "customerName": merchant
        })
        
        ground_truth.append({"source_transaction": f"P-{t_id}", "target_transaction": f"S-{t_id}", "is_match": "true"})

    # 6. Missing ledger entries (5 records) - Payment hit bank, but not recorded in Ledger
    for _ in range(5):
        t_id = next_id
        next_id += 1
        ref = f"PAY-{1000 + t_id}"
        amount = format_amount(random.uniform(100.0, 10000.0))
        merchant = fake.company()
        
        payments.append({
            "externalId": f"P-{t_id}",
            "amount": amount,
            "currency": "INR",
            "transactionDate": base_date.strftime("%Y-%m-%d"),
            "referenceId": ref,
            "merchantName": merchant
        })
        
        settlements.append({
            "externalId": f"S-{t_id}",
            "amount": amount,
            "currency": "INR",
            "transactionDate": base_date.strftime("%Y-%m-%d"),
            "referenceId": ref,
            "description": f"{merchant.upper()} SETTLEMENT"
        })
        
        ground_truth.append({"source_transaction": f"P-{t_id}", "target_transaction": f"S-{t_id}", "is_match": "true"})
        # No ledger appended.

    # 7. Ambiguous candidates (3 records) - Multiple settlements for same exact amount on same day
    for _ in range(3):
        t_id = next_id
        next_id += 1
        ref = f"PAY-{1000 + t_id}"
        amount = "5000.00" # Explicit hardcoded collision
        merchant = fake.company()
        
        payments.append({
            "externalId": f"P-{t_id}",
            "amount": amount,
            "currency": "INR",
            "transactionDate": base_date.strftime("%Y-%m-%d"),
            "referenceId": ref,
            "merchantName": merchant
        })
        
        settlements.append({
            "externalId": f"S-{t_id}-A",
            "amount": amount,
            "currency": "INR",
            "transactionDate": base_date.strftime("%Y-%m-%d"),
            "referenceId": f"REF-{fake.bban()}", 
            "description": f"{merchant.upper()} BATCH 1"
        })
        
        settlements.append({
            "externalId": f"S-{t_id}-B",
            "amount": amount,
            "currency": "INR",
            "transactionDate": base_date.strftime("%Y-%m-%d"),
            "referenceId": f"REF-{fake.bban()}",
            "description": f"{merchant.upper()} BATCH 2"
        })
        
        # Only one is the real match
        ground_truth.append({"source_transaction": f"P-{t_id}", "target_transaction": f"S-{t_id}-A", "is_match": "true"})

    # Create data directory
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
    os.makedirs(data_dir, exist_ok=True)
    
    # Save to CSV using Pandas
    pd.DataFrame(payments).to_csv(os.path.join(data_dir, "payments.csv"), index=False)
    pd.DataFrame(settlements).to_csv(os.path.join(data_dir, "settlements.csv"), index=False)
    pd.DataFrame(ledgers).to_csv(os.path.join(data_dir, "ledger.csv"), index=False)
    pd.DataFrame(ground_truth).to_csv(os.path.join(data_dir, "ground_truth.csv"), index=False)

    print(f"Synthetic data generated successfully in {data_dir}")
    print(f"Total Payments generated: {len(payments)}")

if __name__ == "__main__":
    generate_synthetic_data()
