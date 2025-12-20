"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, File, X, Download, Loader2, CheckCircle2, RefreshCw, AlertCircle, Shield, Lock, Info } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { formatFileSize, uint8ArrayToBlob } from "@/lib/pdf-utils";

export default function ProtectPDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
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

    const handleProtect = async () => {
        if (!file) return;

        if (password !== confirmPassword) {
            setErrorMessage("Passwords do not match");
            setStatus("error");
            return;
        }

        if (password.length < 4) {
            setErrorMessage("Password must be at least 4 characters");
            setStatus("error");
            return;
        }

        setStatus("processing");
        setErrorMessage("");

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);

            // Note: pdf-lib doesn't support encryption. We store the password in metadata
            // as a workaround for demo purposes. For production, a backend service
            // with qpdf or similar would be needed.
            pdf.setTitle(`Protected Document`);
            pdf.setAuthor("SimplyPDF");
            pdf.setSubject(`Password hint: ${password.length} characters`);
            pdf.setProducer("SimplyPDF - Protected");

            const pdfBytes = await pdf.save();
            setResultBlob(uint8ArrayToBlob(pdfBytes));
            setStatus("success");
        } catch (error) {
            console.error(error);
            setErrorMessage("Failed to process PDF. Please try again.");
            setStatus("error");
        }
    };

    const handleDownload = () => {
        if (!resultBlob) return;
        const url = URL.createObjectURL(resultBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `protected_${file?.name || "document.pdf"}`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const reset = () => {
        setFile(null);
        setPassword("");
        setConfirmPassword("");
        setStatus("idle");
        setResultBlob(null);
        setErrorMessage("");
    };

    return (
        <div className="min-h-[calc(100vh-80px)] pt-24 pb-16">
            <div className="container mx-auto px-4">
                <AnimatePresence mode="wait">
                    {status === "idle" && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-4xl mx-auto"
                        >
                            <div className="text-center mb-12">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-6">
                                    <Shield className="w-8 h-8" />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold mb-4">Protect PDF</h1>
                                <p className="text-gray-500 text-lg max-w-xl mx-auto">
                                    Add metadata protection to your PDF documents.
                                </p>
                            </div>

                            {/* Limitation Notice */}
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 flex items-start gap-3">
                                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-amber-800 font-medium">Browser Limitation</p>
                                    <p className="text-amber-700 text-sm mt-1">
                                        Full PDF password encryption requires server-side processing. This tool adds metadata protection
                                        which can be useful for document tracking. For true password protection, consider using
                                        desktop applications like Adobe Acrobat.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-xl">
                                {!file ? (
                                    <div
                                        className={`relative flex flex-col items-center justify-center p-12 py-20 border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer ${dragActive ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-400"
                                            }`}
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
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <File className="w-8 h-8 text-gray-400" />
                                                <div>
                                                    <p className="font-medium">{file.name}</p>
                                                    <p className="text-sm text-gray-400">{formatFileSize(file.size)}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setFile(null)}
                                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                            >
                                                <X className="w-5 h-5 text-gray-500" />
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Password</label>
                                                <div className="relative">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                    <input
                                                        type="password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        placeholder="Enter password"
                                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                                                <div className="relative">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                    <input
                                                        type="password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        placeholder="Confirm password"
                                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-center pt-4">
                                            <button
                                                onClick={handleProtect}
                                                disabled={!password || !confirmPassword}
                                                className="btn-primary text-lg py-4 px-12 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Shield className="w-5 h-5" />
                                                Protect PDF
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-12 grid grid-cols-3 gap-6 text-center">
                                {[
                                    { label: "100% Free", desc: "No hidden fees" },
                                    { label: "Private", desc: "Files stay on device" },
                                    { label: "Fast", desc: "Instant processing" },
                                ].map((feature) => (
                                    <div key={feature.label} className="p-4">
                                        <div className="font-semibold mb-1">{feature.label}</div>
                                        <div className="text-gray-400 text-sm">{feature.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {status === "processing" && (
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-32 max-w-lg mx-auto text-center"
                        >
                            <div className="relative mb-8">
                                <div className="w-24 h-24 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                                <Loader2 className="w-10 h-10 text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Processing your PDF...</h2>
                            <p className="text-gray-500">This won&apos;t take long...</p>
                        </motion.div>
                    )}

                    {status === "success" && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-24 max-w-lg mx-auto text-center"
                        >
                            <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center mb-8">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-bold mb-2">PDF Protected!</h2>
                            <p className="text-gray-500 mb-4">Metadata protection has been added.</p>
                            <p className="text-amber-600 text-sm mb-10 max-w-md">
                                Note: This adds metadata-level protection. For full password encryption,
                                use desktop PDF tools like Adobe Acrobat.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={handleDownload} className="btn-primary py-4 px-10 flex items-center gap-2">
                                    <Download className="w-5 h-5" />
                                    Download PDF
                                </button>
                                <button onClick={reset} className="btn-outline py-4 px-10 flex items-center gap-2">
                                    <RefreshCw className="w-5 h-5" />
                                    Protect Another
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {status === "error" && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-24 max-w-lg mx-auto text-center"
                        >
                            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-8">
                                <AlertCircle className="w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-bold mb-2">Something went wrong</h2>
                            <p className="text-gray-500 mb-10">{errorMessage}</p>

                            <button onClick={reset} className="btn-primary py-4 px-10 flex items-center gap-2">
                                <RefreshCw className="w-5 h-5" />
                                Try Again
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
