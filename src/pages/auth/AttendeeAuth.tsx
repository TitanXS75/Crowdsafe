import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, Eye, EyeOff, User, ArrowLeft, Navigation } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AttendeeAuth() {
    const navigate = useNavigate();
    const { login, signup } = useAuth();
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        name: "",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (mode === "login") {
                await login(formData.email, formData.password, "attendee");
                toast.success("Welcome back! Redirecting to dashboard...");
            } else {
                if (formData.password.length < 6) {
                    throw new Error("Password must be at least 6 characters");
                }
                await signup(formData.email, formData.password, "attendee", { name: formData.name });
                toast.success("Account created successfully!");
            }
            navigate("/attendee");
        } catch (error: any) {
            console.error(error);
            let errorMessage = error.message;

            // Handle Firebase auth errors
            if (error.code === "auth/invalid-email") {
                errorMessage = "Invalid email address";
            } else if (error.code === "auth/user-not-found") {
                errorMessage = "No account found with this email";
            } else if (error.code === "auth/wrong-password") {
                errorMessage = "Incorrect password";
            } else if (error.code === "auth/email-already-in-use") {
                errorMessage = "Email already in use. Please login instead.";
            } else if (error.code === "auth/weak-password") {
                errorMessage = "Password must be at least 6 characters";
            }

            toast.error("Authentication failed", {
                description: errorMessage
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel */}
            <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-32 py-12 bg-background">
                <div className="w-full max-w-md mx-auto">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>

                    <Link to="/" className="flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                            <Shield className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold text-foreground">Crowd<span className="gradient-text">Safe</span></span>
                    </Link>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                            <Navigation className="w-8 h-8 text-primary" />
                            Attendee Access
                        </h1>
                        <p className="text-muted-foreground">
                            {mode === "login" ? "Sign in to navigate events safely" : "Join to get real-time guidance"}
                        </p>
                    </motion.div>

                    {/* Form */}
                    <motion.form
                        key={mode}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >
                        {mode === "signup" && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-2"
                            >
                                <Label htmlFor="name">Full Name</Label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <Input id="name" name="name" placeholder="John Doe" value={formData.name} onChange={handleInputChange} className="pl-11 h-12" required />
                                </div>
                            </motion.div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <Input id="email" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleInputChange} className="pl-11 h-12" required />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={handleInputChange} className="pl-11 pr-11 h-12" required minLength={6} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                            {isLoading ? "Processing..." : mode === "login" ? "Sign In" : "Create Account"}
                        </Button>

                        <p className="text-center text-sm text-muted-foreground">
                            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                            <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-primary font-medium hover:underline">
                                {mode === "login" ? "Sign up" : "Sign in"}
                            </button>
                        </p>
                    </motion.form>
                </div>
            </div>


            {/* Right Visual */}
            <div className="hidden lg:flex flex-1 relative overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/attendee_auth_bg.png')" }}
                />
                <div className="relative z-10 flex items-center justify-center p-12">
                    <div className="text-center max-w-lg bg-background/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-border/50">
                        <h2 className="text-3xl font-bold mb-4 text-foreground">Experience Events Like Never Before</h2>
                        <p className="text-lg text-foreground/90">Get live crowd updates, find parking easily, and navigate safely through any venue.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
