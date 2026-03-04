"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function TrackerEngine() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const refCode = searchParams.get("ref");

        if (refCode) {
            // Salva o cookie válido por 30 dias
            const expires = new Date();
            expires.setDate(expires.getDate() + 30);
            document.cookie = `asaas_affiliate_tracker=${refCode}; expires=${expires.toUTCString()}; path=/`;
            console.log(`[AFFILIATE] Clique rastreado para a Ref: ${refCode}`);
        }
    }, [searchParams]);

    return null;
}

export function AffiliateTracker() {
    return (
        <Suspense fallback={null}>
            <TrackerEngine />
        </Suspense>
    );
}
