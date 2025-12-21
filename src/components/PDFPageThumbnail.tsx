"use client";

import { motion } from "framer-motion";
import { Eye, Trash2, GripVertical, Check } from "lucide-react";

interface PDFPageThumbnailProps {
    image: string;
    pageNumber: number;
    isSelected?: boolean;
    showDragHandle?: boolean;
    showDelete?: boolean;
    showSelect?: boolean;
    showPreviewButton?: boolean;
    onSelect?: () => void;
    onDelete?: () => void;
    onPreview?: () => void;
    className?: string;
}

export function PDFPageThumbnail({
    image,
    pageNumber,
    isSelected = true,
    showDragHandle = false,
    showDelete = false,
    showSelect = false,
    showPreviewButton = true,
    onSelect,
    onDelete,
    onPreview,
    className = "",
}: PDFPageThumbnailProps) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -4 }}
            className={`relative group ${className}`}
        >
            {/* Thumbnail Container */}
            <div
                className={`relative overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${isSelected
                        ? "border-black shadow-lg"
                        : "border-gray-200 opacity-60"
                    }`}
                onClick={onPreview}
            >
                {/* Drag Handle */}
                {showDragHandle && (
                    <div className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing">
                        <div className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            <GripVertical className="w-4 h-4 text-gray-500" />
                        </div>
                    </div>
                )}

                {/* Page Image */}
                <div className="aspect-[3/4] bg-white">
                    <img
                        src={image}
                        alt={`Page ${pageNumber}`}
                        className="w-full h-full object-contain"
                    />
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    {showPreviewButton && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="p-3 bg-white rounded-full shadow-xl">
                                <Eye className="w-5 h-5" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Page Number Badge */}
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black text-white text-xs font-bold rounded">
                    {pageNumber}
                </div>

                {/* Selection Indicator */}
                {showSelect && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onSelect?.(); }}
                        className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                                ? "bg-black border-black text-white"
                                : "bg-white border-gray-300 hover:border-black"
                            }`}
                    >
                        {isSelected && <Check className="w-3 h-3" />}
                    </button>
                )}

                {/* Delete Button */}
                {showDelete && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        </motion.div>
    );
}
