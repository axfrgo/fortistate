const inspectorClientHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Fortistate Inspector - Ontogenetic Edition</title>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
      <!-- To set a favicon for the embedded inspector, place a file at /favicon.ico served by the inspector server
           or update this href to point to a reachable icon URL (absolute or relative to the inspector host). -->
      <link rel="icon" href="/favicon.ico" />
    <style>
      /* ============================================================================
         ONTOGENETIC INSPECTOR - Aurora White Edition
         Inspired by northern lights with soft pastels, glassmorphism, and clean white
         ============================================================================ */
      
      :root {
        --bg-primary: #ffffff;
        --bg-secondary: #f8fafc;
        --bg-tertiary: #f1f5f9;
        --card-bg: rgba(255, 255, 255, 0.85);
        --card-border: rgba(139, 92, 246, 0.15);
        --text-primary: #1e293b;
        --text-secondary: #475569;
        --text-muted: #64748b;
        --accent-primary: #8b5cf6;
        --accent-secondary: #a78bfa;
        --accent-glow: rgba(139, 92, 246, 0.25);
        --success: #10b981;
        --warning: #f59e0b;
        --error: #ef4444;
        --info: #3b82f6;
        --aurora-pink: #f0abfc;
        --aurora-blue: #93c5fd;
        --aurora-green: #86efac;
        --aurora-purple: #c4b5fd;
      }
      
      * {
        box-sizing: border-box;
      }
      
      html, body {
        height: 100%;
        margin: 0;
        padding: 0;
      }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background: linear-gradient(180deg, #faf5ff 0%, #f0f9ff 50%, #ecfdf5 100%);
        background-attachment: fixed;
        color: var(--text-primary);
        overflow-x: hidden;
      }
      
      /* Animated aurora background */
      body::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: 
          radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(244, 114, 182, 0.06) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(134, 239, 172, 0.04) 0%, transparent 60%);
        pointer-events: none;
        z-index: 0;
        animation: aurora-shift 20s ease-in-out infinite;
      }
      
      @keyframes aurora-shift {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }
      
      .wrap {
        position: relative;
        z-index: 1;
        padding: 20px;
        max-width: 1400px;
        margin: 0 auto;
      }
      
      /* ========== Header & Topbar ========== */
      .topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        padding: 20px 24px;
        background: var(--card-bg);
        backdrop-filter: blur(20px);
        border: 1px solid var(--card-border);
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(139, 92, 246, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.5) inset;
      }
      
      .header {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      
      h1 {
        font-size: 24px;
        margin: 0;
        font-weight: 700;
        background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 40%, #10b981 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        filter: drop-shadow(0 0 20px rgba(139, 92, 246, 0.2));
      }
      
      .subtitle {
        color: var(--text-secondary);
        font-size: 13px;
        margin-top: 4px;
      }
      
      .logo {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #10b981 100%);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 20px;
        color: white;
        box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
      }
      
      /* ========== Controls & Buttons ========== */
      .controls-group {
        display: flex;
        gap: 10px;
        align-items: center;
      }
      
      .btn {
        padding: 8px 16px;
        border-radius: 10px;
        border: 1px solid var(--card-border);
        background: var(--card-bg);
        backdrop-filter: blur(10px);
        color: var(--text-primary);
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .btn:hover {
        background: rgba(139, 92, 246, 0.1);
        border-color: var(--accent-secondary);
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(139, 92, 246, 0.2);
      }
      
      .btn.primary {
        background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
        border: none;
        color: white;
        box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
      }
      
      .btn.primary:hover {
        box-shadow: 0 6px 24px rgba(139, 92, 246, 0.4);
        transform: translateY(-2px);
      }
      
      .btn.secondary {
        background: rgba(139, 92, 246, 0.08);
        border-color: var(--accent-primary);
        color: var(--accent-primary);
      }
      
      .btn.ghost {
        background: transparent;
        border-color: transparent;
      }
      
      .btn.ghost:hover {
        background: rgba(139, 92, 246, 0.08);
        border-color: var(--card-border);
      }
      
      .btn.small {
        padding: 6px 12px;
        font-size: 12px;
      }
      
      .btn-icon {
        font-size: 14px;
        display: inline-flex;
        align-items: center;
      }
      
      .btn.full-width {
        width: 100%;
        justify-content: center;
      }
      
      /* ========== Modal & Overlay ========== */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(8px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: fadeIn 0.2s ease;
      }
      
      .modal {
        background: var(--bg-secondary);
        border: 1px solid var(--card-border);
        border-radius: 16px;
        max-width: 800px;
        width: 100%;
        max-height: 90vh;
        overflow: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(167, 139, 250, 0.2) inset;
        animation: slideUp 0.3s ease;
      }
      
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px;
        border-bottom: 1px solid var(--card-border);
        background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%);
      }
      
      .modal-header h2 {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
        background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .modal-close {
        background: transparent;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: var(--text-muted);
        padding: 8px;
        border-radius: 8px;
        transition: all 0.2s ease;
      }
      
      .modal-close:hover {
        background: rgba(239, 68, 68, 0.2);
        color: var(--error);
      }
      
      .modal-body {
        padding: 24px;
      }
      
      .modal-body h3 {
        font-size: 18px;
        margin: 24px 0 12px 0;
        color: var(--accent-secondary);
      }
      
      .modal-body h3:first-child {
        margin-top: 0;
      }
      
      .modal-body p {
        margin: 8px 0;
        line-height: 1.6;
        color: var(--text-secondary);
      }
      
      .modal-body ul {
        margin: 8px 0;
        padding-left: 24px;
      }
      
      .modal-body li {
        margin: 6px 0;
        line-height: 1.6;
        color: var(--text-secondary);
      }
      
      .modal-body code {
        background: rgba(167, 139, 250, 0.15);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Fira Code', monospace;
        font-size: 13px;
        color: var(--accent-secondary);
      }
      
      .help-section {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid var(--card-border);
        border-radius: 8px;
        padding: 16px;
        margin: 12px 0;
      }
      
      .help-icon {
        display: inline-block;
        margin-right: 8px;
      }
      
      /* ========== Configure Laws Modal ========== */
      .laws-modal {
        max-width: 700px;
        max-height: 90vh;
        overflow-y: auto;
      }
      
      .target-store-display {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid var(--card-border);
        border-radius: 8px;
        padding: 16px;
        text-align: center;
      }
      
      .store-key-badge {
        display: inline-block;
        padding: 8px 16px;
        background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
        border-radius: 8px;
        font-family: 'Fira Code', monospace;
        font-size: 16px;
        font-weight: 600;
        color: white;
        box-shadow: 0 4px 12px rgba(167, 139, 250, 0.4);
      }
      
      .preset-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
      }
      
      .preset-card {
        background: rgba(255, 255, 255, 0.02);
        border: 2px solid var(--card-border);
        border-radius: 10px;
        padding: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
      }
      
      .preset-card:hover {
        border-color: var(--accent-secondary);
        background: rgba(167, 139, 250, 0.05);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(167, 139, 250, 0.2);
      }
      
      .preset-card.selected {
        border-color: var(--accent-primary);
        background: rgba(167, 139, 250, 0.1);
        box-shadow: 0 0 0 2px rgba(167, 139, 250, 0.3);
      }
      
      .preset-card.selected::before {
        content: '✓';
        position: absolute;
        top: 12px;
        right: 12px;
        width: 24px;
        height: 24px;
        background: var(--accent-primary);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
        color: white;
        box-shadow: 0 2px 8px rgba(167, 139, 250, 0.4);
      }
      
      .preset-card-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }
      
      .preset-card-title {
        font-size: 15px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
      }
      
      .preset-card-description {
        font-size: 13px;
        color: var(--text-muted);
        line-height: 1.5;
        margin: 8px 0;
      }
      
      .preset-card-laws {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 10px;
      }
      
      .law-tag {
        display: inline-block;
        padding: 4px 8px;
        background: rgba(167, 139, 250, 0.15);
        border: 1px solid rgba(167, 139, 250, 0.3);
        border-radius: 4px;
        font-size: 11px;
        font-family: 'Fira Code', monospace;
        color: var(--accent-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .law-checkboxes {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 10px;
        max-height: 200px;
        overflow-y: auto;
        padding: 12px;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid var(--card-border);
        border-radius: 8px;
      }
      
      .checkbox-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        padding: 10px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid var(--card-border);
        border-radius: 8px;
        transition: all 0.3s ease;
      }
      
      .checkbox-label:hover {
        background: rgba(167, 139, 250, 0.05);
        border-color: var(--accent-secondary);
      }
      
      .form-checkbox {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: var(--accent-primary);
      }
      
      .checkbox-label span {
        font-size: 13px;
        color: var(--text-secondary);
      }
      
      .modal-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1px solid var(--card-border);
      }
      
      .modal-actions .btn {
        min-width: 120px;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      /* ========== Panels & Cards ========== */
      .panel {
        background: var(--card-bg);
        backdrop-filter: blur(20px);
        border: 1px solid var(--card-border);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 8px 32px rgba(139, 92, 246, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5) inset;
        transition: all 0.3s ease;
      }
      
      .panel:hover {
        border-color: var(--accent-secondary);
        box-shadow: 0 12px 40px rgba(139, 92, 246, 0.12), 0 0 20px rgba(139, 92, 246, 0.15);
      }
      
      .panel h3 {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .panel h3::before {
        content: '';
        width: 4px;
        height: 20px;
        background: linear-gradient(180deg, #8b5cf6 0%, #ec4899 100%);
        border-radius: 2px;
      }
      
      /* ========== Preset Configuration Panel ========== */
      .preset-config-panel {
        max-width: 800px;
      }
      
      .config-section {
        background: rgba(139, 92, 246, 0.03);
        border: 1px solid rgba(139, 92, 246, 0.1);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 16px;
        transition: all 0.3s ease;
      }
      
      .config-section:hover {
        background: rgba(139, 92, 246, 0.05);
        border-color: rgba(139, 92, 246, 0.2);
      }
      
      .config-section:last-child {
        margin-bottom: 0;
      }
      
      .section-title {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .section-description {
        margin: 0 0 16px 0;
        font-size: 12px;
        color: var(--text-muted);
        line-height: 1.5;
      }
      
      .form-group {
        margin-bottom: 16px;
      }
      
      .form-group:last-child {
        margin-bottom: 0;
      }
      
      .form-label {
        display: block;
        margin-bottom: 6px;
        font-size: 12px;
        font-weight: 500;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .form-input, .form-select {
        width: 100%;
        padding: 12px 14px;
        border-radius: 8px;
        border: 1px solid var(--card-border);
        background: rgba(0, 0, 0, 0.4);
        color: var(--text-primary);
        font-size: 13px;
        font-family: inherit;
        transition: all 0.3s ease;
      }
      
      .form-input:focus, .form-select:focus {
        outline: none;
        border-color: var(--accent-secondary);
        background: rgba(0, 0, 0, 0.5);
        box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.15);
      }
      
      .form-input::placeholder {
        color: var(--text-muted);
        opacity: 0.7;
      }
      
      .form-input[readonly] {
        background: rgba(0, 0, 0, 0.2);
        cursor: not-allowed;
        opacity: 0.8;
      }
      
      .button-group {
        display: flex;
        gap: 10px;
        margin-top: 16px;
        flex-wrap: wrap;
      }
      
      .button-group .btn {
        flex: 1;
        min-width: 140px;
      }
      
      .token-input-group {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      
      .token-input-group .form-input {
        flex: 1;
      }
      
      .token-status {
        margin-top: 8px;
        font-size: 11px;
        color: var(--text-success);
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .preset-description {
        margin-top: 8px;
        padding: 10px 14px;
        background: rgba(167, 139, 250, 0.1);
        border-left: 3px solid var(--accent-secondary);
        border-radius: 6px;
        font-size: 12px;
        color: var(--text-muted);
        line-height: 1.5;
      }
      
      .preset-description:empty {
        display: none;
      }
      
      /* ========== Store List ========== */
      .store-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
        gap: 16px;
        margin-top: 16px;
      }
      
      .store-item {
        background: var(--card-bg);
        backdrop-filter: blur(10px);
        border: 1px solid var(--card-border);
        border-radius: 12px;
        padding: 16px;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }
      
      .store-item::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #a855f7 0%, #ec4899 50%, #a855f7 100%);
        background-size: 200% 100%;
        animation: shimmer 3s linear infinite;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .store-item:hover {
        border-color: var(--accent-secondary);
        box-shadow: 0 8px 24px rgba(167, 139, 250, 0.3);
        transform: translateY(-2px);
      }
      
      .store-item:hover::before {
        opacity: 1;
      }
      
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      
      .store-key {
        font-weight: 700;
        font-size: 14px;
        color: var(--accent-secondary);
        margin-bottom: 6px;
      }
      
      .store-type {
        font-size: 11px;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 10px;
      }
      
      .store-value {
        font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
        font-size: 12px;
        line-height: 1.6;
        color: var(--text-secondary);
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(167, 139, 250, 0.1);
        border-radius: 8px;
        padding: 12px;
        margin-top: 10px;
        max-height: 200px;
        overflow: auto;
        white-space: pre-wrap;
      }
      
      .store-value::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      .store-value::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
      }
      
      .store-value::-webkit-scrollbar-thumb {
        background: var(--accent-primary);
        border-radius: 4px;
      }
      
      .store-controls {
        display: flex;
        gap: 8px;
        margin-top: 12px;
        flex-wrap: wrap;
      }
      
      /* ========== Inputs & Filters ========== */
      input, select, textarea {
        padding: 10px 14px;
        border-radius: 10px;
        border: 1px solid var(--card-border);
        background: rgba(0, 0, 0, 0.3);
        color: var(--text-primary);
        font-size: 13px;
        font-family: inherit;
        transition: all 0.3s ease;
      }
      
      input:focus, select:focus, textarea:focus {
        outline: none;
        border-color: var(--accent-secondary);
        box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.2);
      }
      
      input::placeholder {
        color: var(--text-muted);
      }
      
      .filter {
        flex: 1;
        min-width: 200px;
      }
      
      /* ========== Badges & Status ========== */
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .badge.success {
        background: rgba(16, 185, 129, 0.2);
        color: var(--success);
        border: 1px solid rgba(16, 185, 129, 0.3);
      }
      
      .badge.warning {
        background: rgba(245, 158, 11, 0.2);
        color: var(--warning);
        border: 1px solid rgba(245, 158, 11, 0.3);
      }
      
      .badge.error {
        background: rgba(239, 68, 68, 0.2);
        color: var(--error);
        border: 1px solid rgba(239, 68, 68, 0.3);
      }
      
      .badge.info {
        background: rgba(59, 130, 246, 0.2);
        color: var(--info);
        border: 1px solid rgba(59, 130, 246, 0.3);
      }
      
      /* ========== Law Validator Panel ========== */
      .law-validator {
        background: linear-gradient(135deg, rgba(167, 139, 250, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%);
      }
      
      .law-score {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 20px;
      }
      
      .score-circle {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: conic-gradient(from 0deg, var(--accent-primary) 0%, var(--accent-secondary) var(--score-percent), rgba(255,255,255,0.1) var(--score-percent));
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: 700;
        box-shadow: 0 0 20px rgba(167, 139, 250, 0.5);
      }
      
      .score-details {
        flex: 1;
      }
      
      .score-label {
        font-size: 12px;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }
      
      .score-value {
        font-size: 32px;
        font-weight: 700;
        color: var(--text-primary);
      }
      
      .violations-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .violation-item {
        padding: 12px;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.3);
        border-left: 3px solid;
        transition: all 0.3s ease;
      }
      
      .violation-item.critical { border-left-color: var(--error); }
      .violation-item.error { border-left-color: var(--warning); }
      .violation-item.warning { border-left-color: var(--info); }
      .violation-item.info { border-left-color: var(--success); }
      
      .violation-item:hover {
        background: rgba(167, 139, 250, 0.1);
        transform: translateX(4px);
      }
      
      .history-item {
        padding: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        cursor: pointer;
        transition: background 0.2s ease;
      }
      
      .history-item:hover {
        background: rgba(167, 139, 250, 0.1);
      }
      
      .violation-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
      }
      
      .violation-id {
        font-weight: 600;
        font-size: 12px;
        font-family: 'SF Mono', monospace;
      }
      
      .violation-message {
        font-size: 13px;
        color: var(--text-secondary);
        margin-bottom: 6px;
      }
      
      .violation-suggestion {
        font-size: 12px;
        color: var(--text-muted);
        font-style: italic;
      }
      
      /* ========== Timeline & History ========== */
      .history-item {
        padding: 12px;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.3);
        border-left: 3px solid var(--accent-primary);
        margin-bottom: 10px;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .history-item:hover {
        background: rgba(167, 139, 250, 0.1);
        border-left-color: var(--accent-secondary);
        transform: translateX(4px);
      }
      
      .history-action {
        font-weight: 600;
        color: var(--accent-secondary);
        margin-bottom: 4px;
      }
      
      .history-timestamp {
        font-size: 11px;
        color: var(--text-muted);
      }
      
      /* ========== Telemetry Panel ========== */
      .telemetry-item {
        padding: 12px;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.3);
        margin-bottom: 10px;
        transition: all 0.3s ease;
        border-left: 3px solid transparent;
      }
      
      .telemetry-item.severity-error { border-left-color: var(--error); }
      .telemetry-item.severity-warn { border-left-color: var(--warning); }
      .telemetry-item.severity-info { border-left-color: var(--info); }
      
      .telemetry-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 6px;
      }
      
      .severity-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        animation: pulse 2s ease-in-out infinite;
      }
      
      .severity-dot.error { background: var(--error); }
      .severity-dot.warn { background: var(--warning); }
      .severity-dot.info { background: var(--info); }
      
      .telemetry-law-name {
        font-weight: 600;
        color: var(--text-primary);
      }
      
      .telemetry-type {
        font-size: 11px;
        color: var(--text-muted);
        text-transform: uppercase;
      }
      
      .telemetry-time {
        margin-left: auto;
        font-size: 11px;
        color: var(--text-muted);
      }
      
      .telemetry-message {
        font-size: 13px;
        color: var(--text-secondary);
        margin-bottom: 6px;
      }
      
      .telemetry-details {
        font-family: 'SF Mono', monospace;
        font-size: 11px;
        color: var(--text-muted);
      }
      
      /* ========== Toast Notifications ========== */
      .toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 16px 20px;
        border-radius: 12px;
        background: var(--card-bg);
        backdrop-filter: blur(10px);
        border: 1px solid var(--card-border);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(167, 139, 250, 0.2) inset;
        color: var(--text-primary);
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        animation: slideInUp 0.3s ease-out;
      }
      
      @keyframes slideInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      /* ========== Loading States ========== */
      .loading {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(167, 139, 250, 0.3);
        border-top-color: var(--accent-primary);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      /* ========== Empty States ========== */
      .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: var(--text-muted);
      }
      
      .empty-state-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
      }
      
      .empty-state-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-secondary);
        margin-bottom: 8px;
      }
      
      .empty-state-description {
        font-size: 14px;
        color: var(--text-muted);
      }
      
      /* ========== Responsive ========== */
      @media (max-width: 768px) {
        .topbar {
          flex-direction: column;
          gap: 16px;
        }
        
        .controls-group {
          width: 100%;
          flex-wrap: wrap;
        }
        
        .store-list {
          grid-template-columns: 1fr;
        }
      }
      
      /* ========== Accessibility ========== */
      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      
      [role="button"], [role="tab"], [role="listitem"] {
        cursor: pointer;
      }
      
      [role="button"]:focus, [role="tab"]:focus, [role="listitem"]:focus {
        outline: 2px solid var(--accent-primary);
        outline-offset: 2px;
      }
    </style>
  </head>
  <body>
    <div class="wrap">
    <!-- ========== Header/Topbar ========== -->
    <div class="topbar" role="banner">
      <div class="header">
        <div class="logo">F</div>
        <div>
          <h1 id="title">Fortistate Inspector</h1>
          <div class="subtitle">Ontogenetic Edition — Laws, States & Flows</div>
        </div>
      </div>
      <div class="controls-group">
        <input id="store-filter" class="filter" placeholder="🔍 Filter stores..." aria-label="Filter stores" />
        <button id="invite-btn" class="btn primary" title="Invite others to view this inspector session">
          👥 Invite
        </button>
        <button id="preset-toggle" class="btn ghost" aria-expanded="false" title="Show presets & configuration">
          🎨 Presets
        </button>
        <button id="law-toggle" class="btn secondary" aria-expanded="false" title="Show law validator">
          ⚖️ Laws
        </button>
        <button id="timeline-toggle" class="btn ghost" aria-expanded="false" title="Show history timeline">
          ⏱️ Timeline
        </button>
        <button id="telemetry-toggle" class="btn ghost" aria-expanded="false" title="Show law telemetry">
          📊 Telemetry
        </button>
        <button id="help-btn" class="btn ghost" title="Show help & documentation">
          ❓ Help
        </button>
      </div>
    </div>

    <!-- ========== Help Modal ========== -->
    <div id="help-modal" class="modal-overlay" style="display:none">
      <div class="modal">
        <div class="modal-header">
          <h2>📚 Fortistate Inspector Guide</h2>
          <button class="modal-close" id="help-close" aria-label="Close help">✕</button>
        </div>
        <div class="modal-body">
          <h3><span class="help-icon">🚀</span>Getting Started</h3>
          <p>The Fortistate Inspector is a powerful development tool for monitoring and controlling your application's state with <strong>ontogenetic laws</strong>—rules that define how state should evolve over time.</p>
          
          <div class="help-section">
            <h3><span class="help-icon">🔑</span>Auto-Configuration</h3>
            <p>The inspector automatically detects:</p>
            <ul>
              <li><strong>Inspector Token:</strong> From URL params (<code>?token=...</code>) or localStorage</li>
              <li><strong>Target Store:</strong> Intelligently selects the most relevant store for operations</li>
            </ul>
            <p>No manual configuration needed—just start using it!</p>
          </div>

          <div class="help-section">
            <h3><span class="help-icon">🏪</span>Working with Stores</h3>
            <p>Each store card displays:</p>
            <ul>
              <li><strong>Store Key:</strong> Unique identifier for the state container</li>
              <li><strong>Current State:</strong> Live JSON view of the data</li>
              <li><strong>Action Buttons:</strong> Quick operations for that store</li>
            </ul>
            <p>Use the <code>🔍 Filter</code> to search through your stores by name.</p>
          </div>

          <div class="help-section">
            <h3><span class="help-icon">⚖️</span>Ontogenetic Laws</h3>
            <p>Laws define validation rules and constraints for your state:</p>
            <ul>
              <li><strong>Apply Laws:</strong> Run law validation on a specific store and see violations</li>
              <li><strong>Configure:</strong> Choose a law preset configuration for ongoing enforcement</li>
              <li><strong>Law Presets:</strong> Pre-defined rule sets like "Strict Validation", "Production Ready", etc.</li>
            </ul>
            <p>Available presets:</p>
            <ul>
              <li><code>strict</code> — Maximum validation with all laws enforced</li>
              <li><code>production</code> — Production-safe rules without debugging</li>
              <li><code>development</code> — Balanced rules for active development</li>
              <li><code>minimal</code> — Essential laws only for prototyping</li>
              <li><code>none</code> — Disable all law enforcement</li>
            </ul>
          </div>

          <div class="help-section">
            <h3><span class="help-icon">🎨</span>Presets & Configuration</h3>
            <p>Toggle the Presets panel to:</p>
            <ul>
              <li><strong>Apply Law Presets:</strong> Quickly configure the target store with a preset</li>
              <li><strong>Export State:</strong> Download store data as JSON</li>
              <li><strong>View Configuration:</strong> See active settings</li>
            </ul>
            <p>Configurations are saved to <code>localStorage</code> and persist across sessions.</p>
          </div>

          <div class="help-section">
            <h3><span class="help-icon">⏱️</span>Timeline</h3>
            <p>View the complete history of state changes:</p>
            <ul>
              <li>See all mutations in chronological order</li>
              <li>Track which actions triggered which state changes</li>
              <li>Useful for debugging time-based issues</li>
            </ul>
          </div>

          <div class="help-section">
            <h3><span class="help-icon">📊</span>Telemetry</h3>
            <p>Monitor law enforcement in real-time:</p>
            <ul>
              <li>Track law violation counts</li>
              <li>See which laws are failing most often</li>
              <li>Performance metrics for validation</li>
            </ul>
          </div>

          <div class="help-section">
            <h3><span class="help-icon">💡</span>Pro Tips</h3>
            <ul>
              <li>Use <strong>Configure</strong> to set up law enforcement once, then let it run automatically</li>
              <li>The <strong>Auto-Fix</strong> button in the Laws panel attempts to repair violations</li>
              <li>Filter stores to focus on specific parts of your application state</li>
              <li>Law configurations are per-store—different stores can have different rule sets</li>
              <li>Check the Timeline when state isn't updating as expected</li>
            </ul>
          </div>

          <h3><span class="help-icon">🔗</span>Learn More</h3>
          <p>For detailed documentation, visit the project repository or check the <code>/docs</code> folder for guides on:</p>
          <ul>
            <li>Creating custom ontogenetic laws</li>
            <li>Advanced inspector configuration</li>
            <li>Integration with your dev workflow</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ========== Configure Laws Modal ========== -->
    <div id="configure-laws-modal" class="modal-overlay" style="display:none">
      <div class="modal laws-modal">
        <div class="modal-header">
          <h2>⚖️ Configure Ontogenetic Laws</h2>
          <button class="modal-close" id="configure-laws-close" aria-label="Close">✕</button>
        </div>
        <div class="modal-body">
          <div class="config-section">
            <h4 class="section-title">🎯 Target Store</h4>
            <div class="target-store-display" id="configure-laws-store-name">
              <span class="store-key-badge">N/A</span>
            </div>
          </div>

          <div class="config-section">
            <h4 class="section-title">📦 Law Presets</h4>
            <p class="section-description">Choose a pre-configured set of laws for common scenarios</p>
            <div class="preset-grid" id="law-preset-grid">
              <!-- Presets will be dynamically generated here -->
            </div>
          </div>

          <div class="config-section">
            <h4 class="section-title">🔧 Custom Configuration</h4>
            <p class="section-description">Or configure laws manually</p>
            
            <div class="form-group">
              <label class="form-label">Select Laws to Enable</label>
              <div class="law-checkboxes" id="law-checkboxes">
                <!-- Law checkboxes will be dynamically generated here -->
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Options</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="law-auto-repair" class="form-checkbox" />
                  <span>Auto-Repair Violations</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" id="law-strict-mode" class="form-checkbox" />
                  <span>Strict Mode (Fail on any violation)</span>
                </label>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn secondary" onclick="closeLawConfigModal()">
              Cancel
            </button>
            <button class="btn primary" onclick="saveLawConfiguration()">
              <span class="btn-icon">💾</span>
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== Ontogenetic Law Validator Panel ========== -->
    <div id="law-validator" class="panel law-validator" style="display:none">
      <h3>⚖️ Ontogenetic Law Validator</h3>
      
      <div class="law-score">
        <div class="score-circle" id="law-score-circle" style="--score-percent: 0%">
          <span id="law-score-value">--</span>
        </div>
        <div class="score-details">
          <div class="score-label">Validation Score</div>
          <div id="law-score-status" class="badge info">Analyzing...</div>
          <div style="margin-top:8px;font-size:12px;color:var(--text-muted)">
            <span id="law-metrics">0 laws checked</span>
          </div>
        </div>
      </div>
      
      <div id="violations-container" style="margin-top:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h4 style="margin:0;font-size:14px">Violations</h4>
          <button id="auto-fix-btn" class="btn primary small" onclick="autoFixViolations()">
            🔧 Auto-Fix
          </button>
        </div>
        <div id="violations-list" class="violations-list">
          <div class="empty-state">
            <div class="empty-state-icon">✨</div>
            <div class="empty-state-title">No violations detected</div>
            <div class="empty-state-description">All stores are compliant with ontogenetic laws</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== Preset Panel ========== -->
    <div id="preset-panel" class="panel preset-config-panel" style="display:none">
      <h3>🎨 Presets & Configuration</h3>
      
      <!-- Configuration Presets Section -->
      <div class="config-section">
        <h4 class="section-title">📦 Configuration Presets</h4>
        <div class="form-group">
          <label class="form-label">Select Preset</label>
          <select id="preset-select" class="form-select"></select>
        </div>
        <div class="form-group">
          <label class="form-label">Target Store</label>
          <input type="text" id="preset-target" placeholder="Auto-detected from selection" class="form-input" readonly />
        </div>
        <div id="preset-desc" class="preset-description"></div>
        <div class="button-group">
          <button id="apply-btn" class="btn primary" onclick="applyPreset()">
            <span class="btn-icon">✨</span>
            Apply Preset
          </button>
          <button id="css-btn" class="btn secondary" onclick="installPresetCss()">
            <span class="btn-icon">🎨</span>
            Install CSS
          </button>
        </div>
      </div>
      
      <!-- Authentication Section -->
      <div class="config-section">
        <h4 class="section-title">🔐 Authentication</h4>
        <div class="form-group">
          <label class="form-label">Inspector Token</label>
          <div class="token-input-group">
            <input id="token-input" placeholder="Auto-detected from URL or localStorage" class="form-input" readonly />
            <button id="clear-token-btn" class="btn secondary small" onclick="clearToken()" style="display:none">
              Clear
            </button>
            <button id="set-token-btn" class="btn primary small" onclick="manualTokenEntry()" style="display:none">
              Manual
            </button>
          </div>
          <div id="token-status" class="token-status"></div>
        </div>
      </div>
      
      <!-- Law Configuration Presets Section -->
      <div class="config-section">
        <h4 class="section-title">⚖️ Law Configuration Presets</h4>
        <p class="section-description">Apply pre-configured law enforcement rules to your stores</p>
        <div class="form-group">
          <label class="form-label">Law Preset</label>
          <select id="law-preset-select" class="form-select">
            <option value="">Select a law preset...</option>
            <option value="strict-validation">Strict Validation - All rules with auto-repair</option>
            <option value="production-ready">Production Ready - Essential laws only</option>
            <option value="development-friendly">Development Friendly - Relaxed for rapid dev</option>
            <option value="quality-assurance">Quality Assurance - Metadata & lifecycle focus</option>
            <option value="size-optimization">Size Optimization - Monitor state size</option>
          </select>
        </div>
        <div id="law-preset-desc" class="preset-description"></div>
        <button id="apply-law-preset-btn" class="btn primary full-width" onclick="applyLawPresetToTarget()">
          <span class="btn-icon">⚖️</span>
          Apply to Target Store
        </button>
      </div>
    </div>

    <!-- ========== Store List ========== -->
    <div class="panel">
      <h3>💾 Remote Stores</h3>
      <div id="stores" class="store-list"></div>
    </div>

  <!-- ========== Timeline Panel ========== -->
  <div id="timeline" class="panel" style="display:none">
    <h3>⏱️ State History</h3>
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:16px;flex-wrap:wrap">
      <button id="replay-prev" class="btn small">◀ Prev</button>
      <button id="replay-play" class="btn primary small">▶ Play</button>
      <button id="replay-next" class="btn small">Next ▶</button>
      <div id="timeline-status" style="margin-left:8px;color:var(--text-muted);font-size:13px"></div>
    </div>
    <div id="history-list" style="max-height:400px;overflow:auto" role="list"></div>
  </div>

  <!-- ========== Telemetry Panel ========== -->
  <div id="telemetry-panel" class="panel" style="display:none">
    <h3>📊 Law Telemetry <span id="telemetry-status" class="badge info" style="margin-left:8px">connecting...</span></h3>
    <div id="telemetry-list" style="max-height:400px;overflow:auto" role="list"></div>
  </div>
    </div>

    <script>
      // ========================================================================
      // INSPECTOR STATE
      // ========================================================================
      let stores = {}
      let ws = null
      let presets = []
      let activeKeyHint = undefined
      let lawValidationResults = {}
      let inspectorToken = null
      let lastActiveStoreKey = null
      
      // Auto-detect and restore token from localStorage
      try {
        const savedToken = localStorage.getItem('fortistate-inspector-token')
        if (savedToken) {
          inspectorToken = savedToken
          console.debug('[inspector.client] Restored token from localStorage')
        }
        // Try URL parameter
        const urlParams = new URLSearchParams(window.location.search)
        const urlToken = urlParams.get('token') || urlParams.get('inspectorToken')
        if (urlToken) {
          inspectorToken = urlToken
          localStorage.setItem('fortistate-inspector-token', urlToken)
          console.debug('[inspector.client] Token loaded from URL')
        }
      } catch (e) { console.debug('[inspector.client] Token detection failed', e) }
      
      // Expose programmatic API for deterministic selection
      try { 
        if (typeof window !== 'undefined') { 
          window.fortistate = window.fortistate || {}
          window.fortistate.setActiveKey = function(k){ 
            activeKeyHint = String(k)
            console.debug('[inspector.client] activeKey set via API',k)
          }
        } 
      } catch(e){}
      
      // ========================================================================
      // ONTOGENETIC LAW VALIDATOR
      // ========================================================================
      
      // Simplified law definitions (mirrors storyteller-laws.ts)
      const INSPECTOR_LAWS = [
        {
          id: 'INS-001',
          category: 'structural',
          severity: 'error',
          description: 'Store value must be valid JSON-serializable',
          validate: (key, value) => {
            try {
              JSON.stringify(value)
              return null
            } catch (e) {
              return { lawId: 'INS-001', severity: 'error', message: 'Store "' + key + '" contains non-serializable value', suggestion: 'Remove functions, circular references, or symbols' }
            }
          }
        },
        {
          id: 'INS-002',
          category: 'semantic',
          severity: 'warning',
          description: 'Store should have descriptive key name',
          validate: (key, value) => {
            if (key.length < 3 || /^[a-z]$/.test(key)) {
              return { lawId: 'INS-002', severity: 'warning', message: 'Store key "' + key + '" is too short or generic', suggestion: 'Use descriptive names like "userProfile" or "cartState"' }
            }
            return null
          }
        },
        {
          id: 'INS-003',
          category: 'ontogenetic',
          severity: 'info',
          description: 'State should follow BEGIN → BECOME → CEASE lifecycle',
          validate: (key, value) => {
            if (typeof value === 'object' && value !== null) {
              const hasStatus = 'status' in value || 'state' in value || 'phase' in value
              if (!hasStatus) {
                return { lawId: 'INS-003', severity: 'info', message: 'Store "' + key + '" lacks lifecycle tracking', suggestion: 'Add status/state/phase field to track entity lifecycle' }
              }
            }
            return null
          }
        },
        {
          id: 'INS-004',
          category: 'operational',
          severity: 'warning',
          description: 'Store size should be reasonable',
          validate: (key, value) => {
            const size = JSON.stringify(value).length
            if (size > 100000) {
              return { lawId: 'INS-004', severity: 'warning', message: 'Store "' + key + '" is very large (' + Math.round(size/1000) + 'KB)', suggestion: 'Consider splitting into smaller stores or using pagination' }
            }
            return null
          }
        },
        {
          id: 'INS-005',
          category: 'quality',
          severity: 'info',
          description: 'State should include metadata (timestamps, version)',
          validate: (key, value) => {
            if (typeof value === 'object' && value !== null) {
              const hasMetadata = 'timestamp' in value || 'createdAt' in value || 'updatedAt' in value || 'version' in value
              if (!hasMetadata) {
                return { lawId: 'INS-005', severity: 'info', message: 'Store "' + key + '" lacks metadata', suggestion: 'Add timestamp, version, or audit fields' }
              }
            }
            return null
          }
        }
      ]
      
      function validateStores() {
        const allViolations = []
        let score = 100
        
        Object.keys(stores).forEach(key => {
          const value = stores[key]
          
          INSPECTOR_LAWS.forEach(law => {
            const violation = law.validate(key, value)
            if (violation) {
              allViolations.push(violation)
              
              // Deduct from score
              if (violation.severity === 'error') score -= 20
              else if (violation.severity === 'warning') score -= 10
              else if (violation.severity === 'info') score -= 5
            }
          })
        })
        
        score = Math.max(0, score)
        
        const criticalCount = allViolations.filter(v => v.severity === 'error').length
        const passed = criticalCount === 0
        
        lawValidationResults = {
          passed,
          score,
          violations: allViolations,
          metrics: {
            totalLaws: INSPECTOR_LAWS.length,
            totalStores: Object.keys(stores).length,
            criticalCount,
            warningCount: allViolations.filter(v => v.severity === 'warning').length,
            infoCount: allViolations.filter(v => v.severity === 'info').length
          }
        }
        
        renderLawValidator()
      }
      
      function renderLawValidator() {
        const container = document.getElementById('law-validator')
        if (!container || container.style.display === 'none') return
        
        const { score, violations, metrics, passed } = lawValidationResults
        
        // Update score circle
        const scoreCircle = document.getElementById('law-score-circle')
        const scoreValue = document.getElementById('law-score-value')
        const scoreStatus = document.getElementById('law-score-status')
        const lawMetrics = document.getElementById('law-metrics')
        
        if (scoreCircle) scoreCircle.style.setProperty('--score-percent', score + '%')
        if (scoreValue) scoreValue.innerText = score
        
        if (scoreStatus) {
          scoreStatus.className = 'badge ' + (passed ? 'success' : 'error')
          scoreStatus.innerText = passed ? '✅ Passed' : '❌ Failed'
        }
        
        if (lawMetrics) {
          lawMetrics.innerText = metrics.totalLaws + ' laws • ' + metrics.totalStores + ' stores • ' + violations.length + ' violations'
        }
        
        // Render violations
        const violationsList = document.getElementById('violations-list')
        if (!violationsList) return
        
        if (violations.length === 0) {
          violationsList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✨</div><div class="empty-state-title">No violations detected</div><div class="empty-state-description">All stores are compliant with ontogenetic laws</div></div>'
        } else {
          violationsList.innerHTML = violations.map(v => {
            return '<div class="violation-item ' + v.severity + '">' +
              '<div class="violation-header">' +
                '<span class="violation-id">' + escapeHtml(v.lawId) + '</span>' +
                '<span class="badge ' + v.severity + '">' + v.severity + '</span>' +
              '</div>' +
              '<div class="violation-message">' + escapeHtml(v.message) + '</div>' +
              (v.suggestion ? '<div class="violation-suggestion">💡 ' + escapeHtml(v.suggestion) + '</div>' : '') +
            '</div>'
          }).join('')
        }
      }
      
      function autoFixViolations() {
        const violations = validateStores()
        if (!violations || violations.length === 0) {
          showToast('✓ No violations detected - all stores are compliant!')
          return
        }
        
        // Group violations by type for analysis
        const grouped = {}
        violations.forEach(v => {
          if (!grouped[v.code]) grouped[v.code] = []
          grouped[v.code].push(v)
        })
        
        // Show analysis summary
        const parts = ['Analyzed ' + violations.length + ' violation(s):']
        Object.entries(grouped).forEach(([code, items]) => {
          parts.push(code + ': ' + items.length + ' issue(s)')
        })
        
        showToast(parts.join(' • '))
        
        // Log detailed suggestions to console for developers
        console.group('Inspector Law Violations')
        violations.forEach(v => {
          console.warn('[' + v.code + '] ' + v.store + ': ' + v.suggestion)
        })
        console.groupEnd()
      }

  // listen for postMessage handshake from host page
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('message', (ev) => {
      try {
        const d = ev && ev.data
        if (d && d.type === 'fortistate:setActiveKey' && d.key) {
          activeKeyHint = String(d.key)
          console.debug('[inspector.client] activeKey set via postMessage', d.key)
        }
      } catch (e) { }
    }, false)
  }

      async function tryFetch(url) {
        try {
          const res = await fetch(url, { credentials: 'include' })
          if (!res.ok) throw new Error('bad status ' + res.status)
          return await res.json()
        } catch (e) {
          console.debug('[inspector.client] fetch failed', url, e && e.message)
          return null
        }
      }

      async function loadRemoteStores() {
        // Try same-origin first, then common fallbacks (useful when the client
        // is embedded into another app or opened from a different origin).
        const candidates = [
          '/remote-stores',
          location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '') + '/remote-stores',
          'http://localhost:4000/remote-stores',
          'http://127.0.0.1:4000/remote-stores'
        ]
        let js = null
        for (const u of candidates) {
          js = await tryFetch(u)
          if (js && Object.keys(js).length > 0) break
        }
        stores = js || {}
        renderStores()
        // Validate stores if law panel is open
        if (document.getElementById('law-validator').style.display !== 'none') {
          validateStores()
        }
        // show hint when empty
        if (!stores || Object.keys(stores).length === 0) {
          const el = document.getElementById('stores')
          if (el) el.innerHTML = '<div style="color:#666">No stores found. Ensure the inspector server is running and this client is loaded from the inspector (http://localhost:4000/). You can also try opening <a href="/remote-stores">/remote-stores</a> directly.</div>'
        }
      }

      async function loadPresets() {
        try {
          const res = await fetch('/presets')
          if (!res.ok) return
          presets = await res.json()
          const sel = document.getElementById('preset-select')
          sel.innerHTML = presets.map(function(p){ return '<option value="'+p.name+'">'+p.name+'</option>'; }).join('')
          updatePresetDesc()
        } catch (e) { console.error('presets load', e) }
      }

      function updatePresetDesc() {
        const name = document.getElementById('preset-select').value
        const desc = document.getElementById('preset-desc')
        try {
          const found = presets.find(function(x){ return x && x.name === name })
          desc.innerText = (found && found.description) ? found.description : ''
        } catch (e) { desc.innerText = '' }
      }

      function renderStores() {
        const el = document.getElementById('stores')
        const filter = (document.getElementById('store-filter') && document.getElementById('store-filter').value || '').toLowerCase()
        const keys = Object.keys(stores || {})
        const visible = keys.filter(function(k){
          const t = String(typeof stores[k] || '')
          return !filter || k.toLowerCase().includes(filter) || t.toLowerCase().includes(filter) || JSON.stringify(stores[k]).toLowerCase().includes(filter)
        })
        el.innerHTML = visible.map(function(key){
          const v = JSON.stringify(stores[key], null, 2)
          let out = '<div class="store-item">'
          out += '<div class="store-left">'
          out += '<div class="store-key">' + escapeHtml(String(key)) + '</div>'
          out += '<div class="store-type">' + escapeHtml(String(typeof stores[key])) + '</div>'
          out += '<pre class="store-value">' + escapeHtml(v) + '</pre>'
          out += '</div>'
          out += '<div class="store-controls">'
          out += '<button class="btn secondary small share-snapshot-btn" data-key="' + encodeURIComponent(String(key)) + '" title="Share snapshot of this store">📸 Share</button>'
          out += '<button class="btn secondary small locate-store-btn" data-key="' + encodeURIComponent(String(key)) + '" title="Find where this store is used in code">🔍 Locate</button>'
          out += '<button class="btn primary small apply-laws-btn" data-key="' + encodeURIComponent(String(key)) + '">⚖️ Apply Laws</button>'
          out += '<button class="btn secondary small config-laws-btn" data-key="' + encodeURIComponent(String(key)) + '">🔧 Configure</button>'
          out += '</div>'
          out += '</div>'
          return out
        }).join('')

        // attach event listeners
        if (el) {
          Array.from(el.querySelectorAll('[data-key]')).forEach(function(b){
            const cls = b.className || ''
            const k = (b.getAttribute('data-key') || '')
            if (cls.indexOf('share-snapshot-btn') >= 0) {
              b.addEventListener('click', function(){ shareStoreSnapshot(decodeURIComponent(k)) })
            }
            if (cls.indexOf('locate-store-btn') >= 0) {
              b.addEventListener('click', function(){ locateStore(decodeURIComponent(k)) })
            }
            if (cls.indexOf('apply-laws-btn') >= 0) {
              b.addEventListener('click', function(){ applyLawsToStore(decodeURIComponent(k)) })
            }
            if (cls.indexOf('config-laws-btn') >= 0) {
              b.addEventListener('click', function(){ configureLawsForStore(decodeURIComponent(k)) })
            }
          })
        }
        
        // Update target key display after rendering stores
        updateTargetKeyDisplay()
      }

      function escapeHtml(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      }

      async function applyPreset() {
        const name = document.getElementById('preset-select').value
        const targetKey = document.getElementById('preset-target').value.trim() || lastActiveStoreKey || undefined
        try {
          const headers = { 'Content-Type': 'application/json' }
          if (inspectorToken) headers['x-fortistate-token'] = inspectorToken
          const res = await fetch('/apply-preset', {
            method: 'POST',
            headers,
            body: JSON.stringify({ name, targetKey })
          })
          if (res.ok) {
            showToast('✓ Preset applied: ' + name)
            loadRemoteStores()
          } else {
            alert('Failed to apply preset')
          }
        } catch (e) { alert('Error: ' + e.message) }
      }

      async function installPresetCss() {
        const name = document.getElementById('preset-select').value
        try {
          const headers = { 'Content-Type': 'application/json' }
          if (inspectorToken) headers['x-fortistate-token'] = inspectorToken
          const res = await fetch('/apply-preset', {
            method: 'POST',
            headers,
            body: JSON.stringify({ name, installCss: true })
          })
          if (res.ok) {
            showToast('✓ CSS installed for preset: ' + name)
          } else {
            alert('Failed to install CSS')
          }
        } catch (e) { alert('Error: ' + e.message) }
      }

      function manualTokenEntry() {
        const newToken = prompt('Enter inspector token:', inspectorToken || '')
        if (newToken && newToken.trim()) {
          inspectorToken = newToken.trim()
          localStorage.setItem('fortistate-inspector-token', inspectorToken)
          updateTokenDisplay()
          showToast('✓ Token saved')
          // Reconnect WebSocket with new token
          if (ws) {
            try { ws.close() } catch (e) {}
          }
          setTimeout(connectWS, 500)
        }
      }
      
      function clearToken() {
        if (confirm('Clear saved inspector token?')) {
          inspectorToken = null
          localStorage.removeItem('fortistate-inspector-token')
          updateTokenDisplay()
          showToast('Token cleared')
        }
      }
      
      function updateTokenDisplay() {
        const input = document.getElementById('token-input')
        const status = document.getElementById('token-status')
        const clearBtn = document.getElementById('clear-token-btn')
        
        if (inspectorToken) {
          input.value = '●●●●●●●●' + inspectorToken.slice(-4)
          status.textContent = '✓ Token active (auto-detected)'
          status.style.color = 'var(--text-success)'
          if (clearBtn) clearBtn.style.display = 'inline-block'
        } else {
          input.value = ''
          input.placeholder = '🔐 No token (click Manual to set)'
          status.textContent = '⚠ No token - some features may be restricted'
          status.style.color = 'var(--text-warning)'
          if (clearBtn) clearBtn.style.display = 'none'
        }
      }

      function updateTargetKeyDisplay() {
        const input = document.getElementById('preset-target')
        const detectedKey = detectActiveKey() || lastActiveStoreKey
        
        if (detectedKey && stores[detectedKey]) {
          input.value = detectedKey
          lastActiveStoreKey = detectedKey
        } else {
          const storeKeys = Object.keys(stores || {})
          if (storeKeys.length > 0) {
            input.value = storeKeys[0]
            lastActiveStoreKey = storeKeys[0]
          } else {
            input.value = ''
            input.placeholder = 'No stores available'
          }
        }
      }
      
      
      // ========================================================================
      // NEW FEATURES: SHARE, LOCATE, INVITE
      // ========================================================================
      
      /**
       * Share a snapshot of a specific store
       * Creates a shareable link with the store state
       */
      function shareStoreSnapshot(storeKey) {
        try {
          const storeValue = stores[storeKey]
          if (!storeValue) {
            showToast('⚠️ Store not found: ' + storeKey)
            return
          }
          
          // Create snapshot data
          const snapshot = {
            store: storeKey,
            value: storeValue,
            timestamp: new Date().toISOString(),
            url: window.location.origin
          }
          
          // Encode snapshot as URL parameter
          const encoded = btoa(JSON.stringify(snapshot))
          const shareUrl = window.location.origin + '?snapshot=' + encoded
          
          // Copy to clipboard
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareUrl).then(function() {
              showToast('📋 Snapshot link copied! Share: ' + shareUrl.substring(0, 50) + '...')
            }).catch(function() {
              fallbackCopySnapshot(shareUrl, snapshot)
            })
          } else {
            fallbackCopySnapshot(shareUrl, snapshot)
          }
          
          // Show modal with share options
          showShareModal(storeKey, snapshot, shareUrl)
          
        } catch (e) {
          console.error('Share snapshot failed:', e)
          showToast('❌ Failed to create snapshot: ' + e.message)
        }
      }
      
      /**
       * Fallback copy method for older browsers
       */
      function fallbackCopySnapshot(url, snapshot) {
        const textarea = document.createElement('textarea')
        textarea.value = url
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        try {
          document.execCommand('copy')
          showToast('📋 Snapshot link copied!')
        } catch (e) {
          prompt('Copy this snapshot URL:', url)
        }
        document.body.removeChild(textarea)
      }
      
      /**
       * Show share modal with multiple share options
       */
      function showShareModal(storeKey, snapshot, shareUrl) {
        const existingModal = document.getElementById('share-modal')
        if (existingModal) existingModal.remove()
        
        const modal = document.createElement('div')
        modal.id = 'share-modal'
        modal.className = 'modal-overlay'
        modal.style.display = 'flex'
        
        const snapshotJson = JSON.stringify(snapshot.value, null, 2)
        const truncated = snapshotJson.length > 500 ? snapshotJson.substring(0, 500) + '\\n...' : snapshotJson
        
        modal.innerHTML = '<div class="modal" style="max-width: 600px;">' +
          '<div class="modal-header">' +
            '<h2>📸 Share Store Snapshot</h2>' +
            '<button class="modal-close" onclick="document.getElementById(\\'share-modal\\').remove()">✕</button>' +
          '</div>' +
          '<div class="modal-body">' +
            '<div class="help-section">' +
              '<h3>🔗 Shareable Link</h3>' +
              '<p><strong>Store:</strong> <code>' + escapeHtml(storeKey) + '</code></p>' +
              '<p><strong>Timestamp:</strong> ' + snapshot.timestamp + '</p>' +
              '<div style="background: var(--bg-tertiary); padding: 12px; border-radius: 8px; margin-top: 8px; overflow-x: auto;">' +
                '<code style="font-size: 11px; word-break: break-all;">' + escapeHtml(shareUrl) + '</code>' +
              '</div>' +
              '<div style="display: flex; gap: 8px; margin-top: 12px;">' +
                '<button class="btn secondary small" onclick="navigator.clipboard.writeText(\\'' + shareUrl.replace(/'/g, "\\\\'") + '\\').then(() => showToast(\\'📋 Link copied!\\'))">' +
                  '📋 Copy Link' +
                '</button>' +
                '<button class="btn secondary small" onclick="window.open(\\'mailto:?subject=FortiState Store Snapshot&body=\\' + encodeURIComponent(\\'' + shareUrl + '\\'), \\'_blank\\')">' +
                  '📧 Email' +
                '</button>' +
                '<button class="btn secondary small" onclick="window.open(\\'https://twitter.com/intent/tweet?text=\\' + encodeURIComponent(\\'Check out this FortiState store snapshot: ' + shareUrl + '\\'), \\'_blank\\')">' +
                  '🐦 Tweet' +
                '</button>' +
              '</div>' +
            '</div>' +
            
            '<div class="help-section">' +
              '<h3>📊 Snapshot Preview</h3>' +
              '<pre style="background: var(--bg-tertiary); padding: 12px; border-radius: 8px; max-height: 200px; overflow-y: auto; font-size: 12px;">' + escapeHtml(truncated) + '</pre>' +
            '</div>' +
            
            '<div class="help-section">' +
              '<h3>💾 Download Options</h3>' +
              '<div style="display: flex; gap: 8px;">' +
                '<button class="btn secondary small" onclick="downloadSnapshot(\\'' + escapeHtml(storeKey) + '\\', \\'json\\')">' +
                  '📄 Download JSON' +
                '</button>' +
                '<button class="btn secondary small" onclick="downloadSnapshot(\\'' + escapeHtml(storeKey) + '\\', \\'csv\\')">' +
                  '📊 Download CSV' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
        
        document.body.appendChild(modal)
      }
      
      /**
       * Download store snapshot in various formats
       */
      function downloadSnapshot(storeKey, format) {
        try {
          const storeValue = stores[storeKey]
          let content = ''
          let filename = ''
          let mimeType = ''
          
          if (format === 'json') {
            content = JSON.stringify({ store: storeKey, value: storeValue, timestamp: new Date().toISOString() }, null, 2)
            filename = 'fortistate-' + storeKey + '-' + Date.now() + '.json'
            mimeType = 'application/json'
          } else if (format === 'csv') {
            // Simple CSV conversion for object/array stores
            if (Array.isArray(storeValue)) {
              const headers = Object.keys(storeValue[0] || {})
              content = headers.join(',') + '\\n'
              content += storeValue.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(',')).join('\\n')
            } else if (typeof storeValue === 'object') {
              content = 'Key,Value\\n'
              content += Object.entries(storeValue).map(([k, v]) => k + ',' + JSON.stringify(v)).join('\\n')
            } else {
              content = 'Value\\n' + JSON.stringify(storeValue)
            }
            filename = 'fortistate-' + storeKey + '-' + Date.now() + '.csv'
            mimeType = 'text/csv'
          }
          
          const blob = new Blob([content], { type: mimeType })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = filename
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          
          showToast('💾 Downloaded: ' + filename)
        } catch (e) {
          console.error('Download failed:', e)
          showToast('❌ Download failed: ' + e.message)
        }
      }
      
      /**
       * Locate where a store is used in code
       * Performs a workspace search and displays results
       */
      function locateStore(storeKey) {
        try {
          // Show modal with search instructions
          const existingModal = document.getElementById('locate-modal')
          if (existingModal) existingModal.remove()
          
          const modal = document.createElement('div')
          modal.id = 'locate-modal'
          modal.className = 'modal-overlay'
          modal.style.display = 'flex'
          
          modal.innerHTML = '<div class="modal" style="max-width: 700px;">' +
            '<div class="modal-header">' +
              '<h2>🔍 Locate Store in Code</h2>' +
              '<button id="locate-close-btn" class="modal-close">✕</button>' +
            '</div>' +
            '<div class="modal-body">' +
              '<div class="help-section">' +
                '<h3>📁 Store: <code>' + escapeHtml(storeKey) + '</code></h3>' +
                '<p>Find where this store is defined and used in your codebase:</p>' +
              '</div>' +
              
              '<div class="help-section">' +
                '<h3>🔎 Search Patterns</h3>' +
                '<div style="background: var(--bg-tertiary); padding: 12px; border-radius: 8px; margin-bottom: 8px;">' +
                  '<strong>Store Creation:</strong>' +
                  '<div style="margin-top: 4px; font-family: monospace; font-size: 12px;">' +
                    'createStore(\\'' + escapeHtml(storeKey) + '\\')<br>' +
                    'createStore("' + escapeHtml(storeKey) + '")<br>' +
                  '</div>' +
                '</div>' +
                '<div style="background: var(--bg-tertiary); padding: 12px; border-radius: 8px; margin-bottom: 8px;">' +
                  '<strong>Store Usage:</strong>' +
                  '<div style="margin-top: 4px; font-family: monospace; font-size: 12px;">' +
                    '.get(\\'' + escapeHtml(storeKey) + '\\')<br>' +
                    '.get("' + escapeHtml(storeKey) + '")<br>' +
                    '[\\'' + escapeHtml(storeKey) + '\\']<br>' +
                    '["' + escapeHtml(storeKey) + '"]' +
                  '</div>' +
                '</div>' +
                '<div style="background: var(--bg-tertiary); padding: 12px; border-radius: 8px;">' +
                  '<strong>Variable Name:</strong>' +
                  '<div style="margin-top: 4px; font-family: monospace; font-size: 12px;">' +
                    escapeHtml(storeKey) + 'Store<br>' +
                    escapeHtml(storeKey.replace(/Store$/, '')) + 'Store' +
                  '</div>' +
                '</div>' +
              '</div>' +
              
              '<div class="help-section">' +
                '<h3>🛠️ Quick Actions</h3>' +
                '<div style="display: flex; gap: 8px; flex-wrap: wrap;">' +
                  '<button id="copy-pattern-btn" class="btn secondary small">' +
                    '📋 Copy Pattern' +
                  '</button>' +
                  '<button id="search-vscode-btn" class="btn secondary small">' +
                    '📝 Search in VS Code' +
                  '</button>' +
                  '<button id="search-webstorm-btn" class="btn secondary small">' +
                    '💡 Search in WebStorm' +
                  '</button>' +
                  '<button id="search-github-btn" class="btn secondary small">' +
                    '🐙 Search in GitHub' +
                  '</button>' +
                '</div>' +
              '</div>' +
              
              '<div class="help-section">' +
                '<h3>💡 Common File Locations</h3>' +
                '<ul style="margin: 0; padding-left: 20px;">' +
                  '<li><code>src/stores/' + escapeHtml(storeKey) + '.ts</code></li>' +
                  '<li><code>src/stores/' + escapeHtml(storeKey) + 'Store.ts</code></li>' +
                  '<li><code>src/state/' + escapeHtml(storeKey) + '.ts</code></li>' +
                  '<li><code>src/models/' + escapeHtml(storeKey) + 'Model.ts</code></li>' +
                  '<li><code>src/**/*' + escapeHtml(storeKey) + '*.ts</code></li>' +
                '</ul>' +
              '</div>' +
            '</div>' +
          '</div>'
          
          document.body.appendChild(modal)
          
          // Add event listeners
          document.getElementById('locate-close-btn').addEventListener('click', function() {
            modal.remove()
          })
          
          document.getElementById('copy-pattern-btn').addEventListener('click', function() {
            copyToClipboard('createStore(\\'' + storeKey + '\\')')
            showToast('📋 Copied search pattern!')
          })
          
          document.getElementById('search-vscode-btn').addEventListener('click', function() {
            searchInVSCode(storeKey)
          })
          
          document.getElementById('search-webstorm-btn').addEventListener('click', function() {
            searchInWebStorm(storeKey)
          })
          
          document.getElementById('search-github-btn').addEventListener('click', function() {
            searchInGitHub(storeKey)
          })
          
          // Close on background click
          modal.addEventListener('click', function(e) {
            if (e.target === modal) {
              modal.remove()
            }
          })
          
        } catch (e) {
          console.error('Locate store failed:', e)
          showToast('❌ Failed to locate store: ' + e.message)
        }
      }
      
      /**
       * Helper functions for IDE/GitHub search
       */
      function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text)
        } else {
          const textarea = document.createElement('textarea')
          textarea.value = text
          textarea.style.position = 'fixed'
          textarea.style.opacity = '0'
          document.body.appendChild(textarea)
          textarea.select()
          document.execCommand('copy')
          document.body.removeChild(textarea)
        }
      }
      
      function searchInVSCode(storeKey) {
        // First, try to use the backend endpoint to open VS Code directly
        fetch('/open-in-vscode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storeKey: storeKey })
        })
        .then(r => r.json())
        .then(result => {
          if (result.success) {
            showToast('📝 Opened in VS Code: ' + result.path)
          } else {
            // Fallback to manual instructions
            showVSCodeInstructions(storeKey, result.searchedPaths || [])
          }
        })
        .catch(e => {
          // Fallback to manual instructions
          showVSCodeInstructions(storeKey, [])
        })
      }
      
      function showVSCodeInstructions(storeKey, searchedPaths) {
        const searchPattern = 'createStore(\\'' + storeKey + '\\')'
        const modal = document.createElement('div')
        modal.className = 'modal-overlay'
        modal.style.display = 'flex'
        modal.innerHTML = '<div class="modal-content" style="max-width: 600px;">' +
          '<div class="modal-header">' +
            '<h2>📝 Open in VS Code</h2>' +
            '<button class="modal-close" onclick="this.closest(\\'.modal-overlay\\').remove()">✕</button>' +
          '</div>' +
          '<div class="modal-body">' +
            '<div style="margin-bottom: 20px;">' +
              '<h3 style="margin: 0 0 10px 0;">� Store Not Found Automatically</h3>' +
              '<p style="color: #4a5568;">Couldn\\'t locate the store file. Try these options:</p>' +
            '</div>' +
            
            '<div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px;">' +
              '<h4 style="margin: 0 0 8px 0; color: #2d3748;">Option 1: Manual Search</h4>' +
              '<p style="margin: 0 0 8px 0; font-size: 14px;">Press <kbd>Ctrl+Shift+F</kbd> (or <kbd>Cmd+Shift+F</kbd> on Mac) and search for:</p>' +
              '<div style="background: white; padding: 10px; border-radius: 6px; font-family: monospace; font-size: 13px; border: 1px solid #e2e8f0;">' +
                searchPattern +
              '</div>' +
              '<button onclick="navigator.clipboard.writeText(\\'' + searchPattern + '\\').then(() => showToast(\\'📋 Copied!\\'))" style="margin-top: 8px; padding: 6px 12px; background: #8b5cf6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px;">📋 Copy Search Pattern</button>' +
            '</div>' +
            
            '<div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #3b82f6;">' +
              '<h4 style="margin: 0 0 8px 0; color: #1e40af;">Option 2: Check These Locations</h4>' +
              '<ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">' +
                '<li><code>src/stores/' + storeKey + '.ts</code></li>' +
                '<li><code>src/stores/' + storeKey + 'Store.ts</code></li>' +
                '<li><code>src/state/' + storeKey + '.ts</code></li>' +
                '<li><code>src/models/' + storeKey + 'Model.ts</code></li>' +
              '</ul>' +
            '</div>' +
            
            '<div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">' +
              '<h4 style="margin: 0 0 8px 0; color: #92400e;">💡 Pro Tip: Install FortiState Extension</h4>' +
              '<p style="margin: 0 0 10px 0; font-size: 14px; color: #78350f;">Get the FortiState VS Code extension for instant store navigation with snapshots!</p>' +
              '<button onclick="window.open(\\'https://marketplace.visualstudio.com/search?term=fortistate&target=VSCode\\', \\'_blank\\')" style="padding: 8px 16px; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px;">📦 Install Extension</button>' +
            '</div>' +
          '</div>' +
        '</div>'
        
        document.body.appendChild(modal)
        
        // Auto-close after 15 seconds
        setTimeout(function() {
          if (modal && modal.parentNode) {
            modal.remove()
          }
        }, 15000)
      }
      
      function searchInWebStorm(storeKey) {
        // WebStorm uses jetbrains:// URI scheme
        const searchPattern = 'createStore(\\'' + storeKey + '\\')'
        
        // Try WebStorm URI scheme
        const webstormUrl = 'jetbrains://idea/navigate/reference?project=fortistate&path=' + storeKey
        window.open(webstormUrl, '_blank')
        
        // Show fallback instructions
        setTimeout(function() {
          alert('WebStorm Search:\\n\\nPress Ctrl+Shift+F (or Cmd+Shift+F on Mac) and search for:\\n\\n' + searchPattern + '\\n\\nOr use Find in Path to search the entire project.')
        }, 500)
      }
      
      function searchInGitHub(storeKey) {
        // Try to detect GitHub repo from origin
        const repo = prompt('Search GitHub for this store. Enter your repository (e.g., owner/repo):', 'axfrgo/fortistate')
        
        if (repo) {
          const searchQuery = encodeURIComponent('createStore(\\'' + storeKey + '\\')')
          const githubUrl = 'https://github.com/' + repo + '/search?q=' + searchQuery
          window.open(githubUrl, '_blank')
          showToast('🐙 Opening GitHub search...')
        }
      }
      
      
      // ========================================================================
      // INVITE COLLABORATION MODAL
      // ========================================================================
      
      function showInviteModal() {
        // Get the current inspector URL
        const protocol = window.location.protocol
        const hostname = window.location.hostname
        const port = window.location.port
        const inspectorUrl = protocol + '//' + hostname + (port ? ':' + port : '')
        
        // Get local network IP if possible
        let networkTip = 'Share this URL with your team to view stores in real-time.'
        
        // Create modal HTML
        const modalHtml = '<div class="modal-overlay" id="invite-modal" style="display: flex;">' +
          '<div class="modal-content" style="max-width: 600px;">' +
            '<div class="modal-header">' +
              '<h2 style="margin: 0; color: #0a0a0a; font-weight: 700;">👥 Invite Team to Inspector</h2>' +
              '<button class="modal-close" id="invite-close" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #666; line-height: 1;">×</button>' +
            '</div>' +
            '<div class="modal-body" style="padding: 30px;">' +
              '<div style="margin-bottom: 25px;">' +
                '<p style="color: #4a5568; margin-bottom: 15px; line-height: 1.6;">' +
                  networkTip +
                '</p>' +
              '</div>' +
              
              '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; margin-bottom: 25px;">' +
                '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">' +
                  '<label style="color: white; font-weight: 600; font-size: 14px;">Inspector Session URL</label>' +
                  '<button onclick="copyInspectorUrl()" class="btn primary" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 6px 12px; font-size: 13px;">📋 Copy</button>' +
                '</div>' +
                '<input type="text" value="' + inspectorUrl + '" readonly style="width: 100%; padding: 12px; border: 2px solid rgba(255,255,255,0.3); border-radius: 8px; font-family: \\'Monaco\\', \\'Courier New\\', monospace; font-size: 14px; background: rgba(255,255,255,0.95); color: #2d3748; font-weight: 600;">' +
              '</div>' +
              
              '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 25px;">' +
                '<button onclick="emailInspectorUrl()" class="btn secondary" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; font-size: 14px; font-weight: 600;">📧 Email Link</button>' +
                '<button onclick="copyInspectorQR()" class="btn secondary" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; font-size: 14px; font-weight: 600;">📱 QR Code</button>' +
              '</div>' +
              
              '<div style="background: #f7fafc; padding: 20px; border-radius: 12px; border: 2px solid #e2e8f0;">' +
                '<h3 style="margin: 0 0 12px 0; color: #2d3748; font-size: 15px; font-weight: 700;">📖 Instructions for Collaborators</h3>' +
                '<ol style="margin: 0; padding-left: 20px; color: #4a5568; line-height: 1.8; font-size: 14px;">' +
                  '<li>Open the Inspector URL in their browser</li>' +
                  '<li>They will see all registered stores in real-time</li>' +
                  '<li>Any changes you make will sync automatically</li>' +
                  '<li>They can inspect state, history, and apply laws</li>' +
                  '<li>Perfect for pair programming and debugging!</li>' +
                '</ol>' +
              '</div>' +
              
              '<div style="margin-top: 20px; padding: 15px; background: #fff5f5; border-left: 4px solid #fc8181; border-radius: 8px;">' +
                '<p style="margin: 0; color: #742a2a; font-size: 13px; line-height: 1.6;">' +
                  '<strong>🔒 Security Note:</strong> This inspector session is on your local network. ' +
                  'Only share with trusted team members. For production monitoring, use the FortiState telemetry system.' +
                '</p>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
        
        // Add modal to page
        const existingModal = document.getElementById('invite-modal')
        if (existingModal) {
          existingModal.style.display = 'flex'
        } else {
          document.body.insertAdjacentHTML('beforeend', modalHtml)
          
          // Add event listeners
          document.getElementById('invite-close').addEventListener('click', function() {
            document.getElementById('invite-modal').style.display = 'none'
          })
          
          document.getElementById('invite-modal').addEventListener('click', function(e) {
            if (e.target.id === 'invite-modal') {
              document.getElementById('invite-modal').style.display = 'none'
            }
          })
        }
        
        // Add helper functions to window if not already there
        if (!window.copyInspectorUrl) {
          window.copyInspectorUrl = function() {
            const url = protocol + '//' + hostname + (port ? ':' + port : '')
            copyToClipboard(url, 'Inspector URL copied to clipboard! Share it with your team.')
          }
          
          window.emailInspectorUrl = function() {
            const url = protocol + '//' + hostname + (port ? ':' + port : '')
            const subject = encodeURIComponent('Join my FortiState Inspector Session')
            const body = encodeURIComponent(
              'Hey!\\n\\n' +
              'I\\'m debugging with FortiState Inspector and wanted to invite you to view the live state.\\n\\n' +
              'Inspector URL: ' + url + '\\n\\n' +
              'Just open this URL in your browser to see all stores in real-time.\\n\\n' +
              'Happy debugging! 🚀'
            )
            window.open('mailto:?subject=' + subject + '&body=' + body, '_blank')
          }
          
          window.copyInspectorQR = function() {
            const url = protocol + '//' + hostname + (port ? ':' + port : '')
            const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(url)
            
            // Create a temporary modal with the QR code
            const qrModal = '<div class="modal-overlay" id="qr-modal" style="display: flex;">' +
              '<div class="modal-content" style="max-width: 400px; text-align: center;">' +
                '<div class="modal-header">' +
                  '<h2 style="margin: 0; color: #0a0a0a; font-weight: 700;">📱 Scan QR Code</h2>' +
                  '<button class="modal-close" onclick="document.getElementById(\\'qr-modal\\').remove()" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #666; line-height: 1;">×</button>' +
                '</div>' +
                '<div class="modal-body" style="padding: 30px;">' +
                  '<img src="' + qrUrl + '" alt="QR Code" style="max-width: 100%; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">' +
                  '<p style="margin-top: 20px; color: #4a5568; font-size: 14px;">Scan this code with your phone to open the inspector</p>' +
                '</div>' +
              '</div>' +
            '</div>'
            
            document.body.insertAdjacentHTML('beforeend', qrModal)
          }
        }
      }
      
      
      // ========================================================================
      // LAW CONFIGURATION PRESETS
      // ========================================================================
      
      const LAW_PRESETS = [
        {
          id: 'strict-validation',
          name: 'Strict Validation',
          description: 'Enforces all validation rules with auto-repair',
          laws: ['INS-001', 'INS-002', 'INS-003', 'INS-004', 'INS-005'],
          config: { autoRepair: true, strictMode: true }
        },
        {
          id: 'production-ready',
          name: 'Production Ready',
          description: 'Essential laws for production deployment',
          laws: ['INS-001', 'INS-002', 'INS-004'],
          config: { autoRepair: false, strictMode: true }
        },
        {
          id: 'development-friendly',
          name: 'Development Friendly',
          description: 'Relaxed rules for rapid development',
          laws: ['INS-001'],
          config: { autoRepair: true, strictMode: false }
        },
        {
          id: 'quality-assurance',
          name: 'Quality Assurance',
          description: 'Focus on metadata and lifecycle tracking',
          laws: ['INS-002', 'INS-003', 'INS-005'],
          config: { autoRepair: false, strictMode: false }
        },
        {
          id: 'size-optimization',
          name: 'Size Optimization',
          description: 'Monitors and controls state size',
          laws: ['INS-004'],
          config: { autoRepair: false, strictMode: true, maxSize: 50000 }
        }
      ]
      
      async function applyLawsToStore(storeKey) {
        const store = stores[storeKey]
        if (!store) {
          alert('Store not found: ' + storeKey)
          return
        }
        
        // Show law selection dialog
        const lawIds = INSPECTOR_LAWS.map(l => l.id).join(', ')
        const selectedLaws = prompt(
          'Apply ontogenetic laws to "' + storeKey + '"\\n\\n' +
          'Available laws: ' + lawIds + '\\n\\n' +
          'Enter law IDs (comma-separated) or "all":',
          'all'
        )
        
        if (!selectedLaws) return
        
        const lawsToApply = selectedLaws.trim().toLowerCase() === 'all'
          ? INSPECTOR_LAWS
          : INSPECTOR_LAWS.filter(l => selectedLaws.split(',').map(s => s.trim().toUpperCase()).includes(l.id))
        
        if (lawsToApply.length === 0) {
          alert('No valid laws selected')
          return
        }
        
        // Validate store against selected laws
        const violations = []
        lawsToApply.forEach(law => {
          const violation = law.validate(storeKey, store)
          if (violation) violations.push(violation)
        })
        
        if (violations.length === 0) {
          showToast('✓ Store "' + storeKey + '" complies with all ' + lawsToApply.length + ' laws!')
        } else {
          const message = '⚠ ' + violations.length + ' violation(s) found in "' + storeKey + '"'
          showToast(message)
          
          // Show detailed violations
          console.group('Law Violations for "' + storeKey + '"')
          violations.forEach(v => {
            console.warn('[' + v.lawId + '] ' + v.message)
            if (v.suggestion) console.info('→ ' + v.suggestion)
          })
          console.groupEnd()
          
          // Ask if user wants to see auto-fix suggestions
          if (confirm('View auto-fix suggestions?')) {
            autoFixViolations()
          }
        }
      }
      
      let currentConfigureStore = null
      
      function configureLawsForStore(storeKey) {
        const store = stores[storeKey]
        if (!store) {
          alert('Store not found: ' + storeKey)
          return
        }
        
        currentConfigureStore = storeKey
        
        // Update modal UI
        const storeNameEl = document.getElementById('configure-laws-store-name')
        if (storeNameEl) {
          storeNameEl.innerHTML = '<span class="store-key-badge">' + escapeHtml(storeKey) + '</span>'
        }
        
        // Render preset grid
        const presetGrid = document.getElementById('law-preset-grid')
        if (presetGrid) {
          presetGrid.innerHTML = LAW_PRESETS.map((preset, index) => 
            '<div class="preset-card" onclick="selectLawPreset(' + index + ')" id="law-preset-' + index + '">' +
              '<div class="preset-card-header">' +
                '<h5 class="preset-card-title">' + escapeHtml(preset.name) + '</h5>' +
              '</div>' +
              '<div class="preset-card-description">' + escapeHtml(preset.description) + '</div>' +
              '<div class="preset-card-laws">' +
                preset.laws.map(law => '<span class="law-tag">' + escapeHtml(law) + '</span>').join('') +
              '</div>' +
            '</div>'
          ).join('')
        }
        
        // Render law checkboxes
        const checkboxesContainer = document.getElementById('law-checkboxes')
        if (checkboxesContainer) {
          checkboxesContainer.innerHTML = INSPECTOR_LAWS.map(law =>
            '<label class="checkbox-label">' +
              '<input type="checkbox" class="form-checkbox law-checkbox" value="' + escapeHtml(law.id) + '" />' +
              '<span>' + escapeHtml(law.id) + '</span>' +
            '</label>'
          ).join('')
        }
        
        // Load existing configuration if any
        try {
          const storeLawConfigs = JSON.parse(localStorage.getItem('fortistate-store-law-configs') || '{}')
          const existingConfig = storeLawConfigs[storeKey]
          if (existingConfig) {
            // Check if it matches a preset
            const presetIndex = LAW_PRESETS.findIndex(p => p.id === existingConfig.id)
            if (presetIndex !== -1) {
              selectLawPreset(presetIndex)
            } else {
              // Custom config - check the checkboxes
              existingConfig.laws.forEach(lawId => {
                const checkbox = checkboxesContainer.querySelector('input[value="' + lawId + '"]')
                if (checkbox) checkbox.checked = true
              })
            }
            
            // Set options
            if (existingConfig.config) {
              const autoRepair = document.getElementById('law-auto-repair')
              const strictMode = document.getElementById('law-strict-mode')
              if (autoRepair) autoRepair.checked = Boolean(existingConfig.config.autoRepair)
              if (strictMode) strictMode.checked = Boolean(existingConfig.config.strictMode)
            }
          }
        } catch (e) {
          console.error('Failed to load existing config:', e)
        }
        
        // Show modal
        const modal = document.getElementById('configure-laws-modal')
        if (modal) modal.style.display = 'flex'
      }
      
      let selectedPresetIndex = null
      
      function selectLawPreset(index) {
        // Deselect all
        LAW_PRESETS.forEach((_, i) => {
          const card = document.getElementById('law-preset-' + i)
          if (card) card.classList.remove('selected')
        })
        
        // Select this one
        const card = document.getElementById('law-preset-' + index)
        if (card) card.classList.add('selected')
        
        selectedPresetIndex = index
        
        // Update checkboxes to match preset
        const preset = LAW_PRESETS[index]
        const checkboxes = document.querySelectorAll('.law-checkbox')
        checkboxes.forEach(cb => {
          cb.checked = preset.laws.includes(cb.value)
        })
        
        // Update options if preset has config
        if (preset.config) {
          const autoRepair = document.getElementById('law-auto-repair')
          const strictMode = document.getElementById('law-strict-mode')
          if (autoRepair) autoRepair.checked = Boolean(preset.config.autoRepair)
          if (strictMode) strictMode.checked = Boolean(preset.config.strictMode)
        }
      }
      
      function closeLawConfigModal() {
        const modal = document.getElementById('configure-laws-modal')
        if (modal) modal.style.display = 'none'
        currentConfigureStore = null
        selectedPresetIndex = null
      }
      
      function saveLawConfiguration() {
        if (!currentConfigureStore) {
          alert('No store selected')
          return
        }
        
        const storeKey = currentConfigureStore
        
        // Get selected laws
        const checkboxes = document.querySelectorAll('.law-checkbox:checked')
        const selectedLaws = Array.from(checkboxes).map(cb => cb.value)
        
        if (selectedLaws.length === 0) {
          alert('Please select at least one law or choose a preset')
          return
        }
        
        // Get options
        const autoRepair = document.getElementById('law-auto-repair')
        const strictMode = document.getElementById('law-strict-mode')
        
        let lawConfig
        if (selectedPresetIndex !== null && selectedPresetIndex >= 0) {
          // Using a preset
          lawConfig = { ...LAW_PRESETS[selectedPresetIndex] }
        } else {
          // Custom configuration
          lawConfig = {
            id: 'custom',
            name: 'Custom Configuration',
            description: 'User-defined law configuration',
            laws: selectedLaws,
            config: {
              autoRepair: autoRepair ? autoRepair.checked : false,
              strictMode: strictMode ? strictMode.checked : false
            }
          }
        }
        
        // Save to localStorage
        try {
          const storeLawConfigs = JSON.parse(localStorage.getItem('fortistate-store-law-configs') || '{}')
          storeLawConfigs[storeKey] = lawConfig
          localStorage.setItem('fortistate-store-law-configs', JSON.stringify(storeLawConfigs))
          
          showToast('✓ Law configuration saved for "' + storeKey + '": ' + lawConfig.name)
          console.info('Law configuration for "' + storeKey + '":', lawConfig)
          
          closeLawConfigModal()
        } catch (e) {
          alert('Failed to save configuration: ' + e.message)
        }
      }
      
      async function duplicateStore(sourceKey) {
        const destKey = prompt('New key for duplicate:')
        if (!destKey) return
        try {
          const headers = { 'Content-Type': 'application/json' }
          if (inspectorToken) headers['x-fortistate-token'] = inspectorToken
          const res = await fetch('/duplicate-store', {
            method: 'POST',
            headers,
            body: JSON.stringify({ sourceKey, destKey })
          })
          if (res.ok) {
            showToast('✓ Store duplicated: ' + destKey)
            loadRemoteStores()
          } else {
            alert('Failed to duplicate store')
          }
        } catch (e) { alert('Error: ' + e.message) }
      }

      async function swapStore(keyA) {
        // try to auto-detect the currently active store key in the host app
          const auto = detectActiveKey(keyA) || keyA
        const keyB = auto
        if (!keyB || !stores[keyB]) {
          alert('Could not determine target key to swap with')
          return
        }
        try {
          const headers = { 'Content-Type': 'application/json' }
          if (inspectorToken) headers['x-fortistate-token'] = inspectorToken
          const res = await fetch('/swap-stores', {
            method: 'POST',
            headers,
            body: JSON.stringify({ keyA, keyB })
          })
          if (res.ok) {
            showToast('✓ Stores swapped: ' + keyA + ' ↔ ' + keyB)
            loadRemoteStores()
          } else {
            alert('Failed to swap stores')
          }
        } catch (e) { alert('Error: ' + e.message) }
      }

  // Heuristic to detect an "active" store key from the host app.
  // Checks: URL search param 'fortistate', data-active-key on body, a global
  // window.__FORTISTATE_ACTIVE__ value, or common keys present in the stores list.
      function detectActiveKey(fallbackKey) {
        try {
          // deterministic hint first
          if (activeKeyHint && stores[activeKeyHint]) return activeKeyHint
          // 1) URL param: ?fortistate=key
          try {
            const u = new URL(location.href)
            const k = u.searchParams.get('fortistate')
            if (k && stores[k]) return k
          } catch (e) { /* ignore */ }

          // 2) data-active-key attribute on body or html
          const bodyAttr = document.body && document.body.getAttribute && document.body.getAttribute('data-active-key')
          if (bodyAttr && stores[bodyAttr]) return bodyAttr
          const htmlAttr = document.documentElement && document.documentElement.getAttribute && document.documentElement.getAttribute('data-active-key')
          if (htmlAttr && stores[htmlAttr]) return htmlAttr

          // 3) global window hint (legacy)
          if (typeof window !== 'undefined' && window.__FORTISTATE_ACTIVE__) {
            const g = window.__FORTISTATE_ACTIVE__
            if (typeof g === 'string' && stores[g]) return g
          }

          // 4) common key names: try standard naming patterns
          const common = ['state', 'appState', 'store', 'main', 'root', 'app']
          for (const c of common) if (stores[c]) return c

          // 5) fallback: if only two stores exist and one matches the passed fallbackKey, pick the other
          const keys = Object.keys(stores || {})
          if (keys.length === 2 && fallbackKey) {
            if (keys[0] === fallbackKey) return keys[1]
            if (keys[1] === fallbackKey) return keys[0]
          }
        } catch (e) { /* ignore heuristics */ }
        return undefined
      }
      
      function applyLawPresetToTarget() {
        const presetId = document.getElementById('law-preset-select').value
        const targetKey = document.getElementById('preset-target').value.trim() || detectActiveKey()
        
        if (!presetId) {
          alert('Please select a law preset')
          return
        }
        
        if (!targetKey || !stores[targetKey]) {
          alert('No target store selected or store not found')
          return
        }
        
        const preset = LAW_PRESETS.find(p => p.id === presetId)
        if (!preset) {
          alert('Preset not found')
          return
        }
        
        // Store law configuration
        try {
          const storeLawConfigs = JSON.parse(localStorage.getItem('fortistate-store-law-configs') || '{}')
          storeLawConfigs[targetKey] = preset
          localStorage.setItem('fortistate-store-law-configs', JSON.stringify(storeLawConfigs))
          
          showToast('\u2713 Applied \"' + preset.name + '\" to \"' + targetKey + '\"')
          
          // Run validation with selected laws
          const lawsToApply = INSPECTOR_LAWS.filter(l => preset.laws.includes(l.id))
          const violations = []
          lawsToApply.forEach(law => {
            const violation = law.validate(targetKey, stores[targetKey])
            if (violation) violations.push(violation)
          })
          
          if (violations.length === 0) {
            showToast('\u2713 \"' + targetKey + '\" complies with ' + preset.name + '!')
          } else {
            console.group('Law Violations: ' + preset.name + ' on \"' + targetKey + '\"')
            violations.forEach(v => {
              console.warn('[' + v.lawId + '] ' + v.message)
              if (v.suggestion) console.info('\u2192 ' + v.suggestion)
            })
            console.groupEnd()
            
            showToast('\u26a0 ' + violations.length + ' violation(s) found (see console)')
          }
        } catch (e) {
          alert('Failed to apply preset: ' + e.message)
        }
      }

      async function moveStore(oldKey) {
        const newKey = prompt('New key:')
        if (!newKey) return
        try {
          const headers = { 'Content-Type': 'application/json' }
          if (inspectorToken) headers['x-fortistate-token'] = inspectorToken
          const res = await fetch('/move-store', {
            method: 'POST',
            headers,
            body: JSON.stringify({ oldKey, newKey })
          })
          if (res.ok) {
            showToast('✓ Store moved: ' + oldKey + ' → ' + newKey)
            loadRemoteStores()
          } else {
            alert('Failed to move store')
          }
        } catch (e) { alert('Error: ' + e.message) }
      }

      // WebSocket for real-time updates
      function connectWS() {
        const hosts = [location.host, 'localhost:4000', '127.0.0.1:4000']
        let idx = 0
        function tryNext() {
          if (idx >= hosts.length) {
            // retry full cycle after a pause
            idx = 0
            setTimeout(tryNext, 2000)
            return
          }
          const h = hosts[idx++]
          try {
            let wsUrl = 'ws://' + h
            if (inspectorToken) {
              wsUrl += '?token=' + encodeURIComponent(inspectorToken)
            }
            ws = new WebSocket(wsUrl)
          } catch (e) {
            setTimeout(tryNext, 200)
            return
          }
          ws.onopen = () => console.debug('[inspector.client] ws open', h)
          ws.onmessage = (e) => {
            try {
              const msg = JSON.parse(e.data)
              if (msg.type === 'store:create' || msg.type === 'store:change') {
                stores[msg.key] = msg.initial || msg.value
                renderStores()
              }
              // Handle history updates in real-time
              if (msg.type === 'history:add' && msg.entry) {
                console.debug('[inspector.client] History update received:', msg.entry)
                historyEntries.push(msg.entry)
                // Keep buffer size in check
                if (historyEntries.length > 200) {
                  historyEntries.shift()
                }
                // If timeline is visible, re-render
                const timelinePanel = document.getElementById('timeline')
                if (timelinePanel && timelinePanel.style.display !== 'none') {
                  console.debug('[inspector.client] Timeline visible, re-rendering')
                  renderHistory()
                }
              }
            } catch (err) { console.error('ws msg error', err) }
          }
          ws.onclose = () => {
            console.debug('[inspector.client] ws closed for', h)
            // try next host
            setTimeout(tryNext, 200)
          }
          ws.onerror = () => {
            console.debug('[inspector.client] ws error for', h)
            try { ws.close() } catch (e) {}
          }
        }
        tryNext()
      }

  // Initialize token and target displays
  updateTokenDisplay()
  
  loadRemoteStores()
  loadPresets()
  setInterval(loadRemoteStores, 3000)
  connectWS()
  
  // Update target key whenever stores change
  setInterval(updateTargetKeyDisplay, 1000)

  // history / timeline support
  let historyEntries = []
  let replayIndex = -1
  async function loadHistory() {
    try {
      const headers = {}
      if (inspectorToken) {
        headers['x-fortistate-token'] = inspectorToken
        headers['Authorization'] = 'Bearer ' + inspectorToken
      }
      const res = await fetch('/history', { headers })
      if (!res.ok) {
        console.debug('history load failed:', res.status, res.statusText)
        return
      }
      historyEntries = await res.json()
      renderHistory()
    } catch (e) { 
      console.debug('history load error:', e && e.message) 
    }
  }

  function renderHistory() {
    const container = document.getElementById('history-list')
    if (!container) return
    
    console.debug('[inspector.client] Rendering history:', historyEntries.length, 'entries')
    
    if (historyEntries.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⏱️</div><div class="empty-state-title">No history yet</div><div class="empty-state-description">Store changes will appear here</div></div>'
      const status = document.getElementById('timeline-status')
      if (status) status.innerText = '0 entries'
      return
    }
    
    container.innerHTML = historyEntries.map(function(h, i){
      return '<div role="listitem" tabindex="0" data-idx="'+i+'" class="history-item"><strong style="color:var(--accent-secondary)">'+escapeHtml(String(h.action || ''))+'</strong> <small style="color:var(--text-muted)">'+new Date(h.ts||0).toLocaleString()+'</small><div style="font-family:monospace;margin-top:6px;white-space:pre-wrap;font-size:12px;color:var(--text-secondary)">'+escapeHtml(JSON.stringify(h, null, 2))+'</div></div>'
    }).join('')
    
    // Update status
    const status = document.getElementById('timeline-status')
    if (status) status.innerText = historyEntries.length + ' entries'
    
    // simple keyboard support for selecting entries
    Array.from(container.querySelectorAll('[data-idx]')).forEach(function(el){
      el.addEventListener('click', function(){ replayIndex = Number(el.getAttribute('data-idx')); applyHistoryEntry(replayIndex) })
      el.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); replayIndex = Number(el.getAttribute('data-idx')); applyHistoryEntry(replayIndex) } })
    })
  }

  function applyHistoryEntry(idx) {
    const h = historyEntries[idx]
    if (!h) return
    // for replay, if change action with key/value, POST to /change
    if (h.action === 'change' && h.key) {
      fetch('/change', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: h.key, value: h.value }) }).then(r => { if (r.ok) showToast('Replayed change') })
    }
    // other actions are informational
    const status = document.getElementById('timeline-status')
  if (status) status.innerText = 'Selected ' + (idx+1) + '/' + historyEntries.length
  }

  document.getElementById('timeline-toggle').addEventListener('click', function(){
    const el = document.getElementById('timeline')
    if (!el) return
    const expanded = el.style.display !== 'none'
    el.style.display = expanded ? 'none' : 'block'
    this.setAttribute('aria-expanded', (!expanded).toString())
    if (!expanded) { loadHistory() }
  })
  
  // preset panel toggle
  document.getElementById('preset-toggle').addEventListener('click', function(){
    const el = document.getElementById('preset-panel')
    if (!el) return
    const expanded = el.style.display !== 'none'
    el.style.display = expanded ? 'none' : 'block'
    this.setAttribute('aria-expanded', (!expanded).toString())
    if (!expanded) { 
      loadPresets()
      updateTargetKeyDisplay()
      updateTokenDisplay()
    }
  })
  
  // law validator toggle
  document.getElementById('law-toggle').addEventListener('click', function(){
    const el = document.getElementById('law-validator')
    if (!el) return
    const expanded = el.style.display !== 'none'
    el.style.display = expanded ? 'none' : 'block'
    this.setAttribute('aria-expanded', (!expanded).toString())
    if (!expanded) { validateStores() }
  })
  
  // help modal toggle
  document.getElementById('help-btn').addEventListener('click', function(){
    const modal = document.getElementById('help-modal')
    if (modal) modal.style.display = 'flex'
  })
  
  // invite modal toggle
  document.getElementById('invite-btn').addEventListener('click', function(){
    showInviteModal()
  })
  
  document.getElementById('help-close').addEventListener('click', function(){
    const modal = document.getElementById('help-modal')
    if (modal) modal.style.display = 'none'
  })
  
  // close help modal when clicking outside
  document.getElementById('help-modal').addEventListener('click', function(e){
    if (e.target === this) {
      this.style.display = 'none'
    }
  })
  
  // configure laws modal controls
  document.getElementById('configure-laws-close').addEventListener('click', function(){
    closeLawConfigModal()
  })
  
  // close configure laws modal when clicking outside
  document.getElementById('configure-laws-modal').addEventListener('click', function(e){
    if (e.target === this) {
      closeLawConfigModal()
    }
  })
  
  // law preset dropdown change
  try {
    const lawPresetSelect = document.getElementById('law-preset-select')
    if (lawPresetSelect) {
      lawPresetSelect.addEventListener('change', function(){
        const desc = document.getElementById('law-preset-desc')
        const presetId = this.value
        const preset = LAW_PRESETS.find(p => p.id === presetId)
        if (preset && desc) {
          desc.innerHTML = '<strong>' + preset.description + '</strong><br>Laws: ' + preset.laws.join(', ') + 
            '<br>Config: ' + JSON.stringify(preset.config)
        } else if (desc) {
          desc.innerHTML = ''
        }
      })
    }
  } catch (e) { console.debug('law preset select init error', e) }

  document.getElementById('replay-play').addEventListener('click', async function(){
    // simple play through changes
    if (historyEntries.length === 0) return
    for (let i = 0; i < historyEntries.length; i++) {
      await new Promise(r => setTimeout(r, 250))
      replayIndex = i
      applyHistoryEntry(i)
    }
    showToast('Replay finished')
  })
  document.getElementById('replay-prev').addEventListener('click', function(){ if (replayIndex>0) { replayIndex--; applyHistoryEntry(replayIndex) } })
  document.getElementById('replay-next').addEventListener('click', function(){ if (replayIndex < historyEntries.length-1) { replayIndex++; applyHistoryEntry(replayIndex) } })
  
  // store filter input
  document.getElementById('store-filter').addEventListener('input', function(){
    renderStores()
    if (document.getElementById('law-validator').style.display !== 'none') {
      validateStores()
    }
  })

  // minimal toast system
  function showToast(msg) {
    let t = document.getElementById('fortistate-toast')
    if (!t) {
      t = document.createElement('div'); t.id = 'fortistate-toast'; t.style.position='fixed'; t.style.right='16px'; t.style.bottom='16px'; t.style.padding='10px 14px'; t.style.borderRadius='8px'; t.style.background='rgba(15,23,42,0.9)'; t.style.color='#fff'; t.style.zIndex='9999'; document.body.appendChild(t)
    }
    t.innerText = msg
    setTimeout(()=>{ try{ t.parentNode && t.parentNode.removeChild(t) } catch(e){} }, 3000)
  }

  // telemetry SSE stream
  let telemetrySource = null
  const telemetryEntries = []
  const MAX_TELEMETRY_DISPLAY = 50

  function connectTelemetry() {
    if (telemetrySource) return
    const status = document.getElementById('telemetry-status')
    try {
      telemetrySource = new EventSource('/telemetry/stream')
      if (status) status.innerText = '(connected)'
      
      telemetrySource.onmessage = function(e) {
        try {
          const entry = JSON.parse(e.data)
          telemetryEntries.push(entry)
          if (telemetryEntries.length > MAX_TELEMETRY_DISPLAY) telemetryEntries.shift()
          renderTelemetry()
        } catch (err) { console.debug('telemetry parse', err) }
      }
      
      telemetrySource.onerror = function() {
        if (status) status.innerText = '(disconnected)'
        if (telemetrySource) telemetrySource.close()
        telemetrySource = null
      }
    } catch (e) {
      if (status) status.innerText = '(error)'
    }
  }

  function renderTelemetry() {
    const container = document.getElementById('telemetry-list')
    if (!container) return
    container.innerHTML = telemetryEntries.slice().reverse().map(function(entry){
      const severityColor = entry.severity === 'error' ? '#dc2626' : entry.severity === 'warn' ? '#f59e0b' : '#10b981'
      const typeLabel = entry.type || 'event'
      return '<div style="padding:8px;border-bottom:1px solid #f0f0f0;font-size:13px"><div style="display:flex;gap:8px;align-items:center"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+severityColor+'"></span><strong>'+escapeHtml(entry.lawName || 'unknown')+'</strong><span style="color:#666">'+typeLabel+'</span><span style="color:#999;font-size:11px;margin-left:auto">'+new Date(entry.timestamp||0).toLocaleTimeString()+'</span></div><div style="margin-top:4px;color:#666">'+escapeHtml(entry.message || '')+'</div>'+(entry.details ? '<div style="margin-top:4px;font-family:monospace;font-size:11px;color:#999">'+escapeHtml(JSON.stringify(entry.details))+'</div>' : '')+'</div>'
    }).join('')
  }

  document.getElementById('telemetry-toggle').addEventListener('click', function(){
    const panel = document.getElementById('telemetry-panel')
    if (!panel) return
    const expanded = panel.style.display !== 'none'
    panel.style.display = expanded ? 'none' : 'block'
    this.setAttribute('aria-expanded', (!expanded).toString())
    if (!expanded) { connectTelemetry(); renderTelemetry() }
  })

    </script>
  </body>
</html>`

export default inspectorClientHtml
