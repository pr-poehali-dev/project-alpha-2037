import os
import json
import uuid
import boto3
import psycopg2

ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'changeme')

def handler(event: dict, context) -> dict:
    """Генерирует presigned URL для загрузки MP3 напрямую в S3, и сохраняет метаданные песни в БД."""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    body = json.loads(event.get('body') or '{}')

    if body.get('password') != ADMIN_PASSWORD:
        return {
            'statusCode': 401,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Неверный пароль'})
        }

    title = body.get('title', 'Без названия')
    artist = body.get('artist', '')
    lyrics = body.get('lyrics', '')
    duration = body.get('duration', '0:00')
    filename = body.get('filename', 'track.mp3')
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'mp3'
    file_key = f"{uuid.uuid4()}.{ext}"

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )

    presigned_url = s3.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': 'files',
            'Key': f"songs/{file_key}",
            'ContentType': 'audio/mpeg'
        },
        ExpiresIn=600
    )

    schema = os.environ['MAIN_DB_SCHEMA']
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
    cdn_url = f"https://cdn.poehali.dev/projects/{access_key}/bucket/songs/{file_key}"

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({
            'id': new_id,
            'upload_url': presigned_url,
            'cdn_url': cdn_url,
            'file_key': file_key
        })
    }
