'use client'

import { useState, useEffect } from 'react';
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { XpaceTour } from "@/components/pwa/xpace-tour";
import { PwaInstallBanner } from "@/components/pwa/install-banner";
import { OnboardingModal } from "@/components/dashboard/onboarding-modal";
import { UsernameSetupModal } from "@/components/ui/username-setup-modal";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [needsUsername, setNeedsUsername] = useState(false);

    useEffect(() => {
        const checkUsername = async () => {
            const { createClient } = await import('@/utils/supabase/client');
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase.from('users').select('username').eq('id', user.id).single();
            if (!data?.username) setNeedsUsername(true);
        };
        checkUsername();
    }, []);

    return (
        <div className="flex bg-[#050505] min-h-screen text-[#ededed] font-sans selection:bg-primary/30 selection:text-white">
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
                <PwaInstallBanner />
                <OnboardingModal />
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
