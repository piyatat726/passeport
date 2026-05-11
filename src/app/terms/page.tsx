'use client';

import { useRouter } from 'next/navigation';

export default function TermsPage() {
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
            TERMS OF USE
          </h1>
        </div>
      </header>

      <article className="px-6 pt-6 max-w-lg mx-auto">
        <p className="text-[10px] text-taupe tracking-widest uppercase font-inter mb-6">
          Last updated: 2025-05-12
        </p>

        <Section title="1. 服務說明">
          <p>
            PASSEPORT 是一個時尚生活風格社群平台，讓使用者分享穿搭日記、旅行筆記、咖啡誌等生活風格內容。使用本平台即代表你同意以下使用條款。
          </p>
        </Section>

        <Section title="2. 帳號註冊">
          <ul>
            <li>你必須年滿 13 歲才能註冊帳號</li>
            <li>註冊資訊必須真實且準確</li>
            <li>你有責任保管自己的帳號安全</li>
            <li>每人限註冊一個主要帳號</li>
          </ul>
        </Section>

        <Section title="3. 使用者內容">
          <p>你在本平台發布的內容（文章、照片、留言）：</p>
          <ul>
            <li>著作權歸你所有</li>
            <li>你授權本平台在服務範圍內展示和分發你的內容</li>
            <li>你可以隨時刪除你發布的內容</li>
            <li>刪除後內容會從平台上移除（但已被他人截圖或轉載的部分無法控制）</li>
          </ul>
        </Section>

        <Section title="4. 禁止行為">
          <p>使用本平台時，你不得：</p>
          <ul>
            <li>發布違法、色情、暴力或仇恨內容</li>
            <li>騷擾、霸凌或威脅其他使用者</li>
            <li>冒充他人或製造虛假身分</li>
            <li>散布垃圾訊息或惡意連結</li>
            <li>未經授權使用他人的照片或內容</li>
            <li>嘗試入侵、干擾或破壞平台系統</li>
            <li>使用自動化工具或機器人操作帳號</li>
            <li>侵犯他人的智慧財產權</li>
          </ul>
        </Section>

        <Section title="5. 內容審核">
          <p>
            我們保留權利在收到檢舉後審查並移除違反使用條款的內容。嚴重違規者的帳號可能被暫停或永久停權。
          </p>
        </Section>

        <Section title="6. 智慧財產權">
          <p>
            PASSEPORT 的品牌名稱、標誌、介面設計和程式碼受智慧財產權保護。未經授權不得複製、修改或商業使用。
          </p>
        </Section>

        <Section title="7. 免責聲明">
          <ul>
            <li>本平台以「現況」提供服務，不保證服務不中斷或無錯誤</li>
            <li>我們不對使用者發布的內容負責</li>
            <li>使用者之間的互動和交易由使用者自行承擔風險</li>
            <li>我們盡力保護你的資料，但無法保證絕對安全</li>
          </ul>
        </Section>

        <Section title="8. 服務變更與終止">
          <p>
            我們可能隨時修改、暫停或終止部分或全部服務功能。重大變更時會提前通知使用者。你可以隨時停止使用本平台或刪除帳號。
          </p>
        </Section>

        <Section title="9. 條款修改">
          <p>
            本使用條款可能會不定期修改。修改後繼續使用本平台即代表同意新版條款。建議定期查看此頁面。
          </p>
        </Section>

        <Section title="10. 聯繫我們">
          <p>
            如有任何問題或疑慮，請聯繫：<br />
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
      <div className="text-[13px] text-ink/80 font-noto leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-1">
        {children}
      </div>
    </section>
  );
}
