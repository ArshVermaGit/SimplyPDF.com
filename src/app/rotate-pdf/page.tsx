"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, File, Download, Loader2, CheckCircle2, RefreshCw, AlertCircle, RotateCw, Eye, Check } from "lucide-react";
import { rotatePDF, formatFileSize, uint8ArrayToBlob } from "@/lib/pdf-utils";
import { PDFPreviewModal } from "@/components/PDFPreviewModal";
import {
    AnimatedBackground,
    FloatingDecorations,
    ToolHeader,
    ToolCard,
    ProcessingState
} from "@/components/ToolPageElements";
import { useHistory } from "@/context/HistoryContext";

interface PageInfo {
    pageNumber: number;
    image: string;
    rotation: 0 | 90 | 180 | 270;
    selected: boolean;
}

export default function RotatePDFPage() {
    const { addToHistory } = useHistory();
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<"idle" | "loading" | "ready" | "processing" | "success" | "error">("idle");
    const [resultBlob, setResultBlob] = useState<Blob | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [dragActive, setDragActive] = useState(false);
    const [pages, setPages] = useState<PageInfo[]>([]);
    const [globalRotation, setGlobalRotation] = useState<90 | 180 | 270>(90);
    const [rotateMode, setRotateMode] = useState<"all" | "selected">("all");
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
            const numPages = pdfDoc.numPages;
            console.log(`${pdfFile.name} has ${numPages} pages`);

            const pageInfos: PageInfo[] = [];
            for (let i = 1; i <= numPages; i++) {
                const page = await pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale: 0.4 });
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d")!;
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                await page.render({ canvasContext: context, viewport } as any).promise;

                pageInfos.push({
                    pageNumber: i,
                    image: canvas.toDataURL("image/jpeg", 0.7),
                    rotation: 0,
                    selected: true,
                });

                (page as any).cleanup?.();
            }

            setPages(pageInfos);
            setStatus("ready");
            await pdfDoc.destroy();
        } catch (error: any) {
            console.error("PDF loading error:", error);
            setErrorMessage(`Failed to load PDF pages: ${error.message || "Unknown error"}`);
            setStatus("error");
        }
    };

    const togglePage = (pageNumber: number) => {
        setPages(pages.map(p =>
            p.pageNumber === pageNumber ? { ...p, selected: !p.selected } : p
        ));
    };

    const handleRotate = async () => {
        if (!file) return;
        setStatus("processing");
        setErrorMessage("");

        try {
            const pdfBytes = await rotatePDF(file, globalRotation);
            setResultBlob(uint8ArrayToBlob(pdfBytes));
            setStatus("success");

            if (file) {
                addToHistory("Rotated PDF", file.name, `All pages rotated ${globalRotation}°`);
            }
        } catch (error) {
            console.error(error);
            setErrorMessage(error instanceof Error ? error.message : "Failed to rotate PDF");
            setStatus("error");
        }
    };

    const handleDownload = () => {
        if (!resultBlob) return;
        const url = URL.createObjectURL(resultBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `rotated-${file?.name || "document.pdf"}`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const reset = () => {
        setFile(null);
        setStatus("idle");
        setPages([]);
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
                                title="Rotate PDF"
                                description="Rotate your PDF pages with visual preview."
                                icon={RotateCw}
                            />

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
                        </motion.div>
                    )}

                    {status === "loading" && (
                        <ProcessingState
                            message="Loading PDF..."
                            description="Generating previews..."
                        />
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
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <File className="w-8 h-8" />
                                    <div>
                                        <p className="font-semibold text-lg">{file?.name}</p>
                                        <p className="text-gray-500">{pages.length} pages</p>
                                    </div>
                                </div>
                                <button onClick={reset} className="btn-outline py-2 px-4 text-sm">
                                    Cancel
                                </button>
                            </div>

                            {/* Rotation Options */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                                <h3 className="font-semibold mb-4">Rotation Angle</h3>
                                <div className="flex flex-wrap gap-3">
                                    {[
                                        { value: 90, label: "90°", desc: "Rotate right" },
                                        { value: 180, label: "180°", desc: "Flip upside down" },
                                        { value: 270, label: "270°", desc: "Rotate left" },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => setGlobalRotation(option.value as 90 | 180 | 270)}
                                            className={`flex-1 min-w-32 p-4 rounded-xl border-2 text-center transition-all ${globalRotation === option.value
                                                ? "border-black bg-gray-50"
                                                : "border-gray-200 hover:border-gray-400"
                                                }`}
                                        >
                                            <div className="flex items-center justify-center gap-2 mb-1">
                                                <RotateCw className="w-5 h-5" style={{ transform: `rotate(${option.value}deg)` }} />
                                                <span className="font-bold text-lg">{option.label}</span>
                                            </div>
                                            <p className="text-sm text-gray-500">{option.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Page Preview Grid */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                                <h3 className="font-semibold mb-4">Page Preview (Click to view full page)</h3>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                    {pages.map((page, index) => (
                                        <motion.div
                                            key={page.pageNumber}
                                            layout
                                            whileHover={{ y: -2, scale: 1.02 }}
                                            className="relative group cursor-pointer"
                                            onClick={() => { setPreviewPage(index); setPreviewOpen(true); }}
                                        >
                                            <div className="relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-black transition-all">
                                                <div
                                                    className="aspect-[3/4] bg-white transition-transform duration-500"
                                                    style={{ transform: `rotate(${globalRotation}deg)` }}
                                                >
                                                    <img
                                                        src={page.image}
                                                        alt={`Page ${page.pageNumber}`}
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>

                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Eye className="w-5 h-5 text-white" />
                                                    </div>
                                                </div>

                                                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black text-white text-xs font-bold rounded">
                                                    {page.pageNumber}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="flex justify-center">
                                <button onClick={handleRotate} className="btn-primary py-4 px-12 text-lg">
                                    <RotateCw className="w-5 h-5 inline mr-2" />
                                    Rotate All Pages
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {status === "processing" && (
                        <ProcessingState
                            message="Rotating pages..."
                            description="This won't take long..."
                        />
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
                            <h2 className="text-3xl font-bold mb-2">PDF Rotated!</h2>
                            <p className="text-gray-500 mb-10">All pages rotated {globalRotation}°</p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={handleDownload} className="btn-primary py-4 px-10 flex items-center gap-2">
                                    <Download className="w-5 h-5" />
                                    Download PDF
                                </button>
                                <button onClick={reset} className="btn-outline py-4 px-10 flex items-center gap-2">
                                    <RefreshCw className="w-5 h-5" />
                                    Rotate Another
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
