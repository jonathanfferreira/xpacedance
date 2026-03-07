import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LogOut, Settings, Bell, CreditCard, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen({ navigation }) {
    const { profile, loading, signOut } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            'Encerrar Sessão',
            'Tem certeza que deseja sair?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sair',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <ActivityIndicator color="#6324b2" size="large" />
            </View>
        );
    }

    const displayName = profile?.full_name || 'Dancer';
    const initials = displayName.substring(0, 2).toUpperCase();
    const roleName = profile?.role === 'admin' ? 'Admin XPACE' : profile?.role === 'professor' ? 'Professor' : 'Aluno XPACE ON';

    return (
        <View className="flex-1 bg-black">

            {/* Cabeçalho Perfil */}
            <View className="px-6 pt-16 pb-6 bg-[#050505] border-b border-[#222]">
                <View className="flex-row items-center gap-4">
                    <View className="w-16 h-16 bg-[#1A1A1A] rounded-full border border-primary items-center justify-center">
                        <Text className="text-primary font-bold text-xl">{initials}</Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-white font-bold text-xl uppercase tracking-widest">{displayName}</Text>
                        <Text className="text-[#888] text-xs font-mono uppercase tracking-widest">{roleName}</Text>
                    </View>
                </View>
            </View>

            {/* Menu Sections */}
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

                <View className="px-6 py-6 border-b border-[#111]">
                    <Text className="text-[#555] font-bold text-xs uppercase tracking-widest mb-4">Sua Conta</Text>

                    <TouchableOpacity
                        activeOpacity={0.7}
                        className="flex-row items-center justify-between bg-[#111] p-4 rounded-t-md border border-[#222] border-b-0"
                        onPress={() => Alert.alert('Ajustes', 'Configurações avançadas em breve.')}
                    >
                        <View className="flex-row items-center gap-3">
                            <Settings color="#888" size={20} />
                            <Text className="text-white font-bold uppercase tracking-widest">Ajustes</Text>
                        </View>
                        <ChevronRight color="#444" size={16} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.7}
                        className="flex-row items-center justify-between bg-[#111] p-4 border-y border-[#222]"
                        onPress={() => Alert.alert('Notificações', 'Central de notificações em breve.')}
                    >
                        <View className="flex-row items-center gap-3">
                            <Bell color="#888" size={20} />
                            <Text className="text-white font-bold uppercase tracking-widest">Notificações</Text>
                        </View>
                        <ChevronRight color="#444" size={16} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.7}
                        className="flex-row items-center justify-between bg-[#111] p-4 rounded-b-md border border-[#222] border-t-0"
                        onPress={() => Alert.alert('Pagamentos', 'Histórico de pagamentos em breve.')}
                    >
                        <View className="flex-row items-center gap-3">
                            <CreditCard color="#888" size={20} />
                            <Text className="text-white font-bold uppercase tracking-widest">Pagamentos Nativos</Text>
                        </View>
                        <ChevronRight color="#444" size={16} />
                    </TouchableOpacity>
                </View>

                {/* Email Info */}
                {profile?.email && (
                    <View className="px-6 py-4 border-b border-[#111]">
                        <Text className="text-[#555] text-xs font-mono uppercase tracking-widest mb-1">Email</Text>
                        <Text className="text-[#888] text-sm">{profile.email}</Text>
                    </View>
                )}

                {/* Zona de Perigo / Sair */}
                <View className="px-6 py-6 pb-20">
                    <Text className="text-[#555] font-bold text-xs uppercase tracking-widest mb-4">Segurança</Text>

                    <TouchableOpacity
                        activeOpacity={0.7}
                        className="flex-row items-center justify-between bg-[#0A0A0A] p-4 rounded-md border border-red-900/30"
                        onPress={handleLogout}
                    >
                        <View className="flex-row items-center gap-3">
                            <LogOut color="#ff4444" size={20} />
                            <Text className="text-[#ff4444] font-bold uppercase tracking-widest">Encerrar Sessão</Text>
                        </View>
                    </TouchableOpacity>
                </View>

            </ScrollView>

        </View>
    );
}
