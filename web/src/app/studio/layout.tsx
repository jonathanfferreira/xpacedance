import { StudioSidebar } from "@/components/studio/studio-sidebar";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NotificationBell } from '@/components/layout/notification-bell';

async function getStudioUser() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
        .from('users')
        .select('full_name, role')
        .eq('id', user.id)
        .single();
    return data;
}

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
    const studioUser = await getStudioUser();

    return (
        <div className="flex bg-[#050505] min-h-screen text-[#ededed] font-sans selection:bg-primary/30 selection:text-white">
            <StudioSidebar />

            <main className="flex-1 flex flex-col relative overflow-x-hidden">
                {/* Topbar */}
                <header className="h-[64px] border-b border-[#1a1a1a] bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-8">
                    <h1 className="font-heading uppercase tracking-widest text-[#555] text-sm">Painel de Curadoria</h1>

                    <div className="flex items-center gap-6">
                        <NotificationBell />

                        <div className="flex items-center gap-4">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-white">
                                    {studioUser?.full_name || 'Criador'}
                                </p>
                                <p className="text-[10px] text-primary font-mono uppercase tracking-widest">
                                    {studioUser?.role === 'admin' ? 'Admin' : 'Escola'}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#333]" />
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
