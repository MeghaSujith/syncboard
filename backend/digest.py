import firebase_admin
from firebase_admin import credentials, db
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import os
import sys
from dotenv import load_dotenv

load_dotenv()

# Initialize Firebase Admin
cred = credentials.Certificate(os.path.join(os.path.dirname(__file__), 'serviceAccountKey.json'))
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://syncboard-f83b4-default-rtdb.firebaseio.com'
    })

def get_board_summary(board_id):
    ref = db.reference(f'boards/{board_id}')
    board_data = ref.get()
    
    if not board_data:
        return None
    
    info = board_data.get('info', {})
    data = board_data.get('data', {})
    columns = data.get('columns', {})
    cards = data.get('cards', {})
    
    return {
        'name': info.get('name', 'Unnamed Board'),
        'owner': info.get('owner', 'Unknown'),
        'members': info.get('members', []),
        'todo': len(columns.get('todo', {}).get('cardIds', []) or []),
        'inprogress': len(columns.get('inprogress', {}).get('cardIds', []) or []),
        'done': len(columns.get('done', {}).get('cardIds', []) or []),
        'total': len(cards)
    }

def get_digest_html(summary):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', sans-serif; background-color: #f1f5f9; padding: 40px 20px; color: #0f172a; }}
            .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
            .header {{ background-color: #0f172a; padding: 30px; text-align: center; border-bottom: 4px solid #0d9488; }}
            .header h1 {{ color: #ffffff; margin: 0; font-size: 24px; }}
            .header p {{ color: #94a3b8; margin: 8px 0 0 0; font-size: 15px; }}
            .content {{ padding: 32px; }}
            .stats-grid {{ display: flex; text-align: center; gap: 16px; margin-bottom: 32px; }}
            .stat-box {{ flex: 1; padding: 20px; border-radius: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0; }}
            .todo {{ border-top: 4px solid #8b5cf6; }}
            .progress {{ border-top: 4px solid #f59e0b; }}
            .done {{ border-top: 4px solid #10b981; }}
            .stat-number {{ font-size: 28px; font-weight: 800; }}
            .details-box {{ background-color: #f8fafc; border-radius: 8px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 24px; }}
            .detail-row {{ margin-bottom: 12px; font-size: 14px; }}
            .btn {{ display: inline-block; background-color: #0d9488; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; }}
            .footer {{ text-align: center; padding: 24px; font-size: 13px; color: #94a3b8; background-color: #f8fafc; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>SyncBoard Digest</h1>
                <p>Project: {summary['name']}</p>
            </div>
            <div class="content">
                <p style="margin-bottom: 24px;">Hello Team,<br><br>Here is your weekly automated progress summary.</p>
                <div class="stats-grid">
                    <div class="stat-box todo"><div class="stat-number">{summary['todo']}</div>To Do</div>
                    <div class="stat-box progress"><div class="stat-number">{summary['inprogress']}</div>In Progress</div>
                    <div class="stat-box done"><div class="stat-number">{summary['done']}</div>Done</div>
                </div>
                <div class="details-box">
                    <div class="detail-row"><strong>Total Cards:</strong> {summary['total']}</div>
                    <div class="detail-row"><strong>Board Owner:</strong> {summary['owner']}</div>
                    <div class="detail-row"><strong>Active Members:</strong> {', '.join(summary['members'])}</div>
                </div>
                <div style="text-align: center;"><a href="http://localhost:3000" class="btn">Open SyncBoard</a></div>
            </div>
            <div class="footer">Automated report generated on {datetime.now().strftime('%d %B %Y')}<br>Powered by SyncBoard AI</div>
        </div>
    </body>
    </html>
    """

def send_digest_email(board_summary, recipient_email):
    gmail_user = os.getenv('GMAIL_USER')
    gmail_pass = os.getenv('GMAIL_PASS')
    
    if not gmail_user or not gmail_pass:
        return False
        
    msg = MIMEMultipart('alternative')
    msg['From'] = gmail_user
    msg['To'] = recipient_email
    msg['Subject'] = f"📊 SyncBoard Weekly Digest: {board_summary['name']}"
    msg.attach(MIMEText(get_digest_html(board_summary), 'html'))
    
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(gmail_user, gmail_pass)
        server.sendmail(gmail_user, recipient_email, msg.as_string())
        server.quit()
        return True
    except Exception:
        return False

def process_boards_dict(boards_dict):
    if not boards_dict:
        return
    for bid, board_data in boards_dict.items():
        summary = get_board_summary(bid)
        if summary and summary.get('members'):
            for member in summary['members']:
                send_digest_email(summary, member)

def run_digest(board_id=None):
    if board_id:
        summary = get_board_summary(board_id)
        if summary and summary.get('members'):
            for member in summary['members']:
                send_digest_email(summary, member)
    else:
        all_boards = db.reference('boards').get()
        process_boards_dict(all_boards)

if __name__ == '__main__':
    board_id_arg = None
    if '--board' in sys.argv:
        idx = sys.argv.index('--board')
        if idx + 1 < len(sys.argv):
            board_id_arg = sys.argv[idx + 1]
    
    run_digest(board_id_arg)