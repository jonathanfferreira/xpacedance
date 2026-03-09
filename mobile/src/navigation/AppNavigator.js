import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, PlaySquare, Award, User } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';

// Telas
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ClassScreen from '../screens/ClassScreen';
import LibraryScreen from '../screens/LibraryScreen';
import RankingScreen from '../screens/RankingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Navegação das Abas Principais
function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#020202',
                    borderTopColor: '#151515',
                    paddingTop: 5,
                    paddingBottom: 5,
                    height: 60,
                },
                tabBarActiveTintColor: '#eb00bc',
                tabBarInactiveTintColor: '#555',
                tabBarLabelStyle: {
                    fontFamily: 'sans-serif',
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                }
            }}
        >
            <Tab.Screen
                name="HoloDeck"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Holo-Deck',
                    tabBarIcon: ({ color }) => <Home color={color} size={24} />
                }}
            />
            <Tab.Screen
                name="Acessos"
                component={LibraryScreen}
                options={{
                    tabBarLabel: 'Biblioteca',
                    tabBarIcon: ({ color }) => <PlaySquare color={color} size={24} />
                }}
            />
            <Tab.Screen
                name="Ranking"
                component={RankingScreen}
                options={{
                    tabBarLabel: 'Ranking',
                    tabBarIcon: ({ color }) => <Award color={color} size={24} />
                }}
            />
            <Tab.Screen
                name="Perfil"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'SISTEMA',
                    tabBarIcon: ({ color }) => <User color={color} size={24} />
                }}
            />
        </Tab.Navigator>
    );
}

// Navegação Raiz — rota condicional baseada em autenticação
export default function AppNavigator() {
    const { user, loading } = useAuth();

    const xPaceTheme = {
        ...DarkTheme,
        colors: {
            ...DarkTheme.colors,
            background: '#000000',
            card: '#0a0a0a',
        },
    };

    // Loading spinner enquanto verifica sessão
    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color="#6324b2" size="large" />
            </View>
        );
    }

    return (
        <NavigationContainer theme={xPaceTheme}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    <>
                        <Stack.Screen name="MainTabs" component={MainTabs} />
                        <Stack.Screen name="Class" component={ClassScreen} />
                        <Stack.Screen name="Notifications" component={NotificationsScreen} />
                    </>
                ) : (
                    <Stack.Screen name="Login" component={LoginScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
