"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Download, Loader2, CheckCircle2, RefreshCw, AlertCircle, ScanLine, FileText, Copy } from "lucide-react";
import { formatFileSize } from "@/lib/pdf-utils";
import {
    AnimatedBackground,
    FloatingDecorations,
    ToolHeader,
    ToolCard,
    ProcessingState
} from "@/components/ToolPageElements";

export default function OCRPDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
    const [extractedText, setExtractedText] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [dragActive, setDragActive] = useState(false);
    const [progress, setProgress] = useState(0);
    const [copied, setCopied] = useState(false);

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

    const handleOCR = async () => {
        if (!file) return;
        setStatus("processing");
        setErrorMessage("");
        setProgress(0);

        try {
            console.log("Loading pdfjs-dist...");
            const pdfjsLib = await import("pdfjs-dist");
            const workerUrl = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
            pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

            const Tesseract = await import("tesseract.js");

            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({
                data: new Uint8Array(arrayBuffer),
                useWorkerFetch: true,
                isEvalSupported: false
            });

            const pdfDoc = await loadingTask.promise;
            const numPages = pdfDoc.numPages;

            let fullText = "";

            for (let i = 1; i <= numPages; i++) {
                setProgress(Math.round((i / numPages) * 100));

                const page = await pdfDoc.getPage(i);

                // First try to get existing text
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(" ");

                if (pageText.trim().length > 50) {
                    // Page has existing text, use it
                    fullText += `\n--- Page ${i} ---\n${pageText}\n`;
                } else {
                    // Page might be scanned, use OCR
                    const viewport = page.getViewport({ scale: 2 });
                    const canvas = document.createElement("canvas");
                    const context = canvas.getContext("2d")!;
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({ canvasContext: context, viewport } as any).promise;

                    const imageData = canvas.toDataURL("image/png");

                    const result = await Tesseract.recognize(imageData, "eng", {
                        logger: (m: any) => {
                            if (m.status === "recognizing text") {
                                setProgress(Math.round(((i - 1) / numPages + m.progress / numPages) * 100));
                            }
                        },
                    });

                    fullText += `\n--- Page ${i} (OCR) ---\n${result.data.text}\n`;
                    (page as any).cleanup?.();
                }
            }

            setExtractedText(fullText.trim());
            setStatus("success");
            await pdfDoc.destroy();
        } catch (error) {
            console.error(error);
            setErrorMessage(error instanceof Error ? error.message : "Failed to process PDF with OCR");
            setStatus("error");
        }
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(extractedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadText = () => {
        const blob = new Blob([extractedText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "extracted-text.txt";
        link.click();
        URL.revokeObjectURL(url);
    };

    const reset = () => {
        setFile(null);
        setStatus("idle");
        setExtractedText("");
        setErrorMessage("");
        setProgress(0);
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
                                title="OCR PDF"
                                description="Extract text from scanned PDFs using optical character recognition."
                                icon={ScanLine}
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

                                {file && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-8 flex flex-col items-center"
                                    >
                                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl w-full max-w-md">
                                            <div className="p-3 bg-white rounded-xl shadow-sm">
                                                <FileText className="w-6 h-6 text-black" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold truncate">{file.name}</p>
                                                <p className="text-sm text-gray-400 font-medium">{formatFileSize(file.size)}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleOCR}
                                            className="mt-8 btn-primary text-xl py-5 px-16 flex items-center gap-3 shadow-2xl shadow-black/10 group hover:scale-[1.02] transition-all"
                                        >
                                            <ScanLine className="w-6 h-6" />
                                            Extract Text
                                        </button>
                                    </motion.div>
                                )}
                            </ToolCard>

                            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                                {[
                                    { label: "100% Free", desc: "No hidden fees" },
                                    { label: "Private", desc: "Files stay on device" },
                                    { label: "Fast", desc: "Instant processing" },
                                ].map((feature) => (
                                    <div key={feature.label} className="p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div className="font-bold text-lg mb-1">{feature.label}</div>
                                        <div className="text-gray-400 text-sm font-medium">{feature.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {status === "processing" && (
                        <ProcessingState
                            title="Analyzing PDF content..."
                            description="Running OCR algorithms on scanned pages..."
                            progress={progress}
                        />
                    )}

                    {status === "success" && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-4xl mx-auto"
                        >
                            <div className="text-center mb-10">
                                <div className="w-20 h-20 bg-black text-white rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <h2 className="text-4xl font-extrabold mb-2 tracking-tight">Text Extracted!</h2>
                                <p className="text-gray-500 text-lg">Analysis complete. We found the following text in your document.</p>
                            </div>

                            <ToolCard className="p-8">
                                <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                                    <h3 className="font-bold text-xl flex items-center gap-2">
                                        <FileText className="w-5 h-5" />
                                        Extracted Content
                                    </h3>
                                    <div className="flex gap-3 w-full md:w-auto">
                                        <button
                                            onClick={handleCopy}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-bold text-sm"
                                        >
                                            <Copy className="w-4 h-4" />
                                            {copied ? "Copied!" : "Copy Text"}
                                        </button>
                                        <button
                                            onClick={handleDownloadText}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-bold text-sm shadow-lg shadow-black/10"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download .txt
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-6 max-h-[500px] overflow-y-auto border border-gray-100">
                                    <pre className="whitespace-pre-wrap text-sm font-mono text-gray-700 leading-relaxed">
                                        {extractedText}
                                    </pre>
                                </div>
                            </ToolCard>

                            <div className="flex justify-center mt-12">
                                <button
                                    onClick={reset}
                                    className="btn-outline py-4 px-10 flex items-center gap-3 text-lg font-bold"
                                >
                                    <RefreshCw className="w-6 h-6" />
                                    OCR Another Document
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
                            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center mb-8">
                                <AlertCircle className="w-12 h-12" />
                            </div>
                            <h2 className="text-4xl font-extrabold mb-4 tracking-tight">Processing Error</h2>
                            <p className="text-gray-500 text-lg mb-12">{errorMessage}</p>

                            <button onClick={reset} className="w-full btn-primary py-5 px-12 flex items-center justify-center gap-3 text-lg font-bold">
                                <RefreshCw className="w-6 h-6" />
                                Try Again
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
