"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, File, X, Download, Loader2, CheckCircle2, RefreshCw, AlertCircle, Scissors, Eye, Check, ArrowRight, LayoutGrid } from "lucide-react";
import { splitPDF, downloadAsZip, formatFileSize } from "@/lib/pdf-utils";
import { PDFPreviewModal } from "@/components/PDFPreviewModal";
import {
    AnimatedBackground,
    FloatingDecorations,
    ToolHeader,
    ToolCard,
    ProcessingState
} from "@/components/ToolPageElements";

type SplitMode = "all" | "range" | "select" | "fixed_range" | "size_limit" | "manual";

interface PageInfo {
    pageNumber: number;
    image: string;
    selected: boolean;
}

interface VisualGroup {
    id: string;
    pages: PageInfo[];
    label: string;
}

export default function SplitPDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [mode, setMode] = useState<SplitMode>("all");
    const [ranges, setRanges] = useState("");
    const [fixedRange, setFixedRange] = useState(1);
    const [sizeLimit, setSizeLimit] = useState(1); // MB
    const [status, setStatus] = useState<"idle" | "loading" | "ready" | "processing" | "success" | "error">("idle");
    const [results, setResults] = useState<{ name: string; data: Uint8Array }[]>([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [dragActive, setDragActive] = useState(false);
    const [pages, setPages] = useState<PageInfo[]>([]);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewPage, setPreviewPage] = useState(0);
    const [manualCuts, setManualCuts] = useState<Set<number>>(new Set());
    const [customFileName, setCustomFileName] = useState("split_document.pdf");
    const [splitPattern, setSplitPattern] = useState("{filename}_part_{n}"); // New pattern state
    const [lastSelectedPage, setLastSelectedPage] = useState<number | null>(null); // For Shift+Click

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

    const handlePageClick = (pageNumber: number, isShiftKey: boolean) => {
        if (mode !== "select") {
            setPreviewOpen(true);
            setPreviewPage(pages.findIndex(p => p.pageNumber === pageNumber));
            return;
        }

        if (isShiftKey && lastSelectedPage !== null) {
            const start = Math.min(lastSelectedPage, pageNumber);
            const end = Math.max(lastSelectedPage, pageNumber);
            setPages(pages.map(p =>
                p.pageNumber >= start && p.pageNumber <= end ? { ...p, selected: true } : p
            ));
        } else {
            setPages(pages.map(p =>
                p.pageNumber === pageNumber ? { ...p, selected: !p.selected } : p
            ));
            setLastSelectedPage(pageNumber);
        }
    };

    // Visual Grouping Engine
    const getVisualGroups = (): VisualGroup[] => {
        if (pages.length === 0) return [];

        if (mode === "all") {
            // Each page is a group
            return pages.map(p => ({
                id: `page-${p.pageNumber}`,
                pages: [p],
                label: `File ${p.pageNumber}`
            }));
        }

        if (mode === "select") {
            // One big group of selected pages (visualize unselected as dimmed)
            return [{
                id: "selection-group",
                pages: pages,
                label: "Selection Mode"
            }];
        }

        if (mode === "manual") {
            // Groups based on manual cuts
            const groups: VisualGroup[] = [];
            let currentGroup: PageInfo[] = [];
            let groupIndex = 1;

            pages.forEach((page, index) => {
                currentGroup.push(page);
                if (manualCuts.has(page.pageNumber) || index === pages.length - 1) {
                    groups.push({
                        id: `group-${groupIndex}`,
                        pages: [...currentGroup],
                        label: `File ${groupIndex}`
                    });
                    currentGroup = [];
                    groupIndex++;
                }
            });
            return groups;
        }

        if (mode === "fixed_range") {
            const groups: VisualGroup[] = [];
            const chunkSize = Math.max(1, fixedRange);
            for (let i = 0; i < pages.length; i += chunkSize) {
                const chunk = pages.slice(i, i + chunkSize);
                groups.push({
                    id: `chunk-${i}`,
                    pages: chunk,
                    label: `File ${groups.length + 1}`
                });
            }
            return groups;
        }

        // Fallback for other modes
        return [{ id: "default-group", pages: pages, label: "All Pages" }];
    };

    const selectAll = () => setPages(pages.map(p => ({ ...p, selected: true })));
    const deselectAll = () => setPages(pages.map(p => ({ ...p, selected: false })));

    const toggleCut = (index: number) => {
        const newCuts = new Set(manualCuts);
        if (newCuts.has(index)) {
            newCuts.delete(index);
        } else {
            newCuts.add(index);
        }
        setManualCuts(newCuts);
    };

    const handleSplit = async () => {
        if (!file) return;
        setStatus("processing");
        setErrorMessage("");

        try {
            let splitFiles;
            switch (mode) {
                case "select":
                    const selectedRanges = pages
                        .filter(p => p.selected)
                        .map(p => p.pageNumber.toString())
                        .join(",");
                    splitFiles = await splitPDF(file, "range", selectedRanges);
                    break;
                case "manual":
                    const sortedCuts = Array.from(manualCuts).sort((a, b) => a - b);
                    const manualRanges: string[] = [];
                    let lastPage = 0;
                    sortedCuts.forEach(cut => {
                        manualRanges.push(`${lastPage + 1}-${cut}`);
                        lastPage = cut;
                    });
                    if (lastPage < pages.length) {
                        manualRanges.push(`${lastPage + 1}-${pages.length}`);
                    }
                    splitFiles = await splitPDF(file, "range", manualRanges.join(","));
                    break;
                case "range":
                    splitFiles = await splitPDF(file, "range", ranges);
                    break;
                case "fixed_range":
                    splitFiles = await splitPDF(file, "fixed_range", Number(fixedRange));
                    break;
                case "size_limit":
                    splitFiles = await splitPDF(file, "size_limit", Number(sizeLimit));
                    break;
                default:
                    splitFiles = await splitPDF(file, "all");
            }
            setResults(splitFiles);
            setStatus("success");
        } catch (error) {
            console.error(error);
            setErrorMessage(error instanceof Error ? error.message : "Failed to split PDF");
            setStatus("error");
        }
    };

    const handleDownloadAll = async () => {
        if (results.length === 0) return;
        await downloadAsZip(results, "split-pdfs.zip");
    };

    const handleDownloadSingle = (result: { name: string; data: Uint8Array }) => {
        const blob = new Blob([result.data.slice().buffer], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.name;
        link.click();
        URL.revokeObjectURL(url);
    };

    const reset = () => {
        setFile(null);
        setMode("all");
        setRanges("");
        setStatus("idle");
        setResults([]);
        setPages([]);
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
                                title="Split PDF"
                                description="Extract pages from your PDF with visual selection."
                                icon={Scissors}
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
                            description="Generating page previews..."
                        />
                    )}

                    {status === "ready" && (
                        <motion.div
                            key="ready"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-7xl mx-auto"
                        >
                            <div className="flex flex-col lg:flex-row gap-8 items-start">
                                {/* Left Column: Page Grid */}
                                <div className="flex-1 w-full bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
                                                <File className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 leading-none mb-1">{file?.name}</h3>
                                                <p className="text-xs text-gray-500 font-medium">
                                                    {pages.length} Pages • {formatFileSize(file?.size || 0)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {mode === "select" && (
                                                <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-gray-200">
                                                    <button onClick={selectAll} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-gray-50 rounded-md transition-colors">Select All</button>
                                                    <div className="w-px h-3 bg-gray-200" />
                                                    <button onClick={deselectAll} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-gray-50 rounded-md transition-colors">Clear</button>
                                                </div>
                                            )}
                                            <button onClick={reset} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors">
                                                <RefreshCw className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-8 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                                        {/* Visual Groups Render */}
                                        <div className="space-y-8">
                                            {getVisualGroups().map((group: VisualGroup) => (
                                                <div key={group.id} className="relative">
                                                    {(mode === "manual" || mode === "fixed_range" || mode === "all") && (
                                                        <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                            <LayoutGrid className="w-3 h-3" />
                                                            {group.label}
                                                            <div className="flex-1 h-px bg-gray-100" />
                                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{group.pages.length} pages</span>
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                                        {group.pages.map((page, index) => (
                                                            <div key={page.pageNumber} className="relative group flex flex-col items-center">
                                                                <motion.div
                                                                    whileHover={{ y: -4 }}
                                                                    className={`relative aspect-[3/4] w-full rounded-xl border-2 transition-all duration-300 shadow-sm overflow-hidden ${mode === "select"
                                                                        ? page.selected
                                                                            ? "border-black ring-4 ring-black/5"
                                                                            : "border-gray-200 opacity-60 grayscale-[0.5]"
                                                                        : "border-gray-100 hover:border-gray-300"
                                                                        }`}
                                                                    onClick={(e) => handlePageClick(page.pageNumber, e.shiftKey)}
                                                                >
                                                                    <img src={page.image} alt={`Page ${page.pageNumber}`} className="w-full h-full object-cover" />

                                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />

                                                                    {/* Selection Indicator */}
                                                                    {mode === "select" && (
                                                                        <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${page.selected ? "bg-black border-black text-white scale-100" : "bg-white/80 backdrop-blur-sm border-gray-300 scale-90 opacity-0 group-hover:opacity-100"
                                                                            }`}>
                                                                            {page.selected && <Check className="w-3.5 h-3.5" />}
                                                                        </div>
                                                                    )}

                                                                    {/* Page Number Badge */}
                                                                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold rounded-lg leading-none">
                                                                        P.{page.pageNumber}
                                                                    </div>

                                                                    {/* Zoom Action */}
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setPreviewPage(index); setPreviewOpen(true); }}
                                                                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                                                    >
                                                                        <div className="w-8 h-8 bg-white/90 backdrop-blur shadow-lg rounded-full flex items-center justify-center pointer-events-auto hover:bg-white transition-transform transform hover:scale-110">
                                                                            <Eye className="w-4 h-4 text-gray-900" />
                                                                        </div>
                                                                    </button>
                                                                </motion.div>

                                                                {/* Manual Cut Indicator */}
                                                                {mode === "manual" && index < pages.length - 1 && (
                                                                    <div
                                                                        className={`absolute -right-3 top-0 bottom-0 w-1 group-last:hidden z-10 transition-all cursor-pointer flex items-center justify-center ${manualCuts.has(page.pageNumber) ? "opacity-100" : "opacity-0 hover:opacity-100"
                                                                            }`}
                                                                        onClick={() => toggleCut(page.pageNumber)}
                                                                    >
                                                                        <div className={`h-full w-0.5 ${manualCuts.has(page.pageNumber) ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-gray-300"}`} />
                                                                        <div className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-all ${manualCuts.has(page.pageNumber) ? "bg-red-500 scale-110" : "bg-white scale-75 group-hover:scale-90"
                                                                            }`}>
                                                                            <Scissors className={`w-3 h-3 ${manualCuts.has(page.pageNumber) ? "text-white rotate-90" : "text-gray-400"}`} />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Sidebar Settings */}
                                <div className="w-full lg:w-[380px] space-y-6 lg:sticky lg:top-24">
                                    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6">
                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                                <Scissors className="w-4 h-4" />
                                            </div>
                                            <h4 className="font-bold text-gray-900">Split Settings</h4>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Mode Selection */}
                                            <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
                                                {[
                                                    { id: "all", icon: Scissors, label: "All Pages" },
                                                    { id: "select", icon: CheckCircle2, label: "Select" },
                                                    { id: "range", icon: File, label: "Range" },
                                                    { id: "manual", icon: Scissors, label: "Manual" },
                                                    { id: "fixed_range", icon: RefreshCw, label: "Fixed" },
                                                    { id: "size_limit", icon: Download, label: "Size" },
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => setMode(opt.id as SplitMode)}
                                                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${mode === opt.id
                                                            ? "bg-white text-black shadow-sm"
                                                            : "text-gray-400 hover:text-gray-600"
                                                            }`}
                                                    >
                                                        <opt.icon className="w-3.5 h-3.5" />
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Contextual Options */}
                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={mode}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="pt-2"
                                                >
                                                    {mode === "range" && (
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Page Ranges</label>
                                                            <input
                                                                type="text"
                                                                value={ranges}
                                                                onChange={(e) => setRanges(e.target.value)}
                                                                placeholder="e.g. 1-3, 5, 8-10"
                                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm"
                                                            />
                                                        </div>
                                                    )}
                                                    {mode === "fixed_range" && (
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Split Every X Pages</label>
                                                            <div className="flex items-center gap-4">
                                                                <input
                                                                    type="range"
                                                                    min="1"
                                                                    max={pages.length}
                                                                    value={fixedRange}
                                                                    onChange={(e) => setFixedRange(Number(e.target.value))}
                                                                    className="flex-1 accent-black h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                                                />
                                                                <div className="w-12 h-10 bg-black text-white rounded-lg flex items-center justify-center font-bold text-sm">
                                                                    {fixedRange}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {mode === "size_limit" && (
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Split by File Size (MB)</label>
                                                            <div className="flex items-center gap-4">
                                                                <input
                                                                    type="number"
                                                                    min="0.1"
                                                                    step="0.1"
                                                                    value={sizeLimit}
                                                                    onChange={(e) => setSizeLimit(Number(e.target.value))}
                                                                    className="w-24 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm font-bold"
                                                                />
                                                                <span className="text-sm font-medium text-gray-500">MB per file</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {mode === "manual" && (
                                                        <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                                                            <p className="text-xs text-red-600 leading-relaxed font-medium">
                                                                Click on the <strong>plus icon</strong> between pages to mark where you want to cut the document.
                                                            </p>
                                                        </div>
                                                    )}
                                                    {mode === "all" && (
                                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                            <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                                                Every page will be extracted as a separate PDF file.
                                                            </p>
                                                        </div>
                                                    )}
                                                    {mode === "select" && (
                                                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                                            <p className="text-xs text-blue-600 leading-relaxed font-medium">
                                                                Only the pages you select will be extracted (merged into a single new PDF).
                                                            </p>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            </AnimatePresence>

                                            {/* Divider */}
                                            <div className="h-px bg-gray-50 my-2" />

                                            {/* Filename Editor & Pattern */}
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Output Naming</label>
                                                    <input
                                                        type="text"
                                                        value={customFileName}
                                                        onChange={(e) => setCustomFileName(e.target.value)}
                                                        placeholder="Enter base filename..."
                                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm"
                                                    />
                                                </div>

                                                {(mode === "manual" || mode === "fixed_range" || mode === "all" || mode === "size_limit") && (
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Pattern</label>
                                                        <input
                                                            type="text"
                                                            value={splitPattern}
                                                            onChange={(e) => setSplitPattern(e.target.value)}
                                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm font-mono"
                                                            placeholder="{filename}_part_{n}"
                                                        />
                                                        <p className="text-[10px] text-gray-400 px-1">Use <code>{`{n}`}</code> for number, <code>{`{filename}`}</code> for original name.</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Summary */}
                                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                                <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                                                    <span>Summary</span>
                                                    <CheckCircle2 className="w-3 h-3" />
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Output files:</span>
                                                        <span className="font-bold text-gray-900">
                                                            {mode === "all" ? pages.length :
                                                                mode === "manual" ? manualCuts.size + 1 :
                                                                    mode === "select" ? 1 :
                                                                        mode === "fixed_range" ? Math.ceil(pages.length / fixedRange) : "?"}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Selected mode:</span>
                                                        <span className="font-bold text-gray-900 capitalize">{mode.replace("_", " ")}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <button
                                                onClick={handleSplit}
                                                disabled={
                                                    (mode === "select" && pages.filter(p => p.selected).length === 0) ||
                                                    (mode === "range" && !ranges.trim())
                                                }
                                                className="w-full btn-primary py-4 rounded-2xl shadow-xl shadow-black/10 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:grayscale transition-all hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                <Scissors className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                                <span className="font-bold text-base">Process & Split PDF</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {status === "processing" && (
                        <ProcessingState
                            message="Splitting PDF..."
                            description="This won't take long..."
                        />
                    )}

                    {status === "success" && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-4xl mx-auto"
                        >
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <h2 className="text-3xl font-bold mb-2">PDF Split Successfully!</h2>
                                <p className="text-gray-500">Created {results.length} files</p>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {results.map((result, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <File className="w-5 h-5 text-gray-400" />
                                                <span className="font-medium">{result.name}</span>
                                            </div>
                                            <button
                                                onClick={() => handleDownloadSingle(result)}
                                                className="text-sm px-3 py-1 bg-black text-white rounded-lg hover:bg-gray-800"
                                            >
                                                Download
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button onClick={handleDownloadAll} className="btn-primary py-4 px-10 flex items-center gap-2 justify-center">
                                    <Download className="w-5 h-5" />
                                    Download All (ZIP)
                                </button>
                                <button onClick={reset} className="btn-outline py-4 px-10 flex items-center gap-2 justify-center">
                                    <RefreshCw className="w-5 h-5" />
                                    Split Another
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
        </div >
    );
}
