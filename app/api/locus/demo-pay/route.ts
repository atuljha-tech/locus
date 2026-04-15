/**
 * Locus Demo Payment Page
 * Simulates the Locus checkout popup for hackathon demo
 */
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const debtId = searchParams.get('debtId') ?? ''
  const amount = searchParams.get('amount') ?? '0'
  const session = searchParams.get('session') ?? ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Locus Paygentic — USDC Payment</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
      background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .card {
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 24px;
      padding: 40px;
      width: 380px;
      text-align: center;
      box-shadow: 0 24px 80px rgba(0,0,0,0.5);
    }
    .logo { font-size: 48px; margin-bottom: 16px; }
    .brand { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
    .sub { font-size: 13px; color: rgba(255,255,255,0.5); margin-bottom: 32px; }
    .amount-box {
      background: rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .amount-label { font-size: 12px; color: rgba(255,255,255,0.4); margin-bottom: 8px; }
    .amount { font-size: 42px; font-weight: 900; color: #a78bfa; }
    .currency { font-size: 16px; color: rgba(255,255,255,0.5); margin-top: 4px; }
    .btn {
      width: 100%;
      padding: 16px;
      border-radius: 14px;
      border: none;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 12px;
    }
    .btn-pay {
      background: linear-gradient(135deg, #7c3aed, #5b21b6);
      color: white;
      box-shadow: 0 4px 20px rgba(124,58,237,0.4);
    }
    .btn-pay:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(124,58,237,0.5); }
    .btn-cancel { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); }
    .status { font-size: 13px; color: rgba(255,255,255,0.4); margin-top: 16px; }
    .success { color: #4ade80; font-size: 16px; font-weight: 700; }
    .spinner {
      display: inline-block;
      width: 20px; height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      vertical-align: middle;
      margin-right: 8px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 99px;
      background: rgba(124,58,237,0.2);
      border: 1px solid rgba(124,58,237,0.3);
      font-size: 11px;
      color: #c4b5fd;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">⚡</div>
    <div class="brand">Locus Paygentic</div>
    <div class="sub">Instant USDC Settlement on Solana</div>
    <div class="badge">🔒 Secure · On-chain · Instant</div>
    <div class="amount-box">
      <div class="amount-label">AMOUNT DUE</div>
      <div class="amount">$${parseFloat(amount).toFixed(2)}</div>
      <div class="currency">USDC · Solana Network</div>
    </div>
    <button class="btn btn-pay" id="payBtn" onclick="handlePay()">
      Pay $${parseFloat(amount).toFixed(2)} USDC
    </button>
    <button class="btn btn-cancel" onclick="window.close()">Cancel</button>
    <div class="status" id="status">Powered by Locus Paygentic · Hackathon Demo</div>
  </div>

  <script>
    async function handlePay() {
      const btn = document.getElementById('payBtn');
      const status = document.getElementById('status');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span>Processing on Solana...';
      status.innerHTML = 'Confirming transaction on-chain...';

      await new Promise(r => setTimeout(r, 2000));
      
      btn.innerHTML = '✅ Payment Confirmed!';
      btn.style.background = 'linear-gradient(135deg, #059669, #047857)';
      status.innerHTML = '<span class="success">✅ USDC transferred successfully!</span><br><span style="font-size:11px;color:rgba(255,255,255,0.3)">Tx confirmed on Solana · Closing in 2s...</span>';
      
      await new Promise(r => setTimeout(r, 2000));
      window.close();
    }
  </script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  })
}
