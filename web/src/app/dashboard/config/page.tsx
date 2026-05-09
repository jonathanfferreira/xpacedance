'use client'

import { useState, useEffect } from 'react'
import { Bell, Moon, Globe, Shield, Monitor, Save } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function ConfigPage() {
    const [notifications, setNotifications] = useState(true)
    const [language, setLanguage] = useState('pt-BR')
    const [theme, setTheme] = useState('dark')
    const [antiPiracy, setAntiPiracy] = useState(true)
    const [deviceText, setDeviceText] = useState('Windows • Chrome')
    const [saving, setSaving] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        // Inicializa estado visual (forçado dark theme local no app para não ser quebrado)
        const savedTheme = localStorage.getItem('xpace-theme') || 'dark';
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTheme(savedTheme);
        if (savedTheme === 'light') {
            document.documentElement.classList.add('theme-light')
        } else {
            document.documentElement.classList.remove('theme-light')
        }

        // Default Language state
        const savedLang = localStorage.getItem('xpace-lang');
        if (savedLang) setLanguage(savedLang);

        // Simple Device Parser
        const ua = navigator.userAgent;
        let os = "Desconhecido";
        let browser = "Navegador";
        if (ua.indexOf("Win") !== -1) os = "Windows";
        if (ua.indexOf("Mac") !== -1) os = "MacOS";
        if (ua.indexOf("Linux") !== -1) os = "Linux";
        if (ua.indexOf("Android") !== -1) os = "Android";
        if (ua.indexOf("like Mac") !== -1) os = "iOS";

        if (ua.indexOf("Chrome") !== -1) browser = "Chrome";
        else if (ua.indexOf("Safari") !== -1) browser = "Safari";
        else if (ua.indexOf("Firefox") !== -1) browser = "Firefox";
        else if (ua.indexOf("Edge") !== -1) browser = "Edge";

        setDeviceText(`${os} • ${browser}`);

        // Verifica inscrição do Push
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.register('/sw.js').then(reg => {
                reg.pushManager.getSubscription().then(sub => {
                    if (sub) setNotifications(true);
                });
            }).catch(console.error);
        }
    }, [])

    const togglePushNotifications = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            alert('Seu navegador não suporta Web Push.');
            return;
        }

        const registration = await navigator.serviceWorker.ready;

        if (notifications) {
            const sub = await registration.pushManager.getSubscription();
            if (sub) {
                await sub.unsubscribe();
                setNotifications(false);
            }
        } else {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                try {
                    const sub = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
                    });

                    const subJson = JSON.parse(JSON.stringify(sub));
                    const { data: { user } } = await supabase.auth.getUser();

                    if (user) {
                        await supabase.from('push_subscriptions').upsert({
                            user_id: user.id,
                            endpoint: subJson.endpoint,
                            p256dh: subJson.keys?.p256dh,
                            auth: subJson.keys?.auth
                        }, { onConflict: 'user_id, endpoint' });
                    }
                    setNotifications(true);
                    alert("A XPACE DANCE enviará os avisos pro seu celular/navegador!");
                } catch (err) {
                    console.error('Erro ao inscrever push', err);
                    alert("Falha ao configurar a notificação.");
                }
            } else {
                alert("Permissão Rejeitada.");
            }
        }
    }

    const handleSave = async () => {
        setSaving(true)

        // Persist preferences to localStorage
        localStorage.setItem('xpace-theme', theme)
        localStorage.setItem('xpace-lang', language)
        localStorage.setItem('xpace-anti-piracy', String(antiPiracy))
        localStorage.setItem('xpace-notifications', String(notifications))

        await new Promise(r => setTimeout(r, 300))

        setSaving(false)
        alert('Configurações salvas com sucesso!')
    }

    return (
        <div className="max-w-3xl mx-auto pb-20">
            <div className="mb-10">
                <h1 className="font-heading text-4xl mb-2 tracking-tight uppercase">
                    <span className="text-transparent bg-clip-text text-gradient-neon">Configuração</span>
                </h1>
                <p className="text-[#888] font-sans">Ajuste o comportamento e as preferências do sistema.</p>
            </div>

            <div className="space-y-4">
                {/* Notifications */}
                <SettingRow
                    icon={<Bell size={18} />}
                    label="Notificações"
                    description="Receber alertas de novos cursos e conquistas"
                    enabled={notifications}
                    onToggle={togglePushNotifications}
                />

                {/* Anti-Piracy */}
                <SettingRow
                    icon={<Shield size={18} />}
                    label="Sessão Única"
                    description="Bloquear acesso simultâneo em múltiplos dispositivos"
                    enabled={antiPiracy}
                    onToggle={() => setAntiPiracy(!antiPiracy)}
                />

                {/* Theme / Modo Claro */}
                <SettingRow
                    icon={<Moon size={18} />}
                    label="Dark Mode"
                    description="Alternar entre o visual noturno (Holo) e modo claro"
                    enabled={theme === 'dark'}
                    onToggle={() => {
                        const newTheme = theme === 'dark' ? 'light' : 'dark';
                        setTheme(newTheme);
                        localStorage.setItem('xpace-theme', newTheme);
                        if (newTheme === 'light') {
                            document.documentElement.classList.add('theme-light');
                            alert('Modo Claro ativado (Aviso: Estilos em transição contínua. Nem todas as páginas já suportam Light Mode).');
                        } else {
                            document.documentElement.classList.remove('theme-light');
                        }
                    }}
                />

                {/* Language */}
                <div className="bg-[#0A0A0A] border border-[#222] rounded-sm p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-sm bg-[#111] border border-[#222] flex items-center justify-center text-primary">
                            <Globe size={18} />
                        </div>
                        <div>
                            <h3 className="font-heading text-sm uppercase tracking-widest text-white">Idioma</h3>
                            <p className="text-[10px] font-sans text-[#555]">Idioma da interface</p>
                        </div>
                    </div>
                    <select
                        value={language}
                        onChange={e => {
                            const val = e.target.value;
                            setLanguage(val);
                            localStorage.setItem('xpace-lang', val);
                            alert(`Idioma alterado para: ${val}. O pacote de tradução será baixado na próxima renderização.`);
                        }}
                        className="bg-[#111] border border-[#222] text-white font-sans text-xs px-3 py-2 rounded outline-none focus:border-primary"
                    >
                        <option value="pt-BR">Português (BR)</option>
                        <option value="en">English (US)</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="zh">Mandarin (中文)</option>
                        <option value="ja">Japanese (日本語)</option>
                        <option value="ko">Korean (한국어)</option>
                    </select>
                </div>

                {/* Device Info */}
                <div className="bg-[#0A0A0A] border border-[#222] rounded-sm p-5">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-sm bg-[#111] border border-[#222] flex items-center justify-center text-accent">
                            <Monitor size={18} />
                        </div>
                        <div>
                            <h3 className="font-heading text-sm uppercase tracking-widest text-white">Dispositivo Atual</h3>
                            <p className="text-[10px] font-sans text-[#555]">Sessão ativa neste navegador</p>
                        </div>
                    </div>
                    <div className="bg-[#050505] border border-[#1a1a1a] rounded p-3 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-sans text-white">{deviceText}</p>
                            <p className="text-[10px] font-sans text-[#555]">Última atividade: Agora</p>
                        </div>
                        <span className="text-[10px] font-sans bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                            Ativo
                        </span>
                    </div>
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full relative overflow-hidden rounded-lg bg-white text-black font-sans font-bold py-3.5 transition-transform duration-200 active:scale-[0.98] disabled:opacity-50 mt-6"
            >
                <span className="relative z-10 flex items-center justify-center gap-2">
                    <Save size={18} />
                    {saving ? 'SALVANDO...' : 'SALVAR CONFIGURAÇÕES'}
                </span>
            </button>
        </div>
    )
}

function SettingRow({ icon, label, description, enabled, onToggle }: {
    icon: React.ReactNode; label: string; description: string; enabled: boolean; onToggle: () => void
}) {
    return (
        <div className="bg-[#0A0A0A] border border-[#222] rounded-sm p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-sm bg-[#111] border border-[#222] flex items-center justify-center text-primary">
                    {icon}
                </div>
                <div>
                    <h3 className="font-heading text-sm uppercase tracking-widest text-white">{label}</h3>
                    <p className="text-[10px] font-sans text-[#555]">{description}</p>
                </div>
            </div>
            <button
                onClick={onToggle}
                className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-[#333]'}`}
            >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-md ${enabled ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
        </div>
    )
}
