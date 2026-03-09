"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, FlipHorizontal, FastForward, SkipBack, SkipForward, FlipHorizontal2, Camera } from "lucide-react";

interface VideoPlayerProps {
    videoId?: string;
    tokenizedUrl?: string;
    userEmail?: string;
    lessonId?: string;
    initialPosition?: number;
}

export function VideoPlayer({ videoId, tokenizedUrl, userEmail, lessonId, initialPosition }: VideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isMirrored, setIsMirrored] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [progress, setProgress] = useState(0);
    const [currentTimeDisplay, setCurrentTimeDisplay] = useState("00:00");
    const [durationDisplay, setDurationDisplay] = useState("00:00");
    const [cameraView, setCameraView] = useState<'front' | 'back'>('front');
    const [xpEarned, setXpEarned] = useState(false);
    const [showXpAnim, setShowXpAnim] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [watermarkPos, setWatermarkPos] = useState({ top: '15%', left: '70%' });
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const lastSaveRef = useRef(0);
    const hasResumedRef = useRef(false);

    // Se tiver urlToken usa o HLS blindado da Bunny, senao deixa vazio para não tocar lixo
    const streamUrl = tokenizedUrl || "";

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !streamUrl) return;

        let hls: any;

        const initializeHls = async () => {
            const HlsModule = await import("hls.js");
            const Hls = HlsModule.default;

            if (Hls.isSupported()) {
                hls = new Hls({
                    maxBufferLength: 30, // Segundos maximos
                    startLevel: -1, // Auto level
                    capLevelToPlayerSize: true, // Nao exagerar
                });
                hls.loadSource(streamUrl);
                hls.attachMedia(video);

                hls.on(Hls.Events.MANIFEST_PARSED, (event: any, data: any) => {
                    // Se tiver resoluções altas, forçar inicio em pelo menos 720p se houver para não começar pixelado
                    let targetLevel = 0;
                    data.levels.forEach((level: any, i: number) => {
                        if (level.height >= 720) targetLevel = i;
                    });
                    hls.startLevel = targetLevel;
                });

                // Tratamento de erros de decode ou rede do CDN
                hls.on(Hls.Events.ERROR, (event: any, data: any) => {
                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                console.error("BunnyCDN Network Error, trying to recover...");
                                hls.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                console.error("BunnyCDN Media Error, trying to recover...");
                                hls.recoverMediaError();
                                break;
                            default:
                                hls.destroy();
                                break;
                        }
                    }
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Suporte Nativo do Safari / iOS ao HLS (Sem JS)
                video.src = streamUrl;
            }
        };

        initializeHls();

        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [streamUrl]);

    // Watermark position rotation (anti-crop)
    useEffect(() => {
        if (!userEmail) return;
        const positions = [
            { top: '15%', left: '70%' },
            { top: '75%', left: '10%' },
            { top: '50%', left: '50%' },
            { top: '20%', left: '20%' },
            { top: '70%', left: '75%' },
        ];
        let idx = 0;
        const interval = setInterval(() => {
            idx = (idx + 1) % positions.length;
            setWatermarkPos(positions[idx]);
        }, 30000);
        return () => clearInterval(interval);
    }, [userEmail]);

    // Auto-save watch position every 30 seconds
    const saveProgress = useCallback(async (positionSeconds: number, durationSec: number) => {
        if (!lessonId || positionSeconds < 5) return;
        // Throttle: save at most every 25 seconds
        const now = Date.now();
        if (now - lastSaveRef.current < 25000) return;
        lastSaveRef.current = now;

        try {
            await fetch('/api/lessons/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId,
                    positionSeconds: Math.floor(positionSeconds),
                    durationSeconds: Math.floor(durationSec),
                }),
            });
        } catch {
            // Non-critical, silently fail
        }
    }, [lessonId]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleMirror = () => {
        setIsMirrored((prev) => !prev);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            videoContainerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const changeSpeed = () => {
        const rates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
        const currentIndex = rates.indexOf(playbackRate);
        const nextRate = rates[(currentIndex + 1) % rates.length];

        if (videoRef.current) {
            videoRef.current.playbackRate = nextRate;
            setPlaybackRate(nextRate);
        }
    };

    const toggleCameraView = () => {
        if (videoRef.current) {
            const currentTime = videoRef.current.currentTime;
            const wasPlaying = isPlaying;
            setCameraView(prev => prev === 'front' ? 'back' : 'front');
            // Preserve timestamp across camera switch
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.currentTime = currentTime;
                    if (wasPlaying) videoRef.current.play();
                }
            }, 100);
        } else {
            setCameraView(prev => prev === 'front' ? 'back' : 'front');
        }
    };

    const formatTime = (seconds: number) => {
        if (isNaN(seconds) || !isFinite(seconds)) return "00:00";
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDurationDisplay(formatTime(videoRef.current.duration));
            setCurrentTimeDisplay(formatTime(videoRef.current.currentTime));

            // Resume playback from saved position
            if (initialPosition && initialPosition > 5 && !hasResumedRef.current) {
                hasResumedRef.current = true;
                const resumeTime = Math.min(initialPosition, videoRef.current.duration - 2);
                if (resumeTime > 0) {
                    videoRef.current.currentTime = resumeTime;
                }
            }
        }
    };

    const handleTimeUpdate = async () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const duration = videoRef.current.duration;

            setCurrentTimeDisplay(formatTime(current));
            if (durationDisplay === "00:00" && !isNaN(duration)) {
                setDurationDisplay(formatTime(duration));
            }

            const currentProgress = (current / duration) * 100;
            setProgress(currentProgress);

            // Recompensa de XP ao completar 90%
            if (currentProgress >= 90 && !xpEarned) {
                setXpEarned(true); // Evita loop no React state

                try {
                    // Chama a API Segura para validar e salvar o XP
                    const res = await fetch('/api/progress/track', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ lessonId: videoId || 'demo_id', progressPercent: currentProgress })
                    });

                    const data = await res.json();

                    // Se o ping for aceito para reward ou já concluído e trouxer o block visual de XP anim
                    if (res.ok && data.status !== 'ignored_ping') {
                        setShowXpAnim(true);
                        setTimeout(() => setShowXpAnim(false), 3000);
                    }
                } catch (e) {
                    console.error("Falha ao sincronizar XP:", e);
                    setXpEarned(false);
                }
            }

            // Auto-save watch position
            if (duration > 0) {
                saveProgress(current, duration);
            }
        }
    };

    const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (videoRef.current) {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            videoRef.current.currentTime = pos * videoRef.current.duration;
        }
    };

    return (
        <div ref={videoContainerRef} className="relative w-full h-full bg-black flex flex-col group overflow-hidden border border-[#222]">

            {/* Container de Vídeo com suporte a Mirror (Espelhamento para Dança) */}
            <div className="relative flex-1 bg-[#050505] flex items-center justify-center overflow-hidden">
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover transition-transform duration-300"
                    style={{ transform: isMirrored ? 'scaleX(-1)' : 'scaleX(1)' }}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                    onClick={togglePlay}
                    poster={tokenizedUrl ? `https://${process.env.NEXT_PUBLIC_BUNNY_STREAM_CDN_URL?.replace(/^https?:\/\//, '')}/${videoId}/thumbnail.jpg` : undefined}
                />

                {/* Anti-Piracy Watermark — Email overlay that moves position */}
                {userEmail && isPlaying && (
                    <div
                        className="absolute z-30 pointer-events-none select-none transition-all duration-[5000ms] ease-in-out"
                        style={{ top: watermarkPos.top, left: watermarkPos.left, transform: 'translate(-50%, -50%)' }}
                    >
                        <span className="text-white/[0.08] text-sm font-mono tracking-wider rotate-[-15deg] inline-block">
                            {userEmail}
                        </span>
                    </div>
                )}

                {/* Play Overlay central grande (Fade out no Play) */}
                {!isPlaying && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                        <div className="w-20 h-20 rounded-full bg-primary/80 backdrop-blur-md flex items-center justify-center border border-white/20 pl-1.5 shadow-[0_0_30px_#6324b2]">
                            <Play size={40} className="text-white" fill="currentColor" />
                        </div>
                    </div>
                )}

                {/* XP Earned Animation Overlay */}
                {showXpAnim && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[80%] z-40 pointer-events-none flex flex-col items-center opacity-0 animate-[riseAndFade_3s_ease-out_forwards]">
                        <span className="font-display text-5xl text-secondary drop-shadow-[0_0_20px_#eb00bc] italic tracking-wider">
                            +50 XP
                        </span>
                        <span className="text-[10px] font-mono text-white tracking-widest uppercase mt-2 bg-black/60 px-3 py-1 rounded backdrop-blur-sm border border-white/10">
                            Missão Concluída
                        </span>
                    </div>
                )}
            </div>

            {/* Control Bar (HUD Estilo Cyberpunk) */}
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-12 pb-4 px-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">

                {/* Progress Bar Tática */}
                <div
                    className="w-full h-1.5 bg-[#333] mb-4 cursor-pointer relative group/bar"
                    onClick={handleProgressBarClick}
                >
                    <div
                        className="absolute top-0 left-0 h-full bg-primary glow-primary"
                        style={{ width: `${progress}%` }}
                    ></div>
                    {/* Knob */}
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border border-primary opacity-0 group-hover/bar:opacity-100 shadow-[0_0_10px_#6324b2] transition-opacity"
                        style={{ left: `calc(${progress}% - 6px)` }}
                    ></div>
                </div>

                {/* Controles */}
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-y-3">
                    <div className="flex items-center gap-4">
                        <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                        </button>
                        <button onClick={toggleMute} className="text-white hover:text-primary transition-colors">
                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>

                        <div className="text-xs font-mono text-[#888] tracking-widest pl-2 border-l border-[#333] min-w-[100px] text-center">
                            {currentTimeDisplay} / {durationDisplay}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">

                        {/* Features Especiais de Dança (XTAGE Core) */}
                        <div className="flex items-center gap-2 bg-[#1a1a1a] p-1 border border-[#333] rounded-sm">
                            <button
                                onClick={toggleMirror}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans font-semibold uppercase tracking-wider transition-colors border border-transparent ${isMirrored ? 'bg-primary/20 text-primary border-primary/50' : 'text-[#888] hover:text-white'}`}
                                title="Espelhar Professor"
                            >
                                <FlipHorizontal2 size={16} /> <span className="hidden sm:inline-block">Espelhar</span>
                            </button>

                            <div className="w-[1px] h-4 bg-[#333]"></div>

                            <button
                                onClick={changeSpeed}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold transition-colors text-[#888] hover:text-white w-auto sm:w-[64px] justify-center"
                                title="Velocidade"
                            >
                                {playbackRate}x
                            </button>

                            <div className="w-[1px] h-4 bg-[#333]"></div>

                            <button
                                onClick={toggleCameraView}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans font-semibold uppercase tracking-wider transition-colors border border-transparent ${cameraView === 'back' ? 'bg-accent/20 text-accent border-accent/50' : 'text-[#888] hover:text-white'}`}
                                title="Trocar Câmera (Front/Back)"
                            >
                                <Camera size={16} /> <span className="hidden sm:inline-block">{cameraView === 'front' ? 'Front' : 'Back'}</span>
                            </button>
                        </div>

                        <button onClick={() => alert('Em breve:\nPainel de Configurações onde você poderá forçar a resolução do vídeo (1080p, 720p, etc), exibir legendas e autocompletar.')} className="text-white hover:text-primary transition-colors ml-2" title="Configurações (Em Breve)">
                            <Settings size={20} />
                        </button>
                        <button onClick={toggleFullscreen} className="text-white hover:text-primary transition-colors">
                            <Maximize size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
