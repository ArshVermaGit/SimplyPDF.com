"use client";

export const dynamic = "force-dynamic";

import { useState, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Upload, File, X, Download, Loader2, CheckCircle2, RefreshCw, AlertCircle, GripVertical, Trash2, Plus, Eye, RotateCw, Combine, Undo, Redo, ArrowUpAZ, ArrowDownZA, ArrowUpDown } from "lucide-react";
import { PDFDocument, degrees } from "pdf-lib";
import { uint8ArrayToBlob } from "@/lib/pdf-utils";
import { PDFPreviewModal } from "@/components/PDFPreviewModal";
import {
    AnimatedBackground,
    FloatingDecorations,
    ToolHeader,
    ToolCard,
    ProcessingState
} from "@/components/ToolPageElements";

interface PageInfo {
    id: string;
    fileId: string;
    fileName: string;
    pageNumber: number;
    image: string;
    rotation: 0 | 90 | 180 | 270;
    originalArrayBuffer: ArrayBuffer;
    isHidden?: boolean;
}

interface FileInfo {
    id: string;
    name: string;
    size: number;
    pages: PageInfo[];
    isExpanded: boolean;
}

export default function MergePDFPage() {
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [status, setStatus] = useState<"idle" | "loading" | "ready" | "processing" | "success" | "error">("idle");
    const [resultBlob, setResultBlob] = useState<Blob | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [dragActive, setDragActive] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [previewPage, setPreviewPage] = useState(0);
    const [customFileName, setCustomFileName] = useState("merged.pdf");
    const [metadata, setMetadata] = useState({
        title: "",
        author: "",
        subject: "",
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const addMoreInputRef = useRef<HTMLInputElement>(null);

    // History for Undo/Redo
    const [history, setHistory] = useState<FileInfo[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const addToHistory = (newFiles: FileInfo[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newFiles);
        // Limit history size to 20
        if (newHistory.length > 20) newHistory.shift();
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setFiles(newFiles);
    };

    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setFiles(history[newIndex]);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setFiles(history[newIndex]);
        }
    };

    const sortFiles = (criteria: 'name_asc' | 'name_desc' | 'size_asc' | 'size_desc') => {
        const sorted = [...files].sort((a, b) => {
            if (criteria === 'name_asc') return a.name.localeCompare(b.name);
            if (criteria === 'name_desc') return b.name.localeCompare(a.name);
            if (criteria === 'size_asc') return a.size - b.size;
            if (criteria === 'size_desc') return b.size - a.size;
            return 0;
        });
        addToHistory(sorted);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        const files = Array.from(e.dataTransfer.files).filter(f => f.type === "application/pdf");
        if (files.length > 0) {
            await loadFiles(files);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            await loadFiles(files);
        }
        e.target.value = "";
    };

    const loadFiles = async (newFiles: File[]) => {
        const isFirstLoad = files.length === 0;
        setStatus("loading");
        setErrorMessage("");

        try {
            console.log("Loading pdfjs-dist...");
            const pdfjsLib = await import("pdfjs-dist");
            const workerUrl = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
            pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

            const loadedFiles: FileInfo[] = [];

            for (const file of newFiles) {
                const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const arrayBuffer = await file.arrayBuffer();
                const originalBuffer = arrayBuffer.slice(0);

                const loadingTask = pdfjsLib.getDocument({
                    data: new Uint8Array(arrayBuffer),
                    useWorkerFetch: true,
                    isEvalSupported: false
                });

                const pdfDoc = await loadingTask.promise;
                const numPages = pdfDoc.numPages;
                const filePages: PageInfo[] = [];

                for (let i = 1; i <= numPages; i++) {
                    const page = await pdfDoc.getPage(i);
                    const viewport = page.getViewport({ scale: 0.5 });
                    const canvas = document.createElement("canvas");
                    const context = canvas.getContext("2d")!;
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({
                        canvasContext: context,
                        viewport: viewport,
                    } as any).promise;

                    filePages.push({
                        id: `${fileId}-page-${i}`,
                        fileId,
                        fileName: file.name,
                        pageNumber: i,
                        image: canvas.toDataURL("image/jpeg", 0.7),
                        rotation: 0,
                        originalArrayBuffer: originalBuffer,
                    });

                    (page as any).cleanup?.();
                }

                loadedFiles.push({
                    id: fileId,
                    name: file.name,
                    size: file.size,
                    pages: filePages,
                    isExpanded: false
                });

                await pdfDoc.destroy();
            }

            if (isFirstLoad) {
                addToHistory(loadedFiles);
                setFiles(loadedFiles);
            } else {
                const combinedFiles = [...files, ...loadedFiles];
                // Check for duplicates in the new batch against existing
                const hasDuplicates = loadedFiles.some(nf => files.some(ef => ef.name === nf.name && ef.size === nf.size));
                if (hasDuplicates) {
                    // We could show a toast here, for now just log or set a transient message
                    console.warn("Duplicate files detected");
                }
                addToHistory(combinedFiles);
                setFiles(combinedFiles);
            }
            setStatus("ready");
        } catch (error: any) {
            console.error(error);
            setErrorMessage(`Error loading PDFs: ${error.message || "Unknown error"}`);
            setStatus("error");
        }
    };

    const rotatePage = (fileId: string, pageId: string) => {
        const newFiles = files.map(f => {
            if (f.id === fileId) {
                return {
                    ...f,
                    pages: f.pages.map(p => {
                        if (p.id === pageId) {
                            const newRotation = ((p.rotation + 90) % 360) as 0 | 90 | 180 | 270;
                            return { ...p, rotation: newRotation };
                        }
                        return p;
                    })
                };
            }
            return f;
        });
        addToHistory(newFiles);
    };

    const removePage = (fileId: string, pageId: string) => {
        const newFiles = files.map(f => {
            if (f.id === fileId) {
                return { ...f, pages: f.pages.filter(p => p.id !== pageId) };
            }
            return f;
        }).filter(f => f.pages.length > 0);
        addToHistory(newFiles);
    };

    const toggleFileExpand = (fileId: string) => {
        setFiles(files.map(f => f.id === fileId ? { ...f, isExpanded: !f.isExpanded } : f));
    };

    const removeFile = (fileId: string) => {
        const newFiles = files.filter(f => f.id !== fileId);
        addToHistory(newFiles);
    };

    const handleRangeSelection = (fileId: string, rangeStr: string) => {
        const newFiles = files.map(f => {
            if (f.id === fileId) {
                // Parse range: e.g., "1-3, 5, 8-10"
                const visiblePages = new Set<number>();
                const parts = rangeStr.split(",").map(p => p.trim());

                parts.forEach(part => {
                    if (part.includes("-")) {
                        const [start, end] = part.split("-").map(Number);
                        if (!isNaN(start) && !isNaN(end)) {
                            for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
                                visiblePages.add(i);
                            }
                        }
                    } else {
                        const num = Number(part);
                        if (!isNaN(num)) visiblePages.add(num);
                    }
                });

                return {
                    ...f,
                    pages: f.pages.map(p => ({
                        ...p,
                        isHidden: rangeStr.trim() !== "" && !visiblePages.has(p.pageNumber)
                    }))
                };
            }
            return f;
        });
        addToHistory(newFiles);
    };

    const openPreview = (filePages: PageInfo[], startIndex: number) => {
        setPreviewImages(filePages.filter(p => !p.isHidden).map(p => p.image));
        // Need to find the index of the clicked page among visible pages
        const clickedPageId = filePages[startIndex].id;
        const visiblePages = filePages.filter(p => !p.isHidden);
        const newIndex = visiblePages.findIndex(p => p.id === clickedPageId);

        setPreviewPage(newIndex !== -1 ? newIndex : 0);
        setPreviewOpen(true);
    };

    const handleMerge = async () => {
        if (files.length === 0) return;

        setStatus("processing");
        setErrorMessage("");

        try {
            const mergedPdf = await PDFDocument.create();

            // Set metadata
            if (metadata.title) mergedPdf.setTitle(metadata.title);
            if (metadata.author) mergedPdf.setAuthor(metadata.author);
            if (metadata.subject) mergedPdf.setSubject(metadata.subject);
            mergedPdf.setProducer("SimplyPDF");
            mergedPdf.setCreator("SimplyPDF");

            // Cache loaded source PDFs to avoid reloading the same file multiple times
            const loadedPdfs = new Map<string, any>();

            for (const fileInfo of files) {
                for (const pageInfo of fileInfo.pages) {
                    if (pageInfo.isHidden) continue;

                    let sourcePdf = loadedPdfs.get(pageInfo.fileId);
                    if (!sourcePdf) {
                        sourcePdf = await PDFDocument.load(pageInfo.originalArrayBuffer);
                        loadedPdfs.set(pageInfo.fileId, sourcePdf);
                    }

                    const [copiedPage] = await mergedPdf.copyPages(sourcePdf, [pageInfo.pageNumber - 1]);

                    if (pageInfo.rotation !== 0) {
                        copiedPage.setRotation(degrees(pageInfo.rotation));
                    }

                    mergedPdf.addPage(copiedPage);
                }
            }

            const pdfBytes = await mergedPdf.save();
            setResultBlob(uint8ArrayToBlob(pdfBytes));
            setStatus("success");
        } catch (error) {
            console.error(error);
            setErrorMessage("Failed to merge PDFs. Please try again.");
            setStatus("error");
        }
    };

    const handleDownload = () => {
        if (!resultBlob) return;
        const url = URL.createObjectURL(resultBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = customFileName.endsWith(".pdf") ? customFileName : `${customFileName}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const reset = () => {
        setFiles([]);
        setStatus("idle");
        setResultBlob(null);
        setErrorMessage("");
        setCustomFileName("merged.pdf");
        setMetadata({ title: "", author: "", subject: "" });
        setHistory([]);
        setHistoryIndex(-1);
    };

    const previewMerged = () => {
        const allPages = files.flatMap(f => f.pages.filter(p => !p.isHidden).map(p => p.image));
        if (allPages.length > 0) {
            setPreviewImages(allPages);
            setPreviewPage(0);
            setPreviewOpen(true);
        }
    };

    // Total stats
    const totalPages = files.reduce((acc, f) => acc + f.pages.length, 0);

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
                                title="Merge PDF"
                                description="Combine multiple PDFs into one. Rearrange, rotate, or delete pages before merging."
                                icon={Combine}
                            />

                            <ToolCard className="p-8">
                                <div
                                    className={`drop-zone active:border-black ${dragActive ? "active" : ""}`}
                                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                    onDragLeave={() => setDragActive(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf"
                                        multiple
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                                    <p className="text-lg font-medium mb-2">Drop your PDFs here</p>
                                    <p className="text-gray-400 text-sm">or click to browse • Multiple files supported</p>
                                </div>
                            </ToolCard>
                        </motion.div>
                    )}

                    {(status === "loading") && (
                        <ProcessingState
                            message="Loading PDFs..."
                            description="Generating page previews..."
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
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-black text-white rounded-xl">
                                        <Combine className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-2xl">Merge PDFs</h2>
                                        <p className="text-gray-500 text-sm">{files.length} file{files.length !== 1 ? 's' : ''} • {totalPages} pages total</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={reset} className="btn-outline py-2 px-4 text-sm rounded-xl">
                                        Reset
                                    </button>
                                    <button
                                        onClick={handleMerge}
                                        disabled={files.length === 0}
                                        className="btn-primary py-2 px-6 rounded-xl shadow-lg shadow-black/10 disabled:opacity-50"
                                    >
                                        Merge & Download
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column: Files & Pages */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Toolbar */}
                                    <div className="flex items-center justify-between mb-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                                                <button onClick={undo} disabled={historyIndex <= 0} className="p-1.5 hover:bg-gray-100 rounded-md disabled:opacity-30 transition-colors" title="Undo">
                                                    <Undo className="w-4 h-4" />
                                                </button>
                                                <div className="w-px h-4 bg-gray-200 mx-1" />
                                                <button onClick={redo} disabled={historyIndex === -1 || historyIndex >= history.length - 1} className="p-1.5 hover:bg-gray-100 rounded-md disabled:opacity-30 transition-colors" title="Redo">
                                                    <Redo className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="h-6 w-px bg-gray-200 mx-2" />

                                            <div className="relative group">
                                                <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-black transition-colors text-xs font-semibold uppercase tracking-wider">
                                                    <ArrowUpDown className="w-3 h-3" />
                                                    Sort
                                                </button>
                                                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden hidden group-hover:block z-20">
                                                    <p className="px-4 py-2 text-[10px] uppercase font-bold text-gray-400 bg-gray-50 border-b border-gray-100">Sort Files By</p>
                                                    <button onClick={() => sortFiles('name_asc')} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm flex items-center gap-2">
                                                        <ArrowUpAZ className="w-4 h-4 text-gray-400" /> Name (A-Z)
                                                    </button>
                                                    <button onClick={() => sortFiles('name_desc')} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm flex items-center gap-2">
                                                        <ArrowDownZA className="w-4 h-4 text-gray-400" /> Name (Z-A)
                                                    </button>
                                                    <button onClick={() => sortFiles('size_asc')} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm flex items-center gap-2">
                                                        <ArrowUpDown className="w-4 h-4 text-gray-400" /> Size (Smallest)
                                                    </button>
                                                    <button onClick={() => sortFiles('size_desc')} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm flex items-center gap-2">
                                                        <ArrowUpDown className="w-4 h-4 text-gray-400" /> Size (Largest)
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <button onClick={reset} className="text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                                            Clear All
                                        </button>
                                    </div>

                                    <Reorder.Group
                                        axis="y"
                                        values={files}
                                        onReorder={setFiles}
                                        className="space-y-4"
                                    >
                                        {files.map((file) => (
                                            <Reorder.Item
                                                key={file.id}
                                                value={file}
                                                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                            >
                                                <div className="p-4 flex items-center justify-between bg-gray-50/50">
                                                    <div className="flex items-center gap-3">
                                                        <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded transition-colors">
                                                            <GripVertical className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                        <File className="w-5 h-5 text-gray-400" />
                                                        <div>
                                                            <p className="font-medium text-sm truncate max-w-[200px]">{file.name}</p>
                                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                                                                {file.pages.length} pages • {(file.size / 1024 / 1024).toFixed(2)} MB
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => toggleFileExpand(file.id)}
                                                            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                                                            title={file.isExpanded ? "Collapse" : "Manage Pages"}
                                                        >
                                                            {file.isExpanded ? <X className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => removeFile(file.id)}
                                                            className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                                                            title="Remove file"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <AnimatePresence>
                                                    {file.isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden border-t border-gray-100"
                                                        >
                                                            <div className="p-4 bg-white">
                                                                {/* Range Selection Input */}
                                                                <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[120px]">
                                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                                        Page Range
                                                                    </div>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="e.g. 1-5, 8, 10-12"
                                                                        className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
                                                                        onChange={(e) => handleRangeSelection(file.id, e.target.value)}
                                                                    />
                                                                    <p className="text-[10px] text-gray-400 italic">
                                                                        Leave empty to include all pages
                                                                    </p>
                                                                </div>

                                                                <Reorder.Group
                                                                    axis="x"
                                                                    values={file.pages}
                                                                    onReorder={(newPages) => {
                                                                        setFiles(files.map(f => f.id === file.id ? { ...f, pages: newPages } : f));
                                                                    }}
                                                                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
                                                                >
                                                                    {file.pages.map((page, pIdx) => (
                                                                        <Reorder.Item
                                                                            key={page.id}
                                                                            value={page}
                                                                            className={`relative group cursor-grab active:cursor-grabbing transition-opacity duration-300 ${page.isHidden ? "opacity-20 grayscale pointer-events-none" : "opacity-100"}`}
                                                                        >
                                                                            <div className="aspect-[3/4] bg-gray-50 rounded-lg border border-gray-100 overflow-hidden relative">
                                                                                <img
                                                                                    src={page.image}
                                                                                    alt={`Page ${page.pageNumber}`}
                                                                                    className="w-full h-full object-contain"
                                                                                    style={{ transform: `rotate(${page.rotation}deg)` }}
                                                                                />
                                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                                                    <button
                                                                                        onClick={() => openPreview(file.pages, pIdx)}
                                                                                        className="p-1.5 bg-white rounded-lg shadow-lg hover:scale-110 transition-transform"
                                                                                    >
                                                                                        <Eye className="w-4 h-4" />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => rotatePage(file.id, page.id)}
                                                                                        className="p-1.5 bg-white rounded-lg shadow-lg hover:scale-110 transition-transform"
                                                                                    >
                                                                                        <RotateCw className="w-4 h-4" />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => removePage(file.id, page.id)}
                                                                                        className="p-1.5 bg-red-500 text-white rounded-lg shadow-lg hover:scale-110 transition-transform"
                                                                                    >
                                                                                        <Trash2 className="w-4 h-4" />
                                                                                    </button>
                                                                                </div>
                                                                                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm text-[10px] text-white rounded">
                                                                                    Page {page.pageNumber}
                                                                                </div>
                                                                            </div>
                                                                        </Reorder.Item>
                                                                    ))}
                                                                </Reorder.Group>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </Reorder.Item>
                                        ))}
                                    </Reorder.Group>

                                    {/* Add More Files */}
                                    <button
                                        onClick={() => addMoreInputRef.current?.click()}
                                        className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-black hover:text-black transition-all flex items-center justify-center gap-2 group"
                                    >
                                        <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        <span className="font-medium">Add More PDF Files</span>
                                    </button>
                                    <input
                                        ref={addMoreInputRef}
                                        type="file"
                                        accept=".pdf"
                                        multiple
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </div>

                                {/* Right Column: Settings */}
                                <div className="space-y-6">
                                    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm sticky top-24">
                                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                                            <Combine className="w-5 h-5" />
                                            Merge Settings
                                        </h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold mb-2">Output Filename</label>
                                                <input
                                                    type="text"
                                                    value={customFileName}
                                                    onChange={(e) => setCustomFileName(e.target.value)}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm font-medium"
                                                    placeholder="merged.pdf"
                                                />
                                            </div>

                                            <div className="pt-4 border-t border-gray-100">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Metadata Editor</p>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">PDF Title</label>
                                                        <input
                                                            type="text"
                                                            value={metadata.title}
                                                            onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm"
                                                            placeholder="Enter title..."
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Author</label>
                                                        <input
                                                            type="text"
                                                            value={metadata.author}
                                                            onChange={(e) => setMetadata({ ...metadata, author: e.target.value })}
                                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm"
                                                            placeholder="Enter author..."
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Subject</label>
                                                        <input
                                                            type="text"
                                                            value={metadata.subject}
                                                            onChange={(e) => setMetadata({ ...metadata, subject: e.target.value })}
                                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm"
                                                            placeholder="Enter subject..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-6 space-y-3">
                                                <button
                                                    onClick={previewMerged}
                                                    disabled={files.length === 0}
                                                    className="w-full btn-outline py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Preview Result
                                                </button>
                                                <button
                                                    onClick={handleMerge}
                                                    className="w-full btn-primary py-4 rounded-2xl shadow-xl shadow-black/10 flex items-center justify-center gap-2"
                                                >
                                                    <Combine className="w-5 h-5" />
                                                    Merge & Save PDF
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {files.length === 0 && (
                                <div className="text-center py-16 text-gray-400">
                                    <p>All files removed. Add more files or go back to upload.</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {status === "processing" && (
                        <ProcessingState
                            message="Merging your PDFs..."
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
                            <h2 className="text-3xl font-bold mb-2">PDFs Merged Successfully!</h2>
                            <p className="text-gray-500 mb-10">Your merged PDF is ready for download.</p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={handleDownload} className="btn-primary py-4 px-10 flex items-center gap-2">
                                    <Download className="w-5 h-5" />
                                    Download PDF
                                </button>
                                <button onClick={reset} className="btn-outline py-4 px-10 flex items-center gap-2">
                                    <RefreshCw className="w-5 h-5" />
                                    Merge Another
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

            <PDFPreviewModal
                isOpen={previewOpen}
                onClose={() => setPreviewOpen(false)}
                images={previewImages}
                currentPage={previewPage}
                onPageChange={setPreviewPage}
                title="PDF Preview"
            />
        </div>
    );
}
