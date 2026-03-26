'use client'

import { useState, useEffect } from 'react';
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { XpaceTour } from "@/components/pwa/xpace-tour";
import { OnboardingModal } from "@/components/dashboard/onboarding-modal";
import { UsernameSetupModal } from "@/components/ui/username-setup-modal";
import { CrispChat } from "@/components/support/crisp-chat";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [needsUsername, setNeedsUsername] = useState(false);
    const [isTeacher, setIsTeacher] = useState(false);
    const [crispUser, setCrispUser] = useState<{ id: string; email?: string; full_name?: string; role?: string; username?: string } | undefined>();

    useEffect(() => {
        const init = async () => {
            const { createClient } = await import('@/utils/supabase/client');
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: userData } = await supabase.from('users').select('username, role').eq('id', user.id).single();
            if (!userData?.username) setNeedsUsername(true);

            // Dados para o Crisp (suporte contextual)
            setCrispUser({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name,
                role: userData?.role,
                username: userData?.username,
            });

            const { data: tenant } = await supabase
                .from('tenants')
                .select('status')
                .eq('owner_id', user.id)
                .eq('status', 'active')
                .maybeSingle();
            setIsTeacher(!!tenant);
        };
        init();
    }, []);

    return (
        <div className={`flex bg-[#050505] min-h-screen text-[#ededed] font-sans selection:bg-primary/30 selection:text-white${isTeacher ? ' theme-professor' : ''}`}>
            {/* Sidebar fixo à esquerda (gaveta no mobile) */}
            <div className="print:hidden">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:ml-[80px] print:ml-0 w-full transition-all duration-300">
                <div className="print:hidden">
                    <Topbar onMenuClick={() => setSidebarOpen(true)} />
                </div>
                <XpaceTour />
                <OnboardingModal />
                <CrispChat user={crispUser} />
                {needsUsername && (
                    <UsernameSetupModal onComplete={() => setNeedsUsername(false)} />
                )}

                {/* Page Content Holder */}
                <main className="flex-1 p-4 md:p-6 lg:p-10 relative overflow-x-hidden">
                    {/* Subtle Background Pattern/Glow */}
                    <div className="fixed top-1/4 -right-[200px] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
                    <div className="fixed bottom-0 left-1/4 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[150px] pointer-events-none z-0"></div>

                    <div className="relative z-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
