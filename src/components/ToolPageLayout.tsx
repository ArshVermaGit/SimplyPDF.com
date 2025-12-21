"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Loader2, CheckCircle2, Download, RefreshCw, AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { FileUploader } from "./FileUploader";
import { downloadFile } from "@/lib/pdf-utils";
import {
    AnimatedBackground,
    FloatingDecorations,
    ToolHeader,
    ToolCard,
    ProcessingState
} from "./ToolPageElements";

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

// Success particles animation
const SuccessParticles = () => {
    const particles = Array.from({ length: 12 }, (_, i) => i);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
            {particles.map((i) => (
                <motion.div
                    key={i}
                    initial={{
                        opacity: 0,
                        scale: 0,
                        x: 0,
                        y: 0
                    }}
                    animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0.5],
                        x: Math.cos(i * 30 * Math.PI / 180) * 100,
                        y: Math.sin(i * 30 * Math.PI / 180) * 100 - 50
                    }}
                    transition={{
                        duration: 1,
                        delay: i * 0.05,
                        ease: "easeOut"
                    }}
                    className="absolute left-1/2 top-1/2 w-2 h-2 bg-black rounded-full"
                />
            ))}
        </div>
    );
};

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
    const [showParticles, setShowParticles] = useState(false);

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
                setShowParticles(true);
                setTimeout(() => setShowParticles(false), 1500);
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
            downloadFile(resultBlob, downloadFileName);
        }
    };

    const reset = () => {
        setFiles([]);
        setStatus("idle");
        setResultBlob(null);
        setErrorMessage("");
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" as const }
        }
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
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, y: -30, transition: { duration: 0.3 } }}
                            className="max-w-4xl mx-auto"
                        >
                            {/* Header */}
                            <ToolHeader
                                title={title}
                                description={description}
                                icon={icon}
                            />

                            {/* File Uploader Card */}
                            <motion.div
                                variants={itemVariants}
                                className="relative"
                            >
                                <ToolCard className="p-8 md:p-10">
                                    <FileUploader
                                        files={files}
                                        onFilesChange={handleFilesChange}
                                        accept={accept}
                                        multiple={multiple}
                                        allowReorder={allowReorder}
                                    />

                                    {files.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                            className="mt-8 flex justify-center"
                                        >
                                            <motion.button
                                                onClick={handleProcess}
                                                className="group relative btn-primary text-lg py-4 px-12 flex items-center gap-3"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <span className="relative z-10 flex items-center gap-3">
                                                    {actionButtonText}
                                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                </span>
                                            </motion.button>
                                        </motion.div>
                                    )}
                                </ToolCard>
                            </motion.div>

                            {/* Features */}
                            <motion.div
                                variants={itemVariants}
                                className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
                            >
                                {[
                                    { icon: "🔒", label: "100% Private", desc: "Files never leave your device" },
                                    { icon: "⚡", label: "Lightning Fast", desc: "Instant local processing" },
                                    { icon: "✨", label: "Completely Free", desc: "No hidden fees or limits" },
                                ].map((feature, i) => (
                                    <motion.div
                                        key={feature.label}
                                        className="group relative p-6 rounded-2xl bg-gradient-to-b from-gray-50 to-white border border-gray-100 hover:border-gray-200 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-500"
                                        whileHover={{ y: -5 }}
                                    >
                                        <span className="text-2xl mb-3 block">{feature.icon}</span>
                                        <div className="font-semibold text-lg mb-1">{feature.label}</div>
                                        <div className="text-gray-500 text-sm">{feature.desc}</div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </motion.div>
                    )}

                    {status === "processing" && (
                        <ProcessingState
                            title={processingText}
                            description="This won't take long..."
                        />
                    )}

                    {status === "success" && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-24 max-w-lg mx-auto text-center relative"
                        >
                            {showParticles && <SuccessParticles />}

                            <motion.div
                                className="relative mb-8"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                            >
                                <motion.div
                                    className="w-24 h-24 bg-black rounded-full flex items-center justify-center"
                                    animate={{ boxShadow: ["0 0 0 0 rgba(0,0,0,0.2)", "0 0 0 20px rgba(0,0,0,0)", "0 0 0 0 rgba(0,0,0,0)"] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    <CheckCircle2 className="w-12 h-12 text-white" />
                                </motion.div>
                            </motion.div>

                            <motion.h2
                                className="text-3xl md:text-4xl font-bold mb-3"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                {successTitle}
                            </motion.h2>
                            <motion.p
                                className="text-gray-500 text-lg mb-10"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                {successDescription}
                            </motion.p>

                            <motion.div
                                className="flex flex-col sm:flex-row gap-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <motion.button
                                    onClick={handleDownload}
                                    className="btn-primary py-4 px-10 flex items-center gap-2 text-lg"
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    <Download className="w-5 h-5" />
                                    Download File
                                </motion.button>
                                <motion.button
                                    onClick={reset}
                                    className="btn-outline py-4 px-10 flex items-center gap-2"
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    Process Another
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    )}

                    {status === "error" && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-24 max-w-lg mx-auto text-center"
                        >
                            <motion.div
                                className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-50 text-red-600 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-red-100"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 200 }}
                            >
                                <AlertCircle className="w-12 h-12" />
                            </motion.div>
                            <h2 className="text-3xl font-bold mb-3">Something went wrong</h2>
                            <p className="text-gray-500 mb-10 text-lg">{errorMessage}</p>

                            <motion.button
                                onClick={reset}
                                className="btn-primary py-4 px-10 flex items-center gap-2"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <RefreshCw className="w-5 h-5" />
                                Try Again
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
