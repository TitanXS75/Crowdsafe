import { useEffect, useState } from "react";
import { getAllUsers, deleteUser, UserData } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Users,
    Trash2,
    Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const AdminDashboard = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            console.log("🔍 Fetching users from Firestore...");
            const allUsers = await getAllUsers();
            console.log("✅ Users fetched successfully:", allUsers);
            console.log("📊 Total users:", allUsers.length);
            console.log("👥 Attendees:", allUsers.filter(u => u.role === 'attendee').length);
            console.log("🛡️ Organizers:", allUsers.filter(u => u.role === 'organizer').length);
            setUsers(allUsers);
        } catch (error) {
            console.error("❌ Failed to fetch users", error);
            toast({
                title: "Error",
                description: `Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (uid: string) => {
        try {
            await deleteUser(uid);
            setUsers(users.filter(u => u.uid !== uid));
            toast({
                title: "User Deleted",
                description: "The user has been permanently removed.",
                variant: "destructive"
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete user.",
                variant: "destructive"
            });
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-muted-foreground">User Management</p>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <p>Loading users...</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Attendees Column */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary" />
                                    Attendees
                                </CardTitle>
                                <CardDescription>Manage registered attendees</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {users.filter(u => u.role === 'attendee').map(user => (
                                        <div key={user.uid} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="text-[10px]">{user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{user.name || 'N/A'}</p>
                                                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleDeleteUser(user.uid)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {users.filter(u => u.role === 'attendee').length === 0 && (
                                        <p className="text-center py-6 text-sm text-muted-foreground">No attendees found.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Organizers Column */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-purple-500" />
                                    Organizers
                                </CardTitle>
                                <CardDescription>Manage event organizers</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {users.filter(u => u.role === 'organizer').map(user => (
                                        <div key={user.uid} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="text-[10px] bg-purple-100 text-purple-700">{user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{user.name || 'N/A'}</p>
                                                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleDeleteUser(user.uid)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {users.filter(u => u.role === 'organizer').length === 0 && (
                                        <p className="text-center py-6 text-sm text-muted-foreground">No organizers found.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};
