"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Download, Loader2, CheckCircle2, RefreshCw, AlertCircle, FileText, ArrowRight } from "lucide-react";
import { formatFileSize } from "@/lib/pdf-utils";

export default function PDFToWordPage() {
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
            // Dynamic imports
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

            const docx = await import("docx");

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const numPages = pdf.numPages;

            const paragraphs: any[] = [];

            for (let i = 1; i <= numPages; i++) {
                setProgress(Math.round((i / numPages) * 100));

                const page = await pdf.getPage(i);
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
        } catch (error) {
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
                                    <FileText className="w-8 h-8" />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold mb-4">PDF to Word</h1>
                                <p className="text-gray-500 text-lg max-w-xl mx-auto">
                                    Convert PDF files to editable Word documents (.docx).
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

                                {file && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-6"
                                    >
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-8 h-8 text-red-500" />
                                                <div>
                                                    <p className="font-medium">{file.name}</p>
                                                    <p className="text-sm text-gray-400">{formatFileSize(file.size)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex justify-center">
                                            <button
                                                onClick={handleConvert}
                                                className="btn-primary text-lg py-4 px-12 flex items-center gap-3"
                                            >
                                                Convert to Word
                                                <ArrowRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </motion.div>
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
                            <h2 className="text-2xl font-bold mb-2">Converting to Word...</h2>
                            <p className="text-gray-500 mb-4">Extracting text from PDF...</p>
                            <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-black transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-sm text-gray-400 mt-2">{progress}%</p>
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
                            <h2 className="text-3xl font-bold mb-2">Conversion Complete!</h2>
                            <p className="text-gray-500 mb-10">Your PDF has been converted to Word format.</p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={handleDownload} className="btn-primary py-4 px-10 flex items-center gap-2">
                                    <Download className="w-5 h-5" />
                                    Download Word
                                </button>
                                <button onClick={reset} className="btn-outline py-4 px-10 flex items-center gap-2">
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
