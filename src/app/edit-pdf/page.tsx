"use client";

export const dynamic = "force-dynamic";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, File, Download, Loader2, CheckCircle2, RefreshCw, AlertCircle, Type, Pencil, ArrowRight, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { uint8ArrayToBlob } from "@/lib/pdf-utils";

type Tool = "text" | "draw" | "rectangle" | "circle" | "select";

interface Annotation {
    id: string;
    type: "text" | "draw" | "rectangle" | "circle";
    page: number;
    x: number;
    y: number;
    width?: number;
    height?: number;
    content?: string;
    color: string;
    path?: { x: number; y: number }[];
}

export default function EditPDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<"idle" | "editing" | "processing" | "success" | "error">("idle");
    const [resultBlob, setResultBlob] = useState<Blob | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [dragActive, setDragActive] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [pageImages, setPageImages] = useState<string[]>([]);
    const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }[]>([]);
    const [selectedTool, setSelectedTool] = useState<Tool>("text");
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [currentColor, setCurrentColor] = useState("#000000");
    const [textInput, setTextInput] = useState("");
    const [isAddingText, setIsAddingText] = useState(false);
    const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
    const canvasRef = useRef<HTMLDivElement>(null);

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
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            setTotalPages(pdf.numPages);

            const images: string[] = [];
            const dimensions: { width: number; height: number }[] = [];

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d")!;
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                await page.render({ canvasContext: context, viewport } as any).promise;
                images.push(canvas.toDataURL("image/jpeg", 0.7));
                dimensions.push({ width: viewport.width, height: viewport.height });
            }
            setPageImages(images);
            setPageDimensions(dimensions);
            setStatus("editing");
        } catch (error) {
            console.error(error);
            setErrorMessage("Failed to load PDF preview");
            setStatus("error");
        }
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (selectedTool !== "text") return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setTextPosition({ x, y });
        setIsAddingText(true);
        setTextInput("");
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (selectedTool !== "draw") return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setIsDrawing(true);
        setCurrentPath([{ x, y }]);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDrawing || selectedTool !== "draw") return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setCurrentPath(prev => [...prev, { x, y }]);
    };

    const handleMouseUp = () => {
        if (!isDrawing || currentPath.length < 2) {
            setIsDrawing(false);
            setCurrentPath([]);
            return;
        }

        const annotation: Annotation = {
            id: `draw-${Date.now()}`,
            type: "draw",
            page: currentPage,
            x: 0,
            y: 0,
            color: currentColor,
            path: currentPath,
        };

        setAnnotations(prev => [...prev, annotation]);
        setIsDrawing(false);
        setCurrentPath([]);
    };

    const addTextAnnotation = () => {
        if (!textInput.trim()) {
            setIsAddingText(false);
            return;
        }

        const annotation: Annotation = {
            id: `text-${Date.now()}`,
            type: "text",
            page: currentPage,
            x: textPosition.x,
            y: textPosition.y,
            content: textInput,
            color: currentColor,
        };

        setAnnotations(prev => [...prev, annotation]);
        setIsAddingText(false);
        setTextInput("");
    };

    const deleteAnnotation = (id: string) => {
        setAnnotations(prev => prev.filter(a => a.id !== id));
    };

    const handleApplyEdits = async () => {
        if (!file) return;

        setStatus("processing");
        setErrorMessage("");

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const font = await pdf.embedFont(StandardFonts.Helvetica);

            for (const annotation of annotations) {
                const page = pdf.getPage(annotation.page);
                const { width, height } = page.getSize();

                if (annotation.type === "text" && annotation.content) {
                    const hexColor = annotation.color.replace("#", "");
                    const r = parseInt(hexColor.substr(0, 2), 16) / 255;
                    const g = parseInt(hexColor.substr(2, 2), 16) / 255;
                    const b = parseInt(hexColor.substr(4, 2), 16) / 255;

                    page.drawText(annotation.content, {
                        x: (annotation.x / 100) * width,
                        y: height - (annotation.y / 100) * height,
                        size: 14,
                        font,
                        color: rgb(r, g, b),
                    });
                } else if (annotation.type === "draw" && annotation.path) {
                    const hexColor = annotation.color.replace("#", "");
                    const r = parseInt(hexColor.substr(0, 2), 16) / 255;
                    const g = parseInt(hexColor.substr(2, 2), 16) / 255;
                    const b = parseInt(hexColor.substr(4, 2), 16) / 255;

                    for (let i = 0; i < annotation.path.length - 1; i++) {
                        const start = annotation.path[i];
                        const end = annotation.path[i + 1];

                        page.drawLine({
                            start: {
                                x: (start.x / 100) * width,
                                y: height - (start.y / 100) * height,
                            },
                            end: {
                                x: (end.x / 100) * width,
                                y: height - (end.y / 100) * height,
                            },
                            thickness: 2,
                            color: rgb(r, g, b),
                        });
                    }
                }
            }

            const pdfBytes = await pdf.save();
            setResultBlob(uint8ArrayToBlob(pdfBytes));
            setStatus("success");
        } catch (error) {
            console.error(error);
            setErrorMessage("Failed to apply edits. Please try again.");
            setStatus("error");
        }
    };

    const handleDownload = () => {
        if (!resultBlob) return;
        const url = URL.createObjectURL(resultBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "edited.pdf";
        link.click();
        URL.revokeObjectURL(url);
    };

    const reset = () => {
        setFile(null);
        setStatus("idle");
        setResultBlob(null);
        setErrorMessage("");
        setCurrentPage(0);
        setPageImages([]);
        setAnnotations([]);
        setIsAddingText(false);
    };

    const currentPageAnnotations = annotations.filter(a => a.page === currentPage);

    const colors = ["#000000", "#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"];

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
                                    <Type className="w-8 h-8" />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold mb-4">Edit PDF</h1>
                                <p className="text-gray-500 text-lg max-w-xl mx-auto">
                                    Add text, annotations, and drawings to your PDF documents.
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

                    {status === "editing" && (
                        <motion.div
                            key="editing"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-6xl mx-auto"
                        >
                            {/* Toolbar */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 shadow-lg flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-2">
                                    {[
                                        { tool: "text" as const, icon: Type, label: "Text" },
                                        { tool: "draw" as const, icon: Pencil, label: "Draw" },
                                    ].map(({ tool, icon: Icon, label }) => (
                                        <button
                                            key={tool}
                                            onClick={() => setSelectedTool(tool)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${selectedTool === tool
                                                ? "bg-black text-white"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {label}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center gap-2">
                                    {colors.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setCurrentColor(color)}
                                            className={`w-8 h-8 rounded-full border-2 transition-all ${currentColor === color ? "border-black scale-110" : "border-transparent"
                                                }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>

                                <button
                                    onClick={handleApplyEdits}
                                    disabled={annotations.length === 0}
                                    className="btn-primary py-2 px-6 flex items-center gap-2 disabled:opacity-50"
                                >
                                    Save PDF
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="grid lg:grid-cols-4 gap-6">
                                {/* PDF Canvas */}
                                <div className="lg:col-span-3">
                                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-lg">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-medium">Page {currentPage + 1} of {totalPages}</h3>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                                    disabled={currentPage === 0}
                                                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                                                >
                                                    <ChevronLeft className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                                                    disabled={currentPage >= totalPages - 1}
                                                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div
                                            ref={canvasRef}
                                            className="relative bg-gray-100 rounded-xl overflow-hidden cursor-crosshair"
                                            style={{ aspectRatio: pageDimensions[currentPage] ? `${pageDimensions[currentPage].width} / ${pageDimensions[currentPage].height}` : "3/4" }}
                                            onClick={handleCanvasClick}
                                            onMouseDown={handleMouseDown}
                                            onMouseMove={handleMouseMove}
                                            onMouseUp={handleMouseUp}
                                            onMouseLeave={handleMouseUp}
                                        >
                                            {pageImages[currentPage] && (
                                                <img
                                                    src={pageImages[currentPage]}
                                                    alt={`Page ${currentPage + 1}`}
                                                    className="w-full h-full object-contain pointer-events-none"
                                                />
                                            )}

                                            {/* Render annotations */}
                                            {currentPageAnnotations.map(annotation => (
                                                <div key={annotation.id}>
                                                    {annotation.type === "text" && (
                                                        <div
                                                            className="absolute text-sm font-medium group"
                                                            style={{
                                                                left: `${annotation.x}%`,
                                                                top: `${annotation.y}%`,
                                                                color: annotation.color,
                                                            }}
                                                        >
                                                            {annotation.content}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); deleteAnnotation(annotation.id); }}
                                                                className="absolute -right-6 -top-1 opacity-0 group-hover:opacity-100 p-1 bg-red-500 text-white rounded transition-opacity"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {annotation.type === "draw" && annotation.path && (
                                                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                                            <path
                                                                d={`M ${annotation.path.map(p => `${p.x}% ${p.y}%`).join(" L ")}`}
                                                                stroke={annotation.color}
                                                                strokeWidth="2"
                                                                fill="none"
                                                                vectorEffect="non-scaling-stroke"
                                                            />
                                                        </svg>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Current drawing path */}
                                            {isDrawing && currentPath.length > 0 && (
                                                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                                    <path
                                                        d={`M ${currentPath.map(p => `${p.x}% ${p.y}%`).join(" L ")}`}
                                                        stroke={currentColor}
                                                        strokeWidth="2"
                                                        fill="none"
                                                        vectorEffect="non-scaling-stroke"
                                                    />
                                                </svg>
                                            )}

                                            {/* Text input popup */}
                                            {isAddingText && (
                                                <div
                                                    className="absolute bg-white shadow-xl rounded-lg p-3 border z-10"
                                                    style={{
                                                        left: `${textPosition.x}%`,
                                                        top: `${textPosition.y}%`,
                                                    }}
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <input
                                                        type="text"
                                                        value={textInput}
                                                        onChange={e => setTextInput(e.target.value)}
                                                        onKeyDown={e => e.key === "Enter" && addTextAnnotation()}
                                                        placeholder="Enter text..."
                                                        className="px-3 py-2 border rounded-lg focus:outline-none focus:border-black w-48"
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            onClick={addTextAnnotation}
                                                            className="flex-1 py-1 px-3 bg-black text-white rounded text-sm"
                                                        >
                                                            Add
                                                        </button>
                                                        <button
                                                            onClick={() => setIsAddingText(false)}
                                                            className="flex-1 py-1 px-3 bg-gray-100 rounded text-sm"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Annotations panel */}
                                <div className="lg:col-span-1">
                                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-lg">
                                        <h3 className="font-semibold mb-4">Annotations ({annotations.length})</h3>

                                        {annotations.length === 0 ? (
                                            <p className="text-gray-400 text-sm">
                                                {selectedTool === "text"
                                                    ? "Click on the PDF to add text"
                                                    : "Draw on the PDF to annotate"}
                                            </p>
                                        ) : (
                                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                                {annotations.map(annotation => (
                                                    <div
                                                        key={annotation.id}
                                                        className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-3 h-3 rounded-full"
                                                                style={{ backgroundColor: annotation.color }}
                                                            />
                                                            <span className="text-sm truncate max-w-32">
                                                                {annotation.type === "text" ? annotation.content : "Drawing"}
                                                            </span>
                                                            <span className="text-xs text-gray-400">p.{annotation.page + 1}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => deleteAnnotation(annotation.id)}
                                                            className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <button
                                            onClick={reset}
                                            className="w-full mt-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50"
                                        >
                                            Cancel
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
                            className="flex flex-col items-center justify-center py-32 max-w-lg mx-auto text-center"
                        >
                            <div className="relative mb-8">
                                <div className="w-24 h-24 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                                <Loader2 className="w-10 h-10 text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Applying edits...</h2>
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
                            <h2 className="text-3xl font-bold mb-2">PDF Edited Successfully!</h2>
                            <p className="text-gray-500 mb-10">Your annotations have been applied to the document.</p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={handleDownload} className="btn-primary py-4 px-10 flex items-center gap-2">
                                    <Download className="w-5 h-5" />
                                    Download PDF
                                </button>
                                <button onClick={reset} className="btn-outline py-4 px-10 flex items-center gap-2">
                                    <RefreshCw className="w-5 h-5" />
                                    Edit Another
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
