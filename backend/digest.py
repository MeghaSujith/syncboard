"""
digest.py — SyncBoard Weekly Digest

Reads board activity from the Firebase Realtime Database and emails a
weekly summary to every active member of each board.

Run:
    python digest.py                  # digest for every board
    python digest.py --board <id>     # digest for a single board
    python digest.py --dry-run        # build the email, don't send it
"""

import argparse
import logging
import os
import smtplib
import sys
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import firebase_admin
from dotenv import load_dotenv
from firebase_admin import credentials, db

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("syncboard.digest")

SERVICE_ACCOUNT_PATH = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")
DATABASE_URL = os.getenv("FIREBASE_DATABASE_URL", "https://syncboard-f83b4-default-rtdb.firebaseio.com")
APP_URL = os.getenv("SYNCBOARD_APP_URL", "http://localhost:3000")


# ---------------------------------------------------------------------------
# Firebase setup
# ---------------------------------------------------------------------------

def init_firebase() -> None:
    """Initialize the Firebase Admin app once, failing fast with a clear
    message if the service account key is missing."""
    if firebase_admin._apps:
        return
    if not os.path.exists(SERVICE_ACCOUNT_PATH):
        log.error("serviceAccountKey.json not found at %s", SERVICE_ACCOUNT_PATH)
        sys.exit(1)
    cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred, {"databaseURL": DATABASE_URL})


# ---------------------------------------------------------------------------
# Board summarization
# ---------------------------------------------------------------------------

def summarize_board(board_id: str, board_data: dict | None = None) -> dict | None:
    """Build a summary dict for one board.

    Accepts an already-fetched board_data tree when available (avoids a
    redundant Firebase read when iterating over every board), otherwise
    fetches it directly for a single-board run.

    The per-column counts (todo/in_progress/done) are cross-referenced
    against the actual `cards` dict rather than trusted blindly, so a
    stale card ID left behind in a column's cardIds array (e.g. after a
    card was deleted) can never inflate a column count. Any card that
    exists in `cards` but isn't referenced by any column is counted
    separately as "unassigned" instead of being silently dropped.
    This guarantees: total == todo + in_progress + done + unassigned,
    always — the exact mismatch this script used to produce.
    """
    if board_data is None:
        board_data = db.reference(f"boards/{board_id}").get()

    if not board_data:
        log.warning("Board %s has no data — skipping.", board_id)
        return None

    info = board_data.get("info", {}) or {}
    data = board_data.get("data", {}) or {}
    columns = data.get("columns", {}) or {}
    cards = data.get("cards", {}) or {}

    valid_card_ids = set(cards.keys())

    def valid_ids_in(column_key: str) -> set:
        raw_ids = (columns.get(column_key, {}) or {}).get("cardIds", []) or []
        return set(raw_ids) & valid_card_ids  # drop any stale/deleted references

    todo_ids = valid_ids_in("todo")
    inprogress_ids = valid_ids_in("inprogress")
    done_ids = valid_ids_in("done")

    accounted_for = todo_ids | inprogress_ids | done_ids
    unassigned_ids = valid_card_ids - accounted_for

    members = list(dict.fromkeys(info.get("members", []) or []))  # de-duplicated, order preserved

    return {
        "name": info.get("name", "Unnamed Board"),
        "owner": info.get("owner", "Unknown"),
        "members": members,
        "todo": len(todo_ids),
        "inprogress": len(inprogress_ids),
        "done": len(done_ids),
        "unassigned": len(unassigned_ids),
        "total": len(valid_card_ids),
    }


# ---------------------------------------------------------------------------
# Email rendering
# ---------------------------------------------------------------------------

