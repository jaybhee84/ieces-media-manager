import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import ArticleCard from "../components/ArticleCard";
import ArticleModal from "../components/ArticleModal";
import Sidebar from "../components/Sidebar";
import DeleteConfirmModal from "../components/DeleteConfirmModal";

export default function DashboardPage({ session, profile }) {
  const isTeacher = profile?.role === "teacher";
  const [statusFilter, setStatusFilter] = useState("all");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("news_articles").select("*").order("created_at", { ascending: false });
    if (!isTeacher) query = query.eq("submitted_by", session.user.id);
    const { data, error } = await query;
    if (!error) setArticles(data || []);
    else showToast("Could not load articles. Please try again.", "error");
    setLoading(false);
  }, [isTeacher, session.user.id]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleNewArticle = () => {
    setEditingArticle(null);
    setShowModal(true);
  };

  const handleEdit = (article) => {
    setEditingArticle(article);
    setShowModal(true);
  };

  const handleDeleteConfirm = (article) => {
    setDeleteTarget(article);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    // Delete photos from storage bucket
    if (deleteTarget.photos?.length) {
      const paths = deleteTarget.photos
        .map((url) => {
          const parts = url.split("/news-photos/");
          return parts[1] || "";
        })
        .filter(Boolean);
      if (paths.length) {
        await supabase.storage.from("news-photos").remove(paths);
      }
    }

    const { error } = await supabase
      .from("news_articles")
      .delete()
      .eq("id", deleteTarget.id);

    if (!error) {
      showToast("Article deleted successfully.");
      fetchArticles();
    } else {
      showToast("Failed to delete article.", "error");
    }
    setDeleteTarget(null);
  };

  // Filter articles based on sidebar category selection and search query
  const filtered = articles.filter((a) => {
    const titleMatch = a.title?.toLowerCase().includes(search.toLowerCase());
    const descMatch = a.description
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const matchesSearch = titleMatch || descMatch;

    const matchesCategory =
      selectedCategory === "All" ||
      a.category?.toLowerCase() === selectedCategory.toLowerCase() ||
      a.tag?.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory && (statusFilter === "all" || a.status === statusFilter);
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar
        user={{ ...session.user, email: profile?.real_email }}
        role={profile?.role}
        onSignOut={handleSignOut}
        articleCount={articles.length}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 flex-shrink-0">
          <div className="flex-1">
            <h1
              className="text-lg font-black text-slate-900"
              style={{ color: "#7B1C1C" }}
            >
              {selectedCategory === "All"
                ? "News & Activities"
                : selectedCategory}
            </h1>
            <p className="text-xs text-slate-400">
              {isTeacher ? "Review student submissions and manage published articles" : "My articles ? submissions require teacher approval"}
            </p>
          </div>

          {/* Search Input */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search articles…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900 w-56 transition"
            />
          </div>

          {/* Add / New Article button */}
          <button
            onClick={handleNewArticle}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg, #7B1C1C, #881337)" }}
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
                strokeWidth="2.5"
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Article
          </button>
        </header>

        <div className="px-6 py-3 flex gap-3 bg-white border-b border-slate-200">
          {[ ["all", "All"], ["pending", `Pending review (${articles.filter(a => a.status === "pending").length})`], ["published", "Published"] ].map(([value, label]) => (
            <button key={value} onClick={() => setStatusFilter(value)} className={`px-3 py-2 rounded-lg text-xs font-bold ${statusFilter === value ? "bg-rose-100 text-rose-900" : "text-slate-500"}`}>{label}</button>
          ))}
          <button onClick={fetchArticles} className="ml-auto text-xs text-rose-900">Refresh</button>
        </div>
        {/* Article Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-rose-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-2xl border border-slate-200/80">
              <div className="text-4xl mb-2">📭</div>
              <p className="font-semibold text-slate-600 text-sm">
                No articles found under "{selectedCategory}"
              </p>
              <button
                onClick={handleNewArticle}
                className="mt-3 px-4 py-2 bg-rose-50 text-rose-900 font-bold text-xs rounded-xl hover:bg-rose-100 transition"
              >
                + Create Article
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onEdit={handleEdit}
                  onDelete={isTeacher || article.status === "pending" ? handleDeleteConfirm : null}
                  canEdit={isTeacher || article.status === "pending"}
                  isTeacher={isTeacher}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Article Create & Edit Modal */}
      {showModal && (
        <ArticleModal
          article={editingArticle}
          isTeacher={isTeacher}
          userId={session.user.id}
          selectedCategory={selectedCategory}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            fetchArticles();
            showToast(
              isTeacher ? "Article saved!" : "Article submitted for teacher review!",
            );
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          title={deleteTarget.title}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-all z-50 ${
            toast.type === "error" ? "bg-red-600" : "bg-emerald-600"
          }`}
        >
          {toast.type === "error" ? "⚠️" : "✅"} {toast.msg}
        </div>
      )}
    </div>
  );
}
