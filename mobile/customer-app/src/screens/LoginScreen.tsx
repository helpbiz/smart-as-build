import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, ScrollView, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api';

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
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
        Alert.alert('연결 오류', `서버에 연결할 수 없습니다.\n[${error.code || 'NO_RESPONSE'}] ${error.message}`);
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

    if (!agreeTerms) {
      Alert.alert('약관 동의', '서비스 이용약관 및 개인정보처리방침에 동의해주세요.');
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
            setAgreeTerms(false);
            setPhone(cleanPhone);
          },
        },
      ]);
    } catch (error: any) {
      if (error.code === 'ECONNABORTED' || !error.response) {
        Alert.alert('연결 오류', `서버에 연결할 수 없습니다.\n[${error.code || 'NO_RESPONSE'}] ${error.message}`);
      } else {
        Alert.alert('회원가입 실패', error.response?.data?.error || '다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Modal visible={showTerms} animationType="slide" onRequestClose={() => setShowTerms(false)}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>이용약관 및 개인정보처리방침</Text>
          <TouchableOpacity onPress={() => setShowTerms(false)}>
            <Text style={styles.modalClose}>✕ 닫기</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalBody}>
          <Text style={styles.termsSectionTitle}>■ 서비스 이용약관</Text>
          <Text style={styles.termsText}>{`제1조 (목적)
본 약관은 고짱(이하 "서비스")이 제공하는 소형가전 A/S 매칭 서비스 이용에 관한 조건 및 절차를 규정합니다.

제2조 (서비스 이용)
① 회원은 본 서비스를 통해 가전제품 수리 접수 및 진행 상황을 확인할 수 있습니다.
② 허위 정보 등록, 서비스 악용 시 이용이 제한될 수 있습니다.

제3조 (책임 제한)
서비스는 수리 기사와 고객을 연결하는 플랫폼이며, 실제 수리 결과에 대한 직접적인 책임을 지지 않습니다.`}
          </Text>

          <Text style={styles.termsSectionTitle}>■ 개인정보처리방침</Text>
          <Text style={styles.termsText}>{`1. 수집 항목
- 이름, 연락처(휴대폰번호), 서비스 주소, 기기 정보

2. 수집 목적
- A/S 접수 및 처리, 수리 기사 배정, 서비스 안내

3. 보유 기간
- 회원 탈퇴 시까지 또는 법령에 따른 보유 기간

4. 제3자 제공
- 수리 서비스 제공을 위해 담당 기사에게 이름, 연락처, 주소를 제공합니다.

5. 개인정보 처리 문의
- 서비스 내 고객센터를 통해 문의하실 수 있습니다.`}
          </Text>
        </ScrollView>
        <TouchableOpacity
          style={styles.agreeButton}
          onPress={() => { setAgreeTerms(true); setShowTerms(false); }}
        >
          <Text style={styles.agreeButtonText}>동의하고 닫기</Text>
        </TouchableOpacity>
      </View>
    </Modal>
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
    >
      <Image source={require('../../assets/logo.jpg')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.subtitle}>고객용</Text>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, !isRegisterMode && styles.activeTab]}
          onPress={() => {
            setIsRegisterMode(false);
            setConfirmPassword('');
            setAgreeTerms(false);
          }}
        >
          <Text style={[styles.tabText, !isRegisterMode && styles.activeTabText]}>로그인</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, isRegisterMode && styles.activeTab]}
          onPress={() => setIsRegisterMode(true)}
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

        {isRegisterMode && (
          <View>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAgreeTerms(!agreeTerms)}
              disabled={loading}
            >
              <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                {agreeTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                서비스 이용약관 및 개인정보처리방침에 동의합니다 <Text style={styles.required}>(필수)</Text>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowTerms(true)}>
              <Text style={styles.termsLink}>▶ 이용약관 및 개인정보처리방침 보기</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => isRegisterMode ? handleRegister() : handleLogin()}
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
          <TouchableOpacity onPress={() => setIsRegisterMode(true)} disabled={loading}>
            <Text style={styles.linkText}>회원가입 하러가기 →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => { setIsRegisterMode(false); setConfirmPassword(''); setAgreeTerms(false); }} disabled={loading}>
            <Text style={styles.linkText}>로그인 하러가기 →</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: '#444',
    lineHeight: 18,
  },
  required: {
    color: '#FF3B30',
    fontWeight: '600',
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
  termsLink: {
    color: '#007AFF',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 32,
    textDecorationLine: 'underline',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  modalClose: {
    color: '#007AFF',
    fontSize: 14,
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  termsSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginTop: 16,
    marginBottom: 8,
  },
  termsText: {
    fontSize: 13,
    color: '#444',
    lineHeight: 22,
  },
  agreeButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  agreeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
