import { motion } from "framer-motion";
import { 
  Map, 
  Car, 
  AlertTriangle, 
  Globe2, 
  WifiOff, 
  LayoutDashboard 
} from "lucide-react";

const features = [
  {
    icon: Map,
    title: "Interactive Smart Maps",
    description: "Real-time routes, POIs, exits, and safe paths with live crowd density visualization",
    color: "primary" as const,
  },
  {
    icon: Car,
    title: "Smart Parking Assistant",
    description: "Live availability updates and save your vehicle location for easy retrieval",
    color: "secondary" as const,
  },
  {
    icon: AlertTriangle,
    title: "Emergency Access Layer",
    description: "One-tap SOS with instant location sharing to emergency responders",
    color: "accent" as const,
  },
  {
    icon: Globe2,
    title: "Multilingual & Inclusive",
    description: "Supports regional languages, voice guidance, and high-contrast accessibility UI",
    color: "primary" as const,
  },
  {
    icon: WifiOff,
    title: "Offline & Low-Bandwidth",
    description: "Works reliably in poor network conditions with smart data caching",
    color: "secondary" as const,
  },
  {
    icon: LayoutDashboard,
    title: "Admin Control Panel",
    description: "Manage maps, alerts, crowd flow, and safety zones from one dashboard",
    color: "accent" as const,
  },
];

const colorClasses = {
  primary: {
    bg: "bg-primary/10",
    icon: "text-primary",
    border: "hover:border-primary/30",
    glow: "group-hover:bg-primary/5",
  },
  secondary: {
    bg: "bg-secondary/10",
    icon: "text-secondary",
    border: "hover:border-secondary/30",
    glow: "group-hover:bg-secondary/5",
  },
  accent: {
    bg: "bg-accent/10",
    icon: "text-accent",
    border: "hover:border-accent/30",
    glow: "group-hover:bg-accent/5",
  },
};

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 lg:py-32 relative bg-muted/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      
      <div className="container mx-auto px-4 lg:px-8 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Core Features
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Everything You Need for{" "}
            <span className="gradient-text">Safe Events</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive tools for navigation, safety, and crowd management
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div
                className={`relative h-full glass rounded-2xl p-6 lg:p-8 border border-border/50 ${colorClasses[feature.color].border} transition-all duration-300`}
              >
                {/* Hover Glow */}
                <div className={`absolute inset-0 rounded-2xl ${colorClasses[feature.color].glow} transition-colors blur-xl opacity-0 group-hover:opacity-100`} />
                
                <div className="relative">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl ${colorClasses[feature.color].bg} flex items-center justify-center mb-5`}>
                    <feature.icon className={`w-7 h-7 ${colorClasses[feature.color].icon}`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
