import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api';

export default function PendingApprovalScreen({
  onApproved,
  onLogout,
}: {
  onApproved: () => void;
  onLogout: () => void;
}) {
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    try {
      const response = await authApi.me();
      if (response.data.status === 'approved') {
        onApproved();
      } else if (response.data.status === 'suspended') {
        Alert.alert('계정 정지', '계정이 정지되었습니다. 관리자에게 문의하세요.');
      } else {
        Alert.alert('승인 대기 중', '아직 관리자 승인이 완료되지 않았습니다.\n잠시 후 다시 확인해 주세요.');
      }
    } catch {
      Alert.alert('오류', '상태 확인에 실패했습니다. 네트워크를 확인해 주세요.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('technician');
    onLogout();
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>⏳</Text>
      </View>

      <Text style={styles.title}>승인 대기 중</Text>
      <Text style={styles.description}>
        회원가입이 완료되었습니다.{'\n'}
        관리자가 계정을 승인하면 바로 서비스를 이용하실 수 있습니다.
      </Text>

      <TouchableOpacity
        style={[styles.refreshBtn, checking && styles.btnDisabled]}
        onPress={handleRefresh}
        disabled={checking}
      >
        {checking ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.refreshBtnText}>승인 상태 확인</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  iconContainer: {
    marginBottom: 24,
  },
  icon: {
    fontSize: 72,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  refreshBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  refreshBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutBtn: {
    paddingVertical: 12,
  },
  logoutBtnText: {
    color: '#FF3B30',
    fontSize: 14,
  },
});
