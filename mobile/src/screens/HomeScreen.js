import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Bell, Flame, PlayCircle, Sparkles } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

export default function HomeScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [topCourses, setTopCourses] = useState([]);
    const [continueWatching, setContinueWatching] = useState([]);
    const [newReleases, setNewReleases] = useState([]);
    const [streak, setStreak] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadError, setLoadError] = useState(false);

    const loadData = useCallback(async () => {
        setLoadError(false);
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;
            setUser(authUser);

            // Busca dados em paralelo para performance
            const [profileRes, coursesRes, progressRes, streakRes] = await Promise.all([
                // Perfil do usuário
                supabase
                    .from('users')
                    .select('full_name, avatar_url, xp')
                    .eq('id', authUser.id)
                    .single(),

                // Top cursos publicados (ordenado por preço/popularidade)
                supabase
                    .from('courses')
                    .select('id, title, thumbnail_url, tenants!tenant_id(name)')
                    .eq('is_published', true)
                    .limit(8),

                // Aulas em progresso (continuar assistindo)
                supabase
                    .from('progress')
                    .select('lesson_id, completed, lessons!lesson_id(id, title, module_name, course_id, courses!course_id(title))')
                    .eq('user_id', authUser.id)
                    .eq('completed', false)
                    .limit(3),

                // Streak do usuário
                supabase
                    .from('user_streaks')
                    .select('current_streak')
                    .eq('user_id', authUser.id)
                    .single(),
            ]);

            if (profileRes.data) setUserProfile(profileRes.data);
            if (coursesRes.data) setTopCourses(coursesRes.data);
            if (progressRes.data) setContinueWatching(progressRes.data.filter(p => p.lessons));
            if (streakRes.data) setStreak(streakRes.data.current_streak || 0);

            // Lançamentos recentes (cursos criados nos últimos 14 dias)
            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
            const { data: releases } = await supabase
                .from('courses')
                .select('id, title')
                .eq('is_published', true)
                .gte('created_at', twoWeeksAgo.toISOString())
                .limit(5);
            if (releases) setNewReleases(releases);
        } catch (err) {
            console.error('HomeScreen load error:', err);
            setLoadError(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const renderCourseCard = ({ item, index }) => (
        <TouchableOpacity
            className="mr-4 w-48 relative overflow-hidden rounded-md border border-[#222] bg-[#0A0A0A]"
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Class', { courseId: item.id })}
        >
            <View className="h-64 bg-[#111] w-full relative">
                {item.thumbnail_url ? (
                    <Image
                        source={{ uri: item.thumbnail_url }}
                        className="absolute inset-0 w-full h-full"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="absolute inset-0 bg-primary/10 opacity-30" />
                )}
                <View className="absolute bottom-4 left-4 right-4 z-10">
                    <View className="bg-[#eb00bc] self-start px-2 py-1 rounded-sm mb-2">
                        <Text className="text-white text-[8px] font-bold uppercase tracking-widest">
                            #{index + 1} EM ALTA
                        </Text>
                    </View>
                    <Text className="text-white font-bold text-lg leading-tight uppercase mb-1" numberOfLines={2}>
                        {item.title}
                    </Text>
                    <Text className="text-[#888] text-[10px] uppercase tracking-widest" numberOfLines={1}>
                        {item.tenants?.name || 'Xpace On'}
                    </Text>
                </View>
                <View className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            </View>
        </TouchableOpacity>
    );

    const renderContinueCard = ({ item }) => {
        const lesson = item.lessons;
        const courseName = lesson?.courses?.title || '';
        return (
            <TouchableOpacity
                className="w-full bg-[#0A0A0A] border border-[#333] rounded-md overflow-hidden relative mb-4"
                activeOpacity={0.9}
                onPress={() => navigation.navigate('Class', { lessonId: lesson?.id })}
            >
                <View className="absolute top-0 left-0 w-1 h-full bg-[#6324b2] z-10" />
                <View className="p-4 pl-6">
                    <View className="flex-row items-center gap-2 mb-2">
                        <View className="bg-[#6324b2]/20 border border-[#6324b2]/50 px-2 py-0.5 rounded-sm">
                            <Text className="text-[#6324b2] text-[10px] uppercase tracking-widest font-bold">
                                {lesson?.module_name || 'Módulo'}
                            </Text>
                        </View>
                    </View>
                    <Text className="text-white font-bold text-base uppercase leading-tight mb-3" numberOfLines={2}>
                        {lesson?.title}
                    </Text>
                    <Text className="text-[#555] text-[10px] font-mono mb-3" numberOfLines={1}>
                        {courseName}
                    </Text>
                    <View className="flex-row items-center border border-white/20 self-start px-4 py-2 rounded-sm gap-2">
                        <PlayCircle color="white" size={14} />
                        <Text className="text-white font-bold text-[10px] tracking-widest uppercase">Retomar</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <ActivityIndicator color="#6324b2" size="large" />
            </View>
        );
    }

    if (loadError) {
        return (
            <View className="flex-1 bg-black items-center justify-center px-8">
                <Sparkles color="#333" size={48} />
                <Text className="text-[#555] text-center mt-4 uppercase tracking-widest text-sm">
                    Erro ao carregar conteúdo
                </Text>
                <Text className="text-[#444] text-xs text-center mt-2">
                    Verifique sua conexão e tente novamente.
                </Text>
                <TouchableOpacity
                    onPress={() => { setLoading(true); loadData(); }}
                    className="mt-6 border border-[#333] px-6 py-3 rounded"
                >
                    <Text className="text-white text-xs uppercase tracking-widest font-bold">Tentar Novamente</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            {/* Topbar */}
            <View className="flex-row justify-between items-center px-6 pt-16 pb-4 bg-[#050505] border-b border-[#222] z-50">
                <Image
                    source={require('../../assets/images/logo-branca.png')}
                    className="w-24 h-8"
                    resizeMode="contain"
                />
                <View className="flex-row items-center gap-4">
                    {streak > 0 && (
                        <View className="flex-row items-center bg-[#111] border border-[#333] px-2 py-1 rounded">
                            <Flame color="#eb00bc" size={14} />
                            <Text className="text-[#eb00bc] font-bold text-xs ml-1">{streak}</Text>
                        </View>
                    )}
                    <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
                        <Bell color="#888" size={20} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6324b2" />}
            >
                {/* Saudação */}
                {userProfile && (
                    <View className="px-6 pt-6 pb-2">
                        <Text className="text-[#555] text-xs font-mono uppercase tracking-widest">
                            Olá, {userProfile.full_name?.split(' ')[0] || 'Dançarino'} 👋
                        </Text>
                        <Text className="text-white font-bold text-lg uppercase">
                            {userProfile.xp || 0} XP acumulados
                        </Text>
                    </View>
                )}

                {/* Continuar Assistindo */}
                {continueWatching.length > 0 && (
                    <View className="px-6 pt-4">
                        <Text className="text-[#555] font-bold text-xs tracking-widest uppercase mb-4">Sessão Ativa</Text>
                        <FlatList
                            data={continueWatching}
                            renderItem={renderContinueCard}
                            keyExtractor={item => item.lesson_id}
                            scrollEnabled={false}
                        />
                    </View>
                )}

                {/* Top Cursos */}
                {topCourses.length > 0 && (
                    <View className="pl-6 mb-8 mt-4">
                        <Text className="text-white font-bold text-lg uppercase tracking-widest mb-4">
                            Top Cursos <Text className="text-[#eb00bc] text-xs">em Alta</Text>
                        </Text>
                        <FlatList
                            data={topCourses}
                            renderItem={renderCourseCard}
                            keyExtractor={item => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingRight: 24 }}
                        />
                    </View>
                )}

                {/* Lançamentos */}
                {newReleases.length > 0 && (
                    <View className="px-6 pb-12">
                        <View className="flex-row items-center gap-2 mb-4">
                            <Sparkles color="#6324b2" size={16} />
                            <Text className="text-white font-bold text-sm uppercase tracking-widest">Lançamentos</Text>
                        </View>
                        {newReleases.map(item => (
                            <TouchableOpacity
                                key={item.id}
                                className="flex-row items-center mb-4 bg-[#111] border border-[#222] rounded-md p-3"
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate('Class', { courseId: item.id })}
                            >
                                <View className="w-16 h-16 bg-[#1A1A1A] rounded-md items-center justify-center mr-4 border border-[#333]">
                                    <PlayCircle color="#555" size={24} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-white font-bold text-sm uppercase" numberOfLines={2}>{item.title}</Text>
                                    <Text className="text-[#666] text-xs mt-1">Novo</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Empty state */}
                {topCourses.length === 0 && continueWatching.length === 0 && !loading && (
                    <View className="flex-1 items-center justify-center px-6 pt-20">
                        <Sparkles color="#333" size={48} />
                        <Text className="text-[#555] text-center mt-4 uppercase tracking-widest text-sm">
                            Nenhum curso disponível ainda
                        </Text>
                    </View>
                )}

            </ScrollView>
        </View>
    );
}
