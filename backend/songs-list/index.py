import os
import json
import psycopg2

def handler(event: dict, context) -> dict:
    """Возвращает список всех песен из базы данных."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    schema = os.environ['MAIN_DB_SCHEMA']

    cur.execute(f"SELECT id, title, artist, duration, lyrics, file_key, created_at FROM {schema}.songs ORDER BY created_at ASC")
    rows = cur.fetchall()
    cur.close()
    conn.close()

    access_key = os.environ['AWS_ACCESS_KEY_ID']
    songs = []
    for row in rows:
        songs.append({
            'id': row[0],
            'title': row[1],
            'artist': row[2],
            'duration': row[3],
            'lyrics': row[4],
            'url': f"https://cdn.poehali.dev/projects/{access_key}/bucket/songs/{row[5]}",
        })

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'songs': songs})
    }
