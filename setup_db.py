import sqlite3

DB_FILE = 'trading.db'

conn = sqlite3.connect(DB_FILE)
cur = conn.cursor()

# Create stocks table
cur.execute("""
CREATE TABLE IF NOT EXISTS stocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stock TEXT NOT NULL,
    date TEXT NOT NULL,
    open REAL,
    high REAL,
    low REAL,
    close REAL,
    volume INTEGER
)
""")

# Create trades table (for margin/target trades)
cur.execute("""
CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    stock TEXT,
    type TEXT,
    price REAL,
    qty INTEGER,
    date TEXT
)
""")

conn.commit()
conn.close()
print("Tables created successfully!")
