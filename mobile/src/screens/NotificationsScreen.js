import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, StatusBar
} from 'react-native';
import { Bell, CheckCheck, ArrowLeft } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function NotificationsScreen({ navigation }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase
            .from('notifications')
            .select('id, title, message, type, link_url, read_at, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);
        setNotifications(data || []);
    }, [user]);

    useEffect(() => {
        fetchNotifications().finally(() => setLoading(false));
    }, [fetchNotifications]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchNotifications();
        setRefreshing(false);
    };

    const handlePress = async (item) => {
        if (!item.read_at) {
            await supabase
                .from('notifications')
                .update({ read_at: new Date().toISOString() })
                .eq('id', item.id);
            setNotifications(prev =>
                prev.map(n => n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n)
            );
        }
        if (item.link_url) {
            // Deep link básico: navegar para Class se tiver lesson na URL
            if (item.link_url.includes('/course/')) {
                const lessonId = item.link_url.split('/').pop();
                navigation.navigate('Class', { lessonId });
            }
        }
    };

    const markAllRead = async () => {
        await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .is('read_at', null);
        setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    };

    const formatTime = (iso) => {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}min atrás`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h atrás`;
        return `${Math.floor(hours / 24)}d atrás`;
    };

    const unreadCount = notifications.filter(n => !n.read_at).length;

    if (loading) {
        return (
            <View className="flex-1 bg-[#020202] items-center justify-center">
                <ActivityIndicator color="#6324b2" size="large" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#020202]">
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pt-14 pb-4 border-b border-[#111]">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <ArrowLeft color="#888" size={22} />
                    </TouchableOpacity>
                    <Text className="text-white font-bold text-base uppercase tracking-widest">
                        Notificações
                    </Text>
                    {unreadCount > 0 && (
                        <View className="bg-[#eb00bc] rounded-full px-2 py-0.5">
                            <Text className="text-white text-[10px] font-bold">{unreadCount}</Text>
                        </View>
                    )}
                </View>
                {unreadCount > 0 && (
                    <TouchableOpacity onPress={markAllRead} className="flex-row items-center gap-1">
                        <CheckCheck color="#6324b2" size={16} />
                        <Text className="text-[#6324b2] text-xs font-mono">Marcar todas</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6324b2" />
                }
                ListEmptyComponent={
                    <View className="flex-1 items-center justify-center py-24">
                        <Bell color="#222" size={40} />
                        <Text className="text-[#444] text-sm font-mono mt-4 uppercase tracking-widest">
                            Nenhuma notificação
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => handlePress(item)}
                        className={`px-5 py-4 border-b border-[#111] ${!item.read_at ? 'bg-[#0a0512]' : ''}`}
                        activeOpacity={0.7}
                    >
                        <View className="flex-row items-start gap-3">
                            {!item.read_at && (
                                <View className="w-2 h-2 rounded-full bg-[#eb00bc] mt-1.5 shrink-0" />
                            )}
                            <View className={`flex-1 ${item.read_at ? 'pl-5' : ''}`}>
                                <Text className={`text-sm font-bold mb-1 ${item.read_at ? 'text-[#888]' : 'text-white'}`}>
                                    {item.title}
                                </Text>
                                <Text className="text-[#666] text-xs leading-relaxed">
                                    {item.message}
                                </Text>
                                <Text className="text-[#444] text-[10px] font-mono mt-2 uppercase tracking-widest">
                                    {formatTime(item.created_at)}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}
