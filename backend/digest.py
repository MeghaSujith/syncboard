import firebase_admin
from firebase_admin import credentials, db
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
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
    
    subject = f"SyncBoard Weekly Digest — {board_summary['name']}"
    
    body = f"""
Hello!

Here's your weekly summary for the board: {board_summary['name']}

📊 Board Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 To Do:        {board_summary['todo']} cards
⚡ In Progress:  {board_summary['inprogress']} cards  
✅ Done:         {board_summary['done']} cards
📌 Total Cards:  {board_summary['total']} cards
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👥 Board Members: {', '.join(board_summary['members'])}
👤 Board Owner: {board_summary['owner']}

Generated on: {datetime.now().strftime('%d %B %Y at %I:%M %p')}

Keep up the great work!
— SyncBoard Team
    """
    
    msg = MIMEMultipart()
    msg['From'] = gmail_user
    msg['To'] = recipient_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(gmail_user, gmail_pass)
        server.sendmail(gmail_user, recipient_email, msg.as_string())
        server.quit()
        print(f"Email sent successfully to {recipient_email}")
        return True
    except Exception as e:
        print(f"Failed to send email to {recipient_email}: {e}")
        return False

def run_digest(board_id=None):
    if board_id:
        # Run for specific board
        print(f"Running digest for board: {board_id}")
        summary = get_board_summary(board_id)
        if summary:
            for member in summary['members']:
                send_digest_email(summary, member)
        else:
            print(f"Board {board_id} not found")
    else:
        # Run for all boards
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
    # Check for --board flag
    board_id = None
    if '--board' in sys.argv:
        idx = sys.argv.index('--board')
        if idx + 1 < len(sys.argv):
            board_id = sys.argv[idx + 1]
    
    run_digest(board_id)
    print("Digest complete!")

    