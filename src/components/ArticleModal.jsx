import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import mammoth from "mammoth";

export default function ArticleModal({
  article,
  isTeacher,
  userId,
  selectedCategory,
  onClose,
  onSaved,
}) {
  const [approve, setApprove] = useState(false);
  const [author, setAuthor] = useState(article?.author || "");
  const [authorSuggestions, setAuthorSuggestions] = useState([]);
  const [title, setTitle] = useState(article?.title || "");
  const [description, setDescription] = useState(article?.description || "");
  const [day, setDay] = useState(article?.day || "1");
  const [month, setMonth] = useState(article?.month || "August");
  const [year, setYear] = useState(article?.year || "2026");
  const [photos, setPhotos] = useState(article?.photos || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDraggingDoc, setIsDraggingDoc] = useState(false);
  const [parsingDoc, setParsingDoc] = useState(false);

  useEffect(() => {
    const loadAuthorSuggestions = async () => {
      const { data, error } = await supabase
        .from("news_articles")
        .select("author")
        .not("author", "is", null);

      if (error) {
        console.error("Author Suggestions Error:", error);
        return;
      }

      const uniqueAuthors = [
        ...new Set(
          (data || [])
            .map((item) => item.author?.trim())
            .filter(Boolean),
        ),
      ].sort((a, b) => a.localeCompare(b));

      setAuthorSuggestions(uniqueAuthors);
    };

    loadAuthorSuggestions();
  }, []);

  const targetCategory =
    selectedCategory && selectedCategory !== "All"
      ? selectedCategory
      : article?.category || "Campus Journalism";

  const monthToNum = (monthName) => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const index = monthNames.indexOf(monthName);
    const num = index !== -1 ? index + 1 : 1;
    return String(num).padStart(2, "0");
  };

  const getDaysInMonth = (monthName, yr) => {
    const monthIndex = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ].indexOf(monthName);
    if (monthIndex === -1) return 31;
    return new Date(parseInt(yr, 10), monthIndex + 1, 0).getDate();
  };

  const daysInMonthCount = getDaysInMonth(month, year);
  const daysArray = Array.from({ length: daysInMonthCount }, (_, i) =>
    String(i + 1),
  );

  useEffect(() => {
    if (parseInt(day, 10) > daysInMonthCount) {
      setDay(String(daysInMonthCount));
    }
  }, [month, year, daysInMonthCount, day]);

  // Handle .docx File Parsing via Drag or File Input
  const processDocxFile = async (file) => {
    if (!file) return;
    if (
      !file.name.endsWith(".docx") &&
      file.type !==
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      alert("Please upload a valid Word document (.docx).");
      return;
    }

    setParsingDoc(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const extractedText = result.value.trim();

      if (extractedText) {
        setDescription(extractedText);
      } else {
        alert("Could not extract any text from this document.");
      }
    } catch (error) {
      console.error("Docx Extraction Error:", error);
      alert("Failed to parse the Word document.");
    } finally {
      setParsingDoc(false);
    }
  };

  const handleDocDrop = (e) => {
    e.preventDefault();
    setIsDraggingDoc(false);
    const file = e.dataTransfer.files[0];
    processDocxFile(file);
  };

  const handleDocFileInput = (e) => {
    const file = e.target.files[0];
    processDocxFile(file);
  };

  // Image Upload Handlers
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);

    const formattedMonth = monthToNum(month);
    const formattedDay = String(day).padStart(2, "0");
    const dateFolderPath = `${year}/${formattedMonth}/${formattedDay}`;

    const uploadedUrls = [];
    for (const file of files) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${userId}/${dateFolderPath}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("news-photos")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Storage Upload Error:", uploadError);
        alert(`Upload error: ${uploadError.message}`);
      } else {
        const { data } = supabase.storage
          .from("news-photos")
          .getPublicUrl(filePath);
        if (data?.publicUrl) {
          uploadedUrls.push(data.publicUrl);
        }
      }
    }

    setPhotos((prev) => [...prev, ...uploadedUrls]);
    setUploading(false);
  };

  const handleRemovePhoto = (urlToRemove) => {
    setPhotos((prev) => prev.filter((url) => url !== urlToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!author.trim() || !title.trim() || !description.trim()) return;
    setSaving(true);

    const payload = {
      status: isTeacher ? (approve ? "published" : article?.status || "published") : "pending",
      ...(!article?.id ? { submitted_by: userId } : {}),
      author: author.trim(),
      title: title.trim(),
      description,
      category: targetCategory,
      day,
      month,
      year,
      photos,
    };

    try {
      if (article?.id) {
        const { error } = await supabase
          .from("news_articles")
          .update(payload)
          .eq("id", article.id)
          .select("id")
          .single();
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("news_articles")
          .insert([payload]);
        if (error) throw error;
      }
      onSaved();
    } catch (err) {
      console.error("Database Operation Error:", err);
      alert(`Database error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              {article ? "Edit Article" : "New Article"}
            </h2>
            <p className="text-xs text-slate-400">
              Publishing under{" "}
              <span className="font-semibold text-rose-900">
                {targetCategory}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* AUTHOR */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Author's Name *
            </label>
            <input
              type="text"
              required
              list="article-author-suggestions"
              autoComplete="off"
              placeholder="e.g. Juan Dela Cruz"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900 transition"
            />
            <datalist id="article-author-suggestions">
              {authorSuggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          {/* TITLE */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Feeding Program Launch"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900 transition"
            />
          </div>

          {/* DATE */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Date
            </label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900 transition"
              >
                {daysArray.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900 transition"
              >
                {[
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "December",
                ].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900 transition"
              >
                {["2024", "2025", "2026", "2027"].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* DESCRIPTION WITH DRAG & DROP FOR .DOCX */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Description *
              </label>
              <label className="text-xs text-rose-900 font-semibold cursor-pointer hover:underline">
                {parsingDoc ? "Extracting..." : "📄 Import Word (.docx)"}
                <input
                  type="file"
                  accept=".docx"
                  onChange={handleDocFileInput}
                  className="hidden"
                  disabled={parsingDoc}
                />
              </label>
            </div>

            <div
              className={`relative rounded-xl border-2 transition ${
                isDraggingDoc
                  ? "border-dashed border-rose-900 bg-rose-50/50"
                  : "border-transparent"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingDoc(true);
              }}
              onDragLeave={() => setIsDraggingDoc(false)}
              onDrop={handleDocDrop}
            >
              {isDraggingDoc && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-rose-50/90 rounded-xl pointer-events-none">
                  <p className="text-sm font-bold text-rose-900">
                    Drop .docx file here to extract text
                  </p>
                </div>
              )}

              <textarea
                required
                rows={5}
                placeholder="Describe the activity, or drag and drop a Word document (.docx) here..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900 transition"
              />
            </div>
          </div>

          {/* PHOTOS */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Photos
              </label>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer transition">
                <span>+ Add Photos</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>

            {uploading && (
              <p className="text-xs text-rose-900 font-medium mb-2 animate-pulse">
                Uploading photos…
              </p>
            )}

            {photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2 border border-slate-200 rounded-xl p-2 bg-slate-50 max-h-36 overflow-y-auto">
                {photos.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200"
                  >
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(url)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isTeacher && article?.status === "pending" && (
            <label className="flex items-center gap-2 text-sm font-bold text-rose-900">
              <input type="checkbox" checked={approve} onChange={e => setApprove(e.target.checked)} />
              Approve and publish this article
            </label>
          )}
          {!isTeacher && <p className="text-xs text-slate-500">Your article will be sent to teachers for review before it appears on the website.</p>}
          {/* ACTIONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading || parsingDoc}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #7B1C1C, #881337)",
              }}
            >
              {saving
                ? "Saving..."
                : !isTeacher ? "Submit for Review" : approve ? "Approve & Publish" : article
                  ? "Save Changes"
                  : "Publish Article"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
