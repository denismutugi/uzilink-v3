import React, { useState, useEffect, useRef } from "react";
import { api } from "../lib/api.js";
import { ChatThread, DirectMessage, UserProfile } from "../types.js";
import { MessageSquare, Send, Calendar, RefreshCw, UserCheck } from "lucide-react";
import { motion } from "motion/react";

interface InboxViewProps {
  user: UserProfile;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  partnerIdPreset: string | null;
  partnerNamePreset: string | null;
  listingIdPreset: string | null;
  onClearPreset: () => void;
}

export const InboxView: React.FC<InboxViewProps> = ({ 
  user, 
  showToast, 
  partnerIdPreset, 
  partnerNamePreset, 
  listingIdPreset,
  onClearPreset
}) => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(partnerIdPreset);
  const [selectedPartnerName, setSelectedPartnerName] = useState<string | null>(partnerNamePreset);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadThreads = async () => {
    setLoading(true);
    try {
      const response = await api.getThreads();
      setThreads(response.threads);
      
      // If we have a preset incoming thread from a buyer action
      if (partnerIdPreset) {
        setSelectedPartnerId(partnerIdPreset);
        setSelectedPartnerName(partnerNamePreset);
        const detailRes = await api.getThread(partnerIdPreset);
        setMessages(detailRes.messages);
      }
    } catch (e) {
      showToast("Could not load direct message threads.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, [partnerIdPreset]);

  // Handle active thread polling/switch
  const loadActiveThread = async (id: string, name: string) => {
    setSelectedPartnerId(id);
    setSelectedPartnerName(name);
    // clear preset
    onClearPreset();
    try {
      const response = await api.getThread(id);
      setMessages(response.messages);
    } catch (e) {
      showToast("Failed to pull message history.", "error");
    }
  };

  useEffect(() => {
    if (selectedPartnerId) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSendMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerId || !currentMessage.trim()) return;
    setSending(true);

    try {
      const payload: any = {
        receiverId: selectedPartnerId,
        content: currentMessage.trim()
      };
      if (listingIdPreset) {
        payload.listingId = listingIdPreset;
      }

      await api.sendMessage(payload);
      
      // Refresh current thread immediately
      const detailRes = await api.getThread(selectedPartnerId);
      setMessages(detailRes.messages);
      
      // update text input
      setCurrentMessage("");
      
      // update threads listing
      const rThreads = await api.getThreads();
      setThreads(rThreads.threads);
    } catch (err: any) {
      showToast(err.message || "Failed to dispatch message", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl h-[620px] flex overflow-hidden shadow-2xl relative" id="inbox-panel">
      {/* List of active threads (Left Rail) */}
      <div className="w-[280px] border-r border-slate-800 flex flex-col justify-between" id="inbox-threads-rail">
        <div className="p-4.5 border-b border-slate-800 flex justify-between items-center bg-slate-950/45">
          <span className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-teal-400" />
            Nego Discussions
          </span>
          <button
            onClick={loadThreads}
            title="Reload Chats"
            className="text-slate-500 hover:text-white p-0.5 rounded transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto space-y-1 p-2 bg-slate-950/20">
          {threads.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-xs">No active chats in your inbox. Contact a seller to discuss!</div>
          ) : (
            threads.map((t) => {
              const matchesActive = selectedPartnerId === t.partnerId;
              return (
                <button
                  key={t.partnerId}
                  onClick={() => loadActiveThread(t.partnerId, t.partnerName)}
                  className={`w-full text-left p-3 rounded-xl flex flex-col justify-between transition cursor-pointer ${
                    matchesActive ? "bg-slate-800 text-white" : "hover:bg-slate-850/60 text-slate-400"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-xs text-slate-200 truncate pr-2 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                      {t.partnerName}
                    </span>
                    <span className="text-[8px] text-slate-500 font-normal shrink-0">
                      {new Date(t.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-1 leading-relaxed">
                    {t.lastMessage.content}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Direct conversation details panel (Right view) */}
      <div className="flex-1 flex flex-col justify-between bg-slate-950/10" id="inbox-thread-stage">
        {selectedPartnerId ? (
          <>
            {/* Header detail */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/45">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 uppercase">
                  Negotiating chat with: {selectedPartnerName}
                </h3>
                <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">UziLink secure encrypted communications pipeline</span>
              </div>
            </div>

            {/* Message Body timeline */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((m) => {
                const belongsToMe = m.senderId === user.id;
                return (
                  <div key={m.id} className={`flex flex-col ${belongsToMe ? "items-end" : "items-start"}`}>
                    <div className={`p-4 rounded-2xl text-xs max-w-md ${
                      belongsToMe 
                        ? "bg-gradient-to-r from-teal-500/90 to-blue-600/90 text-white rounded-br-none shadow-sm" 
                        : "bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/55"
                    }`}>
                      <p className="leading-relaxed font-semibold">{m.content}</p>
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1 uppercase font-normal tracking-wide">
                      {belongsToMe ? "You" : m.senderName} • {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input form */}
            <form onSubmit={handleSendMessageSubmit} className="p-4 border-t border-slate-800 flex gap-2.5 bg-slate-950/40">
              <input
                type="text"
                required
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Type your message terms and click send..."
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-teal-400 text-slate-200 text-xs px-4 py-3 rounded-xl outline-none"
              />
              <button
                type="submit"
                disabled={sending || !currentMessage.trim()}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-3 rounded-xl transition flex items-center justify-center cursor-pointer disabled:opacity-40"
              >
                <Send className="w-4.5 h-4.5 text-slate-950" />
              </button>
            </form>
          </>
        ) : (
          /* Placeholder */
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center space-y-4">
            <MessageSquare className="w-12 h-12 text-slate-700" />
            <div>
              <h4 className="text-slate-300 font-bold text-sm">No Thread Selected</h4>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed mt-1">Select an item from the conversations rail, or submit a quotation on an open textile scrap batch to start discussion.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
