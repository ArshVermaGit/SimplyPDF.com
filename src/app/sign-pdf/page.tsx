"use client";

export const dynamic = "force-dynamic";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, File, X, Download, Loader2, CheckCircle2, RefreshCw, AlertCircle, FileSignature, Pencil, Type, Image, ArrowRight, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { uint8ArrayToBlob } from "@/lib/pdf-utils";

type SignatureMode = "draw" | "type" | "upload";

export default function SignPDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [signatureMode, setSignatureMode] = useState<SignatureMode>("draw");
    const [signatureText, setSignatureText] = useState("");
    const [signatureImage, setSignatureImage] = useState<string | null>(null);
    const [status, setStatus] = useState<"idle" | "signing" | "processing" | "success" | "error">("idle");
    const [resultBlob, setResultBlob] = useState<Blob | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [dragActive, setDragActive] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [pageImages, setPageImages] = useState<string[]>([]);
    const [signaturePosition, setSignaturePosition] = useState({ x: 50, y: 50 });
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile?.type === "application/pdf") {
            setFile(droppedFile);
            await loadPdfPreview(droppedFile);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            await loadPdfPreview(selectedFile);
        }
    };

    const loadPdfPreview = async (pdfFile: File) => {
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
            setTotalPages(pdfDoc.numPages);

            const images: string[] = [];
            for (let i = 1; i <= Math.min(pdfDoc.numPages, 10); i++) {
                const page = await pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale: 1 });
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d")!;
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                await page.render({ canvasContext: context, viewport } as any).promise;
                images.push(canvas.toDataURL("image/jpeg", 0.5));
                (page as any).cleanup?.();
            }
            setPageImages(images);
            setStatus("signing");
            await pdfDoc.destroy();
        } catch (error) {
            console.error(error);
            setErrorMessage("Failed to load PDF preview");
            setStatus("error");
        }
    };

    // Canvas drawing handlers
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
    }, [signatureMode]);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        setIsDrawing(true);
        setHasDrawn(true);

        const rect = canvas.getBoundingClientRect();
        const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
    };

    const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (uploadedFile) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setSignatureImage(event.target?.result as string);
            };
            reader.readAsDataURL(uploadedFile);
        }
    };

    const getSignatureDataUrl = (): string | null => {
        if (signatureMode === "draw") {
            return canvasRef.current?.toDataURL("image/png") || null;
        } else if (signatureMode === "type" && signatureText) {
            const canvas = document.createElement("canvas");
            canvas.width = 400;
            canvas.height = 100;
            const ctx = canvas.getContext("2d")!;
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#000";
            ctx.font = "italic 48px 'Dancing Script', cursive, Georgia, serif";
            ctx.textBaseline = "middle";
            ctx.fillText(signatureText, 20, 50);
            return canvas.toDataURL("image/png");
        } else if (signatureMode === "upload" && signatureImage) {
            return signatureImage;
        }
        return null;
    };

    const handleApplySignature = async () => {
        if (!file) return;

        const signatureDataUrl = getSignatureDataUrl();
        if (!signatureDataUrl) {
            setErrorMessage("Please create a signature first");
            return;
        }

        setStatus("processing");
        setErrorMessage("");

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);

            // Convert data URL to bytes
            const signatureData = signatureDataUrl.split(",")[1];
            const signatureBytes = Uint8Array.from(atob(signatureData), c => c.charCodeAt(0));

            const signatureImageEmbed = await pdf.embedPng(signatureBytes);
            const page = pdf.getPage(currentPage);
            const { width, height } = page.getSize();

            const sigWidth = 150;
            const sigHeight = (signatureImageEmbed.height / signatureImageEmbed.width) * sigWidth;

            page.drawImage(signatureImageEmbed, {
                x: (signaturePosition.x / 100) * (width - sigWidth),
                y: height - (signaturePosition.y / 100) * (height - sigHeight) - sigHeight,
                width: sigWidth,
                height: sigHeight,
            });

            const pdfBytes = await pdf.save();
            setResultBlob(uint8ArrayToBlob(pdfBytes));
            setStatus("success");
        } catch (error) {
            console.error(error);
            setErrorMessage("Failed to apply signature. Please try again.");
            setStatus("error");
        }
    };

    const handleDownload = () => {
        if (!resultBlob) return;
        const url = URL.createObjectURL(resultBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "signed.pdf";
        link.click();
        URL.revokeObjectURL(url);
    };

    const reset = () => {
        setFile(null);
        setSignatureMode("draw");
        setSignatureText("");
        setSignatureImage(null);
        setStatus("idle");
        setResultBlob(null);
        setErrorMessage("");
        setCurrentPage(0);
        setPageImages([]);
        setHasDrawn(false);
    };

    const isSignatureReady = () => {
        if (signatureMode === "draw") return hasDrawn;
        if (signatureMode === "type") return signatureText.trim().length > 0;
        if (signatureMode === "upload") return signatureImage !== null;
        return false;
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
                                    <FileSignature className="w-8 h-8" />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold mb-4">Sign PDF</h1>
                                <p className="text-gray-500 text-lg max-w-xl mx-auto">
                                    Add your digital signature to any PDF document. Draw, type, or upload your signature.
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

                    {status === "signing" && (
                        <motion.div
                            key="signing"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-6xl mx-auto"
                        >
                            <div className="grid lg:grid-cols-2 gap-8">
                                {/* PDF Preview */}
                                <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xl">
                                    <h3 className="text-lg font-semibold mb-4">PDF Preview - Page {currentPage + 1} of {totalPages}</h3>

                                    <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-[3/4] flex items-center justify-center">
                                        {pageImages[currentPage] && (
                                            <img
                                                src={pageImages[currentPage]}
                                                alt={`Page ${currentPage + 1}`}
                                                className="max-w-full max-h-full object-contain"
                                            />
                                        )}

                                        {/* Signature position indicator */}
                                        {isSignatureReady() && (
                                            <div
                                                className="absolute w-24 h-10 border-2 border-dashed border-black bg-white/80 flex items-center justify-center text-xs font-medium"
                                                style={{
                                                    left: `${signaturePosition.x}%`,
                                                    top: `${signaturePosition.y}%`,
                                                    transform: "translate(-50%, -50%)",
                                                }}
                                            >
                                                Signature
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-4">
                                        <button
                                            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                            disabled={currentPage === 0}
                                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <span className="text-sm text-gray-500">Select page to sign</span>
                                        <button
                                            onClick={() => setCurrentPage(Math.min(pageImages.length - 1, currentPage + 1))}
                                            disabled={currentPage >= pageImages.length - 1}
                                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Position controls */}
                                    <div className="mt-4 space-y-3">
                                        <div>
                                            <label className="text-sm text-gray-600 block mb-1">Horizontal Position</label>
                                            <input
                                                type="range"
                                                min="10"
                                                max="90"
                                                value={signaturePosition.x}
                                                onChange={(e) => setSignaturePosition(p => ({ ...p, x: Number(e.target.value) }))}
                                                className="w-full accent-black"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-600 block mb-1">Vertical Position</label>
                                            <input
                                                type="range"
                                                min="10"
                                                max="90"
                                                value={signaturePosition.y}
                                                onChange={(e) => setSignaturePosition(p => ({ ...p, y: Number(e.target.value) }))}
                                                className="w-full accent-black"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Signature Creation */}
                                <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xl">
                                    <h3 className="text-lg font-semibold mb-4">Create Your Signature</h3>

                                    {/* Mode tabs */}
                                    <div className="flex gap-2 mb-6">
                                        {[
                                            { mode: "draw" as const, icon: Pencil, label: "Draw" },
                                            { mode: "type" as const, icon: Type, label: "Type" },
                                            { mode: "upload" as const, icon: Image, label: "Upload" },
                                        ].map(({ mode, icon: Icon, label }) => (
                                            <button
                                                key={mode}
                                                onClick={() => setSignatureMode(mode)}
                                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${signatureMode === mode
                                                    ? "bg-black text-white"
                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                    }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Draw mode */}
                                    {signatureMode === "draw" && (
                                        <div>
                                            <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
                                                <canvas
                                                    ref={canvasRef}
                                                    width={400}
                                                    height={150}
                                                    className="w-full cursor-crosshair touch-none"
                                                    onMouseDown={startDrawing}
                                                    onMouseMove={draw}
                                                    onMouseUp={stopDrawing}
                                                    onMouseLeave={stopDrawing}
                                                    onTouchStart={startDrawing}
                                                    onTouchMove={draw}
                                                    onTouchEnd={stopDrawing}
                                                />
                                            </div>
                                            <button
                                                onClick={clearCanvas}
                                                className="mt-3 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                                            >
                                                <Trash2 className="w-4 h-4" /> Clear
                                            </button>
                                        </div>
                                    )}

                                    {/* Type mode */}
                                    {signatureMode === "type" && (
                                        <div>
                                            <input
                                                type="text"
                                                value={signatureText}
                                                onChange={(e) => setSignatureText(e.target.value)}
                                                placeholder="Type your name"
                                                className="w-full px-4 py-4 text-2xl italic border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none font-serif"
                                                style={{ fontFamily: "'Dancing Script', cursive, Georgia, serif" }}
                                            />
                                            <p className="text-sm text-gray-400 mt-2">Your signature will appear in cursive style</p>
                                        </div>
                                    )}

                                    {/* Upload mode */}
                                    {signatureMode === "upload" && (
                                        <div>
                                            {signatureImage ? (
                                                <div className="relative">
                                                    <img
                                                        src={signatureImage}
                                                        alt="Signature"
                                                        className="w-full h-32 object-contain bg-gray-50 rounded-xl border border-gray-200"
                                                    />
                                                    <button
                                                        onClick={() => setSignatureImage(null)}
                                                        className="absolute top-2 right-2 p-1 bg-white rounded-full shadow"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gray-400">
                                                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                                    <span className="text-sm text-gray-500">Upload signature image</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleSignatureUpload}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-4 mt-8">
                                        <button
                                            onClick={reset}
                                            className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-200 font-medium hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleApplySignature}
                                            disabled={!isSignatureReady()}
                                            className="flex-1 py-3 px-6 rounded-xl bg-black text-white font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            Apply Signature
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
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
                            <h2 className="text-2xl font-bold mb-2">Applying signature...</h2>
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
                            <h2 className="text-3xl font-bold mb-2">PDF Signed Successfully!</h2>
                            <p className="text-gray-500 mb-10">Your signature has been added to the document.</p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={handleDownload}
                                    className="btn-primary py-4 px-10 flex items-center gap-2"
                                >
                                    <Download className="w-5 h-5" />
                                    Download Signed PDF
                                </button>
                                <button
                                    onClick={reset}
                                    className="btn-outline py-4 px-10 flex items-center gap-2"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    Sign Another
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
