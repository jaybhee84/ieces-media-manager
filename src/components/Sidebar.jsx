import iecesLogo from "../image/ieceslogo.png";

const CATEGORIES = [
  { label: "All Articles", tag: "All", icon: "📰" },
  { label: "Campus Journalism", tag: "Campus Journalism", icon: "✍️" },
  { label: "Health & Nutrition", tag: "Health & Nutrition", icon: "🥗" },
  { label: "Sports & Culture", tag: "Sports & Culture", icon: "🏆" },
  { label: "Community Engagement", tag: "Community Engagement", icon: "🤝" },
  { label: "Academic & Literacy", tag: "Academic & Literacy", icon: "📚" },
  { label: "Safety & Preparedness", tag: "Safety & Preparedness", icon: "🚨" },
];

export default function Sidebar({
  user = {},
  role,
  onSignOut,
  articleCount = 0,
  selectedCategory,
  onSelectCategory,
}) {
  const openWebsite = () => {
    window.electron?.openUrl("https://project-rising-xi.vercel.app/activities");
  };

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col border-r border-slate-200 bg-white h-screen">
      {/* Logo Header */}
      <div
        className="px-5 py-5 border-b border-slate-100 flex-shrink-0"
        style={{ background: "linear-gradient(145deg, #7B1C1C, #881337)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-xl flex-shrink-0">
            <img src={iecesLogo} alt="IECES Logo" className="w-8 h-8" />
          </div>
          <div>
            <p className="text-white text-xs font-black leading-tight">IECES</p>
            <p className="text-rose-200 text-[10px] leading-tight">
              Media Manager
            </p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Categories
        </p>

        {CATEGORIES.map((cat) => {
          const isActive =
            selectedCategory === cat.tag ||
            (selectedCategory === "All" && cat.tag === "All");

          return (
            <button
              key={cat.tag}
              onClick={() => onSelectCategory(cat.tag)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-rose-50 text-rose-900 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="text-base">{cat.icon}</span>
              <span className="truncate">{cat.label}</span>
              {cat.tag === "All" && (
                <span className="ml-auto text-[10px] bg-rose-900 text-white rounded-full px-2 py-0.5 font-black">
                  {articleCount}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4 border-t border-slate-100 mt-4">
          <button
            onClick={openWebsite}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors text-xs font-medium"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            <span>View Live Website</span>
          </button>
        </div>
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-900 text-xs font-black uppercase">
            {user.email?.[0] || "U"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-700 truncate">
              {user.email}
            </p>
            <p className="text-[10px] text-slate-400">{role === "teacher" ? "Teacher" : "Student"}</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="w-full text-center text-xs text-slate-500 hover:text-rose-900 py-1.5 rounded-lg hover:bg-slate-50 transition font-medium"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
