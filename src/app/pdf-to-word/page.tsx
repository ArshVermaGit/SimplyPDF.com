"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Download, Loader2, CheckCircle2, RefreshCw, AlertCircle, FileText, ArrowRight } from "lucide-react";
import { formatFileSize } from "@/lib/pdf-utils";
import {
    AnimatedBackground,
    FloatingDecorations,
    ToolHeader,
    ToolCard,
    ProcessingState
} from "@/components/ToolPageElements";
import { useHistory } from "@/context/HistoryContext";

export default function PDFToWordPage() {
    const { addToHistory } = useHistory();
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
    const [resultBlob, setResultBlob] = useState<Blob | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [dragActive, setDragActive] = useState(false);
    const [progress, setProgress] = useState(0);

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

    const handleConvert = async () => {
        if (!file) return;
        setStatus("processing");
        setErrorMessage("");
        setProgress(0);

        try {
            console.log("Loading pdfjs-dist...");
            const pdfjsLib = await import("pdfjs-dist");
            const workerUrl = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
            pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

            const docx = await import("docx");

            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({
                data: new Uint8Array(arrayBuffer),
                useWorkerFetch: true,
                isEvalSupported: false
            });

            const pdfDoc = await loadingTask.promise;
            const numPages = pdfDoc.numPages;

            const paragraphs: any[] = [];

            for (let i = 1; i <= numPages; i++) {
                setProgress(Math.round((i / numPages) * 100));

                const page = await pdfDoc.getPage(i);
                const textContent = await page.getTextContent();

                // Group by Y position to form lines
                const items = textContent.items as any[];
                const lines: { [y: number]: string[] } = {};

                items.forEach(item => {
                    const y = Math.round(item.transform[5]);
                    if (!lines[y]) lines[y] = [];
                    lines[y].push(item.str);
                });

                // Sort by Y position (top to bottom)
                const sortedYs = Object.keys(lines).map(Number).sort((a, b) => b - a);

                // Add page header
                if (i > 1) {
                    paragraphs.push(new docx.Paragraph({
                        children: [],
                        spacing: { before: 400 },
                    }));
                }

                // Add text lines
                for (const y of sortedYs) {
                    const lineText = lines[y].join(" ").trim();
                    if (lineText) {
                        paragraphs.push(new docx.Paragraph({
                            children: [new docx.TextRun({ text: lineText })],
                            spacing: { after: 100 },
                        }));
                    }
                }

                (page as any).cleanup?.();
            }

            // Create Word document
            const doc = new docx.Document({
                sections: [{
                    properties: {},
                    children: paragraphs,
                }],
            });

            const buffer = await docx.Packer.toBlob(doc);
            setResultBlob(buffer);
            setStatus("success");

            if (file) {
                addToHistory("PDF to Word", file.name, "Converted to Word");
            }

            await pdfDoc.destroy();
        } catch (error: any) {
            console.error(error);
            setErrorMessage(error instanceof Error ? error.message : "Failed to convert PDF to Word");
            setStatus("error");
        }
    };

    const handleDownload = () => {
        if (!resultBlob) return;
        const url = URL.createObjectURL(resultBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file?.name.replace(/\.pdf$/i, ".docx") || "document.docx";
        link.click();
        URL.revokeObjectURL(url);
    };

    const reset = () => {
        setFile(null);
        setStatus("idle");
        setResultBlob(null);
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
                                title="PDF to Word"
                                description="Convert PDF files to editable Word documents (.docx)."
                                icon={FileText}
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
                                                <FileText className="w-6 h-6 text-red-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold truncate">{file.name}</p>
                                                <p className="text-sm text-gray-400 font-medium">{formatFileSize(file.size)}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleConvert}
                                            className="mt-8 btn-primary text-xl py-5 px-16 flex items-center gap-3 shadow-2xl shadow-black/10 group hover:scale-[1.02] transition-all"
                                        >
                                            Convert to Word
                                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
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
                            title="Converting to Word..."
                            description="Extracting text from PDF..."
                            progress={progress}
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
                            <h2 className="text-3xl font-bold mb-2">Conversion Complete!</h2>
                            <p className="text-gray-500 mb-10 text-lg">Your PDF has been converted to Word format.</p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={handleDownload} className="btn-primary py-4 px-10 flex items-center gap-2 text-lg">
                                    <Download className="w-5 h-5" />
                                    Download Word
                                </button>
                                <button onClick={reset} className="btn-outline py-4 px-10 flex items-center gap-2 text-lg">
                                    <RefreshCw className="w-5 h-5" />
                                    Convert Another
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
                            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-red-100">
                                <AlertCircle className="w-12 h-12" />
                            </div>
                            <h2 className="text-3xl font-bold mb-2">Something went wrong</h2>
                            <p className="text-gray-500 mb-10 text-lg">{errorMessage}</p>

                            <button onClick={reset} className="btn-primary py-4 px-10 flex items-center gap-2 text-lg">
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
