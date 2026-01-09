import { motion } from "framer-motion";
import {
    User,
    Mail,
    Shield,
    Calendar,
    Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const AdminProfile = () => {
    const profileData = {
        name: "Administrator",
        email: "admin@crowdsafe.com",
        role: "System Administrator",
        joinedDate: new Date().toLocaleDateString(),
        avatar: null,
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Admin Profile</h1>
                    <p className="text-muted-foreground">Manage your administrative details</p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Avatar Section */}
                    <Card className="md:col-span-1">
                        <CardContent className="pt-6 flex flex-col items-center">
                            <div className="relative group">
                                <Avatar className="h-32 w-32 border-4 border-muted">
                                    <AvatarImage src={profileData.avatar || ""} />
                                    <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                                        AD
                                    </AvatarFallback>
                                </Avatar>
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="absolute bottom-0 right-0 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Camera className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="mt-4 text-center">
                                <h2 className="font-bold text-lg">{profileData.name}</h2>
                                <p className="text-sm text-muted-foreground">{profileData.role}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Details Section */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Update your personal and account details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input id="name" defaultValue={profileData.name} className="pl-10" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input id="email" defaultValue={profileData.email} className="pl-10" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <div className="relative">
                                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input id="role" defaultValue={profileData.role} className="pl-10" disabled />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="joined">Joined Date</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input id="joined" defaultValue={profileData.joinedDate} className="pl-10" disabled />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button className="px-8">Save Changes</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
};
