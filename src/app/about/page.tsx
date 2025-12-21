"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
    Github,
    Linkedin,
    Twitter,
    Mail,
    ExternalLink,
    Code2,
    Gamepad2,
    Globe,
    Sparkles,
} from "lucide-react";

const socials = [
    {
        name: "Email",
        icon: Mail,
        href: "mailto:Arshverma.dev@gmail.com",
        label: "Arshverma.dev@gmail.com",
        color: "hover:bg-red-50 hover:text-red-600 hover:border-red-200",
    },
    {
        name: "LinkedIn",
        icon: Linkedin,
        href: "https://www.linkedin.com/in/arshvermadev/",
        label: "linkedin.com/in/arshvermadev",
        color: "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200",
    },
    {
        name: "GitHub",
        icon: Github,
        href: "https://github.com/ArshVermaGit",
        label: "github.com/ArshVermaGit",
        color: "hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300",
    },
    {
        name: "X (Twitter)",
        icon: Twitter,
        href: "https://x.com/TheArshVerma",
        label: "x.com/TheArshVerma",
        color: "hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300",
    },
];

const skills = [
    { icon: Gamepad2, label: "Game Development", detail: "Unity & C#" },
    { icon: Globe, label: "Web Development", detail: "Full-Stack Apps" },
    { icon: Code2, label: "App Development", detail: "Cross-Platform" },
    { icon: Sparkles, label: "Digital Creation", detail: "UI/UX Design" },
];

export default function AboutPage() {
    return (
        <main className="min-h-screen pt-32 pb-20 px-4 overflow-hidden">
            {/* Background Elements */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute top-20 right-10 w-96 h-96 bg-gray-100 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-20 left-10 w-72 h-72 bg-gray-50 rounded-full blur-3xl opacity-60" />
            </div>

            <div className="container mx-auto max-w-5xl">
                {/* Hero Section */}
                <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
                    {/* Photo */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="relative order-2 lg:order-1"
                    >
                        <div className="relative w-full max-w-md mx-auto aspect-square">
                            {/* Decorative elements */}
                            <div className="absolute -inset-4 bg-gradient-to-br from-gray-200 via-gray-100 to-white rounded-[2.5rem] -rotate-3" />
                            <div className="absolute -inset-4 bg-gradient-to-tr from-gray-100 via-white to-gray-50 rounded-[2.5rem] rotate-2 opacity-80" />

                            {/* Main photo container */}
                            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
                                <Image
                                    src="/arsh-verma.jpg"
                                    alt="Arsh Verma"
                                    width={500}
                                    height={500}
                                    className="w-full h-full object-cover"
                                    priority
                                />
                            </div>

                            {/* Floating badge */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                                className="absolute -bottom-4 -right-4 bg-black text-white px-5 py-3 rounded-2xl shadow-xl"
                            >
                                <p className="text-sm font-medium">Full-Stack Creator</p>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Info */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="order-1 lg:order-2"
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm font-medium mb-6">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Developer & Creator
                        </span>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
                            Hi, I&apos;m{" "}
                            <span className="animate-text-shimmer">Arsh Verma</span>
                        </h1>

                        <p className="text-lg text-gray-600 leading-relaxed mb-6">
                            A <strong>Tech Gaming Technology</strong> student at VIT Bhopal and a
                            full-stack digital creator. My expertise lies in game development with
                            Unity, but I also build dynamic websites and apps.
                        </p>

                        <p className="text-gray-500 leading-relaxed mb-8">
                            I&apos;ve earned numerous certifications and treat every project as an
                            opportunity to blend creative vision with technical precision. My
                            development philosophy is simple: turn great ideas into polished,
                            engaging digital reality.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href="https://arshcreates.vercel.app/"
                                target="_blank"
                                className="btn-primary inline-flex items-center gap-2"
                            >
                                View Portfolio
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                            <Link
                                href="mailto:Arshverma.dev@gmail.com"
                                className="btn-secondary inline-flex items-center gap-2"
                            >
                                <Mail className="w-4 h-4" />
                                Get in Touch
                            </Link>
                        </div>
                    </motion.div>
                </div>

                {/* Skills Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mb-20"
                >
                    <h2 className="text-2xl font-bold mb-8 text-center">What I Do</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {skills.map((skill, index) => (
                            <motion.div
                                key={skill.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + index * 0.1 }}
                                className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300"
                            >
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-black group-hover:text-white transition-all">
                                    <skill.icon className="w-6 h-6" />
                                </div>
                                <h3 className="font-semibold mb-1">{skill.label}</h3>
                                <p className="text-sm text-gray-500">{skill.detail}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Philosophy Quote */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mb-20 py-12 px-8 bg-black text-white rounded-3xl text-center relative overflow-hidden"
                >
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-2xl md:text-3xl font-medium leading-relaxed max-w-3xl mx-auto">
                            &ldquo;I love the challenge of coding and design, focusing on creating
                            seamless user experiences across all platforms.&rdquo;
                        </p>
                        <p className="text-gray-400 mt-6">— My Development Philosophy</p>
                    </div>
                </motion.div>

                {/* Connect Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                >
                    <h2 className="text-2xl font-bold mb-8 text-center">Let&apos;s Connect</h2>
                    <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                        {socials.map((social, index) => (
                            <motion.a
                                key={social.name}
                                href={social.href}
                                target={social.href.startsWith("mailto") ? undefined : "_blank"}
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 + index * 0.1 }}
                                className={`flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white transition-all duration-300 group ${social.color}`}
                            >
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <social.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium">{social.name}</p>
                                    <p className="text-sm text-gray-500 truncate">{social.label}</p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-current" />
                            </motion.a>
                        ))}
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="mt-20 text-center p-12 bg-gray-50 rounded-3xl"
                >
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">
                        Ready to tackle the next big project?
                    </h2>
                    <p className="text-gray-500 mb-8 max-w-lg mx-auto">
                        Whether it&apos;s a game, website, or app — I&apos;m always excited to
                        collaborate on new ideas.
                    </p>
                    <Link href="/" className="btn-primary inline-flex items-center gap-2">
                        Explore SimplyPDF
                    </Link>
                </motion.div>
            </div>
        </main>
    );
}
