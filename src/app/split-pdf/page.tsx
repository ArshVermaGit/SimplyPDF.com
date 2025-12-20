"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, File, X, Download, Loader2, CheckCircle2, RefreshCw, AlertCircle, Scissors } from "lucide-react";
import { splitPDF, downloadAsZip, formatFileSize } from "@/lib/pdf-utils";

type SplitMode = "all" | "range";

export default function SplitPDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [mode, setMode] = useState<SplitMode>("all");
    const [ranges, setRanges] = useState("");
    const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
    const [results, setResults] = useState<{ name: string; data: Uint8Array }[]>([]);
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

    const handleSplit = async () => {
        if (!file) return;
        setStatus("processing");
        setErrorMessage("");

        try {
            const splitFiles = await splitPDF(file, mode, ranges);
            setResults(splitFiles);
            setStatus("success");
        } catch (error) {
            console.error(error);
            setErrorMessage(error instanceof Error ? error.message : "Failed to split PDF");
            setStatus("error");
        }
    };

    const handleDownloadAll = async () => {
        if (results.length === 0) return;
        await downloadAsZip(results, "split-pdfs.zip");
    };

    const handleDownloadSingle = (result: { name: string; data: Uint8Array }) => {
        const blob = new Blob([result.data.slice().buffer], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.name;
        link.click();
        URL.revokeObjectURL(url);
    };

    const reset = () => {
        setFile(null);
        setMode("all");
        setRanges("");
        setStatus("idle");
        setResults([]);
        setErrorMessage("");
    };

    return (
        <div className="min-h-[calc(100vh-80px)] pt-24 pb-16">
            <div className="container mx-auto px-4 py-12 md:py-20">
                <AnimatePresence mode="wait">
                    {status === "idle" && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col items-center max-w-4xl mx-auto"
                        >
                            {!file ? (
                                <div
                                    className={`relative w-full flex flex-col items-center justify-center p-12 py-24 border-2 border-dashed rounded-3xl transition-all duration-300 cursor-pointer ${dragActive
                                        ? "border-primary bg-primary/5"
                                        : "border-border bg-white hover:border-primary/50 hover:bg-primary/5"
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
                                    <div className="bg-primary/10 p-6 rounded-2xl mb-6">
                                        <Upload className="w-12 h-12 text-primary" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-foreground mb-3">Split PDF</h2>
                                    <p className="text-muted-foreground mb-8 text-center max-w-md">
                                        Separate one page or a whole set for easy conversion into individual PDF files.
                                    </p>
                                    <button className="btn-primary !py-4 !px-12 !text-lg">
                                        Select PDF file
                                    </button>
                                    <p className="mt-6 text-sm text-muted-foreground">
                                        or drag and drop a PDF here
                                    </p>
                                </div>
                            ) : (
                                <div className="w-full space-y-8">
                                    {/* Selected file */}
                                    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-border shadow-sm">
                                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <File className="w-6 h-6 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-foreground truncate">{file.name}</p>
                                            <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                                        </div>
                                        <button
                                            onClick={() => setFile(null)}
                                            className="p-2 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Split options */}
                                    <div className="bg-white p-6 rounded-xl border border-border">
                                        <h3 className="text-lg font-semibold text-foreground mb-4">Split Options</h3>

                                        <div className="space-y-4">
                                            <label className="flex items-center gap-3 p-4 rounded-lg border border-border cursor-pointer hover:border-primary/50 transition-colors">
                                                <input
                                                    type="radio"
                                                    name="mode"
                                                    value="all"
                                                    checked={mode === "all"}
                                                    onChange={() => setMode("all")}
                                                    className="w-5 h-5 text-primary"
                                                />
                                                <div>
                                                    <p className="font-medium text-foreground">Extract all pages</p>
                                                    <p className="text-sm text-muted-foreground">Split each page into a separate PDF file</p>
                                                </div>
                                            </label>

                                            <label className="flex items-start gap-3 p-4 rounded-lg border border-border cursor-pointer hover:border-primary/50 transition-colors">
                                                <input
                                                    type="radio"
                                                    name="mode"
                                                    value="range"
                                                    checked={mode === "range"}
                                                    onChange={() => setMode("range")}
                                                    className="w-5 h-5 text-primary mt-1"
                                                />
                                                <div className="flex-1">
                                                    <p className="font-medium text-foreground">Split by page ranges</p>
                                                    <p className="text-sm text-muted-foreground mb-3">Specify which pages to extract (e.g., 1-3, 5, 7-9)</p>
                                                    {mode === "range" && (
                                                        <input
                                                            type="text"
                                                            value={ranges}
                                                            onChange={(e) => setRanges(e.target.value)}
                                                            placeholder="e.g., 1-3, 5, 7-9"
                                                            className="w-full px-4 py-2 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                        />
                                                    )}
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Action button */}
                                    <div className="flex justify-center">
                                        <button
                                            onClick={handleSplit}
                                            disabled={mode === "range" && !ranges.trim()}
                                            className="btn-primary !py-5 !px-16 !text-xl flex items-center gap-3 shadow-2xl shadow-primary/40 hover:-translate-y-1 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Scissors className="w-6 h-6" /> Split PDF
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {status === "processing" && (
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-border shadow-xl max-w-2xl mx-auto"
                        >
                            <div className="relative">
                                <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                <Loader2 className="w-10 h-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mt-8 mb-2">Splitting your PDF...</h3>
                            <p className="text-muted-foreground">Please wait, this won&apos;t take long.</p>
                        </motion.div>
                    )}

                    {status === "success" && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center py-12 bg-white rounded-3xl border border-border shadow-xl max-w-3xl mx-auto"
                        >
                            <div className="bg-emerald-100 p-5 rounded-2xl mb-6">
                                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                            </div>
                            <h3 className="text-3xl font-bold text-foreground mb-2">Split Complete!</h3>
                            <p className="text-muted-foreground mb-8">{results.length} PDF files created</p>

                            {/* Results list */}
                            <div className="w-full px-8 max-h-64 overflow-y-auto mb-8">
                                <div className="space-y-2">
                                    {results.map((result, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <File className="w-5 h-5 text-primary" />
                                                <span className="font-medium text-sm">{result.name}</span>
                                            </div>
                                            <button
                                                onClick={() => handleDownloadSingle(result)}
                                                className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={handleDownloadAll}
                                    className="btn-primary !py-4 !px-10 flex items-center gap-2"
                                >
                                    <Download className="w-5 h-5" /> Download All (ZIP)
                                </button>
                                <button onClick={reset} className="btn-outline flex items-center gap-2">
                                    <RefreshCw className="w-5 h-5" /> Split Another
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {status === "error" && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-red-200 shadow-xl max-w-2xl mx-auto text-center"
                        >
                            <div className="bg-red-100 p-5 rounded-2xl mb-6">
                                <AlertCircle className="w-16 h-16 text-red-500" />
                            </div>
                            <h3 className="text-3xl font-bold text-foreground mb-2">Something went wrong</h3>
                            <p className="text-muted-foreground mb-10 max-w-md px-4">{errorMessage}</p>
                            <button onClick={reset} className="btn-primary flex items-center gap-2">
                                <RefreshCw className="w-5 h-5" /> Try Again
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
