import { motion } from "framer-motion";
import { MapPin, Shield, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

export const CTASection = () => {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-primary opacity-90" />
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      
      {/* Floating Elements */}
      <motion.div
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-[10%] w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm hidden lg:block"
      />
      <motion.div
        animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-20 right-[15%] w-32 h-32 rounded-full bg-white/5 backdrop-blur-sm hidden lg:block"
      />

      <div className="container mx-auto px-4 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            Make Large Events Safer,
            <br />
            Smarter, and Stress-Free
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            Join thousands of attendees and organizers who trust CrowdSafe for
            seamless event navigation and safety management.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth?mode=signup&role=attendee">
              <Button
                size="xl"
                className="w-full sm:w-auto bg-card text-foreground hover:bg-card/90 shadow-xl hover:shadow-2xl"
              >
                <MapPin className="w-5 h-5" />
                Start as Attendee
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/auth?mode=signup&role=organizer">
              <Button
                variant="outline"
                size="xl"
                className="w-full sm:w-auto border-2 border-primary-foreground/30 text-primary-foreground bg-transparent hover:bg-primary-foreground/10"
              >
                <Shield className="w-5 h-5" />
                Host an Event
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
