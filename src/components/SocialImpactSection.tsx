import { motion } from "framer-motion";
import { Heart, Zap, Users2, Recycle } from "lucide-react";

const impacts = [
  {
    icon: Heart,
    title: "Reduces Crowd Accidents",
    description: "Smart routing prevents dangerous overcrowding",
  },
  {
    icon: Zap,
    title: "Faster Emergency Response",
    description: "Real-time coordination saves critical minutes",
  },
  {
    icon: Users2,
    title: "Empowers Communities",
    description: "Accessible design for elderly and vulnerable groups",
  },
  {
    icon: Recycle,
    title: "Reusable Infrastructure",
    description: "Deploy across cities and events seamlessly",
  },
];

export const SocialImpactSection = () => {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-primary opacity-5" />
      
      <div className="container mx-auto px-4 lg:px-8 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                Social Impact
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                Built for People.{" "}
                <span className="gradient-text">Designed for Safety.</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our platform goes beyond technology—it's a commitment to making
                public gatherings safer, more accessible, and stress-free for
                everyone, everywhere.
              </p>

              {/* Impact Grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                {impacts.map((impact, index) => (
                  <motion.div
                    key={impact.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-card/50 border border-border/50"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <impact.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm mb-1">
                        {impact.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {impact.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="relative aspect-square max-w-md mx-auto">
                {/* Outer Ring */}
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20 animate-spin" style={{ animationDuration: "30s" }} />
                
                {/* Middle Ring */}
                <div className="absolute inset-8 rounded-full border-2 border-dashed border-secondary/20 animate-spin" style={{ animationDuration: "20s", animationDirection: "reverse" }} />
                
                {/* Center */}
                <div className="absolute inset-16 rounded-full gradient-primary flex items-center justify-center shadow-glow">
                  <div className="text-center text-primary-foreground">
                    <div className="text-4xl font-bold">99%</div>
                    <div className="text-sm opacity-80">Safety Rate</div>
                  </div>
                </div>

                {/* Floating Stats */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-8 right-8 glass p-3 rounded-xl shadow-lg"
                >
                  <div className="text-lg font-bold text-foreground">50%</div>
                  <div className="text-xs text-muted-foreground">Faster Response</div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-12 left-4 glass p-3 rounded-xl shadow-lg"
                >
                  <div className="text-lg font-bold text-foreground">200+</div>
                  <div className="text-xs text-muted-foreground">Events Protected</div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
