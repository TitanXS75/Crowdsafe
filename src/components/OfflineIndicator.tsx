import { WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export const OfflineIndicator = () => {
    const isOnline = useNetworkStatus();

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-destructive text-destructive-foreground rounded-full text-xs font-medium"
                >
                    <WifiOff className="w-3 h-3" />
                    <span className="hidden sm:inline">Offline</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
