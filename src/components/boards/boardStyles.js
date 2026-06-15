export const boardsStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .boards-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    min-height: 100vh;
    background: #f1f5f9;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.45s ease, transform 0.45s ease;
    position: relative;
  }
  .boards-root.mounted { opacity: 1; transform: translateY(0); }
  .boards-root::before {
    content: '';
    position: fixed; inset: 0;
    background-image: radial-gradient(circle, #cbd5e1 1px, transparent 1px);
    background-size: 28px 28px;
    opacity: 0.45;
    pointer-events: none; z-index: 0;
  }

  .nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid #e2e8f0;
    padding: 0 40px; height: 76px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .nav-brand { display: flex; align-items: center; gap: 12px; }
  .nav-logo { width: 42px; height: 42px; background: #0d9488; border-radius: 11px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(13,148,136,0.35); }
  .nav-logo svg { width: 22px; height: 22px; stroke: white; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .nav-title { font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.4px; }
  .nav-right { display: flex; align-items: center; gap: 12px; }

  .role-badge {
    display: flex; align-items: center; gap: 6px;
    padding: 5px 12px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    font-size: 12px; font-weight: 700;
    color: #15803d;
    letter-spacing: 0.2px;
  }
  .role-badge-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 0 2px rgba(34,197,94,0.25);
    flex-shrink: 0;
  }

  .profile-trigger {
    display: flex; align-items: center; gap: 10px;
    cursor: pointer; position: relative;
    padding: 6px 10px; border-radius: 10px;
    transition: background 0.2s;
  }
  .profile-trigger:hover { background: #f1f5f9; }

  .avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #0d9488, #0ea5e9); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: white; box-shadow: 0 2px 8px rgba(13,148,136,0.3); flex-shrink: 0; }
  .user-name { font-size: 13px; color: #334155; font-weight: 700; }

  .profile-card {
    position: absolute; top: calc(100% + 12px); right: 0;
    background: white; border: 1px solid #e2e8f0; border-radius: 16px;
    box-shadow: 0 20px 40px -8px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.02);
    padding: 20px; width: 240px; z-index: 999;
    animation: popoverInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .profile-card-arrow {
    position: absolute; top: -6px; right: 24px;
    width: 14px; height: 14px; background: white;
    border-top: 1px solid #e2e8f0; border-left: 1px solid #e2e8f0;
    transform: rotate(45deg); border-radius: 2px 0 0 0;
  }
  .profile-card-photo {
    width: 64px; height: 64px; border-radius: 50%;
    background: linear-gradient(135deg, #0d9488, #0ea5e9);
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; font-weight: 700; color: white;
    margin-bottom: 10px;
    box-shadow: 0 4px 12px rgba(13,148,136,0.25);
  }

  .btn-danger { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; }
  .btn-danger:hover { background: #fee2e2; }

  .main { max-width: 1100px; margin: 0 auto; padding: 40px 32px; position: relative; z-index: 1; }

  .hero-banner { background: linear-gradient(135deg, #0d9488 0%, #0ea5e9 100%); border-radius: 20px; padding: 36px 40px; margin-bottom: 28px; display: flex; align-items: center; justify-content: space-between; position: relative; overflow: hidden; }
  .hero-banner::before { content: ''; position: absolute; top: -40px; right: -40px; width: 220px; height: 220px; background: rgba(255,255,255,0.08); border-radius: 50%; }
  .hero-banner::after { content: ''; position: absolute; bottom: -60px; right: 120px; width: 160px; height: 160px; background: rgba(255,255,255,0.06); border-radius: 50%; }
  .hero-text h2 { font-size: 26px; font-weight: 800; color: white; letter-spacing: -0.5px; margin-bottom: 6px; }
  .hero-text p { font-size: 14px; color: rgba(255,255,255,0.8); }
  .hero-btn { background: white; color: #0d9488; padding: 11px 22px; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; display: flex; align-items: center; gap: 7px; transition: all 0.2s; position: relative; z-index: 1; box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
  .hero-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.18); }

  .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
  .stat-card { background: white; border-radius: 16px; padding: 22px 24px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 16px; transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; position: relative; cursor: default; }
  .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.07); border-color: #0d9488; }
  .stat-icon-wrap { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
  .stat-label { font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
  .stat-value { font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
  .stat-hint { font-size: 12px; margin-top: 2px; font-weight: 500; }

  .search-wrap {
    position: relative; margin-bottom: 24px;
  }
  .search-icon {
    position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
    pointer-events: none;
  }
  .search-input {
    width: 100%; padding: 12px 16px 12px 44px;
    background: white; border: 1.5px solid #e2e8f0;
    border-radius: 12px; font-size: 14px; font-family: inherit;
    color: #0f172a; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .search-input::placeholder { color: #94a3b8; }
  .search-input:focus { border-color: #0d9488; box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }
  .search-clear {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    background: #f1f5f9; border: none; border-radius: 6px;
    width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #64748b; font-size: 14px;
    transition: background 0.15s;
  }
  .search-clear:hover { background: #e2e8f0; }

  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(15,23,42,0.55);
    z-index: 1000;
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(6px);
    animation: overlayIn 0.2s ease;
  }
  .modal-box {
    background: white;
    border-radius: 20px;
    width: 460px;
    box-shadow: 0 32px 64px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.04);
    overflow: hidden;
    animation: modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .modal-header {
    padding: 28px 32px 0;
  }
  .modal-icon {
    width: 48px; height: 48px; border-radius: 14px;
    background: linear-gradient(135deg, #f0fdfa, #ccfbf1);
    border: 1px solid #a7f3d0;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; margin-bottom: 16px;
  }
  .modal-title { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px; margin-bottom: 4px; }
  .modal-subtitle { font-size: 14px; color: #64748b; }
  .modal-body { padding: 24px 32px; }
  .modal-field { margin-bottom: 20px; }
  .modal-label {
    display: block; font-size: 12px; font-weight: 700;
    color: #475569; margin-bottom: 8px; letter-spacing: 0.4px;
    text-transform: uppercase;
  }
  .modal-input {
    width: 100%; padding: 13px 16px;
    border-radius: 10px; border: 1.5px solid #e2e8f0;
    font-size: 14px; font-family: inherit; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    color: #0f172a; background: #fafafa;
  }
  .modal-input:focus { border-color: #0d9488; box-shadow: 0 0 0 3px rgba(13,148,136,0.1); background: white; }
  .modal-footer {
    padding: 0 32px 28px;
    display: flex; justify-content: flex-end; gap: 10px;
  }
  .modal-cancel {
    padding: 11px 20px; background: #f8fafc; border: 1.5px solid #e2e8f0;
    color: #475569; border-radius: 10px; font-size: 14px; font-weight: 600;
    cursor: pointer; font-family: inherit; transition: 0.2s;
  }
  .modal-cancel:hover { background: #f1f5f9; border-color: #cbd5e1; }
  .modal-submit {
    padding: 11px 24px; background: #0d9488; color: white;
    border: none; border-radius: 10px; font-size: 14px; font-weight: 700;
    cursor: pointer; font-family: inherit;
    box-shadow: 0 4px 12px rgba(13,148,136,0.3);
    transition: 0.2s;
  }
  .modal-submit:hover:not(:disabled) { background: #0f766e; box-shadow: 0 6px 18px rgba(13,148,136,0.35); transform: translateY(-1px); }
  .modal-submit:disabled { opacity: 0.5; cursor: not-allowed; }

  @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes modalIn {
    from { opacity: 0; transform: translateY(20px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes popoverIn {
    from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  @keyframes popoverInRight {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes cardIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

  .section-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .section-label::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; }

  .boards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px; }
  .board-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; cursor: pointer; transition: transform 0.22s, box-shadow 0.22s, border-color 0.22s; animation: cardIn 0.4s ease both; }
  .board-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.1); border-color: #cbd5e1; }
  .board-card-banner { position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: flex-start; padding: 20px; min-height: 90px; }
  .board-card-title-white { font-size: 18px; font-weight: 800; color: white; margin-bottom: 8px; text-shadow: 0 1px 2px rgba(0,0,0,0.15); line-height: 1.2; }
  .board-name-badge { background: rgba(255,255,255,0.25); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 700; color: white; }
  .board-card-body { padding: 16px 20px 14px; }
  .board-card-meta { font-size: 12px; color: #64748b; display: flex; gap: 10px; align-items: center; font-weight: 500; }
  .meta-dot { width: 4px; height: 4px; border-radius: 50%; background: #cbd5e1; }
  .board-card-footer { padding: 12px 20px; background: #f8fafc; border-top: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
  .member-avatar { width: 26px; height: 26px; border-radius: 50%; background: #f0fdfa; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #0d9488; }
  .member-count { font-size: 12px; color: #64748b; font-weight: 600; margin-left: 8px; }
  .open-pill { font-size: 12px; color: #94a3b8; font-weight: 600; display: flex; align-items: center; gap: 4px; transition: color 0.2s; }
  .board-card:hover .open-pill { color: #0d9488; }
  .open-arrow { transition: transform 0.2s; display: inline-block; }
  .board-card:hover .open-arrow { transform: translateX(3px); }

  .empty { text-align: center; padding: 72px 32px; background: white; border: 1.5px dashed #cbd5e1; border-radius: 16px; }
  .empty-icon { font-size: 44px; margin-bottom: 14px; }
  .empty h3 { font-size: 16px; font-weight: 700; color: #334155; margin-bottom: 6px; }
  .empty p { font-size: 14px; color: #94a3b8; }

  .loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Plus Jakarta Sans', sans-serif; background: #f1f5f9; }
  .spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #0d9488; border-radius: 50%; animation: spin 0.7s linear infinite; }
`;