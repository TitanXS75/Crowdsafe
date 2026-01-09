import { useState } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  Wifi,
  WifiOff,
  Download,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { AttendeeLayout } from "@/components/attendee/AttendeeLayout";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "hi", name: "Hindi", flag: "🇮🇳", nativeName: "हिन्दी" },
  { code: "bn", name: "Bengali", flag: "🇮🇳", nativeName: "বাংলা" },
  { code: "te", name: "Telugu", flag: "🇮🇳", nativeName: "తెలుగు" },
  { code: "mr", name: "Marathi", flag: "🇮🇳", nativeName: "మరాఠీ" },
  { code: "ta", name: "Tamil", flag: "🇮🇳", nativeName: "தமிழ்" },
  { code: "gu", name: "Gujarati", flag: "🇮🇳", nativeName: "ગુજરાતી" },
  { code: "kn", name: "Kannada", flag: "🇮🇳", nativeName: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", flag: "🇮🇳", nativeName: "മലയാളം" },
  { code: "pa", name: "Punjabi", flag: "🇮🇳", nativeName: "ਪੰਜਾਬੀ" },
];

// Text sizes removed per request

export const AttendeeSettings = () => {
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [offlineMode, setOfflineMode] = useState(() => {
    // Load offline mode preference from localStorage
    return localStorage.getItem("offlineMode") === "true";
  });
  const [mapDownloaded, setMapDownloaded] = useState(() => {
    // Check if map data is already cached
    return localStorage.getItem("mapDataCached") === "true";
  });
  const { toast } = useToast();

  const handleDownloadMap = async () => {
    try {
      const currentEvent = JSON.parse(localStorage.getItem("currentEvent") || "{}");

      if (!currentEvent || !currentEvent.id) {
        toast({
          title: "No Event Selected",
          description: "Please select an event first before downloading the map.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Downloading Map...",
        description: "Caching event data for offline use.",
      });

      // Simulate download progress
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Cache the event data for offline use
      const offlineData = {
        event: currentEvent,
        cachedAt: new Date().toISOString(),
        version: "1.0"
      };

      // Store in localStorage (for demo - in production, use IndexedDB for larger data)
      localStorage.setItem("offlineEventData", JSON.stringify(offlineData));
      localStorage.setItem("mapDataCached", "true");

      setMapDownloaded(true);
      toast({
        title: "Map Downloaded!",
        description: "You can now use the map offline for this event.",
      });
    } catch (error) {
      console.error("Error downloading map:", error);
      toast({
        title: "Download Failed",
        description: "Failed to cache map data. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Save offline mode preference
  const handleOfflineModeToggle = (checked: boolean) => {
    setOfflineMode(checked);
    localStorage.setItem("offlineMode", checked.toString());

    if (checked && !mapDownloaded) {
      toast({
        title: "Offline Mode Enabled",
        description: "Download the event map below to use it offline.",
      });
    }
  };

  const applyLanguage = (code: string) => {
    // Google Translate cookie method
    document.cookie = `googtrans=/en/${code}; path=/`;
    document.cookie = `googtrans=/en/${code}; domain=.${window.location.hostname}; path=/`;

    toast({
      title: "Language Switching...",
      description: `Switching to ${languages.find(l => l.code === code)?.name}...`,
    });

    // Refresh to apply
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <AttendeeLayout>
      <div className="space-y-6 pb-20 lg:pb-0 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Customize your experience
          </p>
        </motion.div>

        {/* Language */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Language
              </CardTitle>
              <CardDescription>Select your preferred language</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSelectedLanguage(lang.code);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-lg border transition-all text-center relative",
                      selectedLanguage === lang.code
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{lang.flag}</span>
                      <span className={cn(
                        "font-semibold",
                        selectedLanguage === lang.code ? "text-primary" : "text-foreground"
                      )}>
                        {lang.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{lang.nativeName}</span>
                  </button>
                ))}
              </div>

              <Button
                onClick={() => applyLanguage(selectedLanguage)}
                className="w-full mt-6 gradient-primary shadow-glow h-12"
              >
                Apply Language Change
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Translation Widget Placeholder - Hidden but functional */}
        <div id="google_translate_element" className="hidden" />

        {/* Offline Mode */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {offlineMode ? <WifiOff className="w-5 h-5 text-amber-500" /> : <Wifi className="w-5 h-5 text-primary" />}
                Offline Mode
              </CardTitle>
              <CardDescription>Work without internet connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Enable Offline Mode</p>
                  <p className="text-sm text-muted-foreground">Use downloaded map data</p>
                </div>
                <Switch checked={offlineMode} onCheckedChange={handleOfflineModeToggle} />
              </div>

              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Event Map</p>
                    <p className="text-sm text-muted-foreground">
                      {mapDownloaded ? "Downloaded • 12 MB" : "Download for offline use"}
                    </p>
                  </div>
                  <Button
                    variant={mapDownloaded ? "outline" : "default"}
                    size="sm"
                    onClick={handleDownloadMap}
                    disabled={mapDownloaded}
                    className="gap-2"
                  >
                    {mapDownloaded ? (
                      <>
                        <Check className="w-4 h-4" />
                        Downloaded
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {mapDownloaded && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Check className="w-4 h-4 text-secondary" />
                  Last updated: Today, 2:30 PM
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AttendeeLayout>
  );
};
