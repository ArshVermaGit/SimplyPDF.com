"use client";

import { ToolPageLayout } from "@/components/ToolPageLayout";
import { mergePDFs, uint8ArrayToBlob } from "@/lib/pdf-utils";

export default function MergePDFPage() {
    const handleMerge = async (files: File[]): Promise<Blob | null> => {
        try {
            const mergedPdfBytes = await mergePDFs(files);
            return uint8ArrayToBlob(mergedPdfBytes);
        } catch (error) {
            console.error("Merge error:", error);
            throw new Error("Failed to merge PDFs. Please ensure all files are valid PDFs.");
        }
    };

    return (
        <ToolPageLayout
            title="Merge PDF"
            description="Combine PDFs in the order you want. Drag and drop to reorder files."
            actionButtonText="Merge PDFs"
            processingText="Merging your PDFs..."
            successTitle="PDFs Merged Successfully!"
            successDescription="Your merged PDF is ready. Click below to download it."
            onProcess={handleMerge}
            multiple={true}
            allowReorder={true}
            downloadFileName="merged.pdf"
        />
    );
}
