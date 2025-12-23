"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Send, Bot, User, Coins, Clock, Loader2,
  ChevronLeft, Settings, Maximize2, Minimize2, AlertCircle
} from "lucide-react";
import { executeRun } from "../actions";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  usage?: {
    tokensIn: number;
    tokensOut: number;
    toolCalls: number;
    creditsDebited: number;
  };
  error?: string;
}

export default function RunConsolePage() {
  const params = useParams();
  const instanceId = params.instanceId as string;
  const channel = params.channel as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [totalCredits, setTotalCredits] = useState(0);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [instanceName] = useState("Agent");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");

    startTransition(async () => {
      const conversationMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      conversationMessages.push({ role: "user", content: currentInput });

      const result = await executeRun({
        instanceId,
        query: currentInput,
        messages: conversationMessages,
      });

      if (result.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result.text || "No response received.",
          timestamp: new Date().toISOString(),
          usage: result.usage
            ? {
                tokensIn: result.usage.tokensIn,
                tokensOut: result.usage.tokensOut,
                toolCalls: result.usage.toolCalls,
                creditsDebited: result.billing?.debited || 0,
              }
            : undefined,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setTotalCredits((prev) => prev + (result.billing?.debited || 0));
        if (result.billing?.balance !== undefined) {
          setCurrentBalance(result.billing.balance);
        }
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "system",
          content: result.error || "An error occurred.",
          timestamp: new Date().toISOString(),
          error: result.error,
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    });
  };

  return (
    <div className={`min-h-screen bg-neutral-50 flex flex-col ${isFullscreen ? "fixed inset-0 z-50" : ""}`}>
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/${channel}/account/instances`} className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700">
                <ChevronLeft className="h-4 w-4" />Back
              </Link>
              <div className="h-6 w-px bg-neutral-200" />
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <h1 className="font-semibold text-neutral-900">{instanceName}</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Coins className="h-4 w-4 text-amber-500" />
                <span className="font-medium">{totalCredits} credits used</span>
                {currentBalance !== null && (
                  <span className="text-neutral-400">({currentBalance} remaining)</span>
                )}
              </div>
              <button onClick={() => setIsFullscreen(!isFullscreen)} className="rounded-lg p-2 hover:bg-neutral-100">
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <Link href={`/${channel}/account/instances/${instanceId}`} className="rounded-lg p-2 hover:bg-neutral-100">
                <Settings className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-neutral-900">Run Agent</h2>
              <p className="mt-2 text-sm text-neutral-500 max-w-sm mx-auto">
                Start a conversation to interact with this agent. Each message will use credits based on complexity.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role !== "user" && (
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.error ? "bg-red-100" : "bg-gradient-to-br from-violet-500 to-purple-600"}`}>
                      {msg.error ? <AlertCircle className="h-4 w-4 text-red-600" /> : <Bot className="h-4 w-4 text-white" />}
                    </div>
                  )}
                  <div className={`flex-1 max-w-lg ${msg.role === "user" ? "text-right" : ""}`}>
                    <div className={`inline-block rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-violet-600 text-white" : msg.error ? "bg-red-50 border border-red-200 text-red-800" : "bg-white border border-neutral-200"}`}>
                      <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
                      <Clock className="h-3 w-3" />
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      {msg.usage && (
                        <>
                          <span>|</span>
                          <Coins className="h-3 w-3 text-amber-500" />
                          <span>{msg.usage.creditsDebited} credits</span>
                        </>
                      )}
                    </div>
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200">
                      <User className="h-4 w-4 text-neutral-600" />
                    </div>
                  )}
                </div>
              ))}
              {isPending && (
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <Loader2 className="h-4 w-4 animate-spin" />Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              disabled={isPending}
            />
            <button
              type="submit"
              disabled={!input.trim() || isPending}
              className="flex items-center justify-center rounded-xl bg-violet-600 px-4 py-3 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
          <p className="mt-2 text-center text-xs text-neutral-400">
            Messages are processed using your credit balance
          </p>
        </div>
      </div>
    </div>
  );
}
