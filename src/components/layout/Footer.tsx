"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
    Merge,
    Split,
    Minimize2,
    RotateCw,
    Image,
    FileImage,
    Github,
    Twitter,
    Linkedin,
    ArrowUpRight,
} from "lucide-react";

const tools = [
    { title: "Merge PDF", href: "/merge-pdf" },
    { title: "Split PDF", href: "/split-pdf" },
    { title: "Compress PDF", href: "/compress-pdf" },
    { title: "Rotate PDF", href: "/rotate-pdf" },
    { title: "JPG to PDF", href: "/jpg-to-pdf" },
    { title: "PDF to JPG", href: "/pdf-to-jpg" },
    { title: "Unlock PDF", href: "/unlock-pdf" },
    { title: "Protect PDF", href: "/protect-pdf" },
];

const resources = [
    { title: "About", href: "/about" },
    { title: "Privacy", href: "/privacy" },
    { title: "Terms", href: "/terms" },
    { title: "Contact", href: "/contact" },
    { title: "FAQ", href: "/faq" },
];

const socials = [
    { icon: Twitter, href: "https://x.com/TheArshVerma", label: "Twitter" },
    { icon: Github, href: "https://github.com/ArshVermaGit", label: "GitHub" },
    { icon: Linkedin, href: "https://www.linkedin.com/in/arshvermadev/", label: "LinkedIn" },
];

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-950 text-white">
            {/* Main Footer */}
            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Brand Column */}
                    <div className="lg:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-6 group">
                            <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-bold text-xl transition-transform group-hover:scale-110 group-hover:rotate-3">
                                S
                            </div>
                            <span className="text-xl font-bold tracking-tight">
                                Simply<span className="text-gray-400">PDF</span>
                            </span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            Free online PDF tools for everyone. Process files securely in your browser — your files never leave your device.
                        </p>

                        {/* Social Links */}
                        <div className="flex items-center gap-3">
                            {socials.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    aria-label={social.label}
                                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300 hover:scale-110"
                                >
                                    <social.icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Tools Column */}
                    <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-6">
                            Popular Tools
                        </h4>
                        <ul className="space-y-3">
                            {tools.slice(0, 6).map((tool) => (
                                <li key={tool.href}>
                                    <Link
                                        href={tool.href}
                                        className="text-gray-300 hover:text-white transition-colors inline-flex items-center gap-1 group text-sm"
                                    >
                                        {tool.title}
                                        <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* More Tools Column */}
                    <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-6">
                            More Tools
                        </h4>
                        <ul className="space-y-3">
                            {tools.slice(6).map((tool) => (
                                <li key={tool.href}>
                                    <Link
                                        href={tool.href}
                                        className="text-gray-300 hover:text-white transition-colors inline-flex items-center gap-1 group text-sm"
                                    >
                                        {tool.title}
                                        <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <Link
                                    href="/#tools"
                                    className="text-white font-medium hover:underline inline-flex items-center gap-1 text-sm"
                                >
                                    View All Tools →
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources Column */}
                    <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-6">
                            Company
                        </h4>
                        <ul className="space-y-3">
                            {resources.map((resource) => (
                                <li key={resource.title}>
                                    <Link
                                        href={resource.href}
                                        className="text-gray-300 hover:text-white transition-colors text-sm"
                                    >
                                        {resource.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        {/* Newsletter */}
                        <div className="mt-8">
                            <h4 className="font-semibold text-sm mb-3">Stay Updated</h4>
                            <div className="flex">
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    className="flex-1 px-4 py-2.5 bg-white/10 border border-white/10 rounded-l-lg text-sm focus:outline-none focus:border-white/30 transition-colors"
                                />
                                <button className="px-4 py-2.5 bg-white text-black font-medium text-sm rounded-r-lg hover:bg-gray-200 transition-colors">
                                    Subscribe
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/10">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
                        <div>
                            © {currentYear} SimplyPDF. All rights reserved.
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Processing 100% locally in your browser
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
