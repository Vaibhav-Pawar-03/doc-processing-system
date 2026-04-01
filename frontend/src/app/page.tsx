"use client";

import { useEffect, useState, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";

//  ONLY CHANGE in Railway backend
const API_BASE_URL = "https://doc-processing-system-production.up.railway.app";
const WS_URL = "wss://doc-processing-system-production.up.railway.app";

//  STATUS 
const STATUS_CONFIG = {
  queued: { percentage: 20, message: "Waiting in queue ⏳", color: "bg-blue-500" },
  parsing: { percentage: 50, message: "Reading file 📄", color: "bg-orange-500" },
  extracting: { percentage: 80, message: "Extracting data ⚙️", color: "bg-yellow-500" },
  completed: { percentage: 100, message: "Processing complete ✅", color: "bg-green-500" },
};

export default function Home() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const [wsRef, setWsRef] = useState<WebSocket | null>(null);
  const [currentDocId, setCurrentDocId] = useState<number | null>(null);

  const getStatusInfo = useCallback((stat: string) => {
    return (
      STATUS_CONFIG[stat as keyof typeof STATUS_CONFIG] || {
        percentage: 0,
        message: "",
        color: "bg-gray-500",
      }
    );
  }, []);

  //  ONLY CHANGE in WebSocket URL
  useEffect(() => {
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWebSocket = () => {
      const ws = new WebSocket(`${WS_URL}/ws`);

      ws.onopen = () => {
        setWsConnected(true);
        reconnectAttempts = 0;
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.status) {
          const normalized = data.status.toLowerCase().trim();
          setStatus(normalized);
        }
      };

      ws.onerror = () => setWsConnected(false);

      ws.onclose = () => {
        setWsConnected(false);
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          reconnectTimeout = setTimeout(connectWebSocket, 2000);
        }
      };

      setWsRef(ws);
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      wsRef?.close();
    };
  }, []);

  //  API URL
  const handleUpload = useCallback(async () => {
    if (!files || files.length === 0) {
      toast.error("Please select a file");
      return;
    }

    setLoading(true);
    setStatus("queued");

    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);

        const res = await fetch(`${API_BASE_URL}/upload`, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        setCurrentDocId(data.id);
        setFileUrl(data.file_url);
        setFileName(data.filename);

        startStatusPolling(data.id);
      }

      toast.success("✅ Files uploaded successfully!");
    } catch (err) {
      toast.error("❌ Upload failed");
    }

    setLoading(false);
  }, [files]);

  // ❌ NO CHANGE (your logic kept same)
  const startStatusPolling = useCallback((docId: number) => {
    const interval = setInterval(async () => {
      const res = await fetch(`${API_BASE_URL}/status/${docId}`);
      const data = await res.json();
      const newStatus = data.status?.toLowerCase().trim();
      setStatus(newStatus);

      if (newStatus === "completed") {
        clearInterval(interval);
      }
    }, 2000);
  }, []);

  const handleDownload = useCallback(() => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.click();
  }, [fileUrl, fileName]);

  const statusInfo = getStatusInfo(status);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black px-4">
      <Toaster />

      {/* SAME UI */}
      <div className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 border border-gray-700">
        <div
          className={`w-3 h-3 rounded-full ${
            wsConnected ? "bg-green-500" : "bg-red-500"
          } animate-pulse`}
        />
        <span className="text-sm text-gray-300">
          {wsConnected ? "Connected" : "Connecting..."}
        </span>
      </div>

      <h1 className="absolute top-6 left-6 text-gray-400 text-lg font-semibold">
        📄 Document Processing System
      </h1>

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 text-center">
        <p className="text-gray-300 text-sm mb-6">
          Upload documents and track processing in real-time
        </p>

        <input
          type="file"
          multiple
          onChange={(e) => setFiles(e.target.files)}
          disabled={loading}
          className="mb-5 w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer disabled:opacity-50"
        />

        <button
          onClick={handleUpload}
          disabled={loading || !files}
          className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
        >
          {loading ? "Processing..." : "🚀 Upload Files"}
        </button>

        {/* STATUS */}
        {status && (
          <div className="mt-6 text-center p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-gray-400 text-xs uppercase tracking-wider">
              Status
            </p>
            <p className="text-xl font-bold text-white mt-2">
              {status.toUpperCase()}
            </p>
            <p className="text-sm text-gray-300 mt-2">
              {statusInfo.message}
            </p>

            {/* ONLY FIXED THIS LINE */}
            <div className="mt-3 w-full bg-gray-700 rounded-full h-2">
              <div
                className={`${statusInfo.color} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${statusInfo.percentage}%` }}
              />
            </div>

            <p className="text-xs text-gray-400 mt-2">
              {statusInfo.percentage}%
            </p>
          </div>
        )}

        {fileName && (
          <p className="mt-4 text-sm text-gray-300 truncate">
            📄 {fileName}
          </p>
        )}

        {fileUrl && status === "completed" && (
          <button
            onClick={handleDownload}
            className="mt-6 w-full py-3 text-lg font-semibold bg-green-600 hover:bg-green-700 rounded-xl transition-all duration-300 hover:scale-105"
          >
            ⬇️ Download File
          </button>
        )}
      </div>
    </div>
  );
}
