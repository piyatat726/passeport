'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

// ─── SQL for new tables (comments, places, post_places) ───
const NEW_TABLES_SQL = `-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Places table
CREATE TABLE IF NOT EXISTS public.places (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  address text DEFAULT '',
  latitude double precision,
  longitude double precision,
  category text DEFAULT '',
  mapbox_id text DEFAULT '',
  mention_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Post-Places junction table
CREATE TABLE IF NOT EXISTS public.post_places (
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  place_id uuid REFERENCES public.places(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (post_id, place_id)
);

-- RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_places ENABLE ROW LEVEL SECURITY;

-- Comments policies
DO $$ BEGIN
  CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can create own comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Places policies
DO $$ BEGIN
  CREATE POLICY "Places are viewable by everyone" ON public.places FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert places" ON public.places FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Post_places policies
DO $$ BEGIN
  CREATE POLICY "Post places are viewable by everyone" ON public.post_places FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert post_places for own posts" ON public.post_places FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_places_mapbox_id ON public.places(mapbox_id);
CREATE INDEX IF NOT EXISTS idx_places_name ON public.places(name);
CREATE INDEX IF NOT EXISTS idx_post_places_place_id ON public.post_places(place_id);

-- Trigger: auto-update mention_count
CREATE OR REPLACE FUNCTION update_place_mention_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.places SET mention_count = mention_count + 1 WHERE id = NEW.place_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.places SET mention_count = GREATEST(mention_count - 1, 0) WHERE id = OLD.place_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_place_mention_count ON public.post_places;
CREATE TRIGGER trigger_update_place_mention_count
  AFTER INSERT OR DELETE ON public.post_places
  FOR EACH ROW EXECUTE FUNCTION update_place_mention_count();`;

// ─── SQL for Storage policies ───
const STORAGE_SQL = `-- Storage Policies (run AFTER creating buckets in Dashboard)

-- Posts bucket
CREATE POLICY "Post images are publicly viewable"
ON storage.objects FOR SELECT USING (bucket_id = 'posts');

CREATE POLICY "Users can upload post images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own post images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own post images"
ON storage.objects FOR DELETE
USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Avatars bucket
CREATE POLICY "Avatars are publicly viewable"
ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);`;

interface CheckResult {
  name: string;
  status: 'ok' | 'error' | 'loading';
  message: string;
}

