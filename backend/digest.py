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
    
    board_name = info.get('name', 'Unnamed Board')
    members = info.get('members', [])
    owner = info.get('owner', 'Unknown')
    
    columns = data.get('columns', {})
    cards = data.get('cards', {})
    
    todo_count = len(columns.get('todo', {}).get('cardIds', []) or [])
    inprogress_count = len(columns.get('inprogress', {}).get('cardIds', []) or [])
    done_count = len(columns.get('done', {}).get('cardIds', []) or [])
    total_cards = len(cards)
    
    return {
        'name': board_name,
        'owner': owner,
        'members': members,
        'todo': todo_count,
        'inprogress': inprogress_count,
        'done': done_count,
        'total': total_cards
    }

def send_digest_email(board_summary, recipient_email):
    gmail_user = os.getenv('GMAIL_USER')
    gmail_pass = os.getenv('GMAIL_PASS')
    
    if not gmail_user or not gmail_pass:
        print("Error: GMAIL_USER or GMAIL_PASS not set in .env file")
        return False
    
    subject = f"📊 SyncBoard Weekly Digest: {board_summary['name']}"
    
    # BEAUTIFUL HTML EMAIL TEMPLATE
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 40px 20px; color: #0f172a; }}
            .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }}
            .header {{ background-color: #0f172a; padding: 30px; text-align: center; border-bottom: 4px solid #0d9488; }}
            .header h1 {{ color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }}
            .header p {{ color: #94a3b8; margin: 8px 0 0 0; font-size: 15px; }}
            .content {{ padding: 32px; }}
            .greeting {{ font-size: 16px; margin-bottom: 24px; color: #334155; }}
            .stats-grid {{ display: flex; text-align: center; gap: 16px; margin-bottom: 32px; }}
            .stat-box {{ flex: 1; padding: 20px; border-radius: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0; }}
            .stat-box.todo {{ border-top: 4px solid #8b5cf6; }}
            .stat-box.progress {{ border-top: 4px solid #f59e0b; }}
            .stat-box.done {{ border-top: 4px solid #10b981; }}
            .stat-number {{ font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }}
            .stat-label {{ font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }}
            .details-box {{ background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e8f0; }}
            .detail-row {{ margin-bottom: 12px; font-size: 14px; }}
            .detail-row:last-child {{ margin-bottom: 0; }}
            .detail-label {{ font-weight: 600; color: #475569; width: 120px; display: inline-block; }}
            .detail-value {{ color: #0f172a; }}
            .footer {{ text-align: center; padding: 24px; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; background-color: #f8fafc; }}
            .btn {{ display: inline-block; background-color: #0d9488; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 16px; font-size: 14px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>SyncBoard Digest</h1>
                <p>Project: {board_summary['name']}</p>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Hello Team,<br><br>
                    Here is your weekly automated progress summary for <strong>{board_summary['name']}</strong>.
                </div>

                <div class="stats-grid">
                    <div class="stat-box todo">
                        <div class="stat-number">{board_summary['todo']}</div>
                        <div class="stat-label">To Do</div>
                    </div>
                    <div class="stat-box progress">
                        <div class="stat-number">{board_summary['inprogress']}</div>
                        <div class="stat-label">In Progress</div>
                    </div>
                    <div class="stat-box done">
                        <div class="stat-number">{board_summary['done']}</div>
                        <div class="stat-label">Done</div>
                    </div>
                </div>

                <div class="details-box">
                    <div class="detail-row">
                        <span class="detail-label">Total Cards:</span>
                        <span class="detail-value">{board_summary['total']}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Board Owner:</span>
                        <span class="detail-value">{board_summary['owner']}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Active Members:</span>
                        <span class="detail-value">{', '.join(board_summary['members'])}</span>
                    </div>
                </div>

                <div style="text-align: center;">
                    <a href="http://localhost:3000" class="btn">Open SyncBoard</a>
                </div>
            </div>

            <div class="footer">
                Automated report generated on {datetime.now().strftime('%d %B %Y at %I:%M %p')}<br>
                Powered by SyncBoard AI
            </div>
        </div>
    </body>
    </html>
    """
    
    msg = MIMEMultipart('alternative')
    msg['From'] = gmail_user
    msg['To'] = recipient_email
    msg['Subject'] = subject
    
    # Attach the HTML content
    msg.attach(MIMEText(html_body, 'html'))
    
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(gmail_user, gmail_pass)
        server.sendmail(gmail_user, recipient_email, msg.as_string())
        server.quit()
        print(f"HTML Email sent successfully to {recipient_email}")
        return True
    except Exception as e:
        print(f"Failed to send email to {recipient_email}: {e}")
        return False

def run_digest(board_id=None):
    if board_id:
        print(f"Running digest for board: {board_id}")
        summary = get_board_summary(board_id)
        if summary:
            for member in summary['members']:
                send_digest_email(summary, member)
        else:
            print(f"Board {board_id} not found")
    else:
        print("Running digest for all boards...")
        boards_ref = db.reference('boards')
        all_boards = boards_ref.get()
        
        if not all_boards:
            print("No boards found")
            return
        
        for bid, board_data in all_boards.items():
            summary = get_board_summary(bid)
            if summary and summary['members']:
                print(f"Processing board: {summary['name']}")
                for member in summary['members']:
                    send_digest_email(summary, member)

if __name__ == '__main__':
    board_id = None
    if '--board' in sys.argv:
        idx = sys.argv.index('--board')
        if idx + 1 < len(sys.argv):
            board_id = sys.argv[idx + 1]
    
    run_digest(board_id)
    print("Digest complete!")