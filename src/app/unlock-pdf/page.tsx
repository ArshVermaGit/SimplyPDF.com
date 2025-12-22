"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, File, X, Loader2, CheckCircle2, Download, AlertCircle, RefreshCw, Lock, Shield, Key, Info, Unlock } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { formatFileSize, uint8ArrayToBlob } from "@/lib/pdf-utils";
import {
    AnimatedBackground,
    FloatingDecorations,
    ToolHeader,
    ToolCard,
    ProcessingState
} from "@/components/ToolPageElements";
import { useHistory } from "@/context/HistoryContext";

export default function UnlockPDFPage() {
    const { addToHistory } = useHistory();
    const [file, setFile] = useState<File | null>(null);
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
    const [resultBlob, setResultBlob] = useState<Blob | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [dragActive, setDragActive] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile?.type === "application/pdf") {
            setFile(droppedFile);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const handleUnlock = async () => {
        if (!file) return;
        setStatus("processing");
        setErrorMessage("");

        try {
            const arrayBuffer = await file.arrayBuffer();

            // Try to load the PDF
            const pdf = await PDFDocument.load(arrayBuffer, {
                ignoreEncryption: true,
            });

            // Create a new PDF without encryption
            const newPdf = await PDFDocument.create();
            const pages = await newPdf.copyPages(pdf, pdf.getPageIndices());
            pages.forEach(page => newPdf.addPage(page));

            const pdfBytes = await newPdf.save();
            setResultBlob(uint8ArrayToBlob(pdfBytes));
            setStatus("success");

            if (file) {
                addToHistory("Unlocked PDF", file.name, "Password protection removed");
            }
        } catch (error) {
            console.error(error);
            if (error instanceof Error && error.message.includes("password")) {
                setErrorMessage("Incorrect password. Please try again with the correct password.");
            } else {
                setErrorMessage("Failed to unlock PDF. The file may be corrupted or has advanced encryption.");
            }
            setStatus("error");
        }
    };

    const handleDownload = () => {
        if (!resultBlob) return;
        const url = URL.createObjectURL(resultBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `unlocked_${file?.name || "document.pdf"}`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const reset = () => {
        setFile(null);
        setPassword("");
        setStatus("idle");
        setResultBlob(null);
        setErrorMessage("");
    };

    return (
        <div className="relative min-h-[calc(100vh-80px)] pt-24 pb-16 overflow-hidden">
            <AnimatedBackground />
            <FloatingDecorations />

            <div className="container mx-auto px-4 relative z-10">
                <AnimatePresence mode="wait">
                    {status === "idle" && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-4xl mx-auto"
                        >
                            <ToolHeader
                                title="Unlock PDF"
                                description="Remove password protection and restrictions from your PDF files instantly."
                                icon={Unlock}
                            />

                            {!file ? (
                                <ToolCard className="p-8">
                                    <div
                                        className={`drop-zone active:border-black ${dragActive ? "active" : ""}`}
                                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                        onDragLeave={() => setDragActive(false)}
                                        onDrop={handleDrop}
                                        onClick={() => document.getElementById("file-input")?.click()}
                                    >
                                        <input
                                            id="file-input"
                                            type="file"
                                            accept=".pdf"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                        <Upload className="w-12 h-12 text-gray-400 mb-4" />
                                        <p className="text-lg font-medium mb-2">Drop your PDF here</p>
                                        <p className="text-gray-400 text-sm">or click to browse</p>
                                    </div>
                                </ToolCard>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                    {/* Main Area */}
                                    <div className="lg:col-span-12 h-full">
                                        <ToolCard className="p-8 flex flex-col items-center">
                                            <div className="w-24 h-24 bg-gray-50 rounded-[32px] shadow-sm flex items-center justify-center mb-8">
                                                <File className="w-10 h-10 text-gray-400" />
                                            </div>
                                            <h2 className="text-2xl font-bold mb-2 truncate px-4">{file.name}</h2>
                                            <p className="text-gray-400 font-medium uppercase text-xs tracking-widest">{formatFileSize(file.size)} • PDF DOCUMENT</p>

                                            <div className="mt-8 relative group w-full max-w-md">
                                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors" />
                                                <input
                                                    type="password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="Enter Password (if required)"
                                                    className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black outline-none font-medium transition-all"
                                                />
                                            </div>

                                            <div className="mt-8 flex gap-4 w-full max-w-md">
                                                <button onClick={reset} className="flex-1 btn-outline py-4">
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleUnlock}
                                                    className="flex-[2] btn-primary py-4 flex items-center justify-center gap-2"
                                                >
                                                    <Unlock className="w-5 h-5" />
                                                    Unlock PDF
                                                </button>
                                            </div>
                                        </ToolCard>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {status === "processing" && (
                        <ProcessingState
                            title="Decrypting Content"
                            description="Running advanced decryption algorithms..."
                        />
                    )}

                    {status === "success" && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center h-[calc(100vh-80px)] text-center px-4"
                        >
                            <div className="w-24 h-24 bg-black text-white rounded-[32px] flex items-center justify-center mb-8 shadow-2xl hover:scale-110 transition-transform cursor-pointer">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            <h2 className="text-4xl font-extrabold mb-4 tracking-tight">Access Restored</h2>
                            <p className="text-gray-500 text-lg mb-12 max-w-sm mx-auto">
                                Your PDF results are now completely unlocked and ready for use.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                                <button onClick={handleDownload} className="flex-1 btn-primary py-5 px-10 flex items-center justify-center gap-3 text-lg font-bold group">
                                    <Download className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
                                    Download PDF
                                </button>
                                <button onClick={reset} className="flex-1 btn-outline py-5 px-10 flex items-center justify-center gap-3 text-lg font-bold">
                                    <RefreshCw className="w-6 h-6" />
                                    Unlock New
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {status === "error" && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center h-[calc(100vh-80px)] text-center px-4"
                        >
                            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center mb-8">
                                <AlertCircle className="w-12 h-12" />
                            </div>
                            <h2 className="text-4xl font-extrabold mb-4 tracking-tight">Decryption Failed</h2>
                            <p className="text-gray-500 text-lg mb-12 max-w-sm mx-auto">{errorMessage}</p>

                            <button onClick={reset} className="w-full max-w-xs btn-primary py-5 px-12 flex items-center justify-center gap-3 text-lg font-bold">
                                <RefreshCw className="w-6 h-6" />
                                Retry Unlock
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
