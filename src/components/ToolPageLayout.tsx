"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Loader2, CheckCircle2, Download, RefreshCw, AlertCircle, ArrowRight } from "lucide-react";
import { FileUploader } from "./FileUploader";
import { downloadFile } from "@/lib/pdf-utils";

interface ToolPageLayoutProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
    accept?: string;
    multiple?: boolean;
    allowReorder?: boolean;
    actionButtonText: string;
    processingText: string;
    successTitle: string;
    successDescription: string;
    downloadFileName: string;
    onProcess: (files: File[]) => Promise<Blob | null>;
}

export function ToolPageLayout({
    title,
    description,
    icon,
    accept = ".pdf",
    multiple = false,
    allowReorder = false,
    actionButtonText,
    processingText,
    successTitle,
    successDescription,
    downloadFileName,
    onProcess,
}: ToolPageLayoutProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
    const [resultBlob, setResultBlob] = useState<Blob | null>(null);
    const [errorMessage, setErrorMessage] = useState("");

    const handleFilesChange = (newFiles: File[]) => {
        setFiles(newFiles);
    };

    const handleProcess = async () => {
        if (files.length === 0) return;
        setStatus("processing");
        setErrorMessage("");

        try {
            const result = await onProcess(files);
            if (result) {
                setResultBlob(result);
                setStatus("success");
            } else {
                throw new Error("Processing failed");
            }
        } catch (error) {
            console.error(error);
            setErrorMessage(error instanceof Error ? error.message : "An error occurred");
            setStatus("error");
        }
    };

    const handleDownload = () => {
        if (resultBlob) {
            downloadFile(new Uint8Array(0), downloadFileName);
            const url = URL.createObjectURL(resultBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = downloadFileName;
            link.click();
            URL.revokeObjectURL(url);
        }
    };

    const reset = () => {
        setFiles([]);
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
                            {/* Header */}
                            <div className="text-center mb-12">
                                {icon && (
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-6">
                                        {icon}
                                    </div>
                                )}
                                <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
                                <p className="text-gray-500 text-lg max-w-xl mx-auto">{description}</p>
                            </div>

                            {/* File Uploader */}
                            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-xl">
                                <FileUploader
                                    files={files}
                                    onFilesChange={handleFilesChange}
                                    accept={accept}
                                    multiple={multiple}
                                    allowReorder={allowReorder}
                                />

                                {files.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-8 flex justify-center"
                                    >
                                        <button
                                            onClick={handleProcess}
                                            className="btn-primary text-lg py-4 px-12 flex items-center gap-3 shadow-2xl shadow-black/20"
                                        >
                                            {actionButtonText}
                                            <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </motion.div>
                                )}
                            </div>

                            {/* Features */}
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
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="flex flex-col items-center justify-center py-32 max-w-lg mx-auto text-center"
                        >
                            <div className="relative mb-8">
                                <div className="w-24 h-24 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                                <Loader2 className="w-10 h-10 text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">{processingText}</h2>
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
                            <h2 className="text-3xl font-bold mb-2">{successTitle}</h2>
                            <p className="text-gray-500 mb-10">{successDescription}</p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={handleDownload}
                                    className="btn-primary py-4 px-10 flex items-center gap-2"
                                >
                                    <Download className="w-5 h-5" />
                                    Download File
                                </button>
                                <button
                                    onClick={reset}
                                    className="btn-outline py-4 px-10 flex items-center gap-2"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    Process Another
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

                            <button
                                onClick={reset}
                                className="btn-primary py-4 px-10 flex items-center gap-2"
                            >
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
