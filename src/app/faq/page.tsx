"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import {
    HelpCircle,
    ChevronDown,
    Shield,
    Zap,
    FileText,
    ArrowLeft,
    Lock,
    Merge,
    Split,
    Minimize2,
    Image,
    RotateCw,
    Search
} from "lucide-react";

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQCategory {
    title: string;
    icon: React.ElementType;
    faqs: FAQItem[];
}

const faqCategories: FAQCategory[] = [
    {
        title: "General Questions",
        icon: HelpCircle,
        faqs: [
            {
                question: "What is SimplyPDF?",
                answer: "SimplyPDF is a free online tool that lets you work with PDF files directly in your browser. You can merge, split, compress, convert, rotate, and edit PDFs without uploading them to any server. All processing happens locally on your device for maximum privacy and speed."
            },
            {
                question: "Is SimplyPDF really free?",
                answer: "Yes, SimplyPDF is completely free to use with no hidden costs. All features are available at no charge. We sustain the service through non-intrusive advertising. There are no premium tiers, file limits, or watermarks on your documents."
            },
            {
                question: "Do I need to create an account?",
                answer: "No account is required to use any of our PDF tools. You can optionally sign in with Google to keep a history of your actions across sessions, but this is completely optional. All core features work without signing in."
            },
            {
                question: "What file size limits are there?",
                answer: "Since all processing happens in your browser, file limits depend on your device's available memory. Most modern devices can handle files up to 100MB without issues. For very large files (100MB+), performance may vary based on your device."
            },
            {
                question: "What browsers are supported?",
                answer: "SimplyPDF works on all modern browsers including Chrome, Firefox, Safari, Edge, and Opera. We recommend using the latest version of your browser for the best experience. Mobile browsers are also fully supported."
            }
        ]
    },
    {
        title: "Privacy & Security",
        icon: Shield,
        faqs: [
            {
                question: "Are my files uploaded to your servers?",
                answer: "No, your files are NEVER uploaded to our servers. All PDF processing happens entirely in your web browser using JavaScript. This means your sensitive documents never leave your device, ensuring complete privacy and security."
            },
            {
                question: "Is SimplyPDF safe to use for sensitive documents?",
                answer: "Yes, SimplyPDF is extremely safe for sensitive documents. Since we process everything locally in your browser, confidential information like contracts, financial documents, or personal records never leave your computer. Your data stays on your device."
            },
            {
                question: "What happens to my files after processing?",
                answer: "Your files exist only in your browser's memory while you're using the tool. When you close the tab or navigate away, all file data is automatically cleared. We don't store, cache, or have any access to your documents."
            },
            {
                question: "Do you use cookies?",
                answer: "We use minimal cookies for essential functionality (like remembering theme preferences) and analytics to improve our service. We also use Google AdSense cookies for advertising. You can manage cookie preferences through your browser settings."
            }
        ]
    },
    {
        title: "PDF Tools",
        icon: FileText,
        faqs: [
            {
                question: "How do I merge multiple PDFs?",
                answer: "Go to the Merge PDF tool, drag and drop your PDF files or click to browse and select them. You can reorder files by dragging them into your preferred order. You can also expand each file to see pages, rotate or remove specific pages. When ready, click 'Merge & Download' to combine them into a single PDF."
            },
            {
                question: "How do I split a PDF into multiple files?",
                answer: "Use the Split PDF tool. Upload your PDF, then choose how to split: by specific page ranges (e.g., '1-5, 8-10'), extract all pages as separate files, or select specific pages visually. Click 'Split PDF' to process and download your split files."
            },
            {
                question: "How does PDF compression work?",
                answer: "Our compression tool optimizes your PDF by removing redundant data, optimizing images, and streamlining the file structure. The compression maintains document quality while reducing file size, typically achieving 30-70% size reduction depending on the original file's content."
            },
            {
                question: "Can I convert scanned PDFs to editable text?",
                answer: "Yes! Our OCR (Optical Character Recognition) tool can extract text from scanned documents and image-based PDFs. Upload your scanned PDF, and our tool will process it to extract readable, searchable text. The accuracy depends on the scan quality."
            },
            {
                question: "How do I add a password to my PDF?",
                answer: "Use the Protect PDF tool. Upload your PDF, enter your desired password, and optionally set permissions (like preventing printing or copying). The tool will encrypt your PDF with industry-standard AES encryption."
            },
            {
                question: "What image formats can I convert to PDF?",
                answer: "Our JPG to PDF tool supports JPG, JPEG, PNG, and other common image formats. You can upload multiple images and combine them into a single PDF, or convert each image to its own PDF file."
            }
        ]
    },
    {
        title: "Troubleshooting",
        icon: Zap,
        faqs: [
            {
                question: "Why is processing taking a long time?",
                answer: "Processing time depends on your file size and your device's capabilities. Large PDFs with many pages or high-resolution images take longer. If processing seems stuck, try refreshing the page and using a smaller file, or try on a device with more RAM."
            },
            {
                question: "Why can't I upload my PDF?",
                answer: "Make sure your file has a .pdf extension and is a valid PDF document. Some PDFs may be corrupted or use unsupported features. If the file opens in other PDF readers, try saving it as a new PDF and uploading the new copy."
            },
            {
                question: "The output PDF looks different from the original",
                answer: "PDF processing can sometimes affect formatting, especially for complex documents with special fonts or interactive elements. For best results, use source PDFs that are print-ready. If you're having issues, try using a different tool or contact us."
            },
            {
                question: "My protected PDF won't unlock",
                answer: "Our unlock tool can only remove restrictions (like no-printing) from PDFs. If the PDF requires a password to open (fully encrypted), you'll need to enter the correct password. We cannot bypass password protection without the password."
            },
            {
                question: "The download didn't start",
                answer: "Check if your browser is blocking downloads or pop-ups. Try using a different browser. If the issue persists, make sure you have enough disk space and try right-clicking the download button and selecting 'Save As'."
            }
        ]
    }
];

