import os
import json
import base64
import uuid
import boto3
import psycopg2
import re

ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'changeme')

def get_audio_duration(data: bytes) -> str:
    return "0:00"

def handler(event: dict, context) -> dict:
    """Загружает MP3 файл в S3 и сохраняет метаданные песни в БД."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    method = event.get('httpMethod', 'POST')

    body = json.loads(event.get('body') or '{}')

    if body.get('password') != ADMIN_PASSWORD:
        return {
            'statusCode': 401,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Неверный пароль'})
        }

    schema = os.environ['MAIN_DB_SCHEMA']

    if method == 'DELETE':
        song_id = body.get('id')
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(f"SELECT file_key FROM {schema}.songs WHERE id = %s", (song_id,))
        row = cur.fetchone()
        if row:
            s3 = boto3.client('s3', endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])
            s3.delete_object(Bucket='files', Key=f"songs/{row[0]}")
            cur.execute(f"DELETE FROM {schema}.songs WHERE id = %s", (song_id,))
            conn.commit()
        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'ok': True})
        }

    title = body.get('title', 'Без названия')
    artist = body.get('artist', '')
    lyrics = body.get('lyrics', '')
    duration = body.get('duration', '0:00')
    file_b64 = body.get('file')

    if not file_b64:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Файл не передан'})
        }

    file_data = base64.b64decode(file_b64)
    file_key = f"{uuid.uuid4()}.mp3"

    s3 = boto3.client('s3', endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])
    s3.put_object(Bucket='files', Key=f"songs/{file_key}", Body=file_data, ContentType='audio/mpeg')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {schema}.songs (title, artist, duration, lyrics, file_key) VALUES (%s, %s, %s, %s, %s) RETURNING id",
        (title, artist, duration, lyrics, file_key)
    )
    new_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    access_key = os.environ['AWS_ACCESS_KEY_ID']
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({
            'id': new_id,
            'url': f"https://cdn.poehali.dev/projects/{access_key}/bucket/songs/{file_key}"
        })
    }
