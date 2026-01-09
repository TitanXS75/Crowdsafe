import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Auth Pages
import AttendeeAuth from "./pages/auth/AttendeeAuth";
import OrganizerAuth from "./pages/auth/OrganizerAuth";
import AdminAuth from "./pages/auth/AdminAuth";

// Attendee pages
import { AttendeeDashboard } from "./pages/attendee/AttendeeDashboard";
import { AttendeeMap } from "./pages/attendee/AttendeeMap";
import { AttendeeParking } from "./pages/attendee/AttendeeParking";
import { AttendeeEmergency } from "./pages/attendee/AttendeeEmergency";
import { AttendeeAlerts } from "./pages/attendee/AttendeeAlerts";
import { AttendeeSettings } from "./pages/attendee/AttendeeSettings";
import { AttendeeProfile } from "./pages/attendee/AttendeeProfile";
import { AttendeeHelp } from "./pages/attendee/AttendeeHelp";
import { EventCatalog } from "./pages/attendee/EventCatalog";

// Organizer pages
import { OrganizerDashboard } from "./pages/organizer/OrganizerDashboard";
import { EventSetup } from "./pages/organizer/EventSetup";
import { POIManagement } from "./pages/organizer/POIManagement";
import { CrowdControl } from "./pages/organizer/CrowdControl";
import { ParkingManagement } from "./pages/organizer/ParkingManagement";
import { AlertsBroadcast } from "./pages/organizer/AlertsBroadcast";
import { EmergencyMonitoring } from "./pages/organizer/EmergencyMonitoring";
import { Reports } from "./pages/organizer/Reports";
import { OrganizerProfile } from "./pages/organizer/OrganizerProfile";
import LiveTracking from "./pages/organizer/LiveTracking";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminProfile } from "./pages/admin/AdminProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />

            {/* Auth Routes */}
            <Route path="/auth/attendee" element={<AttendeeAuth />} />
            <Route path="/auth/organizer" element={<OrganizerAuth />} />
            <Route path="/auth/admin" element={<AdminAuth />} />

            {/* Attendee Routes */}
            <Route path="/attendee" element={<AttendeeDashboard />} />
            <Route path="/attendee/map" element={<AttendeeMap />} />
            <Route path="/attendee/parking" element={<AttendeeParking />} />
            <Route path="/attendee/emergency" element={<AttendeeEmergency />} />
            <Route path="/attendee/alerts" element={<AttendeeAlerts />} />
            <Route path="/attendee/settings" element={<AttendeeSettings />} />
            <Route path="/attendee/profile" element={<AttendeeProfile />} />
            <Route path="/attendee/help" element={<AttendeeHelp />} />
            <Route path="/attendee/events" element={<EventCatalog />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/profile" element={<AdminProfile />} />

            {/* Organizer Routes */}
            <Route path="/organizer" element={<OrganizerDashboard />} />
            <Route path="/organizer/event-setup" element={<EventSetup />} />
            <Route path="/organizer/poi" element={<POIManagement />} />
            <Route path="/organizer/crowd" element={<CrowdControl />} />
            <Route path="/organizer/live-tracking" element={<LiveTracking />} />
            <Route path="/organizer/parking" element={<ParkingManagement />} />
            <Route path="/organizer/alerts" element={<AlertsBroadcast />} />
            <Route path="/organizer/emergencies" element={<EmergencyMonitoring />} />
            <Route path="/organizer/reports" element={<Reports />} />
            <Route path="/organizer/profile" element={<OrganizerProfile />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
