"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { googleLogout, CredentialResponse } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

interface User {
    email: string;
    description: string;
    picture: string;
    name: string;
    sub: string; // unique google id
}

interface AuthContextType {
    user: User | null;
    login: (credentialResponse: CredentialResponse) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    // Initialize from local storage
    useEffect(() => {
        const storedUser = localStorage.getItem("simplypdf_user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse stored user", e);
                localStorage.removeItem("simplypdf_user");
            }
        }
    }, []);

    const login = (credentialResponse: CredentialResponse) => {
        if (credentialResponse.credential) {
            try {
                const decoded: any = jwtDecode(credentialResponse.credential);
                const newUser: User = {
                    email: decoded.email,
                    description: "Google User",
                    picture: decoded.picture,
                    name: decoded.name,
                    sub: decoded.sub,
                };
                setUser(newUser);
                localStorage.setItem("simplypdf_user", JSON.stringify(newUser));
            } catch (error) {
                console.error("Login Failed: Invalid Token", error);
            }
        }
    };

    const logout = () => {
        googleLogout();
        setUser(null);
        localStorage.removeItem("simplypdf_user");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