function FAQAccordion({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
    return (
        <div className="border-b border-gray-100 last:border-0">
            <button
                onClick={onToggle}
                className="w-full py-5 flex items-start justify-between gap-4 text-left group"
            >
                <span className="font-medium group-hover:text-black transition-colors pr-4">
                    {item.question}
                </span>
                <ChevronDown
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <p className="pb-5 text-gray-600 leading-relaxed">
                            {item.answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function FAQPage() {
    const [openItems, setOpenItems] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");

    const toggleItem = (key: string) => {
        const newOpenItems = new Set(openItems);
        if (newOpenItems.has(key)) {
            newOpenItems.delete(key);
        } else {
            newOpenItems.add(key);
        }
        setOpenItems(newOpenItems);
    };

    // Filter FAQs based on search
    const filteredCategories = faqCategories.map(category => ({
        ...category,
        faqs: category.faqs.filter(
            faq =>
                faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(category => category.faqs.length > 0);

    return (
        <main className="min-h-screen pt-32 pb-20 px-4">
            {/* Background */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute top-20 right-10 w-96 h-96 bg-gray-100 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-20 left-10 w-72 h-72 bg-gray-50 rounded-full blur-3xl opacity-60" />
            </div>

            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-black mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>

                    <div className="w-20 h-20 bg-black text-white rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <HelpCircle className="w-10 h-10" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                        Find answers to common questions about SimplyPDF and our tools.
                    </p>
                </motion.div>

                {/* Search */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-12"
                >
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search questions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-lg"
                        />
                    </div>
                </motion.div>

                {/* Quick Links */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
                >
                    {faqCategories.map((category, index) => (
                        <a
                            key={category.title}
                            href={`#${category.title.toLowerCase().replace(/\s+/g, '-')}`}
                            className="p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 text-center group"
                        >
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-black group-hover:text-white transition-colors">
                                <category.icon className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium">{category.title}</span>
                        </a>
                    ))}
                </motion.div>

                {/* FAQ Categories */}
                {filteredCategories.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16 bg-gray-50 rounded-2xl"
                    >
                        <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">No results found</h3>
                        <p className="text-gray-500">Try searching with different keywords</p>
                    </motion.div>
                ) : (
                    <div className="space-y-8">
                        {filteredCategories.map((category, catIndex) => (
                            <motion.div
                                key={category.title}
                                id={category.title.toLowerCase().replace(/\s+/g, '-')}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + catIndex * 0.05 }}
                                className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                            >
                                <div className="px-6 py-5 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">
                                        <category.icon className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xl font-bold">{category.title}</h2>
                                    <span className="ml-auto text-sm text-gray-400">
                                        {category.faqs.length} questions
                                    </span>
                                </div>
                                <div className="px-6">
                                    {category.faqs.map((faq, faqIndex) => {
                                        const key = `${catIndex}-${faqIndex}`;
                                        return (
                                            <FAQAccordion
                                                key={key}
                                                item={faq}
                                                isOpen={openItems.has(key)}
                                                onToggle={() => toggleItem(key)}
                                            />
                                        );
                                    })}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Still Need Help */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-16 text-center p-10 bg-gray-50 rounded-3xl"
                >
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">
                        Still Have Questions?
                    </h2>
                    <p className="text-gray-500 mb-8 max-w-lg mx-auto">
                        Can&apos;t find what you&apos;re looking for? We&apos;re here to help.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/contact" className="btn-primary">
                            Contact Us
                        </Link>
                        <Link href="/" className="btn-secondary">
                            Explore Tools
                        </Link>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