export default function SetupPage() {
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [running, setRunning] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const projectRef = supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)?.[1] || '';

  const runChecks = async () => {
    setRunning(true);
    const results: CheckResult[] = [];
    const supabase = createClient();

    // 1. Supabase connection
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' },
      });
      results.push({
        name: 'Supabase 連線',
        status: res.ok ? 'ok' : 'error',
        message: res.ok ? '已連線' : `HTTP ${res.status}`,
      });
    } catch {
      results.push({ name: 'Supabase 連線', status: 'error', message: '無法連線' });
    }

    // 2. Core tables
    const coreTables = ['users', 'posts', 'likes', 'follows', 'collections', 'collection_items'];
    let coreOk = 0;
    const coreMissing: string[] = [];
    for (const table of coreTables) {
      const { error } = await supabase.from(table).select('*').limit(0);
      if (!error) coreOk++;
      else coreMissing.push(table);
    }
    results.push({
      name: '核心表格（6個）',
      status: coreOk === coreTables.length ? 'ok' : 'error',
      message: coreOk === coreTables.length
        ? '✓ users, posts, likes, follows, collections, collection_items'
        : `缺少：${coreMissing.join(', ')}`,
    });

    // 3. New tables
    const newTables = ['comments', 'places', 'post_places'];
    let newOk = 0;
    const newMissing: string[] = [];
    for (const table of newTables) {
      const { error } = await supabase.from(table).select('*').limit(0);
      if (!error) newOk++;
      else newMissing.push(table);
    }
    results.push({
      name: '新表格（3個）',
      status: newOk === newTables.length ? 'ok' : 'error',
      message: newOk === newTables.length
        ? '✓ comments, places, post_places'
        : `缺少：${newMissing.join(', ')}`,
    });

    // 4. Storage buckets
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketNames = (buckets || []).map(b => b.name);
      const hasPosts = bucketNames.includes('posts');
      const hasAvatars = bucketNames.includes('avatars');
      results.push({
        name: 'Storage Buckets',
        status: hasPosts && hasAvatars ? 'ok' : 'error',
        message: hasPosts && hasAvatars
          ? '✓ posts, avatars'
          : `缺少：${[!hasPosts && 'posts', !hasAvatars && 'avatars'].filter(Boolean).join(', ')}`,
      });
    } catch {
      results.push({ name: 'Storage Buckets', status: 'error', message: '無法檢查（可能需要先建立）' });
    }

    // 5. Storage upload test
    try {
      const { error } = await supabase.storage.from('posts').list('', { limit: 1 });
      results.push({
        name: 'Storage 權限',
        status: !error ? 'ok' : 'error',
        message: !error ? '已設定' : '需要設定 RLS 政策',
      });
    } catch {
      results.push({ name: 'Storage 權限', status: 'error', message: '需要設定' });
    }

    setChecks(results);
    setRunning(false);
  };

  useEffect(() => {
    runChecks();
  }, []);

  const handleCopy = async (sql: string, id: string) => {
    try {
      await navigator.clipboard.writeText(sql);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = sql;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;
  const storageUrl = `https://supabase.com/dashboard/project/${projectRef}/storage/buckets`;
  const allGood = checks.length > 0 && checks.every(c => c.status === 'ok');

  return (
    <div className="min-h-screen bg-cream p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-playfair italic text-3xl tracking-editorial text-ink mb-2">
          PASSEPORT SETUP
        </h1>
        <p className="text-sm text-taupe font-noto">環境設定面板 — 隨時回來檢查狀態</p>
        <p className="text-[10px] text-taupe/60 font-inter mt-1">localhost:3000/setup</p>
      </div>

      {/* ═══ Status Checks ═══ */}
      <div className="space-y-2.5 mb-8">
        <h2 className="font-inter text-xs tracking-widest uppercase text-taupe mb-3">STATUS CHECK</h2>
        {checks.map((check, i) => (
          <div
            key={i}
            className={`flex items-center justify-between p-3.5 rounded-xl border ${
              check.status === 'ok'
                ? 'bg-emerald-50/50 border-emerald-200'
                : 'bg-red-50/50 border-red-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`text-sm font-bold ${check.status === 'ok' ? 'text-emerald-500' : 'text-red-400'}`}>
                {check.status === 'ok' ? '✓' : '✗'}
              </span>
              <span className="text-sm font-inter font-medium text-ink">{check.name}</span>
            </div>
            <span className={`text-[11px] font-noto ${
              check.status === 'ok' ? 'text-emerald-600' : 'text-red-500'
            }`}>
              {check.message}
            </span>
          </div>
        ))}
        {running && (
          <div className="text-center py-4">
            <div className="w-5 h-5 border-2 border-taupe/30 border-t-ink rounded-full animate-spin mx-auto" />
          </div>
        )}
      </div>

      <button
        onClick={runChecks}
        disabled={running}
        className="mb-10 px-6 py-2.5 bg-ink text-cream rounded-lg text-xs font-inter tracking-editorial uppercase disabled:opacity-50"
      >
        重新檢查
      </button>

      {/* ═══ All Good Banner ═══ */}
      {allGood && (
        <div className="mb-10 p-6 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <p className="text-lg font-playfair italic text-emerald-700 mb-1">All Set!</p>
          <p className="text-xs font-noto text-emerald-600 mb-4">所有設定完成，可以開始使用了</p>
          <a href="/" className="inline-block px-8 py-3 bg-ink text-cream rounded-lg text-xs font-inter tracking-editorial uppercase">
            開始使用 PASSEPORT
          </a>
        </div>
      )}

      {/* ═══ Setup Steps ═══ */}
      <div className="space-y-8">

        {/* Step 1: New Tables */}
        <SetupStep
          number={1}
          title="建立新表格"
          subtitle="comments + places + post_places"
          done={checks.find(c => c.name === '新表格（3個）')?.status === 'ok'}
          description="新增留言、地點、文章地點關聯等表格"
        >
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => handleCopy(NEW_TABLES_SQL, 'tables')}
              className={`px-5 py-2 rounded-lg text-xs font-inter tracking-wide transition-colors ${
                copiedId === 'tables'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-ink text-cream hover:bg-ink/90'
              }`}
            >
              {copiedId === 'tables' ? '已複製 ✓' : '複製 SQL'}
            </button>
            <a
              href={sqlEditorUrl}
              target="_blank"
              rel="noopener"
              className="px-5 py-2 border border-border text-ink rounded-lg text-xs font-inter tracking-wide hover:border-taupe transition-colors inline-flex items-center gap-1.5"
            >
              打開 SQL Editor ↗
            </a>
          </div>
        </SetupStep>

        {/* Step 2: Storage Buckets */}
        <SetupStep
          number={2}
          title="建立 Storage Buckets"
          subtitle="posts + avatars"
          done={checks.find(c => c.name === 'Storage Buckets')?.status === 'ok'}
          description="到 Supabase Dashboard → Storage → New Bucket"
        >
          <div className="space-y-2 text-xs font-noto text-ink/70 mb-4">
            <p>1. 點「New Bucket」→ 名稱輸入 <code className="bg-surface px-1.5 py-0.5 rounded font-mono text-ink">posts</code> → 勾選 <strong>Public bucket</strong> → Create</p>
            <p>2. 再建一個 → 名稱 <code className="bg-surface px-1.5 py-0.5 rounded font-mono text-ink">avatars</code> → 勾選 <strong>Public bucket</strong> → Create</p>
          </div>
          <a
            href={storageUrl}
            target="_blank"
            rel="noopener"
            className="px-5 py-2 border border-border text-ink rounded-lg text-xs font-inter tracking-wide hover:border-taupe transition-colors inline-flex items-center gap-1.5"
          >
            打開 Storage 頁面 ↗
          </a>
        </SetupStep>

        {/* Step 3: Storage Policies */}
        <SetupStep
          number={3}
          title="設定 Storage 權限"
          subtitle="RLS policies for posts & avatars"
          done={checks.find(c => c.name === 'Storage 權限')?.status === 'ok'}
          description="建立 Bucket 後，執行此 SQL 設定上傳/讀取權限"
        >
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => handleCopy(STORAGE_SQL, 'storage')}
              className={`px-5 py-2 rounded-lg text-xs font-inter tracking-wide transition-colors ${
                copiedId === 'storage'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-ink text-cream hover:bg-ink/90'
              }`}
            >
              {copiedId === 'storage' ? '已複製 ✓' : '複製 Storage SQL'}
            </button>
            <a
              href={sqlEditorUrl}
              target="_blank"
              rel="noopener"
              className="px-5 py-2 border border-border text-ink rounded-lg text-xs font-inter tracking-wide hover:border-taupe transition-colors inline-flex items-center gap-1.5"
            >
              打開 SQL Editor ↗
            </a>
          </div>
        </SetupStep>
      </div>

      {/* ═══ Quick Links ═══ */}
      <div className="mt-12 p-5 bg-surface rounded-xl border border-border">
        <h3 className="font-inter text-xs tracking-widest uppercase text-taupe mb-4">QUICK LINKS</h3>
        <div className="grid grid-cols-2 gap-2">
          <QuickLink href={`https://supabase.com/dashboard/project/${projectRef}`} label="Supabase Dashboard" />
          <QuickLink href={`https://supabase.com/dashboard/project/${projectRef}/auth/users`} label="Auth Users" />
          <QuickLink href={`https://supabase.com/dashboard/project/${projectRef}/editor`} label="Table Editor" />
          <QuickLink href={`https://supabase.com/dashboard/project/${projectRef}/storage/buckets`} label="Storage" />
          <QuickLink href={`https://supabase.com/dashboard/project/${projectRef}/sql/new`} label="SQL Editor" />
          <QuickLink href={`https://supabase.com/dashboard/project/${projectRef}/auth/url-configuration`} label="Auth URL Config" />
        </div>
      </div>

      {/* ═══ Auth URL Reminder ═══ */}
      <div className="mt-6 p-5 bg-surface rounded-xl border border-border">
        <h3 className="font-inter text-xs tracking-widest uppercase text-taupe mb-3">AUTH URL 設定</h3>
        <div className="space-y-1.5 text-xs font-mono text-ink">
          <p><span className="text-taupe">Site URL:</span> http://localhost:3000</p>
          <p><span className="text-taupe">Redirect URLs:</span> http://localhost:3000/**</p>
        </div>
      </div>

      {/* Back */}
      <div className="mt-8 text-center">
        <a href="/" className="text-xs text-taupe font-inter hover:text-ink transition-colors">
          ← 返回首頁
        </a>
      </div>
    </div>
  );
}

// ─── Components ───

function SetupStep({ number, title, subtitle, done, description, children }: {
  number: number;
  title: string;
  subtitle: string;
  done?: boolean;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`p-5 rounded-xl border ${done ? 'bg-emerald-50/30 border-emerald-200' : 'bg-surface border-border'}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-inter font-bold ${
          done ? 'bg-emerald-500 text-white' : 'bg-ink text-cream'
        }`}>
          {done ? '✓' : number}
        </div>
        <div>
          <h3 className="font-inter text-sm font-semibold text-ink">{title}</h3>
          <p className="text-[10px] text-taupe font-inter">{subtitle}</p>
        </div>
        {done && (
          <span className="ml-auto text-[10px] text-emerald-600 font-inter font-medium bg-emerald-100 px-2 py-0.5 rounded-full">
            DONE
          </span>
        )}
      </div>
      <p className="text-xs text-ink/60 font-noto mb-4 ml-10">{description}</p>
      <div className="ml-10">
        {children}
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-cream transition-colors group"
    >
      <span className="text-xs font-inter text-ink">{label}</span>
      <svg className="w-3 h-3 text-taupe group-hover:text-ink transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
      </svg>
    </a>
  );
}
