import { Layout } from "@/components/layout";
import { useChat } from "@/context/chat";
import { useLocation } from "wouter";
import { useRef, useState } from "react";
import { useExtractTextFromImage } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, User, Users, XCircle, Camera, Sparkles, Loader2, X, ChevronDown, ChevronUp } from "lucide-react";

const CONTEXT_OPTIONS = [
  { id: "one_sided", label: "One Sided", icon: User },
  { id: "already_dating", label: "Already Dating", icon: Heart },
  { id: "mutual_crush", label: "Mutual Crush", icon: Users },
  { id: "ex", label: "Ex", icon: XCircle },
] as const;

const CASE_TEMPLATES = ["Crush #1", "Situationship", "Ex files", "Mystery person"];

interface ImageEntry {
  dataUrl: string;
  mimeType: string;
}

export default function Home() {
  const {
    chatText, setChatText,
    relationshipContext, setRelationshipContext,
    caseName, setCaseName,
    backstory, setBackstory,
    isReadyToAnalyze,
  } = useChat();

  const [, setLocation] = useLocation();
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [showBackstory, setShowBackstory] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { mutate: ocr, isPending: ocrPending } = useExtractTextFromImage();

  const addImages = (files: FileList | null) => {
    if (!files) return;
    const toAdd = Array.from(files).slice(0, 3 - images.length);
    toAdd.forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setImages((prev) => prev.length < 3 ? [...prev, { dataUrl, mimeType: file.type }] : prev);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleExtractAll = () => {
    if (images.length === 0) return;
    const imagesData = images.map((img) => ({
      imageBase64: img.dataUrl.split(",")[1],
      mimeType: img.mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
    }));
    ocr(
      { data: { images: imagesData } },
      {
        onSuccess: (data) => {
          setChatText(chatText ? chatText + "\n\n" + data.extractedText : data.extractedText);
          setImages([]);
        },
      }
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addImages(e.dataTransfer.files);
  };

  return (
    <Layout showBack={false}>
      <div className="max-w-2xl mx-auto pt-10 md:pt-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6 ring-8 ring-primary/5">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4 leading-tight">
            They're confusing? <br />
            <span className="text-primary italic">I'm not.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            Paste or type the chat — or drop in a screenshot. I'll tell you exactly what's going on.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-6 md:p-8 space-y-7">
          {/* Step 1: Relationship context */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-xs font-bold">1</span>
              What's the situation?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {CONTEXT_OPTIONS.map((ctx) => (
                <button
                  key={ctx.id}
                  onClick={() => setRelationshipContext(ctx.id as any)}
                  className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl transition-all duration-200 border-2 ${
                    relationshipContext === ctx.id
                      ? "border-primary bg-primary/8 text-primary shadow-sm"
                      : "border-transparent bg-white/50 hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ctx.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{ctx.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Chat input */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-xs font-bold">2</span>
              Add the chat
            </label>

            {/* Textarea with inline camera icon */}
            <div
              className="relative group"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <Textarea
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder={"Them: hey\nYou: hey! how was your day\nThem: good. you?\n\nPaste or type the conversation..."}
                className="min-h-[160px] resize-none bg-white/50 dark:bg-black/20 border-white/20 focus:border-primary/40 text-sm placeholder:text-muted-foreground/40 rounded-2xl p-4 pr-12 pb-12 transition-all leading-relaxed"
              />
              {chatText && (
                <button
                  onClick={() => setChatText("")}
                  className="absolute right-3 top-3 p-1.5 rounded-lg bg-white/80 dark:bg-black/40 text-muted-foreground hover:text-foreground transition-all opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {/* Camera icon — bottom right of textarea */}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={images.length >= 3}
                className="absolute bottom-3 right-3 p-2 rounded-xl bg-white/80 dark:bg-black/40 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all disabled:opacity-30"
                title={images.length >= 3 ? "Max 3 screenshots" : "Add screenshot"}
              >
                <Camera className="w-4 h-4" />
                {images.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[9px] text-primary-foreground font-bold flex items-center justify-center">
                    {images.length}
                  </span>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => { addImages(e.target.files); e.target.value = ""; }}
              />
            </div>

            {/* Screenshot thumbnails */}
            {images.length > 0 && (
              <div className="flex items-start gap-2 flex-wrap">
                {images.map((img, i) => (
                  <div key={i} className="relative shrink-0">
                    <img
                      src={img.dataUrl}
                      alt={`Screenshot ${i + 1}`}
                      className="w-16 h-16 object-cover rounded-xl border border-primary/20 shadow-sm"
                    />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-foreground/80 text-background flex items-center justify-center hover:bg-foreground transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
                <Button
                  onClick={handleExtractAll}
                  disabled={ocrPending}
                  size="sm"
                  variant="outline"
                  className="rounded-xl self-center border-primary/30 hover:border-primary hover:bg-primary/5"
                >
                  {ocrPending ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Reading...</>
                  ) : (
                    <>Read {images.length > 1 ? `${images.length} screenshots` : "screenshot"}</>
                  )}
                </Button>
              </div>
            )}

            {/* Backstory toggle */}
            <button
              onClick={() => setShowBackstory((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              {showBackstory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showBackstory ? "Hide backstory" : "Add backstory (optional)"}
            </button>

            {showBackstory && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                <textarea
                  value={backstory}
                  onChange={(e) => setBackstory(e.target.value)}
                  placeholder="Who is this person? What's the history or context? (e.g. 'we matched 3 weeks ago, went on one date...')"
                  rows={3}
                  className="w-full text-sm bg-white/40 dark:bg-white/5 border border-border/40 focus:border-primary/40 rounded-2xl px-4 py-3 outline-none transition-all placeholder:text-muted-foreground/40 resize-none leading-relaxed"
                />
              </div>
            )}
          </div>

          {/* Step 3: Case name (optional) */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-xs font-bold">3</span>
              Name this case <span className="text-muted-foreground/50 font-normal">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CASE_TEMPLATES.map((t) => (
                <button
                  key={t}
                  onClick={() => setCaseName(caseName === t ? "" : t)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    caseName === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
              placeholder="or type your own..."
              className="w-full text-sm bg-white/40 dark:bg-white/5 border border-border/40 focus:border-primary/40 rounded-xl px-4 py-2.5 outline-none transition-all placeholder:text-muted-foreground/40"
            />
          </div>

          <Button
            onClick={() => setLocation("/analyze")}
            disabled={!isReadyToAnalyze}
            size="lg"
            className="w-full rounded-2xl h-14 text-base font-semibold shadow-md shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            Analyze <Sparkles className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </Layout>
  );
}
