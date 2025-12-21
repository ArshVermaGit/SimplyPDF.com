"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthProvider";

export interface HistoryItem {
    id: string;
    action: string; // e.g. "Merged PDF", "Split PDF"
    fileName: string;
    details: string; // e.g. "5 files merged", "Pages 1-5 extracted"
    timestamp: number;
    userEmail: string; // to associate with specific user
}

interface HistoryContextType {
    history: HistoryItem[];
    addToHistory: (action: string, fileName: string, details: string) => void;
    clearHistory: () => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [history, setHistory] = useState<HistoryItem[]>([]);

    // Load history when user changes
    useEffect(() => {
        if (user) {
            const storedHistory = localStorage.getItem(`simplypdf_history_${user.email}`);
            if (storedHistory) {
                try {
                    setHistory(JSON.parse(storedHistory));
                } catch (e) {
                    console.error("Failed to parse history", e);
                    setHistory([]);
                }
            } else {
                setHistory([]);
            }
        } else {
            setHistory([]); // Clear view if logged out
        }
    }, [user]);

    const addToHistory = (action: string, fileName: string, details: string) => {
        if (!user) return; // Only track if logged in

        const newItem: HistoryItem = {
            id: Date.now().toString(),
            action,
            fileName,
            details,
            timestamp: Date.now(),
            userEmail: user.email,
        };

        const newHistory = [newItem, ...history];
        setHistory(newHistory);
        localStorage.setItem(`simplypdf_history_${user.email}`, JSON.stringify(newHistory));
    };

    const clearHistory = () => {
        if (!user) return;
        setHistory([]);
        localStorage.removeItem(`simplypdf_history_${user.email}`);
    };

    return (
        <HistoryContext.Provider value={{ history, addToHistory, clearHistory }}>
            {children}
        </HistoryContext.Provider>
    );
}

export const useHistory = () => {
    const context = useContext(HistoryContext);
    if (context === undefined) {
        throw new Error("useHistory must be used within a HistoryProvider");
    }
    return context;
};
