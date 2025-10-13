import sqlite3
import pandas as pd
import os

DB_FILE = 'trading.db'
DATA_FOLDER = os.path.join(os.getcwd(), 'data')  # put your CSVs here

# Define your CSV files
stocks = ['RELIANCE']  # add more stock symbols if needed
timeframes = ['daily', 'weekly', 'monthly', 'yearly']

conn = sqlite3.connect(DB_FILE)
cur = conn.cursor()

for stock in stocks:
    for tf in timeframes:
        csv_file = os.path.join(DATA_FOLDER, f"{stock}_{tf}.csv")
        if os.path.exists(csv_file):
            df = pd.read_csv(csv_file)
            # Ensure column names are lowercase for consistency
            df.columns = [c.lower() for c in df.columns]
            for _, row in df.iterrows():
                cur.execute("""
                    INSERT INTO stocks (stock, date, open, high, low, close, volume)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    stock,
                    row['date'],
                    row['open'],
                    row['high'],
                    row['low'],
                    row['close'],
                    row['volume']
                ))
            print(f"{stock} {tf} data imported successfully.")
        else:
            print(f"File not found: {csv_file}")

conn.commit()
conn.close()
print("All data imported successfully!")
