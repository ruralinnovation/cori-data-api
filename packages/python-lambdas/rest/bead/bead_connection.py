import decimal
import os
import psycopg
import types

DB_ARGS = {
    'user': os.environ['DB_USER'],
    'password': os.environ['DB_SECRET'],
    'host': os.environ['DB_HOST'],
    'dbname': os.environ['DB_NAME'],
    'connect_timeout': 10,
    'options': '-c statement_timeout=10000'
    }
# ideally this allows us to reuse a connection
conn = None

def replace_decimals(obj):
    if isinstance(obj, list):
        for i in range(len(obj)):
            obj[i] = replace_decimals(obj[i])
        return obj
    elif isinstance(obj, dict):
        for k, v in obj.items():
            obj[k] = replace_decimals(obj[k])
        return obj
    elif isinstance(obj, decimal.Decimal):
#         return str(obj)
        # In my original code I'm converting to int or float, comment the line above if necessary.
        if obj % 1 == 0:
            return int(obj)
        else:
            return float(obj)
    else:
        return obj

def execute(query):
    global conn
    if not conn:
        conn = psycopg.connect(**DB_ARGS)

    with conn.cursor() as cur:
        try:
            cur.execute(query)
            return cur.fetchall()
        except Exception as error:
            print(error)
            cur.execute("ROLLBACK")
            conn.commit()

def execute_with_cols(query):
    global conn
    if not conn:
        conn = psycopg.connect(**DB_ARGS)

    with conn.cursor() as cur:
        try:
            cur.execute(query)
            # return cur.fetchall()
            return [ replace_decimals(dict(line)) for line in [zip([ column[0] for column in cur.description], row) for row in cur.fetchall()] ]
        except Exception as error:
            print(error)
            cur.execute("ROLLBACK")
            conn.commit()

