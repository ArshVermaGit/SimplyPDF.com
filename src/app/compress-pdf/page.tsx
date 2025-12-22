"use client";

import { ToolPageLayout } from "@/components/ToolPageLayout";
import { compressPDF, uint8ArrayToBlob } from "@/lib/pdf-utils";

export default function CompressPDFPage() {
    const handleCompress = async (files: File[]): Promise<Blob | null> => {
        try {
            const file = files[0];
            const compressedBytes = await compressPDF(file);
            return uint8ArrayToBlob(compressedBytes);
        } catch (error) {
            console.error("Compress error:", error);
            throw new Error("Failed to compress PDF. Please ensure the file is a valid PDF.");
        }
    };

    return (
        <ToolPageLayout
            title="Compress PDF"
            description="Reduce file size while optimizing for maximal PDF quality."
            actionButtonText="Compress PDF"
            processingText="Compressing your PDF..."
            successTitle="PDF Compressed!"
            successDescription="Your optimized PDF is ready. File size has been reduced while maintaining quality."
            onProcess={handleCompress}
            multiple={false}
            downloadFileName="compressed.pdf"
            historyAction="Compressed PDF"
            howItWorks={{
                title: "How to Compress PDF",
                steps: [
                    "Select the PDF file you want to compress from your device.",
                    "Our tool will automatically optimize images and remove redundant data.",
                    "Download your smaller, high-quality PDF instantly."
                ]
            }}
            benefits={{
                title: "Benefits of PDF Compression",
                items: [
                    { title: "Reduce Storage", desc: "Save space on your device and in your cloud storage by making PDFs smaller." },
                    { title: "Faster Sharing", desc: "Small PDFs are much easier to send via email and upload to websites." },
                    { title: "Maintain Quality", desc: "We use smart compression that keeps your text and images looking professional." },
                    { title: "Completely Private", desc: "No files are ever uploaded. Your sensitive documents stay on your computer." }
                ]
            }}
            faqs={[
                {
                    question: "Will my PDF lose quality?",
                    answer: "We use lossy compression mostly on images, but we keep text and vectors intact. You won't notice a difference in most documents, while saving significant space."
                },
                {
                    question: "How much can I reduce my PDF size?",
                    answer: "Most users see 30-70% reduction in size, though this depends heavily on the original images and content in your PDF."
                },
                {
                    question: "Is there a limit on file size?",
                    answer: "Since we process everything in your browser, the limit is based on your device's memory. Most files up to 100MB work perfectly."
                }
            ]}
        />
    );
}
