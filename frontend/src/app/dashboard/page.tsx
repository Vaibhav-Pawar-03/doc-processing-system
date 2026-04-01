"use client";

import { useEffect, useState, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

// Status styling configuration
const STATUS_STYLES = {
  queued: { color: "text-blue-400", badge: "bg-blue-500/20 border-blue-500/50" },
  parsing: { color: "text-orange-400", badge: "bg-orange-500/20 border-orange-500/50" },
  extracting: { color: "text-yellow-400", badge: "bg-yellow-500/20 border-yellow-500/50" },
  completed: { color: "text-green-400", badge: "bg-green-500/20 border-green-500/50" },
};

interface Document {
  id: number;
  filename: string;
  status: string;
}

export default function Dashboard() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch documents from API
  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/documents`);
      if (!res.ok) throw new Error("Failed to fetch documents");
      const data = await res.json();
      setDocs(data);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("❌ Failed to load documents");
    }
  }, []);

  // Setup WebSocket for real-time updates
  useEffect(() => {
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let pollInterval: ReturnType<typeof setInterval>;

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(`${WS_URL}/ws`);

        ws.onopen = () => {
          console.log("✅ Dashboard connected to real-time updates");
          setWsConnected(true);
          reconnectAttempts = 0;
          setLoading(false);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.id && data.status) {
              // Update document status in real-time
              setDocs(prev =>
                prev.map(doc =>
                  doc.id === data.id
                    ? { ...doc, status: data.status.toLowerCase().trim() }
                    : doc
                )
              );
            }
          } catch (e) {
            console.error("Message parse error:", e);
          }
        };

        ws.onerror = () => {
          console.error("❌ WebSocket error");
          setWsConnected(false);
        };

        ws.onclose = () => {
          setWsConnected(false);
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 10000);
            reconnectTimeout = setTimeout(connectWebSocket, delay);
          }
        };
      } catch (e) {
        console.error("WebSocket error:", e);
      }
    };

    connectWebSocket();

    // Fetch documents initially
    fetchDocuments();

    // Poll for updates every 3 seconds (backup to WebSocket)
    pollInterval = setInterval(fetchDocuments, 3000);

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [fetchDocuments]);

  // Filter documents
  const filteredDocs = useCallback(() => {
    return docs.filter((doc) => {
      const matchesSearch = doc.filename
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesFilter = filter === "all" || doc.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [docs, search, filter])();

  // Get status style
  const getStatusStyle = (status: string) => {
    const style = STATUS_STYLES[status as keyof typeof STATUS_STYLES];
    return style || { color: "text-gray-400", badge: "bg-gray-500/20 border-gray-500/50" };
  };

  // Human-friendly status names
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      queued: "⏳ Queued",
      parsing: "📄 Parsing",
      extracting: "⚙️ Processing",
      completed: "✅ Complete",
    };
    return labels[status] || status;
  };

  // Handle document retry
  const handleRetry = async (docId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/retry/${docId}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Retry failed");
      toast.success("🔄 Retrying document...");
      fetchDocuments();
    } catch (err) {
      console.error("Retry error:", err);
      toast.error("❌ Failed to retry");
    }
  };

  // Handle download
  const handleDownload = (docId: number, filename: string) => {
    const link = document.createElement("a");
    link.href = `${API_BASE_URL}/uploads/${filename}`;
    link.download = filename;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-6">
      <Toaster />

      {/* Connection Status */}
      <div className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 border border-gray-700">
        <div 
          className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}
        />
        <span className="text-sm text-gray-300">
          {wsConnected ? 'Live Updates' : 'Polling Mode'}
        </span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">📊 Dashboard</h1>
          <p className="text-gray-400 text-sm mt-2">Track all uploaded documents</p>
        </div>
        <a
          href="/"
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          ← New Upload
        </a>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <input
          type="text"
          placeholder="🔍 Search by filename..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-blue-500 transition-colors"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-6 py-3 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-blue-500 transition-colors"
        >
          <option value="all">All Status</option>
          <option value="queued">⏳ Queued</option>
          <option value="parsing">📄 Parsing</option>
          <option value="extracting">⚙️ Processing</option>
          <option value="completed">✅ Complete</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading documents...</p>
        </div>
      )}

      {/* Documents List */}
      {!loading && (
        <div className="grid gap-4">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
              <p className="text-gray-400 text-lg">📭 No documents found</p>
              <p className="text-gray-500 text-sm mt-2">
                {docs.length === 0
                  ? "Start by uploading a document"
                  : "Try adjusting your filter"}
              </p>
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const statusStyle = getStatusStyle(doc.status);
              return (
                <div
                  key={doc.id}
                  className="p-5 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl flex flex-col md:flex-row md:justify-between md:items-center gap-4 hover:bg-white/15 transition-all duration-300"
                >
                  {/* Document Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📄</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{doc.filename}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium border ${statusStyle.badge} ${statusStyle.color}`}
                          >
                            {getStatusLabel(doc.status)}
                          </span>
                          <span className="text-xs text-gray-500">ID: {doc.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end">
                    {doc.status === "completed" && (
                      <button
                        onClick={() => handleDownload(doc.id, doc.filename)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        ⬇️ Download
                      </button>
                    )}
                    {doc.status !== "completed" && doc.status !== "parsing" && (
                      <button
                        onClick={() => handleRetry(doc.id)}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        🔄 Retry
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Stats Footer */}
      {!loading && docs.length > 0 && (
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-blue-500/20 rounded-lg">
            <p className="text-2xl font-bold text-blue-400">
              {docs.filter(d => d.status === "queued").length}
            </p>
            <p className="text-xs text-gray-400 mt-1">Queued</p>
          </div>
          <div className="p-4 bg-orange-500/20 rounded-lg">
            <p className="text-2xl font-bold text-orange-400">
              {docs.filter(d => d.status === "parsing").length}
            </p>
            <p className="text-xs text-gray-400 mt-1">Parsing</p>
          </div>
          <div className="p-4 bg-yellow-500/20 rounded-lg">
            <p className="text-2xl font-bold text-yellow-400">
              {docs.filter(d => d.status === "extracting").length}
            </p>
            <p className="text-xs text-gray-400 mt-1">Processing</p>
          </div>
          <div className="p-4 bg-green-500/20 rounded-lg">
            <p className="text-2xl font-bold text-green-400">
              {docs.filter(d => d.status === "completed").length}
            </p>
            <p className="text-xs text-gray-400 mt-1">Complete</p>
          </div>
        </div>
      )}
    </div>
  );
}