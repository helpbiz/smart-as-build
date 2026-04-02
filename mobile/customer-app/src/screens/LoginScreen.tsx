import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api';

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePhone = (phoneNumber: string): boolean => {
    const phoneRegex = /^01[0-9]{8,9}$/;
    return phoneRegex.test(phoneNumber.replace(/[-\s]/g, ''));
  };

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('입력 오류', '연락처와 비밀번호를 입력해주세요.');
      return;
    }

    const cleanPhone = phone.replace(/[-\s]/g, '');
    if (!validatePhone(cleanPhone)) {
      Alert.alert('입력 오류', '올바른 연락처를 입력해주세요. (예: 01012345678)');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.login(cleanPhone, password);
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      onLogin();
    } catch (error: any) {
      if (error.code === 'ECONNABORTED' || !error.response) {
        Alert.alert('연결 오류', '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
      } else {
        Alert.alert('로그인 실패', error.response?.data?.error || '연락처 또는 비밀번호를 확인해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!phone || !password || !name) {
      Alert.alert('입력 오류', '연락처, 이름, 비밀번호를 모두 입력해주세요.');
      return;
    }

    const cleanPhone = phone.replace(/[-\s]/g, '');
    if (!validatePhone(cleanPhone)) {
      Alert.alert('입력 오류', '올바른 연락처를 입력해주세요. (예: 01012345678)');
      return;
    }

    if (password.length < 6) {
      Alert.alert('입력 오류', '비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('입력 오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      await authApi.register(cleanPhone, name, '', password);
      Alert.alert('회원가입 성공', '로그인 해주세요.', [
        {
          text: '확인',
          onPress: () => {
            setIsRegisterMode(false);
            setPassword('');
            setConfirmPassword('');
            setPhone(cleanPhone);
          },
        },
      ]);
    } catch (error: any) {
      if (error.code === 'ECONNABORTED' || !error.response) {
        Alert.alert('연결 오류', '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
      } else {
        Alert.alert('회원가입 실패', error.response?.data?.error || '다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/logo.jpg')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.subtitle}>고객용</Text>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, !isRegisterMode && styles.activeTab]}
          onPress={() => {
            setIsRegisterMode(false);
            setConfirmPassword('');
          }}
        >
          <Text style={[styles.tabText, !isRegisterMode && styles.activeTabText]}>로그인</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, isRegisterMode && styles.activeTab]}
          onPress={() => {
            setIsRegisterMode(true);
          }}
        >
          <Text style={[styles.tabText, isRegisterMode && styles.activeTabText]}>회원가입</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>연락처</Text>
          <TextInput
            style={styles.input}
            placeholder="01012345678"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            maxLength={11}
            editable={!loading}
          />
        </View>

        {isRegisterMode && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>이름</Text>
            <TextInput
              style={styles.input}
              placeholder="홍길동"
              value={name}
              onChangeText={setName}
              editable={!loading}
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>비밀번호</Text>
          <TextInput
            style={styles.input}
            placeholder={isRegisterMode ? '6자 이상' : '비밀번호'}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />
        </View>

        {isRegisterMode && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>비밀번호 확인</Text>
            <TextInput
              style={styles.input}
              placeholder="비밀번호 다시 입력"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!loading}
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => {
            if (isRegisterMode) {
              handleRegister();
            } else {
              handleLogin();
            }
          }}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isRegisterMode ? '회원가입' : '로그인'}
            </Text>
          )}
        </TouchableOpacity>

        {!isRegisterMode ? (
          <TouchableOpacity
            onPress={() => setIsRegisterMode(true)}
            disabled={loading}
          >
            <Text style={styles.linkText}>회원가입 하러가기 →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => {
              setIsRegisterMode(false);
              setConfirmPassword('');
            }}
            disabled={loading}
          >
            <Text style={styles.linkText}>로그인 하러가기 →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  logo: {
    width: 200,
    height: 80,
    alignSelf: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  form: {
    gap: 8,
  },
  inputContainer: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
});
