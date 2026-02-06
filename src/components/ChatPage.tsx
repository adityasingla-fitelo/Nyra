"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Plus,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  FileText,
  MessageSquarePlus,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import {
  getChats,
  getMessages,
  saveMessage,
  createChat,
  deleteChat,
  updateChatTitle,
  getPersona,
  savePersona,
  type ChatRow,
  type MessageRow,
  type PersonaRow,
} from "@/lib/supabase";

interface ChatPageProps {
  user: any;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  onLogout: () => void;
}

/* ---------- STATIC FALLBACK ACTIONS ---------- */
const quickActions = [
  { icon: "🏋️", label: "Muscle Building", intent: "muscle_building" },
  { icon: "📝", label: "Track My Day", intent: "track_day" },
  { icon: "🍽️", label: "Get a Diet Plan", intent: "diet_plan" },
  { icon: "🔥", label: "Calorie Check", intent: "calorie_check" },
];

export default function ChatPage({
  user,
  darkMode,
  setDarkMode,
  onLogout,
}: ChatPageProps) {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ---------- 🔥 NEW: DYNAMIC ACTION BUTTONS ---------- */
  const [dynamicActions, setDynamicActions] = useState<
    { label: string; intent: string }[]
  >([]);
  const [followUps, setFollowUps] = useState<string[]>([]);

  const [isPlusDropdownOpen, setIsPlusDropdownOpen] = useState(false);
  const [displayedTexts, setDisplayedTexts] = useState<Map<string, string>>(
    new Map()
  );
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [persona, setPersona] = useState<PersonaRow | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const plusDropdownRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typewriterIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  /* ---------- LOAD INITIAL DATA ---------- */
  useEffect(() => {
    if (user) {
      loadChats();
      loadPersona();
    }
  }, [user]);

  useEffect(() => {
    if (currentChatId) {
      loadMessages();
    }
  }, [currentChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, displayedTexts]);


  // Typewriter effect logic:
  // 1. Cleanup on unmount ONLY
  useEffect(() => {
    return () => {
      typewriterIntervalsRef.current.forEach((interval) =>
        clearInterval(interval)
      );
      typewriterIntervalsRef.current.clear();
    };
  }, []);

  // 2. Start typing for new messages
  useEffect(() => {
    messages.forEach((msg) => {
      // Only start if:
      // a) It's an assistant message
      // b) It's NOT fully displayed yet
      // c) We aren't ALREADY typing it (check map)
      const isAssistant = msg.role === "assistant";
      const hasFullText = displayedTexts.get(msg.id) === msg.content;
      const isAlreadyTyping = typewriterIntervalsRef.current.has(msg.id);

      if (isAssistant && !hasFullText && !isAlreadyTyping) {
        // Initialize if not present
        if (!displayedTexts.has(msg.id)) {
          setDisplayedTexts((prev) => {
            const newMap = new Map(prev);
            newMap.set(msg.id, "");
            return newMap;
          });
        }

        const fullText = msg.content;
        const words = fullText.split(" ");
        let currentIndex = 0;

        // If we are resuming (e.g. strict mode double invoke), try to catch up?
        // For simplicity, start from 0 works because state is "" above. 
        // If state was partial, we would need to calc currentIndex.
        // Let's safe-guard: if we have partial text, find index.
        const currentText = displayedTexts.get(msg.id) || "";
        if (currentText) {
          const currentWords = currentText.split(" ");
          currentIndex = currentWords.length;
        }

        const interval = setInterval(() => {
          if (currentIndex < words.length) {
            setDisplayedTexts((prev) => {
              const newMap = new Map(prev);
              const nextText = words.slice(0, currentIndex + 1).join(" ");
              newMap.set(msg.id, nextText);
              return newMap;
            });
            currentIndex++;
          } else {
            clearInterval(interval);
            typewriterIntervalsRef.current.delete(msg.id);

            // Ensure exact match at end
            setDisplayedTexts((prev) => {
              const newMap = new Map(prev);
              newMap.set(msg.id, fullText);
              return newMap;
            });
          }
        }, 30); // Faster typing (30ms)

        typewriterIntervalsRef.current.set(msg.id, interval);
      }
    });
  }, [messages]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (plusDropdownRef.current && !plusDropdownRef.current.contains(target))
        setIsPlusDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadChats = async () => {
    try {
      const loadedChats = await getChats(user.id);
      setChats(loadedChats);
    } catch (error) {
      console.error("Failed to load chats:", error);
    }
  };

  const loadPersona = async () => {
    try {
      const loadedPersona = await getPersona(user.id);
      setPersona(loadedPersona);
    } catch (error) {
      console.error("Failed to load persona:", error);
    }
  };

  const loadMessages = async () => {
    if (!currentChatId) return;
    try {
      const loadedMessages = await getMessages(currentChatId);
      setMessages(loadedMessages);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const closeDropdowns = () => {
    setIsPlusDropdownOpen(false);
  };

  const openPhotoPicker = () => {
    closeDropdowns();
    photoInputRef.current?.click();
  };

  const openFilePicker = () => {
    closeDropdowns();
    fileInputRef.current?.click();
  };

  const handleSelectedFiles = (
    files: FileList | null,
    type: "photo" | "file"
  ) => {
    if (!files) return;
    console.log(
      `Selected ${files.length} ${type}(s):`,
      Array.from(files).map((f) => f.name)
    );
    // TODO: Implement file upload logic
  };

  const sendMessage = async (text?: string, intent?: string) => {
    const userMessage = text || inputMessage.trim();
    if (!userMessage) return;

    // Clear follow-ups and dropdowns
    setFollowUps([]);
    closeDropdowns();
    setInputMessage("");
    setLoading(true);

    try {
      // Create new chat if needed
      let chatId = currentChatId;
      if (!chatId) {
        const newChat = await createChat(user.id, userMessage.slice(0, 50));
        chatId = newChat.id;
        setCurrentChatId(chatId);
        setChats([newChat, ...chats]);
      }

      // Save user message
      const userMsg = await saveMessage({
        chat_id: chatId,
        user_id: user.id,
        role: "user",
        content: userMessage,
      });
      setMessages((prev) => [...prev, userMsg]);

      // Extract and update persona information from user message (runs in background)
      try {
        const extractResponse = await fetch("/api/extract-persona", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userMessage,
            userId: user.id,
          }),
        });

        const extractData = await extractResponse.json();

        if (!extractResponse.ok) {
          console.error("Extract persona failed:", extractData);
        } else {
          console.log("Persona extraction result:", {
            success: extractData.success,
            extractedFields: extractData.extractedFields,
            message: extractData.message,
          });
        }

        // Reload persona to reflect any updates
        const updatedPersona = await getPersona(user.id);
        setPersona(updatedPersona);
      } catch (error) {
        console.error("Failed to extract persona:", error);
        // Don't block chat flow if persona extraction fails
      }

      // Call chat API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.slice(-20).map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { role: "user", content: userMessage },
          ],
          persona: persona || undefined,
          intent: intent || undefined,
          userId: user.id, // CRITICAL: Always send userId for security validation
        }),
      });

      const data = await response.json();

      // Get bot reply and dynamic actions from API
      const botReply =
        data.reply || "hmm, kuch issue aa gaya. try again?";

      if (Array.isArray(data.actions)) {
        setDynamicActions(data.actions);
      } else {
        setDynamicActions([]);
      }

      if (Array.isArray(data.followUpQuestions)) {
        setFollowUps(data.followUpQuestions);
      } else {
        setFollowUps([]);
      }

      // Split bot reply by \n ONLY for casual responses
      // Structured content (headings, bullet points) should stay as ONE message

      // Check if this is structured content (diet plans, workout plans, etc.)
      const isStructuredContent = botReply.includes("##") ||
        botReply.includes("###") ||
        (botReply.includes("- ") && botReply.includes(":")) ||
        botReply.includes("**Day") ||
        botReply.includes("Breakfast") ||
        botReply.includes("Lunch") ||
        botReply.includes("Dinner");

      let messageParts: string[] = [];

      if (isStructuredContent) {
        // For structured content: save as ONE message, no splitting
        messageParts = [botReply];
      } else {
        // For casual responses: split by \n for natural multi-message feel
        messageParts = botReply
          .split("\n")
          .map((part: string) => part.trim())
          .filter((part: string) => part.length > 0); // Remove empty strings
      }

      // If no parts after filtering, save the original reply
      if (messageParts.length === 0) {
        const botMsg = await saveMessage({
          chat_id: chatId,
          user_id: user.id,
          role: "assistant",
          content: botReply,
        });
        setMessages((prev) => [...prev, botMsg]);
      } else {
        // Save each part as a separate message
        for (const part of messageParts) {
          const botMsg = await saveMessage({
            chat_id: chatId,
            user_id: user.id,
            role: "assistant",
            content: part,
          });
          setMessages((prev) => [...prev, botMsg]);
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (label: string, intent: string) => {
    sendMessage(label, intent);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setDisplayedTexts(new Map());
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-black flex flex-col relative transition-colors">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-[9] flex items-center justify-between min-h-14 py-2 px-3 sm:px-4 md:px-6 bg-white dark:bg-black/90 backdrop-blur-sm border-b border-stone-200 dark:border-gray-800 gap-3">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-10 h-10 rounded-full bg-stone-200 dark:bg-gray-700 flex items-center justify-center text-stone-700 dark:text-gray-300 hover:opacity-90 transition-opacity shrink-0"
          aria-label="Open menu"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <h1 className="flex-1 min-w-0 flex justify-center text-sm sm:text-base md:text-xl font-medium text-stone-800 dark:text-white truncate">
          Your health coach
        </h1>
        <button
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          className="relative w-14 h-8 rounded-full bg-stone-200 dark:bg-gray-700 shrink-0 flex items-center transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-black"
          aria-label={
            darkMode ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          <span
            className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white dark:bg-gray-600 shadow-md transition-transform duration-300 ease-out"
            style={{
              transform: darkMode ? "translateX(24px)" : "translateX(0)",
            }}
          />
          <span className="relative flex w-full justify-between items-center px-2 pointer-events-none">
            <Sun className="w-4 h-4 text-amber-500 dark:text-stone-500 transition-colors duration-300" />
            <Moon className="w-4 h-4 text-stone-500 dark:text-amber-400 transition-colors duration-300" />
          </span>
        </button>
      </header>

      {/* Sidebar */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 dark:bg-black/50 z-20"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden
          />
          <aside className="fixed left-0 top-0 bottom-0 w-20 bg-white dark:bg-black flex flex-col items-center py-4 z-30 border-r border-stone-200 dark:border-gray-800">
            <button
              onClick={() => setIsMenuOpen(false)}
              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-800 dark:text-white hover:opacity-90 transition-colors mb-6"
              aria-label="Close menu"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <nav className="flex-1 flex flex-col items-center gap-8 pt-2">
              <button
                onClick={startNewChat}
                className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                aria-label="New chat"
              >
                <MessageSquarePlus className="w-6 h-6" strokeWidth={1.5} />
                <span className="text-xs">New chat</span>
              </button>
            </nav>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                onLogout();
              }}
              className="flex flex-col items-center gap-2 text-stone-500 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white transition-colors mt-6"
              aria-label="Log out"
            >
              <LogOut className="w-6 h-6" strokeWidth={1.5} />
              <span className="text-xs">Logout</span>
            </button>
          </aside>
        </>
      )}

      {/* Hidden file inputs */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleSelectedFiles(e.target.files, "photo");
          e.target.value = "";
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          handleSelectedFiles(e.target.files, "file");
          e.target.value = "";
        }}
      />

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-3 sm:px-4 md:px-6 pt-20 pb-6 sm:pb-8">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-0">
            <h1 className="text-stone-800 dark:text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium mb-6 sm:mb-10 text-center px-2">
              What's the{" "}
              <span className="text-stone-600 dark:text-[#FF6B4A]">move</span>?
            </h1>

            <div className="w-full max-w-2xl mb-6 sm:mb-8 px-2 sm:px-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Chat here ....."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="w-full pl-11 sm:pl-12 pr-28 sm:pr-32 py-3 sm:py-4 bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-white rounded-full placeholder-stone-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-[#FF6B4A] border border-stone-200 dark:border-transparent"
                />
                <div
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  ref={plusDropdownRef}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlusDropdownOpen((o) => !o);
                    }}
                    className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-[#252525] text-stone-500 dark:text-gray-500 hover:text-stone-800 dark:hover:text-white transition-colors"
                    aria-label="Add attachments"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  {isPlusDropdownOpen && (
                    <div className="absolute left-0 bottom-full mb-2 w-44 sm:w-48 py-1 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-stone-200 dark:border-gray-800 z-50">
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm text-stone-800 dark:text-white hover:bg-stone-50 dark:hover:bg-[#252525] flex items-center gap-3"
                        onClick={openPhotoPicker}
                      >
                        <ImageIcon className="w-4 h-4 text-stone-500 dark:text-gray-400" />
                        Add photos
                      </button>
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm text-stone-800 dark:text-white hover:bg-stone-50 dark:hover:bg-[#252525] flex items-center gap-3"
                        onClick={openFilePicker}
                      >
                        <FileText className="w-4 h-4 text-stone-500 dark:text-gray-400" />
                        Add files
                      </button>
                    </div>
                  )}
                </div>
                <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => sendMessage()}
                    disabled={loading}
                    className="text-stone-600 dark:text-[#FF6B4A] hover:text-stone-800 dark:hover:text-[#ff5a39] transition-colors disabled:opacity-50"
                    aria-label="Send"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-center text-[13px] sm:text-sm font-medium text-stone-600 dark:text-gray-400 font-manrope">
                Nyra remembers your conversation
              </p>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center px-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.label, action.intent)}
                  className="px-3 sm:px-4 py-2 bg-white dark:bg-[#1a1a1a] text-stone-600 dark:text-[#FF6B4A] rounded-full text-sm hover:bg-stone-100 dark:hover:bg-[#252525] transition-colors flex items-center gap-2 border border-stone-200 dark:border-transparent"
                >
                  <span>{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {messages.map((msg, index) => {
                const displayedText =
                  msg.role === "assistant"
                    ? displayedTexts.get(msg.id) ?? msg.content
                    : msg.content;

                const isTyping =
                  msg.role === "assistant" &&
                  displayedTexts.get(msg.id) !== msg.content;

                return (
                  <div
                    key={`${msg.id}-${index}`}
                    className={`flex ${msg.role === "assistant"
                      ? "justify-start"
                      : "justify-end"
                      }`}
                  >
                    <div
                      className={`max-w-[90%] sm:max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-2xl shadow-sm border ${msg.role === "assistant"
                        ? "bg-white dark:bg-[#1a1a1a] text-stone-800 dark:text-white border-stone-200 dark:border-gray-700"
                        : "bg-stone-200 dark:bg-[#FF6B4A] text-stone-900 dark:text-white border-stone-300 dark:border-[#ff5a39]"
                        }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="nyra-markdown break-words">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {displayedText}
                          </ReactMarkdown>
                          {isTyping && (
                            <span className="inline-block w-0.5 h-4 bg-stone-600 dark:bg-gray-400 ml-1 animate-pulse" />
                          )}
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap break-words">
                          {displayedText}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[90%] sm:max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-2xl bg-white dark:bg-[#1a1a1a] text-stone-800 dark:text-white border border-stone-200 dark:border-gray-700 flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-stone-400 dark:bg-gray-500 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-stone-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                      <span className="w-2 h-2 bg-stone-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                    <span className="text-stone-500 dark:text-gray-400 text-sm">
                      Nyra is typing
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Follow-up Suggestions */}
            {followUps.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 px-1 mb-2 no-scrollbar scroll-smooth">
                {followUps.map((text, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(text)}
                    className="flex-shrink-0 px-3 py-1.5 bg-stone-100 dark:bg-[#1a1a1a] text-stone-600 dark:text-stone-300 text-sm rounded-full border border-stone-200 dark:border-gray-800 hover:bg-stone-200 dark:hover:bg-[#252525] hover:text-stone-900 dark:hover:text-white transition-colors"
                  >
                    {text}
                  </button>
                ))}
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                placeholder="Chat here ....."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full pl-11 sm:pl-12 pr-28 sm:pr-32 py-3 sm:py-4 bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-white rounded-full placeholder-stone-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-[#FF6B4A] border border-stone-200 dark:border-transparent"
              />
              <div
                className="absolute left-4 top-1/2 -translate-y-1/2"
                ref={plusDropdownRef}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsPlusDropdownOpen((o) => !o);
                  }}
                  className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-[#252525] text-stone-500 dark:text-gray-500 hover:text-stone-800 dark:hover:text-white transition-colors"
                  aria-label="Add attachments"
                >
                  <Plus className="w-5 h-5" />
                </button>
                {isPlusDropdownOpen && (
                  <div className="absolute left-0 bottom-full mb-2 w-44 sm:w-48 py-1 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-stone-200 dark:border-gray-800 z-50">
                    <button
                      type="button"
                      className="w-full px-4 py-2.5 text-left text-sm text-stone-800 dark:text-white hover:bg-stone-50 dark:hover:bg-[#252525] flex items-center gap-3"
                      onClick={openPhotoPicker}
                    >
                      <ImageIcon className="w-4 h-4 text-stone-500 dark:text-gray-400" />
                      Add photos
                    </button>
                    <button
                      type="button"
                      className="w-full px-4 py-2.5 text-left text-sm text-stone-800 dark:text-white hover:bg-stone-50 dark:hover:bg-[#252525] flex items-center gap-3"
                      onClick={openFilePicker}
                    >
                      <FileText className="w-4 h-4 text-stone-500 dark:text-gray-400" />
                      Add files
                    </button>
                  </div>
                )}
              </div>
              <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => sendMessage()}
                  disabled={loading}
                  className="text-stone-600 dark:text-[#FF6B4A] hover:text-stone-800 dark:hover:text-[#ff5a39] transition-colors disabled:opacity-50"
                  aria-label="Send"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="mt-2 text-center text-[13px] sm:text-sm font-medium text-stone-600 dark:text-gray-400 font-manrope">
              Nyra remembers your conversation
            </p>
          </>
        )}
      </div>
    </div>
  );
}
