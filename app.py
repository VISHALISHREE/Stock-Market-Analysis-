from flask import Flask, jsonify, send_from_directory, request
import sqlite3
from flask_cors import CORS
import os

app = Flask(__name__, static_folder='frontend', template_folder='frontend')
CORS(app)

DB_FILE = 'trading.db'

def query_db(query, args=(), one=False):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(query, args)
    rv = cur.fetchall()
    conn.close()
    return (rv[0] if rv else None) if one else rv

# ------------------- Serve Frontend -------------------
@app.route('/')
def dashboard():
    return send_from_directory('frontend', 'dashboard.html')

@app.route('/<path:path>')
def serve_file(path):
    return send_from_directory('frontend', path)

# ------------------- API: Chart Data -------------------
@app.route("/api/chart-data")
def chart_data():
    stock = request.args.get("stock", "RELIANCE").upper()
    timeframe = request.args.get("timeframe", "daily").lower()
    data = query_db(
        "SELECT * FROM stocks WHERE stock=? AND timeframe=? ORDER BY date ASC",
        [stock, timeframe]
    )
    return jsonify([dict(row) for row in data])

# ------------------- API: Specific Date Data -------------------
@app.route("/api/date-data")
def date_data():
    stock = request.args.get("stock", "RELIANCE").upper()
    date = request.args.get("date")
    timeframe = request.args.get("timeframe", "daily").lower()
    row = query_db(
        "SELECT * FROM stocks WHERE stock=? AND timeframe=? AND date=?",
        [stock, timeframe, date], one=True
    )
    return jsonify(dict(row)) if row else jsonify({})

# ------------------- API: Target Trades -------------------
@app.route("/api/target-trades")
def get_target_trades():
    user_id = request.args.get("user_id", 1)
    trades = query_db(
        "SELECT * FROM trades WHERE user_id=? AND trade_type='target'",
        [user_id]
    )
    return jsonify([dict(t) for t in trades])

# ------------------- API: Margin Trades -------------------
@app.route("/api/margin-trades")
def get_margin_trades():
    user_id = request.args.get("user_id", 1)
    trades = query_db(
        "SELECT * FROM trades WHERE user_id=? AND trade_type='margin'",
        [user_id]
    )
    return jsonify([dict(t) for t in trades])

# ------------------- Run App -------------------
if __name__ == "__main__":
    app.run(debug=True)
