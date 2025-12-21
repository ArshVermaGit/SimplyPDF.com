"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

// Floating decoration component
export const FloatingShape = ({ className, delay = 0 }: { className: string; delay?: number }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
            opacity: 1,
            scale: 1,
            y: [0, -20, 0],
        }}
        transition={{
            opacity: { duration: 0.5, delay },
            scale: { duration: 0.5, delay },
            y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay }
        }}
        className={className}
    />
);

// Animated grid pattern with gradients
export const AnimatedBackground = () => (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ duration: 1 }}
            className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-gray-100 to-transparent rounded-full blur-3xl"
        />
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-gray-50 to-transparent rounded-full blur-3xl"
        />
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-gray-100/50 to-transparent rounded-full blur-3xl"
        />
    </div>
);

// Floating decorations
export const FloatingDecorations = () => (
    <>
        <FloatingShape
            className="absolute top-32 right-[10%] w-20 h-20 border-2 border-gray-200 rounded-full opacity-40"
            delay={0}
        />
        <FloatingShape
            className="absolute top-48 left-[5%] w-12 h-12 bg-gray-100 rounded-2xl rotate-12 opacity-60"
            delay={0.2}
        />
        <FloatingShape
            className="absolute bottom-32 right-[15%] w-16 h-16 bg-gray-50 rounded-full opacity-50"
            delay={0.4}
        />
        <FloatingShape
            className="absolute bottom-48 left-[10%] w-24 h-24 border border-gray-100 rounded-3xl -rotate-6 opacity-30"
            delay={0.6}
        />
    </>
);

// Page wrapper with all decorations
interface ToolPageBackgroundProps {
    children: ReactNode;
    className?: string;
}

export function ToolPageBackground({ children, className = "" }: ToolPageBackgroundProps) {
    return (
        <div className={`min-h-[calc(100vh-80px)] pt-24 pb-16 relative overflow-hidden ${className}`}>
            <AnimatedBackground />
            <FloatingDecorations />
            <div className="container mx-auto px-4 relative">
                {children}
            </div>
        </div>
    );
}

// Page header component
interface ToolHeaderProps {
    icon?: any;
    title: string;
    description: string;
}

export function ToolHeader({ icon: Icon, title, description }: ToolHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
        >
            {Icon && (
                <motion.div
                    className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl mb-6 shadow-lg shadow-gray-200/50"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                >
                    {typeof Icon === 'function' || (typeof Icon === 'object' && (Icon.$$typeof || Icon.render)) ? (
                        <Icon className="w-10 h-10" />
                    ) : (
                        Icon
                    )}
                </motion.div>
            )}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
                {title}
            </h1>
            <p className="text-gray-500 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
                {description}
            </p>
        </motion.div>
    );
}

// Card wrapper with glow effect
interface ToolCardProps {
    children: ReactNode;
    className?: string;
}

export function ToolCard({ children, className = "" }: ToolCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`relative ${className}`}
        >
            <div className="absolute -inset-1 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-[2rem] blur-xl opacity-50" />
            <div className="relative bg-white rounded-3xl border border-gray-200/80 p-8 md:p-10 shadow-2xl shadow-gray-200/50">
                {children}
            </div>
        </motion.div>
    );
}

// Feature grid
export function FeatureGrid() {
    const features = [
        { icon: "🔒", label: "100% Private", desc: "Files never leave your device" },
        { icon: "⚡", label: "Lightning Fast", desc: "Instant local processing" },
        { icon: "✨", label: "Completely Free", desc: "No hidden fees or limits" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
            {features.map((feature) => (
                <motion.div
                    key={feature.label}
                    className="group relative p-6 rounded-2xl bg-gradient-to-b from-gray-50 to-white border border-gray-100 hover:border-gray-200 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-500"
                    whileHover={{ y: -5 }}
                >
                    <span className="text-2xl mb-3 block">{feature.icon}</span>
                    <div className="font-semibold text-lg mb-1">{feature.label}</div>
                    <div className="text-gray-500 text-sm">{feature.desc}</div>
                </motion.div>
            ))}
        </motion.div>
    );
}

// Processing state component
interface ProcessingStateProps {
    title?: string;
    message?: string; // for backward compatibility
    description?: string;
    progress?: number;
}

export function ProcessingState({ title, message, description, progress }: ProcessingStateProps) {
    const displayTitle = title || message || "Processing...";
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 max-w-lg mx-auto text-center"
        >
            <div className="relative mb-10">
                <motion.div
                    className="w-32 h-32 rounded-full border-[3px] border-gray-200"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                    className="absolute inset-2 rounded-full border-[3px] border-transparent border-t-black"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
            </div>
            <motion.h2
                className="text-2xl md:text-3xl font-bold mb-3"
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                {displayTitle}
            </motion.h2>

            {description && (
                <p className="text-gray-500 mb-6 max-w-sm">
                    {description}
                </p>
            )}

            {progress !== undefined && (
                <>
                    <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mt-4">
                        <motion.div
                            className="h-full bg-black"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                    <p className="text-sm text-gray-400 mt-2">{progress}%</p>
                </>
            )}

            <div className="flex gap-2 mt-6">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="w-2 h-2 bg-black rounded-full"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                ))}
            </div>
        </motion.div>
    );
}
