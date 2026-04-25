"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function FloatingPaths({ position }: { position: number }) {
    const paths = Array.from({ length: 36 }, (_, i) => ({
        id: i,
        d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
            380 - i * 5 * position
        } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
            152 - i * 5 * position
        } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
            684 - i * 5 * position
        } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
        color: `rgba(255,255,255,${0.04 + i * 0.015})`,
        width: 0.5 + i * 0.03,
    }));

    return (
        <div className="absolute inset-0 pointer-events-none">
            <svg
                className="w-full h-full"
                viewBox="0 0 696 316"
                fill="none"
            >
                <title>Background Paths</title>
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke="rgba(255,255,255,0.35)"
                        strokeWidth={path.width}
                        strokeOpacity={0.04 + path.id * 0.012}
                        initial={{ pathLength: 0.3, opacity: 0.6 }}
                        animate={{
                            pathLength: 1,
                            opacity: [0.3, 0.6, 0.3],
                            pathOffset: [0, 1, 0],
                        }}
                        transition={{
                            duration: 20 + Math.random() * 10,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                        }}
                    />
                ))}

            </svg>
        </div>
    );
}

export function BackgroundPaths({
    title = "Horizon",
    isLoggedIn = false,
}: {
    title?: string;
    isLoggedIn?: boolean;
}) {
    const words = title.split(" ");

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
            style={{ background: '#000000' }}
        >
            {/* Subtle white glow orbs */}
            <div className="absolute pointer-events-none" style={{
                top: '15%', left: '10%', width: 500, height: 500,
                background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'float 8s ease-in-out infinite',
            }} />
            <div className="absolute pointer-events-none" style={{
                bottom: '15%', right: '10%', width: 350, height: 350,
                background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'float 10s ease-in-out infinite reverse',
            }} />

            {/* Grid overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                backgroundSize: '50px 50px',
            }} />

            {/* Floating SVG paths */}
            <div className="absolute inset-0">
                <FloatingPaths position={1} />
                <FloatingPaths position={-1} />
            </div>

            <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                    className="max-w-4xl mx-auto"
                >
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="inline-flex items-center gap-2 mb-8"
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: 100, padding: '6px 16px',
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: '#ffffff', display: 'inline-block',
                            boxShadow: '0 0 6px rgba(255,255,255,0.8)'
                        }} />
                        <span style={{ color: '#aaaaaa', fontSize: 13, fontWeight: 500 }}>
                            Real-time AI-powered chat
                        </span>
                    </motion.div>

                    {/* Animated title */}
                    <h1 className="font-bold mb-8 tracking-tighter"
                        style={{ fontSize: 'clamp(48px, 8vw, 96px)', lineHeight: 1.05 }}
                    >
                        {words.map((word, wordIndex) => (
                            <span key={wordIndex} className="inline-block mr-4 last:mr-0">
                                {word.split("").map((letter, letterIndex) => (
                                    <motion.span
                                        key={`${wordIndex}-${letterIndex}`}
                                        initial={{ y: 100, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{
                                            delay: wordIndex * 0.1 + letterIndex * 0.03,
                                            type: "spring",
                                            stiffness: 150,
                                            damping: 25,
                                        }}
                                        className="inline-block"
                                        style={{
                                            background: 'linear-gradient(180deg, #ffffff 0%, #888888 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text',
                                        }}
                                    >
                                        {letter}
                                    </motion.span>
                                ))}
                            </span>
                        ))}
                    </h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                        style={{
                            fontSize: 'clamp(16px, 2vw, 20px)',
                            color: '#888',
                            marginBottom: 48,
                            lineHeight: 1.6,
                            maxWidth: 500,
                            margin: '0 auto 48px',
                        }}
                    >
                        A next-generation chat platform with real-time messaging,
                        AI assistance, and a beautiful interface.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.0, duration: 0.6 }}
                        className="flex gap-4 justify-center flex-wrap mt-4 mb-16"
                    >
                        {isLoggedIn ? (
                            /* Logged in — go straight to chat */
                            <Link href="/chat">
                                <div className="inline-block group relative p-px rounded-2xl overflow-hidden shadow-lg hover:shadow-white/20 hover:shadow-xl transition-all duration-300"
                                    style={{ background: 'rgba(255,255,255,0.15)' }}
                                >
                                    <Button
                                        variant="ghost"
                                        className="rounded-[1.15rem] px-8 py-6 text-lg font-semibold transition-all duration-300 group-hover:-translate-y-0.5"
                                        style={{ background: '#ffffff', color: '#000000', border: 'none' }}
                                    >
                                        <span className="opacity-90 group-hover:opacity-100 transition-opacity">
                                            Start chatting
                                        </span>
                                        <span className="ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-300">
                                            →
                                        </span>
                                    </Button>
                                </div>
                            </Link>
                        ) : (
                            /* Logged out — sign up or sign in */
                            <>
                                <Link href="/sign-up">
                                    <div className="inline-block group relative p-px rounded-2xl overflow-hidden shadow-lg hover:shadow-white/20 hover:shadow-xl transition-all duration-300"
                                        style={{ background: 'rgba(255,255,255,0.15)' }}
                                    >
                                        <Button
                                            variant="ghost"
                                            className="rounded-[1.15rem] px-8 py-6 text-lg font-semibold transition-all duration-300 group-hover:-translate-y-0.5"
                                            style={{ background: '#ffffff', color: '#000000', border: 'none' }}
                                        >
                                            <span className="opacity-90 group-hover:opacity-100 transition-opacity">
                                                Get started free
                                            </span>
                                            <span className="ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-300">
                                                →
                                            </span>
                                        </Button>
                                    </div>
                                </Link>

                                <Link href="/sign-in">
                                    <div className="inline-block group relative p-px rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                                        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))' }}
                                    >
                                        <Button
                                            variant="ghost"
                                            className="rounded-[1.15rem] px-8 py-6 text-lg font-semibold backdrop-blur-md transition-all duration-300 group-hover:-translate-y-0.5"
                                            style={{ background: 'rgba(255,255,255,0.05)', color: '#ccc', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
                                        >
                                            <span className="opacity-90 group-hover:opacity-100 transition-opacity">
                                                Sign in
                                            </span>
                                        </Button>
                                    </div>
                                </Link>
                            </>
                        )}
                    </motion.div>

                    {/* Feature pills */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.3, duration: 0.8 }}
                        className="flex gap-3 justify-center flex-wrap"
                    >
                        {['Real-time messaging', 'AI summarization', 'Private chats', 'Online presence'].map((f, i) => (
                            <motion.span
                                key={f}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1.3 + i * 0.1 }}
                                style={{
                                    padding: '6px 14px',
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: 100,
                                    fontSize: 12,
                                    color: '#666',
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                {f}
                            </motion.span>
                        ))}
                    </motion.div>
                </motion.div>
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) scale(1); }
                    50% { transform: translateY(-30px) scale(1.05); }
                }
            `}</style>
        </div>
    );
}
