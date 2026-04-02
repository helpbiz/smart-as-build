import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Technician } from '../types';

export default function MyPageScreen({ onLogout }: { onLogout: () => void }) {
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTechnician();
  }, []);

  const loadTechnician = async () => {
    try {
      const data = await AsyncStorage.getItem('technician');
      if (data) {
        setTechnician(JSON.parse(data));
      }
    } catch (error) {
      console.error('Failed to load technician:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('technician');
            onLogout();
          },
        },
      ]
    );
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '승인 대기';
      case 'approved': return '승인됨';
      case 'suspended': return '정지됨';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'approved': return '#34C759';
      case 'suspended': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {technician?.name?.charAt(0) || '?'}
          </Text>
        </View>
        <Text style={styles.name}>{technician?.name || '알 수 없음'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(technician?.status || '') }]}>
          <Text style={styles.statusText}>{getStatusText(technician?.status || '')}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>계정 정보</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>연락처</Text>
          <Text style={styles.value}>{technician?.phone || '-'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>이메일</Text>
          <Text style={styles.value}>{technician?.email || '미등록'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>서비스 지역</Text>
          <Text style={styles.value}>{technician?.service_area || '미설정'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>안내</Text>
        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>
            {technician?.status === 'pending'
              ? '현재 가입 승인을 기다리고 있습니다. 관리자가 검토 후 승인하면 서비스를 이용하실 수 있습니다.'
              : technician?.status === 'approved'
              ? '모든 기능을 이용하실 수 있습니다. 요청을 수락하고 수리 작업을 완료해주세요.'
              : '계정이 정지되었습니다. 자세한 내용은 관리자에게 문의하세요.'}
          </Text>
        </View>
      </View>

      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 },
  statusText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#007AFF', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  label: { fontSize: 14, color: '#666' },
  value: { fontSize: 14, color: '#333', fontWeight: '500' },
  noticeCard: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 16 },
  noticeText: { fontSize: 14, color: '#666', lineHeight: 22 },
  logoutSection: { marginTop: 'auto', paddingBottom: 20 },
  logoutBtn: { backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FF3B30' },
  logoutBtnText: { color: '#FF3B30', fontSize: 16, fontWeight: '600' },
});
