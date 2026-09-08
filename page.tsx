// ── IECES Activities Page — reads live data from Supabase ──────────────────
// Replace your existing app/activities/page.tsx with this file.
// Add these to your Next.js .env.local:
//   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
//   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface NewsArticle {
  id: string
  title: string
  category: string
  tag: string
  date_label: string
  description: string
  icon: string
  bg_color: string
  border_color: string
  photos: string[]
  created_at: string
}

async function getArticles(): Promise<NewsArticle[]> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Supabase fetch error:', error.message)
    return []
  }
  return data || []
}

export const revalidate = 60 // Re-fetch every 60 seconds (ISR)

export default async function ActivitiesPage() {
  const articles = await getArticles()

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Hero Banner */}
        <div
          style={{ background: 'linear-gradient(135deg, #7B1C1C 0%, #881337 50%, #4C0D15 100%)' }}
          className="rounded-3xl p-8 sm:p-12 text-white shadow-xl mb-12 relative overflow-hidden"
        >
          <div className="relative z-10 max-w-3xl">
            <div
              style={{ backgroundColor: 'var(--school-gold)', color: '#0A192F' }}
              className="inline-block text-xs font-black uppercase tracking-widest px-3.5 py-1 rounded-full mb-4 shadow-sm"
            >
              School Announcements & Events
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
              News, Activities & Campus Journalism
            </h1>
            <p className="text-rose-100 text-sm sm:text-base leading-relaxed opacity-90 max-w-2xl">
              Highlights from student journalism competitions, campus events, sports meets, and community
              engagement projects at Isabela East Central Elementary School.
            </p>
          </div>
        </div>

        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-slate-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Campus Updates</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1" style={{ color: '#7B1C1C' }}>
              Recent School Highlights
            </h2>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-2 md:mt-0">
            Showcasing academic, cultural, and sports achievements across all grade levels.
          </p>
        </div>

        {/* Empty state */}
        {articles.length === 0 && (
          <div className="text-center py-24 text-slate-400">
            <div className="text-5xl mb-3">📭</div>
            <p className="font-semibold text-slate-500">No articles published yet.</p>
            <p className="text-sm mt-1">Check back soon for school news and updates.</p>
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((item) => (
            <article
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1"
            >
              <div className="p-6">
                {/* Photo / gallery area */}
                {item.photos && item.photos.length > 0 ? (
                  <div className="w-full h-48 rounded-xl mb-6 overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.photos[0]}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {item.photos.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        +{item.photos.length - 1} more
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{ backgroundColor: '#FFF5F5' }}
                    className="w-full h-48 rounded-xl mb-6 border border-rose-100 flex flex-col items-center justify-center text-slate-400 relative overflow-hidden group-hover:bg-rose-100/50 transition-colors"
                  >
                    <span className="text-5xl mb-2 transition-transform group-hover:scale-110 duration-300">
                      {item.icon}
                    </span>
                    <span className="text-xs font-semibold text-rose-900/70 uppercase tracking-wider">
                      {item.tag} Photo Gallery
                    </span>
                  </div>
                )}

                {/* Meta */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${item.bg_color} ${item.border_color} border`}>
                    {item.category}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    {item.date_label}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug group-hover:text-rose-900 transition-colors">
                  {item.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  {item.description}
                </p>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900 group-hover:underline inline-flex items-center cursor-pointer">
                  Read Announcement
                  <svg className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">SDO Isabela City</span>
              </div>
            </article>
          ))}
        </div>

        {/* Back CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/"
            style={{ backgroundColor: '#0A192F' }}
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-white font-bold text-sm shadow-md transition-all hover:bg-slate-800 hover:scale-[1.01]"
          >
            ← Back to Home Page
          </Link>
        </div>

      </div>
    </div>
  )
}
