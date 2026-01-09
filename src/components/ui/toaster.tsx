import { useTheme } from "next-themes";
import { toast } from "sonner";

interface ToasterProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center";
  expand?: boolean;
  richColors?: boolean;
  closeButton?: boolean;
}

const Toaster = ({ 
  position = "top-right",
  expand = false,
  richColors = true,
  closeButton = true
}: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <div
      className="fixed z-50 flex flex-col gap-2 p-4 pointer-events-none"
      style={{
        top: position.includes("top") ? "0" : "auto",
        bottom: position.includes("bottom") ? "0" : "auto",
        left: position.includes("left") ? "0" : position.includes("center") ? "50%" : "auto",
        right: position.includes("right") ? "0" : "auto",
        transform: position.includes("center") ? "translateX(-50%)" : "none",
      }}
    />
  );
};

export { Toaster, toast };
