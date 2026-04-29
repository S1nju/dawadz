"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import axiosClient from "@/lib/axios-client"
import axios from "axios"
import ReactMarkdown from "react-markdown"

type Message = {
    id: number
    role: "user" | "assistant"
    content: string
}

const WELCOME: Message = {
    id: 0,
    role: "assistant",
    content: "ask me about illnesses",
}

const sanitizeAssistantReply = (value: string): string => {
    return value.replace(/^\s*direct\s*answer\s*[:\-]?\s*/i, "").trim()
}

export function ChatbotWidget() {
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([WELCOME])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Scroll to bottom whenever messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // Focus input when chat opens
    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 100)
    }, [open])

    const sendMessage = useCallback(async () => {
        const text = input.trim()
        if (!text || loading) return

        const userMsg: Message = { id: Date.now(), role: "user", content: text }
        setMessages(prev => [...prev, userMsg])
        setInput("")
        setLoading(true)

        try {
            // Try a /chatbot or /ai/chat endpoint; fall back to a stub if not available
            const res = await axios.post("https://operation-carol-overcrowd.ngrok-free.dev/chat", { message: text })
            const reply = res.data?.reply ?? res.data?.message ?? res.data?.response ?? ""
            const assistantMsg: Message = {
                id: Date.now() + 1,
                role: "assistant",
                content: sanitizeAssistantReply(reply || "I received your message but couldn't generate a response."),
            }
            setMessages(prev => [...prev, assistantMsg])
        } catch {
            // Graceful stub response when no chatbot endpoint exists yet
            const assistantMsg: Message = {
                id: Date.now() + 1,
                role: "assistant",
                content: "I'm not fully connected yet. Please contact support or check back later.",
            }
            setMessages(prev => [...prev, assistantMsg])
        } finally {
            setLoading(false)
        }
    }, [input, loading])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    return (
        <>
            {/* Chat panel */}
            <div
                className={cn(
                    "fixed bottom-20 right-4 z-50 w-[clamp(300px,90vw,380px)] rounded-2xl border bg-background shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right",
                    open
                        ? "scale-100 opacity-100 pointer-events-auto"
                        : "scale-90 opacity-0 pointer-events-none"
                )}
                style={{ height: "520px" }}
            >
                {/* Header */}
                <div className="flex items-center gap-2.5 px-4 py-3 border-b bg-primary text-primary-foreground rounded-t-2xl">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary-foreground/20">
                        <Bot className="size-4" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold leading-none">DawaDz Assistant</p>
                        <p className="text-xs opacity-70 mt-0.5">Ask about meds, pharmacies & orders</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-primary-foreground hover:bg-primary-foreground/20 -mr-1"
                        onClick={() => setOpen(false)}
                    >
                        <X className="size-4" />
                    </Button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
                    {messages.map(msg => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex gap-2 items-end",
                                msg.role === "user" ? "flex-row-reverse" : "flex-row"
                            )}
                        >
                            {/* Avatar */}
                            <div className={cn(
                                "flex size-6 shrink-0 items-center justify-center rounded-full text-xs",
                                msg.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                            )}>
                                {msg.role === "user" ? <User className="size-3" /> : <Bot className="size-3" />}
                            </div>

                            {/* Bubble */}
                            <div className={cn(
                                "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                                msg.role === "user"
                                    ? "bg-primary text-primary-foreground rounded-br-sm"
                                    : "bg-muted text-foreground rounded-bl-sm prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0"
                            )}>
                                {msg.role === "assistant" ? (
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                ) : (
                                    msg.content
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {loading && (
                        <div className="flex gap-2 items-end">
                            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
                                <Bot className="size-3 text-muted-foreground" />
                            </div>
                            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                                <div className="flex gap-1 items-center">
                                    <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                                    <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                                    <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t flex gap-2">
                    <Input
                        ref={inputRef}
                        placeholder="Type a message..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                        className="flex-1 h-9 text-sm"
                    />
                    <Button
                        size="icon"
                        className="size-9 shrink-0"
                        onClick={sendMessage}
                        disabled={!input.trim() || loading}
                    >
                        {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    </Button>
                </div>
            </div>

            {/* Floating trigger button */}
            <button
                onClick={() => setOpen(o => !o)}
                className={cn(
                    "fixed bottom-4 right-4 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 active:scale-95 transition-all duration-200",
                    open && "rotate-90"
                )}
                aria-label="Open chatbot"
            >
                {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
            </button>
        </>
    )
}