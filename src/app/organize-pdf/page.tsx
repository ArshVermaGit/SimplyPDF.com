"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Upload, File, X, Download, Loader2, CheckCircle2, RefreshCw, AlertCircle, GripVertical, Trash2, Layers, Eye, Check } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { uint8ArrayToBlob } from "@/lib/pdf-utils";
import { PDFPreviewModal } from "@/components/PDFPreviewModal";

interface PageInfo {
    id: string;
    pageNumber: number;
    selected: boolean;
    image: string;
}

export default function OrganizePDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pages, setPages] = useState<PageInfo[]>([]);
    const [status, setStatus] = useState<"idle" | "loading" | "ready" | "processing" | "success" | "error">("idle");
    const [resultBlob, setResultBlob] = useState<Blob | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [dragActive, setDragActive] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewPage, setPreviewPage] = useState(0);

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
        setErrorMessage("");
        try {
            console.log("Loading pdfjs-dist...");
            const pdfjsLib = await import("pdfjs-dist");
            const workerUrl = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
            pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

            const arrayBuffer = await pdfFile.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({
                data: new Uint8Array(arrayBuffer),
                useWorkerFetch: true,
                isEvalSupported: false
            });

            const pdfDoc = await loadingTask.promise;
            const pageCount = pdfDoc.numPages;

            const pageInfos: PageInfo[] = [];
            for (let i = 1; i <= pageCount; i++) {
                const page = await pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale: 0.5 });
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d")!;
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                await page.render({ canvasContext: context, viewport } as any).promise;

                pageInfos.push({
                    id: `page-${i - 1}`,
                    pageNumber: i,
                    selected: true,
                    image: canvas.toDataURL("image/jpeg", 0.7),
                });

                (page as any).cleanup?.();
            }

            setPages(pageInfos);
            setStatus("ready");
            await pdfDoc.destroy();
        } catch (error: any) {
            console.error("PDF loading error:", error);
            setErrorMessage(`Failed to load PDF: ${error.message || "Unknown error"}`);
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

    const openPreview = (index: number) => {
        setPreviewPage(index);
        setPreviewOpen(true);
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
                                    <Layers className="w-8 h-8" />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold mb-4">Organize PDF</h1>
                                <p className="text-gray-500 text-lg max-w-xl mx-auto">
                                    Sort, delete, and reorder PDF pages with visual previews.
                                </p>
                            </div>

                            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-xl">
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
                            </div>
                        </motion.div>
                    )}

                    {status === "loading" && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-32 max-w-lg mx-auto text-center"
                        >
                            <div className="relative mb-8">
                                <div className="w-24 h-24 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                                <Loader2 className="w-10 h-10 text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Loading PDF pages...</h2>
                            <p className="text-gray-500">Generating previews...</p>
                        </motion.div>
                    )}

                    {status === "ready" && (
                        <motion.div
                            key="ready"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-6xl mx-auto"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <File className="w-8 h-8" />
                                    <div>
                                        <p className="font-semibold text-lg">{file?.name}</p>
                                        <p className="text-gray-500">{pages.length} pages • {pages.filter(p => p.selected).length} selected</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={reset} className="btn-outline py-2 px-4 text-sm">
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleOrganize}
                                        disabled={pages.filter(p => p.selected).length === 0}
                                        className="btn-primary py-2 px-6 disabled:opacity-50"
                                    >
                                        Apply Changes
                                    </button>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center">
                                <p className="text-gray-600">
                                    <strong>Drag</strong> to reorder • <strong>Click checkbox</strong> to select/deselect • <strong>Click preview</strong> to view full page
                                </p>
                            </div>

                            {/* Page Grid with Reorder */}
                            <Reorder.Group
                                axis="x"
                                values={pages}
                                onReorder={setPages}
                                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                            >
                                {pages.map((page, index) => (
                                    <Reorder.Item
                                        key={page.id}
                                        value={page}
                                        className="cursor-grab active:cursor-grabbing"
                                    >
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            whileHover={{ y: -4 }}
                                            className="relative group"
                                        >
                                            {/* Thumbnail */}
                                            <div
                                                className={`relative overflow-hidden rounded-xl border-2 transition-all ${page.selected
                                                    ? "border-black shadow-lg"
                                                    : "border-gray-200 opacity-50"
                                                    }`}
                                            >
                                                {/* Drag Handle */}
                                                <div className="absolute top-2 left-2 z-10">
                                                    <div className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <GripVertical className="w-4 h-4 text-gray-500" />
                                                    </div>
                                                </div>

                                                {/* Image */}
                                                <div
                                                    className="aspect-[3/4] bg-white cursor-pointer"
                                                    onClick={() => openPreview(index)}
                                                >
                                                    <img
                                                        src={page.image}
                                                        alt={`Page ${page.pageNumber}`}
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>

                                                {/* Hover Overlay */}
                                                <div
                                                    className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none"
                                                >
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="p-3 bg-white rounded-full shadow-xl">
                                                            <Eye className="w-5 h-5" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Page Number */}
                                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black text-white text-xs font-bold rounded">
                                                    {page.pageNumber}
                                                </div>

                                                {/* Selection Checkbox */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); togglePage(page.id); }}
                                                    className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${page.selected
                                                        ? "bg-black border-black text-white"
                                                        : "bg-white border-gray-300 hover:border-black"
                                                        }`}
                                                >
                                                    {page.selected && <Check className="w-3 h-3" />}
                                                </button>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removePage(page.id); }}
                                                    className="absolute bottom-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>
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
                            <h2 className="text-2xl font-bold mb-2">Organizing pages...</h2>
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
                            <h2 className="text-3xl font-bold mb-2">PDF Organized!</h2>
                            <p className="text-gray-500 mb-10">Your pages have been reordered successfully.</p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={handleDownload} className="btn-primary py-4 px-10 flex items-center gap-2">
                                    <Download className="w-5 h-5" />
                                    Download PDF
                                </button>
                                <button onClick={reset} className="btn-outline py-4 px-10 flex items-center gap-2">
                                    <RefreshCw className="w-5 h-5" />
                                    Organize Another
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

            {/* Preview Modal */}
            <PDFPreviewModal
                isOpen={previewOpen}
                onClose={() => setPreviewOpen(false)}
                images={pages.map(p => p.image)}
                currentPage={previewPage}
                onPageChange={setPreviewPage}
                title={file?.name || "PDF Preview"}
            />
        </div>
    );
}
