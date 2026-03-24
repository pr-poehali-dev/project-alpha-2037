import os
import json
import uuid
import re
import urllib.request
import urllib.parse
import boto3
import psycopg2

ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'changeme')

def fetch_url(url: str, headers: dict = None) -> bytes:
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read()

def extract_track_id(yandex_url: str) -> str | None:
    m = re.search(r'/track/(\d+)', yandex_url)
    return m.group(1) if m else None

def get_track_meta(track_id: str) -> dict:
    api_url = f"https://api.music.yandex.net/tracks/{track_id}"
    headers = {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
    }
    try:
        data = fetch_url(api_url, headers)
        parsed = json.loads(data)
        track = parsed.get('result', [{}])
        if isinstance(track, list):
            track = track[0] if track else {}
        title = track.get('title', 'Без названия')
        artists = ', '.join(a.get('name', '') for a in track.get('artists', []))
        duration_ms = track.get('durationMs', 0)
        minutes = duration_ms // 60000
        seconds = (duration_ms % 60000) // 1000
        duration = f"{minutes}:{seconds:02d}"
        return {'title': title, 'artist': artists, 'duration': duration}
    except Exception:
        return {'title': 'Без названия', 'artist': '', 'duration': '0:00'}

def get_download_info(track_id: str) -> str | None:
    api_url = f"https://api.music.yandex.net/tracks/{track_id}/download-info"
    headers = {'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json'}
    try:
        data = fetch_url(api_url, headers)
        parsed = json.loads(data)
        infos = parsed.get('result', [])
        mp3_infos = [i for i in infos if i.get('codec') == 'mp3']
        if not mp3_infos:
            return None
        best = sorted(mp3_infos, key=lambda x: x.get('bitrateInKbps', 0), reverse=True)[0]
        dl_info_url = best.get('downloadInfoUrl', '')
        if not dl_info_url:
            return None
        xml_data = fetch_url(dl_info_url, headers).decode('utf-8')
        host_m = re.search(r'<host>([^<]+)</host>', xml_data)
        path_m = re.search(r'<path>([^<]+)</path>', xml_data)
        ts_m = re.search(r'<ts>([^<]+)</ts>', xml_data)
        s_m = re.search(r'<s>([^<]+)</s>', xml_data)
        if not (host_m and path_m and ts_m and s_m):
            return None
        host = host_m.group(1)
        path = path_m.group(1)
        ts = ts_m.group(1)
        s = s_m.group(1)
        import hashlib
        sign = hashlib.md5(f"XGRlBW9FXlekgbPrRHuSiA{path[1:]}{s}".encode()).hexdigest()
        audio_url = f"https://{host}/get-mp3/{sign}/{ts}{path}"
        return audio_url
    except Exception:
        return None

def handler(event: dict, context) -> dict:
    """Импортирует трек из Яндекс.Музыки по ссылке: скачивает аудио и сохраняет в библиотеку."""
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

    yandex_url = body.get('url', '').strip()
    if not yandex_url:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Укажите ссылку на трек'})
        }

    track_id = extract_track_id(yandex_url)
    if not track_id:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Не удалось определить трек. Вставьте ссылку вида music.yandex.ru/album/.../track/...'})
        }

    meta = get_track_meta(track_id)
    title = body.get('title') or meta['title']
    artist = body.get('artist') or meta['artist']
    duration = meta['duration']
    lyrics = body.get('lyrics', '')

    audio_url = get_download_info(track_id)
    if not audio_url:
        return {
            'statusCode': 422,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'error': 'Не удалось скачать трек. Яндекс.Музыка требует авторизации — попробуйте добавить трек вручную через MP3 файл.',
                'meta': {'title': title, 'artist': artist, 'duration': duration}
            })
        }

    try:
        audio_data = fetch_url(audio_url, {'User-Agent': 'Mozilla/5.0'})
    except Exception as e:
        return {
            'statusCode': 422,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Ошибка скачивания аудио: {str(e)}'})
        }

    file_key = f"{uuid.uuid4()}.mp3"
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )
    s3.put_object(Bucket='files', Key=f"songs/{file_key}", Body=audio_data, ContentType='audio/mpeg')

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
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({
            'id': new_id,
            'title': title,
            'artist': artist,
            'duration': duration,
            'url': f"https://cdn.poehali.dev/projects/{access_key}/bucket/songs/{file_key}"
        })
    }
