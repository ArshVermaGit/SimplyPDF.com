"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/context/AuthProvider";
import { HistoryProvider } from "@/context/HistoryContext";
import { ReactNode } from "react";

const GOOGLE_CLIENT_ID = "92545735176-rg30uefh7bbm94urcdidftnbgfp6uo6v.apps.googleusercontent.com";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AuthProvider>
                <HistoryProvider>
                    {children}
                </HistoryProvider>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}
