import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import PendingApprovalScreen from './src/screens/PendingApprovalScreen';
import JobListScreen from './src/screens/JobListScreen';
import AssignmentListScreen from './src/screens/AssignmentListScreen';
import JobDetailScreen from './src/screens/JobDetailScreen';
import MyPageScreen from './src/screens/MyPageScreen';

type Tab = 'jobs' | 'assignments' | 'mypage';

const Stack = createNativeStackNavigator();

function MainTabs({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('jobs');

  const renderContent = () => {
    switch (activeTab) {
      case 'jobs':
        return <JobListScreen />;
      case 'assignments':
        return <AssignmentListScreen />;
      case 'mypage':
        return <MyPageScreen onLogout={onLogout} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.content}>
        {renderContent()}
      </View>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'jobs' && styles.activeTab]}
          onPress={() => setActiveTab('jobs')}
        >
          <Text style={[styles.tabIcon, activeTab === 'jobs' && styles.activeTabIcon]}>📋</Text>
          <Text style={[styles.tabText, activeTab === 'jobs' && styles.activeTabText]}>대기 요청</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'assignments' && styles.activeTab]}
          onPress={() => setActiveTab('assignments')}
        >
          <Text style={[styles.tabIcon, activeTab === 'assignments' && styles.activeTabIcon]}>📝</Text>
          <Text style={[styles.tabText, activeTab === 'assignments' && styles.activeTabText]}>내 작업</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'mypage' && styles.activeTab]}
          onPress={() => setActiveTab('mypage')}
        >
          <Text style={[styles.tabIcon, activeTab === 'mypage' && styles.activeTabIcon]}>👤</Text>
          <Text style={[styles.tabText, activeTab === 'mypage' && styles.activeTabText]}>MY</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [technicianStatus, setTechnicianStatus] = useState<string>('pending');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const techData = await AsyncStorage.getItem('technician');
        if (techData) {
          const tech = JSON.parse(techData);
          setTechnicianStatus(tech.status || 'pending');
        }
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogin = (status: string) => {
    setTechnicianStatus(status);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('technician');
    setIsLoggedIn(false);
    setTechnicianStatus('pending');
  };

  if (checkingAuth) {
    return (
      <View style={styles.loading}>
        <Text>로딩 중...</Text>
      </View>
    );
  }

  if (!isLoggedIn) {
    if (showRegister) {
      return <RegisterScreen onRegistered={() => setShowRegister(false)} />;
    }
    return <LoginScreen onLogin={handleLogin} onRegister={() => setShowRegister(true)} />;
  }

  if (technicianStatus !== 'approved') {
    return (
      <PendingApprovalScreen
        onApproved={() => setTechnicianStatus('approved')}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Main" options={{ headerShown: false }}>
          {() => <MainTabs onLogout={handleLogout} />}
        </Stack.Screen>
        <Stack.Screen
          name="JobDetail"
          component={JobDetailScreen}
          options={{
            title: '작업 상세',
            headerStyle: { backgroundColor: '#007AFF' },
            headerTintColor: '#fff',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff', paddingBottom: 20, paddingTop: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  activeTab: { borderTopWidth: 2, borderTopColor: '#007AFF', marginTop: -2 },
  tabIcon: { fontSize: 20, marginBottom: 4 },
  activeTabIcon: {},
  tabText: { fontSize: 12, color: '#999' },
  activeTabText: { color: '#007AFF', fontWeight: '600' },
});
