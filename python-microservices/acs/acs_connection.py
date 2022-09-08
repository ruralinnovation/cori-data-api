import os
import psycopg


DB_ARGS = {
    'user': os.environ['DB_USER'],
    'password': os.environ['SECRET'],
    'host': os.environ['DB_HOST'],
    'dbname': os.environ['DB_NAME'],
    }
# ideally this allows us to reuse a connection
conn = None


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

