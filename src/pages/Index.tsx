import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { RoleSelection } from "@/components/RoleSelection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { SocialImpactSection } from "@/components/SocialImpactSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, userData, loading } = useAuth();

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect logged-in users to their dashboard based on role
  if (user && userData) {
    if (userData.role === "attendee") {
      return <Navigate to="/attendee" replace />;
    } else if (userData.role === "organizer") {
      return <Navigate to="/organizer" replace />;
    } else if (userData.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <RoleSelection />
        <SocialImpactSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
