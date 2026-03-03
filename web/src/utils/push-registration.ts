/**
 * Registro de Push Notifications para a PWA (Web Push API)
 * =========================================================
 * Gerencia a inscrição do service worker no Push Manager
 * e salva a subscription no Supabase para uso no backend.
 */

import { createClient } from '@/utils/supabase/client';

/** Converte ArrayBuffer para base64url */
function bufferToBase64url(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Solicita permissão de notificação e registra o service worker.
 * Retorna a subscription serializada para salvar no backend.
 */
export async function subscribePushNotifications(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('[push] Push não suportado neste navegador.');
        return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        console.warn('[push] Permissão negada pelo usuário.');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.ready;

        // Obtém chave pública VAPID do .env
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
            console.error('[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY não configurada.');
            return null;
        }

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidPublicKey,
        });

        // Salva subscription no Supabase
        await savePushSubscription(subscription);
        return subscription;
    } catch (err) {
        console.error('[push] Erro ao registrar subscription:', err);
        return null;
    }
}

/**
 * Salva a subscription PWA no Supabase (tabela push_subscriptions ou campo em users).
 */
async function savePushSubscription(subscription: PushSubscription): Promise<void> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const subJson = subscription.toJSON();

    await supabase
        .from('users')
        .update({
            push_subscription: JSON.stringify(subJson),
            push_token: null, // campo web usa push_subscription
        })
        .eq('id', user.id);
}

/**
 * Cancela o registro de push do usuário atual.
 */
export async function unsubscribePushNotifications(): Promise<void> {
    if (!('serviceWorker' in navigator)) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    await subscription.unsubscribe();

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await supabase
            .from('users')
            .update({ push_subscription: null })
            .eq('id', user.id);
    }
}

/**
 * Hook: registra SW e verifica se já existe subscription ativa.
 * Chame no layout raiz do dashboard após hidratação.
 */
export async function initPushRegistration(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    try {
        // Registra/atualiza o service worker
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });

        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();

        // Já registrado → sincroniza com Supabase
        if (existingSubscription) {
            await savePushSubscription(existingSubscription);
        }
    } catch (err) {
        console.error('[push] initPushRegistration error:', err);
    }
}