def render_digest_html(summary: dict) -> str:
    """Render the digest email body. Colors are pulled from SyncBoard's own
    brand palette (navy / teal / amber) instead of an unrelated purple, so
    the email is visually consistent with the product it represents."""

    unassigned_row = ""
    if summary["unassigned"]:
        unassigned_row = f"""
                    <div class="stat-box unassigned">
                        <div class="stat-number">{summary['unassigned']}</div>Unassigned
                    </div>"""

    members_html = (
        ", ".join(summary["members"]) if summary["members"] else "No active members"
    )

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', sans-serif; background-color: #f1f5f9; padding: 40px 20px; color: #0f172a; }}
            .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
            .header {{ background-color: #0b2545; padding: 30px; text-align: center; border-bottom: 4px solid #0d9488; }}
            .header h1 {{ color: #ffffff; margin: 0; font-size: 24px; }}
            .header p {{ color: #94a3b8; margin: 8px 0 0 0; font-size: 15px; }}
            .content {{ padding: 32px; }}
            .stats-grid {{ display: flex; text-align: center; gap: 16px; margin-bottom: 32px; }}
            .stat-box {{ flex: 1; padding: 20px; border-radius: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0; }}
            .todo {{ border-top: 4px solid #0b2545; }}
            .progress {{ border-top: 4px solid #d97706; }}
            .done {{ border-top: 4px solid #0d9488; }}
            .unassigned {{ border-top: 4px solid #94a3b8; }}
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
                    <div class="stat-box done"><div class="stat-number">{summary['done']}</div>Done</div>{unassigned_row}
                </div>
                <div class="details-box">
                    <div class="detail-row"><strong>Total Cards:</strong> {summary['total']}</div>
                    <div class="detail-row"><strong>Board Owner:</strong> {summary['owner']}</div>
                    <div class="detail-row"><strong>Active Members:</strong> {members_html}</div>
                </div>
                <div style="text-align: center;"><a href="{APP_URL}" class="btn">Open SyncBoard</a></div>
            </div>
            <div class="footer">Automated report generated on {datetime.now().strftime('%d %B %Y')}<br>Powered by SyncBoard</div>
        </div>
    </body>
    </html>
    """


# ---------------------------------------------------------------------------
# Email delivery
# ---------------------------------------------------------------------------

def open_smtp_connection():
    """Open and authenticate ONE SMTP session for the entire digest run.

    The previous version called smtplib.SMTP(...).login(...) inside
    send_digest_email — i.e. once PER RECIPIENT. Each fresh connection
    costs a TLS handshake + Gmail auth round-trip (roughly 2-5 seconds).
    With even a handful of recipients that alone accounts for the
    ~1.5 minute delay. Reusing a single logged-in session and calling
    sendmail() repeatedly on it cuts total send time down to roughly
    the size of the emails themselves, not the number of recipients.
    """
    gmail_user = os.getenv("GMAIL_USER")
    gmail_pass = os.getenv("GMAIL_PASS")

    if not gmail_user or not gmail_pass:
        log.error("GMAIL_USER / GMAIL_PASS not set — cannot send email.")
        return None

    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(gmail_user, gmail_pass)
    return server


def send_digest_email(summary: dict, recipient_email: str, server, dry_run: bool = False) -> bool:
    """Send one digest email over an already-open SMTP session.

    Returns True on success. Failures are logged with the actual
    exception instead of being swallowed silently.
    """
    gmail_user = os.getenv("GMAIL_USER")

    msg = MIMEMultipart("alternative")
    msg["From"] = gmail_user
    msg["To"] = recipient_email
    msg["Subject"] = f"SyncBoard Weekly Digest: {summary['name']}"
    msg.attach(MIMEText(render_digest_html(summary), "html"))

    if dry_run:
        log.info("[DRY RUN] Would send digest for '%s' to %s", summary["name"], recipient_email)
        return True

    if server is None:
        log.error("No SMTP session available — cannot send to %s.", recipient_email)
        return False

    try:
        server.sendmail(gmail_user, recipient_email, msg.as_string())
        log.info("Digest sent for '%s' to %s", summary["name"], recipient_email)
        return True
    except smtplib.SMTPException as exc:
        log.error("Failed to send digest to %s: %s", recipient_email, exc)
        return False


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

def digest_for_board(board_id: str, board_data: dict | None = None, server=None, dry_run: bool = False) -> None:
    summary = summarize_board(board_id, board_data)
    if not summary:
        return
    if not summary["members"]:
        log.warning("Board '%s' has no members — nothing to send.", summary["name"])
        return

    sent, failed = 0, 0
    for member in summary["members"]:
        if send_digest_email(summary, member, server, dry_run=dry_run):
            sent += 1
        else:
            failed += 1
    log.info("Board '%s': %d sent, %d failed.", summary["name"], sent, failed)


def run_digest(board_id: str | None = None, dry_run: bool = False) -> None:
    init_firebase()

    server = None if dry_run else open_smtp_connection()
    if not dry_run and server is None:
        log.error("Could not open SMTP session — aborting run.")
        return

    try:
        if board_id:
            digest_for_board(board_id, server=server, dry_run=dry_run)
            return

        all_boards = db.reference("boards").get() or {}
        if not all_boards:
            log.info("No boards found — nothing to do.")
            return

        for bid, board_data in all_boards.items():
            digest_for_board(bid, board_data=board_data, server=server, dry_run=dry_run)
    finally:
        if server is not None:
            server.quit()


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Send SyncBoard weekly digest emails.")
    parser.add_argument("--board", metavar="BOARD_ID", help="Run the digest for a single board only.")
    parser.add_argument("--dry-run", action="store_true", help="Build emails but do not send them.")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    run_digest(board_id=args.board, dry_run=args.dry_run)