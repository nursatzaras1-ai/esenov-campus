"""Vercel Python function. Computes browser demo aggregates; stores nothing."""
import csv
import io
import json
import math
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler

COURSES = {
    1: 'Логистика негіздері', 2: 'Бағдарламалау негіздері',
    3: 'Академиялық ағылшын', 4: 'Жоғары математика',
    5: 'Қазақстан тарихы', 6: 'Неміс тілі · A1',
}
MAX_BODY = 200_000


def integer(value):
    return isinstance(value, int) and not isinstance(value, bool)


def calculate(payload):
    if not isinstance(payload, dict):
        raise ValueError('JSON объектісі қажет.')
    rows = payload.get('courses', [])
    ratings = payload.get('ratings', [])
    if not isinstance(rows, list) or len(rows) > 6:
        raise ValueError('Курстар тізімі дұрыс емес.')
    if not isinstance(ratings, list) or len(ratings) > 2000:
        raise ValueError('Рейтинг саны 2000-нан аспауы керек.')
    known = {}
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError('Курс жазбасы дұрыс емес.')
        cid, done, score = row.get('id'), row.get('done', []), row.get('score')
        if not integer(cid) or cid not in COURSES or cid in known:
            raise ValueError('Курс идентификаторы дұрыс емес немесе қайталанған.')
        if not isinstance(done, list) or len(done) > 3 or any(not integer(x) or x not in (0, 1, 2) for x in done):
            raise ValueError('Сабақ нөмірлері 0, 1, 2 болуы керек.')
        if score is not None and (isinstance(score, bool) or not isinstance(score, (float, int)) or not math.isfinite(score) or not 0 <= score <= 100):
            raise ValueError('Тест ұпайы 0 мен 100 арасында болуы керек.')
        known[cid] = {'done': len(set(done)), 'score': score}
    buckets = {cid: [] for cid in COURSES}
    for row in ratings:
        if not isinstance(row, dict):
            raise ValueError('Рейтинг жазбасы дұрыс емес.')
        cid, rating = row.get('course_id'), row.get('rating')
        if not integer(cid) or cid not in COURSES or not integer(rating) or not 1 <= rating <= 5:
            raise ValueError('Рейтинг 1 мен 5 арасында болуы керек.')
        buckets[cid].append(rating)
    result = []
    for cid, title in COURSES.items():
        item = known.get(cid, {'done': 0, 'score': None})
        values = buckets[cid]
        result.append({
            'id': cid, 'title': title, 'lessons_done': item['done'],
            'lessons_total': 3, 'progress': round(item['done'] / 3 * 100, 1),
            'test_score': item['score'], 'reviews_count': len(values),
            'rating': round(sum(values) / len(values), 2) if values else None,
        })
    scores = [r['test_score'] for r in result if r['test_score'] is not None]
    all_ratings = [v for values in buckets.values() for v in values]
    total_done = sum(r['lessons_done'] for r in result)
    return {
        'engine': 'Python', 'scope': 'browser_demo',
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'summary': {
            'courses_total': 6, 'courses_started': sum(r['lessons_done'] > 0 or r['test_score'] is not None for r in result),
            'courses_completed': sum(r['lessons_done'] == 3 for r in result),
            'lessons_done': total_done, 'lessons_total': 18,
            'completion_percent': round(total_done / 18 * 100, 1),
            'tests_attempted': len(scores), 'average_test_score': round(sum(scores) / len(scores), 1) if scores else None,
            'reviews_count': len(all_ratings), 'average_rating': round(sum(all_ratings) / len(all_ratings), 2) if all_ratings else None,
        },
        'courses': result,
    }


def to_csv(report):
    stream = io.StringIO(newline='')
    writer = csv.writer(stream)
    writer.writerow(['Пән', 'Аяқталған сабақ', 'Барлық сабақ', 'Оқу барысы (%)', 'Тест ұпайы', 'Пікір саны', 'Орташа рейтинг'])
    for row in report['courses']:
        writer.writerow([row['title'], row['lessons_done'], row['lessons_total'], row['progress'],
                         '' if row['test_score'] is None else row['test_score'], row['reviews_count'],
                         '' if row['rating'] is None else row['rating']])
    return ('\ufeff' + stream.getvalue()).encode('utf-8')


class handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        # Do not log request bodies, tokens or personal data.
        pass

    def respond(self, status, body, content_type='application/json; charset=utf-8', download=False):
        if not isinstance(body, bytes):
            body = json.dumps(body, ensure_ascii=False, allow_nan=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Length', str(len(body)))
        if download:
            self.send_header('Content-Disposition', 'attachment; filename="yessenov-analytics.csv"')
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        self.respond(200, {'status': 'ok', 'engine': 'Python', 'scope': 'browser_demo'})

    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= MAX_BODY:
                self.respond(413, {'error': 'Сұрау бос немесе тым үлкен.'})
                return
            if self.headers.get('Content-Type', '').split(';')[0].strip() != 'application/json':
                self.respond(415, {'error': 'application/json қажет.'})
                return
            payload = json.loads(self.rfile.read(length), parse_constant=lambda _: (_ for _ in ()).throw(ValueError('Сан дұрыс емес.')))
            report = calculate(payload)
            if payload.get('format') == 'csv':
                self.respond(200, to_csv(report), 'text/csv; charset=utf-8', download=True)
            else:
                self.respond(200, report)
        except (ValueError, TypeError, UnicodeError):
            self.respond(400, {'error': 'Деректер пішімі дұрыс емес. Бетті жаңартып көр.'})
