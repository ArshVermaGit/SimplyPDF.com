"use client";

export const dynamic = "force-dynamic";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, File, Download, Loader2, CheckCircle2, RefreshCw, AlertCircle, Type, Pencil, ArrowRight, ChevronLeft, ChevronRight, Trash2, Square, Circle, Image as ImageIcon, MousePointer2, Settings, Plus, Minus, Move } from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { uint8ArrayToBlob } from "@/lib/pdf-utils";
import {
    AnimatedBackground,
    FloatingDecorations,
    ToolHeader,
    ToolCard,
    ProcessingState
} from "@/components/ToolPageElements";

type Tool = "text" | "draw" | "rectangle" | "circle" | "image" | "select";

interface Annotation {
    id: string;
    type: "text" | "draw" | "rectangle" | "circle" | "image";
    page: number;
    x: number;
    y: number;
    width?: number;
    height?: number;
    content?: string;
    color: string;
    opacity?: number;
    strokeWidth?: number;
    fontSize?: number;
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
    const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [currentStrokeWidth, setCurrentStrokeWidth] = useState(2);
    const [currentFontSize, setCurrentFontSize] = useState(14);
    const [currentOpacity, setCurrentOpacity] = useState(1);
    const canvasRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const startX = useRef(0);
    const startY = useRef(0);
    const [isCreating, setIsCreating] = useState(false);

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
            const workerUrl = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
            pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (re) => {
                const content = re.target?.result as string;
                const annotation: Annotation = {
                    id: `image-${Date.now()}`,
                    type: "image",
                    page: currentPage,
                    x: 20,
                    y: 20,
                    width: 30,
                    height: 30,
                    content,
                    color: "transparent",
                    opacity: 1
                };
                setAnnotations(prev => [...prev, annotation]);
                setSelectedAnnotationId(annotation.id);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((selectedTool as string) !== "text") return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setTextPosition({ x, y });
        setIsAddingText(true);
        setTextInput("");
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        startX.current = x;
        startY.current = y;

        if (selectedTool === "draw") {
            setIsDrawing(true);
            setCurrentPath([{ x, y }]);
            setSelectedAnnotationId(null);
        } else if (selectedTool === "rectangle" || selectedTool === "circle") {
            setIsCreating(true);
            const newId = `${selectedTool}-${Date.now()}`;
            const newAnnotation: Annotation = {
                id: newId,
                type: selectedTool,
                page: currentPage,
                x,
                y,
                width: 0,
                height: 0,
                color: currentColor,
                opacity: currentOpacity,
                strokeWidth: currentStrokeWidth,
            };
            setAnnotations(prev => [...prev, newAnnotation]);
            setSelectedAnnotationId(newId);
        } else if (selectedTool === "select") {
            const clickedAnnotation = [...annotations]
                .reverse()
                .find(a =>
                    a.page === currentPage &&
                    x >= (a.x || 0) && x <= (a.x || 0) + (a.width || 5) &&
                    y >= (a.y || 0) && y <= (a.y || 0) + (a.height || 5)
                );
            setSelectedAnnotationId(clickedAnnotation?.id || null);
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        if (isDrawing && selectedTool === "draw") {
            setCurrentPath(prev => [...prev, { x, y }]);
        } else if (isCreating && selectedAnnotationId) {
            setAnnotations(prev => prev.map(a => {
                if (a.id === selectedAnnotationId) {
                    return {
                        ...a,
                        width: Math.abs(x - startX.current),
                        height: Math.abs(y - startY.current),
                        x: Math.min(x, startX.current),
                        y: Math.min(y, startY.current),
                    };
                }
                return a;
            }));
        }
    };

    const handleMouseUp = () => {
        if (isDrawing && currentPath.length > 1) {
            const annotation: Annotation = {
                id: `draw-${Date.now()}`,
                type: "draw",
                page: currentPage,
                x: 0,
                y: 0,
                color: currentColor,
                path: currentPath,
                strokeWidth: currentStrokeWidth,
                opacity: currentOpacity,
            };
            setAnnotations(prev => [...prev, annotation]);
        }
        setIsDrawing(false);
        setCurrentPath([]);
        setIsCreating(false);
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
            fontSize: currentFontSize,
            opacity: currentOpacity,
        };

        setAnnotations(prev => [...prev, annotation]);
        setSelectedAnnotationId(annotation.id);
        setIsAddingText(false);
        setTextInput("");
    };

