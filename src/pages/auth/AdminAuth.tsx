import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, Eye, EyeOff, LayoutDashboard, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminAuth() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    // Admin credentials (must also exist in Firebase Auth)
    const ADMIN_EMAIL = "admin@crowdsafe.com";

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // First check if it's the admin email
            if (formData.email !== ADMIN_EMAIL) {
                toast.error("Access Denied", { description: "This login is for administrators only" });
                setIsLoading(false);
                return;
            }

            // Sign in with Firebase Auth
            await signInWithEmailAndPassword(auth, formData.email, formData.password);

            toast.success("Welcome back! Redirecting to Admin Panel...");
            navigate("/admin");
        } catch (error: any) {
            console.error(error);
            if (error.code === "auth/user-not-found") {
                toast.error("Admin account not found", { description: "Please create an admin account first" });
            } else if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
                toast.error("Authentication failed", { description: "Invalid password" });
            } else {
                toast.error("Authentication failed", { description: error.message });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-32 py-12 bg-background">
                <div className="w-full max-w-md mx-auto">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                            <LayoutDashboard className="w-8 h-8 text-destructive" />
                            Admin Console
                        </h1>
                        <p className="text-muted-foreground">
                            Restricted access. Authorized personnel only.
                        </p>
                    </motion.div>

                    <motion.form
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <Input id="email" name="email" type="email" placeholder="admin@crowdsafe.com" value={formData.email} onChange={handleInputChange} className="pl-11 h-12" required />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={handleInputChange} className="pl-11 pr-11 h-12" required />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" variant="destructive" size="lg" className="w-full" disabled={isLoading}>
                            {isLoading ? "Verifying..." : "Authenticate"}
                        </Button>
                    </motion.form>
                </div>
            </div>

            {/* Visual */}
            <div className="hidden lg:flex flex-1 relative overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/admin_auth_bg.png')" }}
                />
                <div className="relative z-10 flex items-center justify-center p-12">
                    <div className="text-center max-w-md bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20">
                        <Shield className="w-20 h-20 mx-auto mb-6 text-destructive/70" />
                        <h3 className="text-2xl font-mono text-white mb-3">SYSTEM ACCESS RESTRICTED</h3>
                        <p className="text-sm text-white/90 mt-2">Map Calibration • System Configuration • Platform Administration</p>
                        <p className="text-xs text-white/70 mt-4">All activities are logged and monitored.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
