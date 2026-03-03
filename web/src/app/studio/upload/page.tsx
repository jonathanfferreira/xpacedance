'use client';

import { UploadCloud, CheckCircle2, Film, Info, AlertTriangle, Loader2, Plus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import * as tus from 'tus-js-client';

interface Course { id: string; title: string; }
type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error' | 'paused';
export default function StudioUploadPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [courseId, setCourseId] = useState('');
    const [moduleName, setModuleName] = useState('');
    const [lessonTitle, setLessonTitle] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<UploadStatus | 'paused'>('idle');
    const [progress, setProgress] = useState(0);
    const [createdLessonId, setCreatedLessonId] = useState('');
    const uploadRef = useRef<tus.Upload | null>(null);

    useEffect(() => {
        fetch('/api/studio/courses')
            .then(r => r.json())
            .then(data => { setCourses(data.courses || []); setLoadingCourses(false); })
            .catch(() => setLoadingCourses(false));
    }, []);

    const isConfigured = !!(courseId && moduleName.trim() && lessonTitle.trim());

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(false);
        if (!isConfigured) { alert('Preencha curso, módulo e título antes de enviar.'); return; }
        if (e.dataTransfer.files?.[0]) startUpload(e.dataTransfer.files[0]);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (!isConfigured) { alert('Preencha curso, módulo e título antes de enviar.'); return; }
        if (e.target.files?.[0]) startUpload(e.target.files[0]);
    };

    const startUpload = async (file: File) => {
        try {
            setUploadStatus('uploading');
            setProgress(0);
            setCreatedLessonId('');

            // 1. Autoriza upload + cria video no Bunny
            const authRes = await fetch('/api/bunny/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: lessonTitle }),
            });
            const authData = await authRes.json();
            if (!authRes.ok) throw new Error(authData.error || 'Falha na autorização Bunny');
            const { videoId, libraryId, signature, expirationTime } = authData;

            // 2. Cria a aula no banco com video_id já vinculado
            const lessonRes = await fetch('/api/studio/lessons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course_id: courseId,
                    module_name: moduleName.trim(),
                    title: lessonTitle.trim(),
                    video_id: videoId,
                }),
            });
            const lessonData = await lessonRes.json();
            if (!lessonRes.ok) throw new Error(lessonData.error || 'Erro ao criar aula no banco');
            setCreatedLessonId(lessonData.lesson.id);

            // 3. TUS upload direto para o Bunny CDN (Pausável/Permitir Resume)
            const upload = new tus.Upload(file, {
                endpoint: 'https://video.bunnycdn.com/tusupload',
                retryDelays: [0, 3000, 5000, 10000, 20000],
                // @ts-expect-error "resume" isn't fully typed conditionally in tus yet
                resume: true, // Auto save to localStorage
                removeFingerprintOnSuccess: true, // Cleanup localStorage on finish
                headers: {
                    AuthorizationSignature: signature,
                    AuthorizationExpire: String(expirationTime),
                    VideoId: videoId,
                    LibraryId: String(libraryId),
                },
                metadata: { filetype: file.type, title: lessonTitle },
                onError(error) { console.error('TUS falhou:', error); setUploadStatus('error'); },
                onProgress(bytesUploaded, bytesTotal) {
                    setProgress(Math.round((bytesUploaded / bytesTotal) * 100));
                },
                onSuccess() {
                    setUploadStatus('processing');
                    setTimeout(() => setUploadStatus('success'), 5000);
                },
            });

            uploadRef.current = upload;

            // Verifica se há envios parciais para retomar imediatamente
            upload.findPreviousUploads().then(function (previousUploads) {
                if (previousUploads.length) {
                    upload.resumeFromPreviousUpload(previousUploads[0]);
                }
                upload.start();
            });

        } catch (e: any) {
            console.error(e);
            setUploadStatus('error');
            alert(e.message);
        }
    };

    const handlePause = (e: React.MouseEvent) => {
        e.preventDefault();
        if (uploadRef.current && uploadStatus === 'uploading') {
            uploadRef.current.abort();
            setUploadStatus('paused');
        }
    };

    const handleResume = (e: React.MouseEvent) => {
        e.preventDefault();
        if (uploadRef.current && uploadStatus === 'paused') {
            uploadRef.current.start();
            setUploadStatus('uploading');
        }
    };

    const handleReset = () => {
        if (uploadRef.current && (uploadStatus === 'uploading' || uploadStatus === 'paused')) {
            uploadRef.current.abort();
        }
        uploadRef.current = null;
        setUploadStatus('idle'); setProgress(0);
        setLessonTitle(''); setModuleName(''); setCreatedLessonId('');
    };

    const uploaderBorderClass = dragActive && isConfigured
        ? 'border-primary bg-primary/5 scale-[1.01]'
        : !isConfigured
            ? 'border-[#1a1a1a] opacity-50 cursor-not-allowed'
            : 'border-[#333] hover:border-[#555] cursor-pointer';

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <h1 className="text-3xl font-heading font-bold text-white uppercase tracking-tight mb-2">Central de Upload</h1>
            <p className="text-[#888] font-sans text-sm mb-8 border-b border-[#1a1a1a] pb-6">
                Envie vídeos MP4 direto da câmera. O Bunny.net converte para HLS e vincula automaticamente à aula no banco.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">

                    {/* Step 1 */}
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm p-6 space-y-4">
                        <h2 className="text-white font-heading font-bold uppercase tracking-wide text-sm flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">1</span>
                            Configure a Aula
                        </h2>

                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-[#888]">Curso *</label>
                            {loadingCourses ? (
                                <div className="flex items-center gap-2 text-[#555] text-sm py-3">
                                    <Loader2 size={14} className="animate-spin" /> Carregando cursos...
                                </div>
                            ) : courses.length === 0 ? (
                                <div className="text-[#555] text-sm py-2">
                                    Nenhum curso. <Link href="/studio/cursos/novo" className="text-primary hover:text-white">Criar curso</Link>
                                </div>
                            ) : (
                                <select
                                    value={courseId}
                                    onChange={e => setCourseId(e.target.value)}
                                    disabled={uploadStatus !== 'idle'}
                                    className="w-full bg-[#111] border border-[#222] focus:border-primary/50 rounded py-3 px-4 text-white text-sm outline-none cursor-pointer disabled:opacity-50"
                                >
                                    <option value="">Selecione um curso...</option>
                                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                </select>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-mono uppercase tracking-widest text-[#888]">Módulo *</label>
                                <input
                                    type="text" value={moduleName}
                                    onChange={e => setModuleName(e.target.value)}
                                    disabled={uploadStatus !== 'idle'}
                                    placeholder="Ex: Módulo 1 — Fundamentos"
                                    className="w-full bg-[#111] border border-[#222] focus:border-primary/50 rounded py-3 px-4 text-white text-sm outline-none transition-colors disabled:opacity-50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-mono uppercase tracking-widest text-[#888]">Título da Aula *</label>
                                <input
                                    type="text" value={lessonTitle}
                                    onChange={e => setLessonTitle(e.target.value)}
                                    disabled={uploadStatus !== 'idle'}
                                    placeholder="Ex: Dissociação de Ombros"
                                    className="w-full bg-[#111] border border-[#222] focus:border-primary/50 rounded py-3 px-4 text-white text-sm outline-none transition-colors disabled:opacity-50"
                                />
                            </div>
                        </div>
                        {!isConfigured && uploadStatus === 'idle' && (
                            <p className="text-[10px] text-[#555] font-mono">Preencha todos os campos para habilitar o upload.</p>
                        )}
                    </div>

                    {/* Step 2 */}
                    <div>
                        <h2 className="text-white font-heading font-bold uppercase tracking-wide text-sm flex items-center gap-2 mb-3">
                            <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">2</span>
                            Enviar Vídeo
                        </h2>

                        <form
                            onDragEnter={handleDrag} onDragLeave={handleDrag}
                            onDragOver={handleDrag} onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-sm flex flex-col items-center justify-center p-12 transition-all duration-300 relative overflow-hidden bg-[#0A0A0A] ${uploaderBorderClass} ${uploadStatus !== 'idle' ? 'pointer-events-none' : ''}`}
                        >
                            <input
                                type="file" accept="video/mp4,video/quicktime"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                onChange={handleChange}
                                disabled={uploadStatus !== 'idle' || !isConfigured}
                            />

                            {uploadStatus === 'idle' && (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-[#111] border border-[#222] flex items-center justify-center mb-6">
                                        <UploadCloud size={32} className={isConfigured ? 'text-[#666]' : 'text-[#333]'} />
                                    </div>
                                    <h3 className="font-heading font-bold text-lg text-white uppercase mb-2">
                                        {isConfigured ? 'Arraste o Vídeo Aqui' : 'Configure a aula acima'}
                                    </h3>
                                    <p className="text-sm font-sans text-[#666] text-center max-w-sm">MP4 ou MOV até 2.5GB. Suporte a Resumable Upload (Pode Pausar).</p>
                                    {isConfigured && (
                                        <button type="button" className="mt-8 px-6 py-2 bg-[#1a1a1a] hover:bg-[#222] text-white font-mono text-xs uppercase tracking-widest border border-[#333] rounded">
                                            Procurar Arquivo
                                        </button>
                                    )}
                                </>
                            )}

                            {(uploadStatus === 'uploading' || uploadStatus === 'paused') && (
                                <div className="w-full text-center z-10">
                                    <div className="flex items-center justify-between mb-2 text-xs font-mono uppercase tracking-widest text-[#888]">
                                        <span>{uploadStatus === 'paused' ? 'Pausado' : 'Enviando para Bunny CDN...'}</span>
                                        <span className="text-white">{progress}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-[#111] rounded overflow-hidden border border-[#222]">
                                        <div className={`h-full transition-all duration-300 ${uploadStatus === 'paused' ? 'bg-[#555]' : 'bg-primary'}`} style={{ width: `${progress}%` }} />
                                    </div>

                                    <div className="flex items-center justify-center gap-4 mt-6">
                                        {uploadStatus === 'uploading' ? (
                                            <button onClick={handlePause} className="px-6 py-2 bg-[#1a1a1a] hover:bg-[#222] text-white font-mono text-xs uppercase tracking-widest border border-[#333] rounded transition-colors">
                                                Pausar Upload
                                            </button>
                                        ) : (
                                            <button onClick={handleResume} className="px-6 py-2 bg-primary/20 hover:bg-primary/30 text-primary font-mono text-xs uppercase tracking-widest border border-primary/50 rounded shadow-[0_0_15px_rgba(99,36,178,0.2)] transition-all">
                                                Retomar Upload
                                            </button>
                                        )}
                                        <button onClick={handleReset} className="px-6 py-2 text-red-400/70 hover:text-red-400 font-mono text-xs uppercase tracking-widest transition-colors">
                                            Cancelar
                                        </button>
                                    </div>
                                    <p className="text-[#555] text-[10px] font-mono mt-4">Pode fechar a aba se a energia cair. Retomaremos automaticamente.</p>
                                </div>
                            )}

                            {uploadStatus === 'processing' && (
                                <div className="w-full text-center z-10 flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-primary animate-spin" />
                                    <div>
                                        <p className="font-heading font-bold text-white uppercase">Convertendo HLS na Nuvem...</p>
                                        <p className="text-xs text-[#888] font-mono mt-1">Fragmentando para anti-pirataria. Aguarde...</p>
                                    </div>
                                </div>
                            )}

                            {uploadStatus === 'success' && (
                                <div className="w-full text-center z-10 flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center">
                                        <CheckCircle2 size={32} className="text-green-500" />
                                    </div>
                                    <div>
                                        <p className="font-heading font-bold text-green-500 uppercase text-xl">Upload Concluído!</p>
                                        <p className="text-xs text-[#888] font-mono mt-1">Aula criada e vídeo vinculado com sucesso.</p>
                                        {createdLessonId && (
                                            <p className="text-[10px] text-[#555] font-mono mt-1">lesson_id: {createdLessonId.slice(0, 20)}...</p>
                                        )}
                                    </div>
                                    <button onClick={handleReset} className="mt-2 px-6 py-2 bg-[#1a1a1a] hover:bg-[#222] text-white font-mono text-xs uppercase tracking-widest border border-[#333] rounded">
                                        Subir Novo Vídeo
                                    </button>
                                </div>
                            )}

                            {uploadStatus === 'error' && (
                                <div className="w-full text-center z-10 flex flex-col items-center gap-4">
                                    <AlertTriangle size={40} className="text-red-400" />
                                    <p className="font-heading font-bold text-red-400 uppercase">Falha no Upload</p>
                                    <button onClick={handleReset} className="px-6 py-2 bg-[#1a1a1a] hover:bg-[#222] text-white font-mono text-xs uppercase tracking-widest border border-[#333] rounded">
                                        Tentar Novamente
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>

                <div className="md:col-span-1 flex flex-col gap-6">
                    <div className="bg-[#111] border border-primary/20 rounded p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-20"><Film size={40} className="text-primary" /></div>
                        <h4 className="font-heading font-bold text-white uppercase mb-3 flex items-center gap-2 relative z-10">
                            <Info size={16} className="text-primary" /> Como funciona
                        </h4>
                        <p className="text-xs font-sans text-[#aaa] leading-relaxed relative z-10">
                            O vídeo vai direto para o Bunny Stream (HLS criptografado). O <strong className="text-white">video_id é gravado na aula automaticamente</strong> — sem etapa manual.
                        </p>
                    </div>

                    <div className="bg-accent/5 border border-accent/20 rounded p-5">
                        <h4 className="font-heading font-bold text-accent uppercase mb-3 flex items-center gap-2">
                            <AlertTriangle size={16} /> Qualidade
                        </h4>
                        <ul className="text-xs font-sans text-[#888] space-y-2 list-disc pl-4">
                            <li>Máximo: <strong className="text-white">2.5 GB / Aula</strong></li>
                            <li>Formatos: <strong className="text-white">.MP4 ou .MOV</strong></li>
                            <li>FPS: <strong className="text-white">60fps</strong> p/ dança</li>
                            <li>Luz limpa para melhor imagem</li>
                        </ul>
                    </div>

                    <Link href="/studio/cursos" className="flex items-center gap-2 text-[#888] hover:text-white text-sm font-mono transition-colors">
                        <Plus size={14} /> Gerenciar Cursos
                    </Link>
                </div>
            </div>
        </div>
    );
}
