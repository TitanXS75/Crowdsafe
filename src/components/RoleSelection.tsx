import { motion } from "framer-motion";
import {
  Navigation,
  MapPin,
  Car,
  AlertTriangle,
  Globe2,
  Shield,
  Map,
  Bell,
  BarChart3,
  Radio,
  ArrowRight
} from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

const attendeeFeatures = [
  { icon: Navigation, text: "Live navigation to entrances, exits, facilities" },
  { icon: MapPin, text: "Safe route suggestions based on crowd density" },
  { icon: Car, text: "Parking location saving & retrieval" },
  { icon: AlertTriangle, text: "One-tap emergency access" },
  { icon: Globe2, text: "Multilingual & accessibility-friendly" },
];

const organizerFeatures = [
  { icon: Map, text: "Upload & manage event maps" },
  { icon: Car, text: "Control parking zones & POIs" },
  { icon: Bell, text: "Broadcast alerts & announcements" },
  { icon: BarChart3, text: "Monitor crowd heatmaps in real time" },
  { icon: Radio, text: "Emergency coordination dashboard" },
];


const adminFeatures = [
  { icon: Map, text: "Create & Calibrate Venue Maps" },
  { icon: Shield, text: "Platform-wide Security Controls" },
  { icon: BarChart3, text: "Global Analytics & Optimization" },
  { icon: Radio, text: "System System Configuration" },
  { icon: Bell, text: "Emergency Broadcast Override" },
];

export const RoleSelection = () => {
  return (
    <section id="roles" className="py-24 lg:py-32 relative">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Choose Your Role
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select your portal to get started
          </p>
        </motion.div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {/* Attendee Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-xl group-hover:bg-primary/10 transition-colors" />
            <div className="relative glass rounded-3xl p-8 border border-primary/10 hover:border-primary/30 transition-all duration-300 h-full flex flex-col">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow mb-6">
                <Navigation className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Attendee</h3>
              <p className="text-muted-foreground mb-6">Navigate events safely with live guidance</p>
              <ul className="space-y-4 mb-8 flex-1">
                {attendeeFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{feature.text}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth/attendee">
                <Button variant="hero" size="lg" className="w-full group">
                  Login as Attendee
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Organizer Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-secondary/5 rounded-3xl blur-xl group-hover:bg-secondary/10 transition-colors" />
            <div className="relative glass rounded-3xl p-8 border border-secondary/10 hover:border-secondary/30 transition-all duration-300 h-full flex flex-col">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center shadow-glow-green mb-6">
                <Shield className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Organizer</h3>
              <p className="text-muted-foreground mb-6">Host events and manage crowd safety</p>
              <ul className="space-y-4 mb-8 flex-1">
                {organizerFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-4 h-4 text-secondary" />
                    </div>
                    <span className="text-sm text-foreground">{feature.text}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth/organizer">
                <Button variant="secondary" size="lg" className="w-full group">
                  Login as Organizer
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Admin Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-destructive/5 rounded-3xl blur-xl group-hover:bg-destructive/10 transition-colors" />
            <div className="relative glass rounded-3xl p-8 border border-destructive/10 hover:border-destructive/30 transition-all duration-300 h-full flex flex-col">
              <div className="w-16 h-16 rounded-2xl bg-destructive flex items-center justify-center shadow-md mb-6">
                <BarChart3 className="w-8 h-8 text-destructive-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Admin</h3>
              <p className="text-muted-foreground mb-6">System calibration and map creation</p>
              <ul className="space-y-4 mb-8 flex-1">
                {adminFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-4 h-4 text-destructive" />
                    </div>
                    <span className="text-sm text-foreground">{feature.text}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth/admin">
                <Button variant="outline" size="lg" className="w-full group hover:bg-destructive hover:text-destructive-foreground border-destructive/50">
                  Login as Admin
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
