import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Loader2, Send, MessageCircle, Bot, User, AlertTriangle, Lightbulb, CheckCircle2, Mic, MicOff, Volume2
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { useCoachReminders } from "@/hooks/useCoachReminders";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Coach = () => {
  const navigate = useNavigate();
  const { user, session, loading: authLoading } = useAuth();
  const { updateLastCoachSession, requestPushPermission } = useCoachReminders(user?.id);
  const [healthProfile, setHealthProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI nutrition coach. I can help you with meal suggestions, answer nutrition questions, and provide personalized advice based on your health profile. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [wasVoiceInput, setWasVoiceInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from("health_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        
        setHealthProfile(data);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const playVoiceResponse = (text: string) => {
    if (!('speechSynthesis' in window)) {
      toast({
        title: "Not Supported",
        description: "Text-to-speech is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    setIsPlayingAudio(true);
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to get a natural-sounding voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      voice => voice.lang.startsWith('en') && voice.name.includes('Google')
    ) || voices.find(voice => voice.lang.startsWith('en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => {
      setIsPlayingAudio(false);
      toast({
        title: "Voice playback error",
        description: "Could not play the voice response.",
        variant: "destructive",
      });
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const toggleVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Not Supported",
        description: "Voice recognition is not supported in your browser. Please use Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    if (isRecording) {
      // Stop recording
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        setWasVoiceInput(true); // Mark that this will be a voice input
        toast({
          title: "Listening...",
          description: "Speak now. I'm listening to your question.",
        });
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setWasVoiceInput(false);
        toast({
          title: "Error",
          description: "Could not recognize speech. Please try again.",
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = { role: "user", content: input };
    const shouldPlayVoice = wasVoiceInput; // Capture before reset
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    setWasVoiceInput(false); // Reset for next message

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-meal-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ 
            healthProfile: { ...healthProfile, message: input }, 
            type: "coach" 
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";

      if (!reader) throw new Error("No response body");

      // Add empty assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantContent,
                };
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Play voice response if user sent a voice message
      if (shouldPlayVoice && assistantContent) {
        playVoiceResponse(assistantContent);
      }

      // Update last coach session timestamp
      updateLastCoachSession();
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to get response. Please try again.",
        variant: "destructive",
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Request push notification permission on mount
  useEffect(() => {
    if (user) {
      requestPushPermission();
    }
  }, [user, requestPushPermission]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-8">
        <div className="container mx-auto px-4 max-w-3xl h-full flex flex-col">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary font-medium text-sm mb-3">
              <MessageCircle className="w-4 h-4" />
              AI Nutrition Coach
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Chat with Your Coach
            </h1>
          </div>

          {/* Chat Container */}
          <Card className="flex-1 border-border/50 shadow-lg flex flex-col min-h-[500px]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted/50 text-foreground rounded-tl-sm border border-border/50"
                    }`}
                  >
                    {message.role === "user" ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <div>
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown
                            components={{
                              h1: ({ children }) => (
                                <h1 className="text-lg font-bold text-foreground mt-3 mb-2 first:mt-0">{children}</h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-base font-semibold text-foreground mt-3 mb-2 flex items-center gap-2">
                                  <Lightbulb className="w-4 h-4 text-primary" />
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-sm font-semibold text-foreground mt-2 mb-1">{children}</h3>
                              ),
                              p: ({ children }) => {
                                const text = String(children);
                                if (text.includes("IMPORTANT") || text.includes("⚠") || text.includes("🚨")) {
                                  return (
                                    <div className="my-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-2">
                                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                      <span className="text-sm text-foreground/90">{children}</span>
                                    </div>
                                  );
                                }
                                return <p className="text-foreground/80 leading-relaxed my-2 first:mt-0 last:mb-0">{children}</p>;
                              },
                              ul: ({ children }) => (
                                <ul className="space-y-1.5 my-2">{children}</ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="space-y-1.5 my-2 list-none">{children}</ol>
                              ),
                              li: ({ children, ...props }) => {
                                const index = props.node?.position?.start?.line;
                                return (
                                  <li className="flex items-start gap-2 text-foreground/80">
                                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-medium mt-0.5">
                                      {typeof index === 'number' ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                    </span>
                                    <span className="leading-relaxed">{children}</span>
                                  </li>
                                );
                              },
                              strong: ({ children }) => (
                                <strong className="font-semibold text-foreground">{children}</strong>
                              ),
                              em: ({ children }) => (
                                <em className="text-muted-foreground">{children}</em>
                              ),
                              code: ({ children }) => (
                                <code className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs font-mono">{children}</code>
                              ),
                              hr: () => <hr className="my-3 border-border/50" />,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                        {message.content && (
                          <button
                            onClick={() => playVoiceResponse(message.content)}
                            disabled={isPlayingAudio}
                            className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                          >
                            <Volume2 className={`w-3 h-3 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                            {isPlayingAudio ? 'Playing...' : 'Listen'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm p-4">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask me anything about nutrition..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  disabled={isTyping || isRecording}
                  className="flex-1"
                />
                <Button 
                  onClick={toggleVoiceRecording}
                  variant={isRecording ? "destructive" : "outline"}
                  size="icon"
                  disabled={isTyping}
                  className="shrink-0"
                >
                  {isRecording ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
                <Button 
                  onClick={sendMessage} 
                  disabled={isTyping || !input.trim()}
                  className="gap-2"
                >
                  {isTyping ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                AI responses are for informational purposes. Consult a healthcare professional for medical advice.
              </p>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Coach;
