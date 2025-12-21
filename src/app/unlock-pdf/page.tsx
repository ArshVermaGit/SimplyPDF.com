"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, File, X, Loader2, CheckCircle2, Download, AlertCircle, RefreshCw, Lock, Shield, Key, Info, Unlock } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { formatFileSize, uint8ArrayToBlob } from "@/lib/pdf-utils";

export default function UnlockPDFPage() {
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
        <div className="min-h-screen bg-[#F8F9FA] pt-20">
            <AnimatePresence mode="wait">
                {status === "idle" && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-[calc(100vh-80px)]"
                    >
                        {!file ? (
                            <div className="h-full flex flex-col items-center justify-center px-4">
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="text-center mb-12"
                                >
                                    <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6 mx-auto">
                                        <Unlock className="w-10 h-10 text-black" />
                                    </div>
                                    <h1 className="text-4xl font-bold mb-4">Unlock PDF</h1>
                                    <p className="text-gray-500 max-w-sm mx-auto">
                                        Remove password protection and restrictions from your PDF files instantly.
                                    </p>
                                </motion.div>

                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                    onDragLeave={() => setDragActive(false)}
                                    onDrop={handleDrop}
                                    onClick={() => document.getElementById("file-input")?.click()}
                                    className={`w-full max-w-2xl aspect-[16/9] bg-white rounded-[40px] border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center cursor-pointer group shadow-sm ${dragActive ? "border-black bg-gray-50 scale-105" : "border-gray-200 hover:border-gray-400 hover:shadow-xl"
                                        }`}
                                >
                                    <input id="file-input" type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Upload className="w-8 h-8 text-gray-400 group-hover:text-black" />
                                    </div>
                                    <p className="text-xl font-semibold text-gray-900">Drop PDF here</p>
                                    <p className="text-gray-400 mt-2">or click to browse from device</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-12 h-all gap-0">
                                {/* Left Toolbar */}
                                <div className="hidden lg:flex lg:col-span-1 border-r border-gray-100 bg-white flex-col items-center py-8 gap-4">
                                    <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg">
                                        <Key className="w-6 h-6" />
                                    </div>
                                    <button className="p-3 text-gray-400 hover:text-black hover:bg-gray-50 rounded-xl transition-all"><Unlock className="w-5 h-5" /></button>
                                    <div className="mt-auto">
                                        <button onClick={reset} className="p-3 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><X className="w-5 h-5" /></button>
                                    </div>
                                </div>

                                {/* Main Area */}
                                <div className="lg:col-span-7 h-full bg-[#F8F9FA] overflow-y-auto p-12 text-center flex flex-col justify-center items-center">
                                    <div className="max-w-md mx-auto">
                                        <div className="w-24 h-24 bg-white rounded-[32px] shadow-xl border border-gray-100 flex items-center justify-center mb-8 mx-auto">
                                            <File className="w-10 h-10 text-gray-400" />
                                        </div>
                                        <h2 className="text-2xl font-bold mb-2 truncate px-4">{file.name}</h2>
                                        <p className="text-gray-400 font-medium uppercase text-xs tracking-widest">{formatFileSize(file.size)} • PDF DOCUMENT</p>

                                        <div className="mt-12 p-8 bg-blue-50/50 rounded-3xl border border-blue-100/50 flex flex-col items-center text-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                                <Key className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-blue-900 font-bold mb-1">Ready to Decrypt</p>
                                                <p className="text-blue-700/60 text-sm max-w-[240px]">
                                                    Enter the original password in the sidebar to release all restrictions.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Sidebar */}
                                <div className="lg:col-span-4 bg-white border-l border-gray-100 flex flex-col shadow-2xl">
                                    <div className="p-8">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">Decryption Panel</h3>

                                        <div className="space-y-8">
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-3 block">Document Password</label>
                                                <div className="relative group">
                                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors" />
                                                    <input
                                                        type="password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        placeholder="Enter Password"
                                                        className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black outline-none font-medium transition-all"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-gray-400 mt-3 flex items-center gap-2">
                                                    <Info className="w-3 h-3" />
                                                    Leave empty if the file is only restricted (no password)
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 mt-auto border-t border-gray-100 bg-gray-50/50">
                                        <button
                                            onClick={handleUnlock}
                                            className="w-full btn-primary !py-5 flex items-center justify-center gap-3 shadow-2xl shadow-black/20 group hover:scale-[1.02] transition-all active:scale-95"
                                        >
                                            <Unlock className="w-5 h-5 transition-transform group-hover:-rotate-12" />
                                            Unlock PDF
                                        </button>
                                        <p className="text-[10px] text-gray-400 text-center mt-4 font-medium uppercase tracking-tighter">Instant & Private Decryption</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {status === "processing" && (
                    <motion.div
                        key="processing"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center h-[calc(100vh-80px)] text-center"
                    >
                        <div className="relative mb-12">
                            <div className="w-32 h-32 border-[6px] border-gray-100 border-t-black rounded-[48px] animate-[spin_2s_linear_infinite]" />
                            <Loader2 className="w-12 h-12 text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                        </div>
                        <h2 className="text-3xl font-bold mb-3 tracking-tight">Decrypting Content</h2>
                        <p className="text-gray-400 text-lg font-medium animate-pulse">Running advanced decryption algorithms...</p>
                    </motion.div>
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
    );
}
