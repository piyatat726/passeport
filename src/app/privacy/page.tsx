'use client';

import { useRouter } from 'next/navigation';

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-cream pb-16">
      <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center px-5 pt-14 pb-4 gap-3">
          <button onClick={() => router.back()} className="p-1">
            <svg className="w-5 h-5 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="font-playfair italic text-xl tracking-editorial text-ink">
            PRIVACY POLICY
          </h1>
        </div>
      </header>

      <article className="px-6 pt-6 max-w-lg mx-auto">
        <p className="text-[10px] text-taupe tracking-widest uppercase font-inter mb-6">
          Last updated: 2025-05-12
        </p>

        <Section title="1. 資料蒐集">
          <p>PASSEPORT（以下稱「本平台」）蒐集以下資料以提供服務：</p>
          <ul>
            <li>帳號資料：電子郵件、使用者名稱、顯示名稱</li>
            <li>個人檔案：大頭貼、自我介紹、城市</li>
            <li>使用者內容：文章、留言、照片</li>
            <li>互動紀錄：按讚、追蹤、收藏、訊息</li>
            <li>裝置資訊：瀏覽器類型（用於改善體驗）</li>
            <li>位置資訊：僅在使用地圖功能且授權時取得</li>
          </ul>
        </Section>

        <Section title="2. 資料使用">
          <p>我們使用你的資料來：</p>
          <ul>
            <li>提供、維護和改善本平台服務</li>
            <li>顯示個人化的內容推薦</li>
            <li>處理和傳送通知與訊息</li>
            <li>確保平台安全及防止濫用</li>
          </ul>
          <p>我們<strong>不會</strong>將你的個人資料出售給第三方。</p>
        </Section>

        <Section title="3. 資料儲存與安全">
          <p>
            你的資料儲存於 Supabase 雲端服務（位於美國），採用加密傳輸（TLS/SSL）和資料庫層級安全策略（Row Level Security）保護。密碼經過雜湊處理，我們無法查看你的明文密碼。
          </p>
        </Section>

        <Section title="4. 資料分享">
          <p>以下資料為公開可見：</p>
          <ul>
            <li>你的個人檔案（使用者名稱、顯示名稱、大頭貼、自介）</li>
            <li>你發布的文章和留言</li>
            <li>追蹤者和追蹤中的清單</li>
          </ul>
          <p>以下資料僅限本人可見：</p>
          <ul>
            <li>電子郵件地址</li>
            <li>收藏和喜歡的文章</li>
            <li>私人訊息內容</li>
            <li>封鎖名單</li>
          </ul>
        </Section>

        <Section title="5. Cookie 與追蹤">
          <p>
            本平台使用必要的 Cookie 來維持登入狀態。我們不使用第三方追蹤 Cookie 或廣告追蹤技術。
          </p>
        </Section>

        <Section title="6. 你的權利">
          <p>你可以隨時：</p>
          <ul>
            <li>編輯或刪除你的個人檔案資料</li>
            <li>刪除你發布的文章和留言</li>
            <li>封鎖其他使用者</li>
            <li>要求刪除你的帳號及所有相關資料</li>
          </ul>
          <p>如需刪除帳號，請聯繫我們。</p>
        </Section>

        <Section title="7. 未成年人">
          <p>
            本平台不面向 13 歲以下的兒童。如果我們發現 13 歲以下使用者的帳號，將會刪除該帳號及相關資料。
          </p>
        </Section>

        <Section title="8. 政策變更">
          <p>
            本隱私權政策可能會不定期更新。重大變更時，我們會透過平台通知使用者。繼續使用本平台即代表同意更新後的政策。
          </p>
        </Section>

        <Section title="9. 聯繫我們">
          <p>
            如有隱私相關問題，請透過電子郵件聯繫：<br />
            <span className="font-inter text-ink">hello@passeport.app</span>
          </p>
        </Section>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-inter font-semibold text-sm text-ink mb-3 tracking-wide">
        {title}
      </h2>
      <div className="text-[13px] text-ink/80 font-noto leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-1 [&_strong]:text-ink [&_strong]:font-semibold">
        {children}
      </div>
    </section>
  );
}