    const deleteAnnotation = (id: string) => {
        setAnnotations(prev => prev.filter(a => a.id !== id));
        if (selectedAnnotationId === id) setSelectedAnnotationId(null);
    };

    const updateAnnotationProperty = (id: string, property: keyof Annotation, value: any) => {
        setAnnotations(prev => prev.map(a => a.id === id ? { ...a, [property]: value } : a));
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

                const hexColor = (annotation.color || "#000000").replace("#", "");
                let r = 0, g = 0, b = 0;
                if (hexColor !== "transparent" && hexColor.length === 6) {
                    r = parseInt(hexColor.substr(0, 2), 16) / 255;
                    g = parseInt(hexColor.substr(2, 2), 16) / 255;
                    b = parseInt(hexColor.substr(4, 2), 16) / 255;
                }
                const color = rgb(r, g, b);
                const opacity = annotation.opacity ?? 1;

                if (annotation.type === "text" && annotation.content) {
                    page.drawText(annotation.content, {
                        x: (annotation.x / 100) * width,
                        y: height - (annotation.y / 100) * height,
                        size: annotation.fontSize || 14,
                        font,
                        color,
                        opacity,
                    });
                } else if (annotation.type === "draw" && annotation.path) {
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
                            thickness: annotation.strokeWidth || 2,
                            color,
                            opacity,
                        });
                    }
                } else if (annotation.type === "rectangle") {
                    page.drawRectangle({
                        x: (annotation.x / 100) * width,
                        y: height - (annotation.y / 100) * height - ((annotation.height || 0) / 100) * height,
                        width: ((annotation.width || 0) / 100) * width,
                        height: ((annotation.height || 0) / 100) * height,
                        borderColor: color,
                        borderWidth: annotation.strokeWidth || 2,
                        opacity,
                    });
                } else if (annotation.type === "circle") {
                    page.drawEllipse({
                        x: (annotation.x / 100) * width + ((annotation.width || 0) / 200) * width,
                        y: height - (annotation.y / 100) * height - ((annotation.height || 0) / 200) * height,
                        xScale: ((annotation.width || 0) / 200) * width,
                        yScale: ((annotation.height || 0) / 200) * height,
                        borderColor: color,
                        borderWidth: annotation.strokeWidth || 2,
                        opacity,
                    });
                } else if (annotation.type === "image" && annotation.content) {
                    try {
                        const base64Data = annotation.content.split(',')[1];
                        const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                        let embeddedImage;
                        if (annotation.content.includes("image/png")) {
                            embeddedImage = await pdf.embedPng(imageBytes);
                        } else {
                            embeddedImage = await pdf.embedJpg(imageBytes);
                        }
                        page.drawImage(embeddedImage, {
                            x: (annotation.x / 100) * width,
                            y: height - (annotation.y / 100) * height - ((annotation.height || 0) / 100) * height,
                            width: ((annotation.width || 0) / 100) * width,
                            height: ((annotation.height || 0) / 100) * height,
                            opacity,
                        });
                    } catch (e) {
                        console.error("Failed to embed image:", e);
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
        link.download = (file?.name.replace(".pdf", "") || "edited") + "_SimplyPDF.pdf";
        link.click();
        URL.revokeObjectURL(url);
    };

    const reset = () => {
        setFile(null);
        setStatus("idle");
        setResultBlob(null);
        setErrorMessage("");
        setCurrentPage(0);
        setTotalPages(0);
        setPageImages([]);
        setAnnotations([]);
        setIsAddingText(false);
        setSelectedAnnotationId(null);
    };

    const currentPageAnnotations = annotations.filter(a => a.page === currentPage);
    const selectedAnnotation = annotations.find(a => a.id === selectedAnnotationId);

    const colors = ["#000000", "#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "transparent"];

    return (
        <div className="relative min-h-[calc(100vh-80px)] pt-20 flex flex-col overflow-hidden">
            <AnimatedBackground />
            <FloatingDecorations />

            {/* Hidden Inputs */}
            <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={handleImageUpload} />
            <input id="file-input" type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />

            <AnimatePresence mode="wait">
                {status === "idle" && (
                    <div className="container mx-auto px-4 py-12 relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-4xl mx-auto"
                        >
                            <ToolHeader
                                title="Edit & Annotate"
                                description="Professional tools to edit, draw, and enhance your PDFs in the browser."
                                icon={Type}
                            />

                            <ToolCard className="p-8">
                                <div
                                    className={`drop-zone active:border-black ${dragActive ? "active" : ""}`}
                                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                    onDragLeave={() => setDragActive(false)}
                                    onDrop={handleDrop}
                                    onClick={() => document.getElementById("file-input")?.click()}
                                >
                                    <Upload className="w-16 h-16 text-gray-300 mb-6" />
                                    <p className="text-xl font-semibold mb-2">Drop your PDF here</p>
                                    <p className="text-gray-400">or click to browse from your computer</p>
                                </div>
                            </ToolCard>
                        </motion.div>
                    </div>
                )}

                {status === "editing" && (
                    <motion.div
                        key="editing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 flex overflow-hidden relative z-10"
                    >
                        {/* LEFT: Floating Toolbar */}
                        <div className="w-20 flex flex-col border-r border-gray-200 bg-white py-6 items-center gap-4 z-10 shrink-0">
                            <div className="flex flex-col gap-2 p-1.5 bg-gray-100 rounded-2xl">
                                {[
                                    { id: "select", icon: MousePointer2, label: "Select" },
                                    { id: "text", icon: Type, label: "Text" },
                                    { id: "draw", icon: Pencil, label: "Draw" },
                                    { id: "rectangle", icon: Square, label: "Rectangle" },
                                    { id: "circle", icon: Circle, label: "Circle" },
                                ].map((tool) => (
                                    <button
                                        key={tool.id}
                                        onClick={() => setSelectedTool(tool.id as Tool)}
                                        className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${selectedTool === tool.id
                                            ? "bg-black text-white shadow-lg"
                                            : "hover:bg-white text-gray-500 hover:text-black"
                                            }`}
                                        title={tool.label}
                                    >
                                        <tool.icon className="w-5 h-5" />
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => imageInputRef.current?.click()}
                                className="w-12 h-12 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-black transition-all"
                                title="Add Image"
                            >
                                <ImageIcon className="w-5 h-5" />
                            </button>

                            <div className="mt-auto flex flex-col gap-2 items-center">
                                <button
                                    onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))}
                                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                                <span className="text-[10px] font-bold text-gray-400">{Math.round(zoom * 100)}%</span>
                                <button
                                    onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
                                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* CENTER: Canvas Area */}
                        <div className="flex-1 overflow-auto bg-gray-200/50 p-8 flex flex-col items-center">
                            {/* Page Controls Overlay */}
                            <div className="bg-white/80 backdrop-blur-md border border-gray-200 px-4 py-2 rounded-full flex items-center gap-6 shadow-sm mb-6 sticky top-0 z-20">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                        disabled={currentPage === 0}
                                        className="p-1.5 hover:bg-gray-100 rounded-md disabled:opacity-30"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm font-medium">Page {currentPage + 1} of {totalPages}</span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                                        disabled={currentPage === totalPages - 1}
                                        className="p-1.5 hover:bg-gray-100 rounded-md disabled:opacity-30"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="w-[1px] h-4 bg-gray-200" />
                                <button
                                    onClick={handleApplyEdits}
                                    className="px-4 py-1.5 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Save PDF
                                </button>
                            </div>

                            {/* Actual PDF Page Canvas */}
                            <div
                                ref={canvasRef}
                                className="relative bg-white shadow-2xl origin-top transition-transform duration-200"
                                style={{
                                    width: (pageDimensions[currentPage]?.width || 0) * zoom,
                                    height: (pageDimensions[currentPage]?.height || 0) * zoom,
                                    cursor: selectedTool === "text" ? "text" : selectedTool === "select" ? "default" : "crosshair",
                                }}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onClick={handleCanvasClick}
                            >
                                <img
                                    src={pageImages[currentPage]}
                                    alt={`Page ${currentPage + 1}`}
                                    className="absolute inset-0 w-full h-full pointer-events-none select-none"
                                />

                                {/* Render All Page Annotations */}
                                {currentPageAnnotations.map((anno) => (
                                    <div
                                        key={anno.id}
                                        onClick={(e) => {
                                            if (selectedTool === "select") {
                                                e.stopPropagation();
                                                setSelectedAnnotationId(anno.id);
                                            }
                                        }}
                                        className={`absolute select-none ${selectedAnnotationId === anno.id ? "ring-2 ring-blue-500 ring-offset-2 z-10" : ""
                                            }`}
                                        style={{
                                            left: `${anno.x}%`,
                                            top: `${anno.y}%`,
                                            width: anno.width ? `${anno.width}%` : "auto",
                                            height: anno.height ? `${anno.height}%` : "auto",
                                            color: anno.color,
                                            opacity: anno.opacity,
                                            cursor: selectedTool === "select" ? "move" : "inherit"
                                        }}
                                    >
                                        {anno.type === "text" && (
                                            <div style={{ fontSize: `${(anno.fontSize || 14) * zoom}px`, whiteSpace: "nowrap" }}>
                                                {anno.content}
                                            </div>
                                        )}
                                        {anno.type === "rectangle" && (
                                            <div
                                                className="w-full h-full border-2"
                                                style={{ borderColor: anno.color, borderWidth: anno.strokeWidth }}
                                            />
                                        )}
                                        {anno.type === "circle" && (
                                            <div
                                                className="w-full h-full border-2 rounded-full"
                                                style={{ borderColor: anno.color, borderWidth: anno.strokeWidth }}
                                            />
                                        )}
                                        {anno.type === "image" && anno.content && (
                                            <img src={anno.content} alt="" className="w-full h-full" />
                                        )}
                                        {anno.type === "draw" && anno.path && (
                                            <svg
                                                className="absolute inset-0 pointer-events-none overflow-visible"
                                                style={{ width: "100%", height: "100%" }}
                                            >
                                                <polyline
                                                    points={anno.path.map(p => `${(p.x - anno.x)}%,${(p.y - anno.y)}%`).join(" ")}
                                                    fill="none"
                                                    stroke={anno.color}
                                                    strokeWidth={anno.strokeWidth || 2}
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        )}
                                    </div>
                                ))}

                                {/* Overlay for Text Input */}
                                {isAddingText && (
                                    <div
                                        className="absolute z-20 bg-white shadow-xl border border-gray-200 rounded-lg p-2 flex flex-col gap-2"
                                        style={{ left: `${textPosition.x}%`, top: `${textPosition.y}%` }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <textarea
                                            autoFocus
                                            value={textInput}
                                            onChange={(e) => setTextInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    addTextAnnotation();
                                                }
                                            }}
                                            placeholder="Type something..."
                                            className="w-48 h-20 text-sm p-2 bg-gray-50 border border-gray-100 rounded outline-none resize-none"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setIsAddingText(false)} className="text-[10px] text-gray-400 hover:text-black">Cancel</button>
                                            <button onClick={addTextAnnotation} className="px-2 py-1 bg-black text-white text-[10px] rounded">Add</button>
                                        </div>
                                    </div>
                                )}

                                {/* Rendering Current Drawing Path */}
                                {isDrawing && (
                                    <svg className="absolute inset-0 pointer-events-none z-10 overflow-visible">
                                        <polyline
                                            points={currentPath.map(p => `${p.x}%,${p.y}%`).join(" ")}
                                            fill="none"
                                            stroke={currentColor}
                                            strokeWidth={currentStrokeWidth}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            style={{ opacity: currentOpacity }}
                                        />
                                    </svg>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Property & Layer Sidebar */}
                        <div className="w-80 flex flex-col border-l border-gray-200 bg-white overflow-y-auto">
                            {/* Properties Section */}
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-center gap-2 mb-6">
                                    <Settings className="w-4 h-4" />
                                    <h3 className="font-bold uppercase tracking-wider text-xs">Properties</h3>
                                </div>

                                <div className="flex flex-col gap-6">
                                    {/* Color Picker */}
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-3 block">Color</label>
                                        <div className="grid grid-cols-7 gap-2">
                                            {colors.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => {
                                                        setCurrentColor(c);
                                                        if (selectedAnnotationId) updateAnnotationProperty(selectedAnnotationId, "color", c);
                                                    }}
                                                    className={`w-7 h-7 rounded-lg border-2 transition-all ${c === (selectedAnnotation?.color || currentColor) ? "scale-110 border-blue-500 shadow-md" : "border-transparent"}`}
                                                    style={{ backgroundColor: c === "transparent" ? "white" : c, backgroundImage: c === "transparent" ? "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 50%, #ccc 50%, #ccc 75%, transparent 75%, transparent)" : "none", backgroundSize: "8px 8px" }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Size / Stroke Slider */}
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">
                                                {selectedAnnotation?.type === "text" ? "Font Size" : "Stroke Weight"}
                                            </label>
                                            <span className="text-[10px] font-bold">{selectedAnnotation?.type === "text" ? (selectedAnnotation.fontSize || currentFontSize) : (selectedAnnotation?.strokeWidth || currentStrokeWidth)}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={selectedAnnotation?.type === "text" ? "8" : "1"}
                                            max={selectedAnnotation?.type === "text" ? "48" : "20"}
                                            value={selectedAnnotation?.type === "text" ? (selectedAnnotation.fontSize || currentFontSize) : (selectedAnnotation?.strokeWidth || currentStrokeWidth)}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (selectedAnnotationId) {
                                                    updateAnnotationProperty(selectedAnnotationId, selectedAnnotation?.type === "text" ? "fontSize" : "strokeWidth", val);
                                                } else {
                                                    if (selectedTool === "text") setCurrentFontSize(val);
                                                    else setCurrentStrokeWidth(val);
                                                }
                                            }}
                                            className="w-full accent-black h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>

                                    {/* Opacity Slider */}
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Opacity</label>
                                            <span className="text-[10px] font-bold">{Math.round((selectedAnnotation?.opacity || currentOpacity) * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={selectedAnnotation?.opacity || currentOpacity}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (selectedAnnotationId) updateAnnotationProperty(selectedAnnotationId, "opacity", val);
                                                else setCurrentOpacity(val);
                                            }}
                                            className="w-full accent-black h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>

                                    {selectedAnnotationId && (
                                        <button
                                            onClick={() => deleteAnnotation(selectedAnnotationId)}
                                            className="flex items-center justify-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors mt-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase">Delete Annotation</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Layers / Annotations List */}
                            <div className="p-6 flex-1 overflow-y-auto">
                                <div className="flex items-center gap-2 mb-6">
                                    <Move className="w-4 h-4" />
                                    <h3 className="font-bold uppercase tracking-wider text-xs">Page Layers</h3>
                                </div>

                                <div className="flex flex-col gap-2">
                                    {currentPageAnnotations.length === 0 ? (
                                        <p className="text-[10px] text-gray-400 italic text-center py-8">No annotations on this page yet.</p>
                                    ) : (
                                        currentPageAnnotations.map((anno, idx) => (
                                            <button
                                                key={anno.id}
                                                onClick={() => setSelectedAnnotationId(anno.id)}
                                                className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${selectedAnnotationId === anno.id
                                                    ? "border-black bg-black text-white shadow-md scale-[1.02]"
                                                    : "border-gray-100 hover:border-gray-300 bg-gray-50/50"
                                                    }`}
                                            >
                                                <div className={`p-1.5 rounded-lg ${selectedAnnotationId === anno.id ? "bg-white/20" : "bg-white"}`}>
                                                    {anno.type === "text" && <Type className="w-3 h-3" />}
                                                    {anno.type === "draw" && <Pencil className="w-3 h-3" />}
                                                    {anno.type === "rectangle" && <Square className="w-3 h-3" />}
                                                    {anno.type === "circle" && <Circle className="w-3 h-3" />}
                                                    {anno.type === "image" && <ImageIcon className="w-3 h-3" />}
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-[10px] font-bold uppercase opacity-60">Layer {idx + 1}</p>
                                                    <p className="text-xs font-medium truncate">
                                                        {anno.type === "text" ? (anno.content || "Text") : anno.type.charAt(0).toUpperCase() + anno.type.slice(1)}
                                                    </p>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {status === "processing" && (
                    <ProcessingState
                        message="Applying edits..."
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
    );
}
