"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import {
  Merge,
  Split,
  Minimize2,
  RotateCw,
  Image,
  FileImage,
  Unlock,
  Lock,
  Layers,
  Stamp,
  FileSignature,
  Type,
  FileText,
  FileUp,
  FileDown,
  ScanLine,
  ArrowRight,
  Zap,
  Shield,
  Globe,
  Check,
  Star,
} from "lucide-react";

const tools = [
  { title: "Merge PDF", description: "Combine multiple PDFs into one", icon: Merge, href: "/merge-pdf", featured: true },
  { title: "Split PDF", description: "Separate pages into files", icon: Split, href: "/split-pdf", featured: true },
  { title: "Compress PDF", description: "Reduce file size instantly", icon: Minimize2, href: "/compress-pdf" },
  { title: "Rotate PDF", description: "Rotate pages any direction", icon: RotateCw, href: "/rotate-pdf" },
  { title: "JPG to PDF", description: "Convert images to PDF", icon: Image, href: "/jpg-to-pdf", featured: true },
  { title: "PDF to JPG", description: "Extract images from PDF", icon: FileImage, href: "/pdf-to-jpg" },
  { title: "Unlock PDF", description: "Remove PDF passwords", icon: Unlock, href: "/unlock-pdf" },
  { title: "Protect PDF", description: "Secure with password", icon: Lock, href: "/protect-pdf" },
  { title: "Organize PDF", description: "Reorder & delete pages", icon: Layers, href: "/organize-pdf" },
  { title: "Watermark", description: "Add text watermarks", icon: Stamp, href: "/watermark-pdf" },
  { title: "Sign PDF", description: "Add digital signature", icon: FileSignature, href: "/sign-pdf" },
  { title: "Edit PDF", description: "Modify PDF content", icon: Type, href: "/edit-pdf" },
  { title: "OCR PDF", description: "Extract text from scans", icon: ScanLine, href: "/ocr-pdf" },
  { title: "PDF to Word", description: "Convert PDF to Word", icon: FileText, href: "/pdf-to-word" },
  { title: "Word to PDF", description: "Convert Word to PDF", icon: FileUp, href: "/word-to-pdf" },
  { title: "PDF to Excel", description: "Convert PDF to Excel", icon: FileDown, href: "/pdf-to-excel" },
];

const features = [
  { icon: Zap, title: "Lightning Fast", description: "Process files in seconds with our optimized engine" },
  { icon: Shield, title: "100% Secure", description: "Files processed locally, never uploaded to servers" },
  { icon: Globe, title: "Works Anywhere", description: "Use on any device, any browser, anytime" },
];

const stats = [
  { value: "Secure", label: "Local Processing" },
  { value: "Fast", label: "Optimized Engine" },
  { value: "0", label: "Data Stored" },
  { value: "Free", label: "Accessibility" },
];

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);

  // Scroll reveal effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    document.querySelectorAll(".scroll-reveal, .stagger-children").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <main className="overflow-hidden">
      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center px-4"
      >
        {/* Background Elements */}
        <div className="absolute inset-0 grid-pattern" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-gray-100 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gray-50 rounded-full blur-3xl animate-float" />

        {/* Floating Icons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="absolute top-32 left-[15%] hidden lg:block"
        >
          <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center animate-float">
            <FileText className="w-8 h-8" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="absolute top-48 right-[12%] hidden lg:block"
        >
          <div className="w-20 h-20 bg-black text-white rounded-2xl shadow-xl flex items-center justify-center animate-float-slow">
            <Merge className="w-10 h-10" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="absolute bottom-40 left-[20%] hidden lg:block"
        >
          <div className="w-14 h-14 bg-gray-100 rounded-xl shadow-lg flex items-center justify-center animate-float">
            <Image className="w-7 h-7" />
          </div>
        </motion.div>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              100% Free & Privacy First
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-[0.95]"
          >
            Every PDF Tool
            <br />
            <span className="animate-text-shimmer">You&apos;ll Ever Need</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10"
          >
            Merge, split, compress, convert — do everything with your PDFs.
            All processing happens in your browser. Your files never leave your device.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/merge-pdf" className="btn-primary text-lg px-10 py-4 inline-flex items-center justify-center gap-2 group">
              Get Started
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="#tools" className="btn-secondary text-lg px-10 py-4 inline-flex items-center justify-center">
              Explore Tools
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-gray-400 rounded-full animate-bounce" />
          </div>
        </motion.div>
      </motion.section>

      {/* Stats Section */}
      <section className="py-16 border-y border-gray-100 bg-gray-50/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 stagger-children">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-gray-500 text-sm uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools Grid - Bento Style */}
      <section id="tools" className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="section-title mb-4">Powerful PDF Tools</h2>
            <p className="section-subtitle mx-auto">
              Everything you need to work with PDF files, completely free.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
            {tools.slice(0, 4).map((tool, index) => (
              <Link
                key={tool.href}
                href={tool.href}
                className={`tool-card ${index === 0 ? "lg:col-span-2 lg:row-span-2" : ""}`}
              >
                <div className={`tool-icon ${index === 0 ? "w-20 h-20" : ""} mb-4`}>
                  <tool.icon className={index === 0 ? "w-10 h-10" : "w-7 h-7"} />
                </div>
                <h3 className={`font-bold mb-2 ${index === 0 ? "text-2xl" : "text-lg"}`}>{tool.title}</h3>
                <p className="text-gray-500 text-sm">{tool.description}</p>
                <div className="mt-4 flex items-center text-sm font-medium group-hover:underline">
                  Use Tool <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 stagger-children">
            {tools.slice(4).map((tool) => (
              <Link key={tool.href} href={tool.href} className="tool-card">
                <div className="tool-icon mb-4">
                  <tool.icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-lg mb-2">{tool.title}</h3>
                <p className="text-gray-500 text-sm">{tool.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32 bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 grid-pattern" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)' }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="section-title text-white mb-4">Why SimplyPDF?</h2>
            <p className="section-subtitle text-gray-400 mx-auto">
              Built for speed, privacy, and simplicity.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 stagger-children">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-500 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:rotate-6">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="mt-20 flex flex-wrap justify-center gap-6 scroll-reveal">
            {["No signup required", "Works offline", "No file limits", "Forever free"].map((badge) => (
              <div key={badge} className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20">
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-sm">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="relative max-w-4xl mx-auto text-center p-12 md:p-20 rounded-[3rem] bg-gray-50 overflow-hidden scroll-reveal">
            <div className="absolute inset-0 grid-pattern opacity-50" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-gray-200 rounded-full blur-3xl -translate-y-1/2" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Ready to simplify your PDFs?
              </h2>
              <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto">
                Join millions who trust SimplyPDF for their document needs.
              </p>
              <Link href="/merge-pdf" className="btn-primary text-lg px-12 py-5 inline-flex items-center gap-2">
                Start Now — It&apos;s Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Preview */}
      <section className="py-16 border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-8 flex-wrap scroll-reveal">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-black" />
              ))}
            </div>
            <div className="text-gray-500">
              Loved by <span className="text-black font-semibold">10,000+</span> users worldwide
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
