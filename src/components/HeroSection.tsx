import { motion } from "framer-motion";
import { MapPin, Shield, Navigation } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

export const HeroSection = () => {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-50" />
      <div className="absolute inset-0 bg-map-lines" />

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />

      {/* Floating Elements */}
      <motion.div
        className="absolute top-32 left-[10%] hidden lg:block"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="glass p-4 rounded-2xl shadow-lg">
          <MapPin className="w-8 h-8 text-primary" />
        </div>
      </motion.div>

      <motion.div
        className="absolute top-48 right-[15%] hidden lg:block"
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <div className="glass p-4 rounded-2xl shadow-lg">
          <Shield className="w-8 h-8 text-secondary" />
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-40 left-[20%] hidden lg:block"
        animate={{ y: [0, -25, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <div className="glass p-4 rounded-2xl shadow-lg">
          <Navigation className="w-8 h-8 text-accent" />
        </div>
      </motion.div>

      {/* Content */}
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium text-foreground mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            Designed for Large-Scale Events
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-foreground mb-6"
          >
            Navigate Crowds.{" "}
            <span className="gradient-text">Stay Safe.</span>
            <br />
            <span className="text-muted-foreground text-3xl sm:text-4xl lg:text-5xl font-bold">
              Experience Events Without Stress.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            A real-time navigation, safety, and parking platform designed for
            festivals, religious gatherings, sports events, exhibitions, and
            civic assemblies worldwide.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/auth/attendee">
              <Button variant="hero" size="xl" className="w-full sm:w-auto">
                <MapPin className="w-5 h-5" />
                I Need Event Guidance
              </Button>
            </Link>
            <Link to="/auth/organizer">
              <Button variant="heroOutline" size="xl" className="w-full sm:w-auto">
                <Shield className="w-5 h-5" />
                Host / Create an Event
              </Button>
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 pt-8 border-t border-border/50"
          >
            <p className="text-sm text-muted-foreground mb-4">
              Trusted by event organizers worldwide
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
              <span className="text-sm text-muted-foreground">Designed for Modern Events</span>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <span className="text-sm text-muted-foreground">Real-time Crowd Safety</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
