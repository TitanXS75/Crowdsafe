import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserRole, saveUserRole, UserData, UserRole } from "@/lib/db";

interface AuthContextType {
    user: User | null;
    userData: UserData | null;
    loading: boolean;
    login: (email: string, password: string, expectedRole: UserRole) => Promise<void>;
    signup: (email: string, password: string, role: UserRole, additionalData?: { name?: string; orgName?: string }) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                // Fetch user role from Firestore
                const data = await getUserRole(firebaseUser.uid);
                setUserData(data);
            } else {
                setUserData(null);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = async (email: string, password: string, expectedRole: UserRole) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // Check user role
        const data = await getUserRole(userCredential.user.uid);

        if (!data) {
            await signOut(auth);
            throw new Error("User account not found. Please sign up first.");
        }

        // Verify role matches the login page they're using
        if (data.role !== expectedRole) {
            await signOut(auth);
            throw new Error(`This account is registered as ${data.role}. Please use the correct login page.`);
        }

        setUserData(data);
    };

    const signup = async (email: string, password: string, role: UserRole, additionalData?: { name?: string; orgName?: string }) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Save user role to Firestore
        await saveUserRole(userCredential.user.uid, email, role, additionalData);

        // Fetch the saved data
        const data = await getUserRole(userCredential.user.uid);
        setUserData(data);
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
        setUserData(null);
    };

    const value: AuthContextType = {
        user,
        userData,
        loading,
        login,
        signup,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
