export default function ArticleCard({ article, onEdit, onDelete, canEdit = true, isTeacher }) {
  const photoCount = article.photos?.length || 0;
  const firstPhoto = photoCount > 0 ? article.photos[0] : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group">
      {/* Photo header area */}
      <div className="relative h-44 bg-slate-100 overflow-hidden">
        {firstPhoto ? (
          <img
            src={firstPhoto}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
            <span className="text-4xl mb-1">{article.icon}</span>
            <span className="text-xs font-medium text-slate-400">
              No image uploaded
            </span>
          </div>
        )}

        {photoCount > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {photoCount} photo{photoCount !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${article.bg_color} ${article.border_color}`}
          >
            {article.category}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {article.date_label}
          </span>
        </div>

        <p className="text-xs font-bold text-rose-900 mb-2">{article.status === "pending" ? "Pending teacher review" : "Published"}</p>
        <p className="text-xs text-slate-500 mb-2">By {article.author}</p>
        <h3 className="text-sm font-black text-slate-900 leading-snug mb-2 line-clamp-2">
          {article.title}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 flex-1">
          {article.description}
        </p>
      </div>

      {/* Action Footer */}
      <div className="px-5 pb-5 pt-2 flex items-center gap-2 border-t border-slate-50">
        <button
          disabled={!canEdit}
          onClick={() => onEdit(article)}
          className="flex-1 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-rose-200 hover:text-rose-900 transition"
        >
          {!canEdit ? "Approved" : isTeacher && article.status === "pending" ? "Review & Edit" : "Edit"}
        </button>
        {onDelete && <button
          onClick={() => onDelete(article)}
          className="py-2 px-3 rounded-xl text-xs font-bold border border-red-100 text-red-500 hover:bg-red-50 transition"
        >
          🗑️ Delete
        </button>}
      </div>
    </div>
  );
}
