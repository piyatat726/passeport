# PASSEPORT Email Templates Setup

Go to **Supabase Dashboard > Authentication > Email Templates**

## 1. Confirm Signup

Subject: `歡迎加入 PASSEPORT — 請確認你的信箱`

Body (HTML):
```html
<div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="background:#1a1a1a;padding:32px 24px;text-align:center">
    <h1 style="font-family:Georgia,serif;font-style:italic;font-size:28px;color:#fff;margin:0;letter-spacing:2px">PASSEPORT</h1>
    <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:8px 0 0;letter-spacing:3px;text-transform:uppercase">A lifestyle magazine in your pocket</p>
  </div>
  <div style="padding:40px 24px;background:#F7F4EF">
    <h2 style="font-family:Georgia,serif;font-size:20px;color:#222;margin:0 0 16px">確認你的信箱</h2>
    <p style="font-size:14px;color:#666;line-height:1.6;margin:0 0 24px">感謝你加入 PASSEPORT。點擊下方按鈕完成註冊，開始探索時尚、旅行與生活美學的靈感。</p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#222;color:#F7F4EF;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:500">確認信箱</a>
    <p style="font-size:11px;color:#999;margin:24px 0 0;line-height:1.5">如果按鈕無法使用，請複製以下連結到瀏覽器：<br><a href="{{ .ConfirmationURL }}" style="color:#666;word-break:break-all">{{ .ConfirmationURL }}</a></p>
  </div>
  <div style="padding:20px 24px;text-align:center;background:#F7F4EF;border-top:1px solid #e8e4de">
    <p style="font-size:10px;color:#999;margin:0;letter-spacing:1px">PASSEPORT &copy; 2025 — 把生活，寫成風格</p>
  </div>
</div>
```

## 2. Reset Password

Subject: `重設你的 PASSEPORT 密碼`

Body (HTML):
```html
<div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="background:#1a1a1a;padding:32px 24px;text-align:center">
    <h1 style="font-family:Georgia,serif;font-style:italic;font-size:28px;color:#fff;margin:0;letter-spacing:2px">PASSEPORT</h1>
  </div>
  <div style="padding:40px 24px;background:#F7F4EF">
    <h2 style="font-family:Georgia,serif;font-size:20px;color:#222;margin:0 0 16px">重設密碼</h2>
    <p style="font-size:14px;color:#666;line-height:1.6;margin:0 0 24px">我們收到了你的密碼重設請求。點擊下方按鈕設定新密碼。此連結 24 小時內有效。</p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#222;color:#F7F4EF;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:500">重設密碼</a>
    <p style="font-size:11px;color:#999;margin:24px 0 0">如果你沒有要求重設密碼，請忽略此信。</p>
  </div>
  <div style="padding:20px 24px;text-align:center;background:#F7F4EF;border-top:1px solid #e8e4de">
    <p style="font-size:10px;color:#999;margin:0;letter-spacing:1px">PASSEPORT &copy; 2025</p>
  </div>
</div>
```

## 3. Magic Link

Subject: `你的 PASSEPORT 登入連結`

Body (HTML):
```html
<div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="background:#1a1a1a;padding:32px 24px;text-align:center">
    <h1 style="font-family:Georgia,serif;font-style:italic;font-size:28px;color:#fff;margin:0;letter-spacing:2px">PASSEPORT</h1>
  </div>
  <div style="padding:40px 24px;background:#F7F4EF">
    <h2 style="font-family:Georgia,serif;font-size:20px;color:#222;margin:0 0 16px">一鍵登入</h2>
    <p style="font-size:14px;color:#666;line-height:1.6;margin:0 0 24px">點擊下方按鈕即可登入 PASSEPORT。此連結 1 小時內有效。</p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#222;color:#F7F4EF;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:500">登入</a>
    <p style="font-size:11px;color:#999;margin:24px 0 0">如果你沒有要求此連結，請忽略此信。</p>
  </div>
  <div style="padding:20px 24px;text-align:center;background:#F7F4EF;border-top:1px solid #e8e4de">
    <p style="font-size:10px;color:#999;margin:0;letter-spacing:1px">PASSEPORT &copy; 2025</p>
  </div>
</div>
```
