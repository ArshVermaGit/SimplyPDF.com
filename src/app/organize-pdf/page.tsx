"use client";

import { useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Upload, File, X, Download, Loader2, CheckCircle2, RefreshCw, AlertCircle, GripVertical, Trash2, Layers } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { uint8ArrayToBlob } from "@/lib/pdf-utils";

interface PageInfo {
    id: string;
    pageNumber: number;
    selected: boolean;
}

export default function OrganizePDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pages, setPages] = useState<PageInfo[]>([]);
    const [status, setStatus] = useState<"idle" | "loading" | "ready" | "processing" | "success" | "error">("idle");
    const [resultBlob, setResultBlob] = useState<Blob | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [dragActive, setDragActive] = useState(false);

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile?.type === "application/pdf") {
            setFile(droppedFile);
            await loadPages(droppedFile);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            await loadPages(selectedFile);
        }
    };

    const loadPages = async (pdfFile: File) => {
        setStatus("loading");
        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const pageCount = pdf.getPageCount();

            const pageInfos: PageInfo[] = [];
            for (let i = 0; i < pageCount; i++) {
                pageInfos.push({
                    id: `page-${i}`,
                    pageNumber: i + 1,
                    selected: true,
                });
            }

            setPages(pageInfos);
            setStatus("ready");
        } catch (error) {
            console.error(error);
            setErrorMessage("Failed to load PDF. The file may be corrupted.");
            setStatus("error");
        }
    };

    const togglePage = (id: string) => {
        setPages(pages.map(p =>
            p.id === id ? { ...p, selected: !p.selected } : p
        ));
    };

    const removePage = (id: string) => {
        setPages(pages.filter(p => p.id !== id));
    };

    const handleOrganize = async () => {
        if (!file || pages.length === 0) return;

        const selectedPages = pages.filter(p => p.selected);
        if (selectedPages.length === 0) {
            setErrorMessage("Please select at least one page to keep.");
            setStatus("error");
            return;
        }

        setStatus("processing");
        setErrorMessage("");

        try {
            const arrayBuffer = await file.arrayBuffer();
            const originalPdf = await PDFDocument.load(arrayBuffer);
            const newPdf = await PDFDocument.create();

            // Get page indices in the new order
            const pageIndices = selectedPages.map(p => p.pageNumber - 1);
            const copiedPages = await newPdf.copyPages(originalPdf, pageIndices);
            copiedPages.forEach(page => newPdf.addPage(page));

            const pdfBytes = await newPdf.save();
            setResultBlob(uint8ArrayToBlob(pdfBytes));
            setStatus("success");
        } catch (error) {
            console.error(error);
            setErrorMessage("Failed to organize PDF. Please try again.");
            setStatus("error");
        }
    };

    const handleDownload = () => {
        if (!resultBlob) return;
        downloadFile(new Uint8Array(resultBlob.size), "organized.pdf");
        const url = URL.createObjectURL(resultBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "organized.pdf";
        link.click();
        URL.revokeObjectURL(url);
    };

    const reset = () => {
        setFile(null);
        setPages([]);
        setStatus("idle");
        setResultBlob(null);
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
                                <h2 className="text-3xl font-bold text-foreground mb-3">Organize PDF</h2>
                                <p className="text-muted-foreground mb-8 text-center max-w-md">
                                    Sort, delete, and reorder PDF pages. Drag and drop to rearrange your pages.
                                </p>
                                <button className="btn-primary !py-4 !px-12 !text-lg">
                                    Select PDF file
                                </button>
                                <p className="mt-6 text-sm text-muted-foreground">
                                    or drag and drop a PDF here
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {status === "loading" && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-border shadow-xl max-w-2xl mx-auto"
                        >
                            <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
                            <h3 className="text-xl font-semibold text-foreground">Loading PDF...</h3>
                        </motion.div>
                    )}

                    {status === "ready" && (
                        <motion.div
                            key="ready"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col items-center max-w-4xl mx-auto"
                        >
                            <div className="w-full space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <File className="w-8 h-8 text-primary" />
                                        <div>
                                            <p className="font-medium text-foreground">{file?.name}</p>
                                            <p className="text-sm text-muted-foreground">{pages.length} pages</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={reset}
                                        className="p-2 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="bg-white p-6 rounded-xl border border-border">
                                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                        <Layers className="w-5 h-5 text-primary" />
                                        Reorder Pages
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Drag to reorder pages. Click the trash icon to remove pages.
                                    </p>

                                    <Reorder.Group axis="y" values={pages} onReorder={setPages} className="space-y-2">
                                        {pages.map((page) => (
                                            <Reorder.Item
                                                key={page.id}
                                                value={page}
                                                className="cursor-grab active:cursor-grabbing"
                                            >
                                                <div
                                                    className={`flex items-center gap-4 p-3 rounded-lg border transition-all ${page.selected
                                                        ? "border-primary/30 bg-primary/5"
                                                        : "border-border bg-muted/50 opacity-50"
                                                        }`}
                                                >
                                                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                        {page.pageNumber}
                                                    </div>
                                                    <span className="flex-1 font-medium">Page {page.pageNumber}</span>
                                                    <button
                                                        onClick={() => togglePage(page.id)}
                                                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${page.selected
                                                            ? "bg-primary text-white"
                                                            : "bg-muted text-muted-foreground"
                                                            }`}
                                                    >
                                                        {page.selected ? "Selected" : "Excluded"}
                                                    </button>
                                                    <button
                                                        onClick={() => removePage(page.id)}
                                                        className="p-2 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </Reorder.Item>
                                        ))}
                                    </Reorder.Group>
                                </div>

                                <div className="flex justify-center">
                                    <button
                                        onClick={handleOrganize}
                                        disabled={pages.filter(p => p.selected).length === 0}
                                        className="btn-primary !py-5 !px-16 !text-xl flex items-center gap-3 shadow-2xl shadow-primary/40 hover:-translate-y-1 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Layers className="w-6 h-6" /> Organize PDF
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {status === "processing" && (
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-border shadow-xl max-w-2xl mx-auto"
                        >
                            <div className="relative">
                                <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                <Loader2 className="w-10 h-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mt-8 mb-2">Organizing your PDF...</h3>
                            <p className="text-muted-foreground">Reordering pages...</p>
                        </motion.div>
                    )}

                    {status === "success" && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-border shadow-xl max-w-2xl mx-auto text-center"
                        >
                            <div className="bg-emerald-100 p-5 rounded-2xl mb-6">
                                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                            </div>
                            <h3 className="text-3xl font-bold text-foreground mb-2">PDF Organized!</h3>
                            <p className="text-muted-foreground mb-10 max-w-md px-4">
                                Your PDF pages have been reordered successfully.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={handleDownload}
                                    className="btn-primary !py-4 !px-10 flex items-center gap-2"
                                >
                                    <Download className="w-5 h-5" /> Download PDF
                                </button>
                                <button onClick={reset} className="btn-outline flex items-center gap-2">
                                    <RefreshCw className="w-5 h-5" /> Organize Another
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
