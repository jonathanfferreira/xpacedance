import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Configure como as notificações aparecem em foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

/**
 * Solicita permissão e registra o token de push.
 * Salva o token na tabela users para uso no backend (Expo push).
 *
 * @returns {string|null} token Expo push ou null
 */
export async function registerForPushNotifications() {
    if (!Device.isDevice) {
        console.warn('[notifications] Push só funciona em dispositivo físico.');
        return null;
    }

    // Verifica/solicita permissão
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.warn('[notifications] Permissão de push negada pelo usuário.');
        return null;
    }

    // Canal Android
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Notificações Xpace On',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#6324b2',
        });
    }

    // Obtém token Expo
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Salva token no Supabase para o backend usar
    const { data: { user } } = await supabase.auth.getUser();
    if (user && token) {
        await supabase
            .from('users')
            .update({ push_token: token })
            .eq('id', user.id);
    }

    return token;
}

/**
 * Agenda uma notificação local de lembrete de streak.
 * Dispara às 20h se o usuário ainda não praticou hoje.
 */
export async function scheduleStreakReminder() {
    // Cancela anteriores
    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
        content: {
            title: '🔥 Seu streak está em risco!',
            body: 'Pratique hoje para não perder sua sequência de dias.',
            data: { url: '/dashboard' },
        },
        trigger: {
            hour: 20,
            minute: 0,
            repeats: true,
        },
    });
}

/**
 * Listener de notificações recebidas (foreground).
 * Adicionar no App root para capturar e navegar.
 */
export function addNotificationResponseListener(navigationRef) {
    return Notifications.addNotificationResponseReceivedListener(response => {
        const url = response.notification.request.content.data?.url;
        if (url && navigationRef?.current) {
            // Deep link simples: '/dashboard' → navigate('Home')
            if (url.includes('dashboard')) {
                navigationRef.current.navigate('Home');
            } else if (url.includes('ranking')) {
                navigationRef.current.navigate('Ranking');
            }
        }
    });
}
