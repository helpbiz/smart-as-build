import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Linking } from 'react-native';
import { assignmentsApi } from '../api';
import type { RepairRequest } from '../types';

type Props = {
  route: { params: { job: RepairRequest } };
  navigation: any;
};

export default function JobDetailScreen({ route, navigation }: Props) {
  const { job } = route.params;
  const [loading, setLoading] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [formData, setFormData] = useState({
    repair_details: '',
    parts_used: '',
    payment_amount: '',
    payment_method: 'card' as 'card' | 'cash' | 'transfer',
  });

  const handleStart = async () => {
    Alert.alert(
      '수리 시작',
      '수리를 시작하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '시작',
          onPress: async () => {
            setLoading(true);
            try {
              await assignmentsApi.start(job.id);
              Alert.alert('성공', '수리를 시작합니다.');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('오류', error.response?.data?.error || '시작 실패');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleComplete = async () => {
    if (!formData.repair_details || !formData.payment_amount) {
      Alert.alert('입력 오류', '수리 내용과 결제 금액을 입력해주세요.');
      return;
    }

    Alert.alert(
      '수리 완료',
      '정말 수리를 완료하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '완료',
          onPress: async () => {
            setLoading(true);
            try {
              await assignmentsApi.complete(job.id, {
                repair_details: formData.repair_details,
                parts_used: formData.parts_used,
                payment_amount: parseInt(formData.payment_amount),
                payment_method: formData.payment_method,
              });
              Alert.alert('성공', '수리가 완료되었습니다.', [
                { text: '확인', onPress: () => navigation.goBack() },
              ]);
            } catch (error: any) {
              Alert.alert('오류', error.response?.data?.error || '완료 실패');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCall = () => {
    Linking.openURL(`tel:${job.phone}`);
  };

  const handleMap = () => {
    const url = `https://maps.google.com/?q=${job.latitude},${job.longitude}`;
    Linking.openURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기';
      case 'assigned': return '배정됨';
      case 'repairing': return '수리중';
      case 'completed': return '완료';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'assigned': return '#007AFF';
      case 'repairing': return '#5856D6';
      case 'completed': return '#34C759';
      default: return '#8E8E93';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <View style={styles.header}>
          <Text style={styles.productName}>{job.product_name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
            <Text style={styles.statusText}>{getStatusText(job.status)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>고객 정보</Text>
        <View style={styles.row}>
          <Text style={styles.label}>고객명</Text>
          <Text style={styles.value}>{job.customer_name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>연락처</Text>
          <TouchableOpacity onPress={handleCall}>
            <Text style={styles.linkText}>{job.phone}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>주소</Text>
          <TouchableOpacity onPress={handleMap} style={styles.mapLink}>
            <Text style={styles.linkText}>{job.address}</Text>
            <Text style={styles.mapIcon}> 📍</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>요청 정보</Text>
        <View style={styles.row}>
          <Text style={styles.label}>증상</Text>
          <Text style={styles.value}>{job.symptom_description || '없음'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>접수일</Text>
          <Text style={styles.value}>{formatDate(job.created_at)}</Text>
        </View>
        {job.accepted_at && (
          <View style={styles.row}>
            <Text style={styles.label}>수락일</Text>
            <Text style={styles.value}>{formatDate(job.accepted_at)}</Text>
          </View>
        )}
      </View>

      {job.status === 'assigned' && (
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.startBtn, loading && styles.btnDisabled]}
            onPress={handleStart}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionBtnText}>수리 시작</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {job.status === 'repairing' && (
        <View style={styles.actionSection}>
          {!showCompleteForm ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.completeBtn]}
              onPress={() => setShowCompleteForm(true)}
            >
              <Text style={styles.actionBtnText}>수리 완료</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.form}>
              <Text style={styles.formTitle}>수리 완료 정보 입력</Text>
              
              <Text style={styles.inputLabel}>수리 내용 *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="수리 내용을 입력해주세요"
                multiline
                numberOfLines={4}
                value={formData.repair_details}
                onChangeText={(v) => setFormData({ ...formData, repair_details: v })}
              />
              
              <Text style={styles.inputLabel}>사용 부품</Text>
              <TextInput
                style={styles.input}
                placeholder="사용한 부품 (선택)"
                value={formData.parts_used}
                onChangeText={(v) => setFormData({ ...formData, parts_used: v })}
              />
              
              <Text style={styles.inputLabel}>결제 금액 (원) *</Text>
              <TextInput
                style={styles.input}
                placeholder="결제 금액"
                keyboardType="numeric"
                value={formData.payment_amount}
                onChangeText={(v) => setFormData({ ...formData, payment_amount: v })}
              />
              
              <Text style={styles.inputLabel}>결제 방법</Text>
              <View style={styles.paymentMethods}>
                {(['card', 'cash', 'transfer'] as const).map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.methodBtn,
                      formData.payment_method === method && styles.methodBtnActive,
                    ]}
                    onPress={() => setFormData({ ...formData, payment_method: method })}
                  >
                    <Text style={[
                      styles.methodText,
                      formData.payment_method === method && styles.methodTextActive,
                    ]}>
                      {method === 'card' ? '카드' : method === 'cash' ? '현금' : '계좌이체'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.formBtn, styles.cancelBtn]}
                  onPress={() => setShowCompleteForm(false)}
                >
                  <Text style={styles.cancelBtnText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formBtn, styles.submitBtn, loading && styles.btnDisabled]}
                  onPress={handleComplete}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitBtnText}>완료</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {job.status === 'completed' && job.repair_completion && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>수리 완료 정보</Text>
          <View style={styles.row}>
            <Text style={styles.label}>수리 내용</Text>
            <Text style={styles.value}>{job.repair_completion.repair_details}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>사용 부품</Text>
            <Text style={styles.value}>{job.repair_completion.parts_used || '없음'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>결제 금액</Text>
            <Text style={styles.value}>{job.repair_completion.payment_amount.toLocaleString()}원</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>결제 방법</Text>
            <Text style={styles.value}>
              {job.repair_completion.payment_method === 'card' ? '카드' :
               job.repair_completion.payment_method === 'cash' ? '현금' : '계좌이체'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>완료일</Text>
            <Text style={styles.value}>{formatDate(job.repair_completion.completed_at)}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  section: { backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 12, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productName: { fontSize: 20, fontWeight: 'bold', color: '#333', flex: 1 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#007AFF', marginBottom: 12 },
  row: { flexDirection: 'row', marginBottom: 12 },
  label: { width: 80, fontSize: 14, color: '#666' },
  value: { flex: 1, fontSize: 14, color: '#333' },
  linkText: { color: '#007AFF', fontSize: 14 },
  mapLink: { flexDirection: 'row', alignItems: 'center' },
  mapIcon: { color: '#007AFF' },
  actionSection: { padding: 16 },
  actionBtn: { padding: 16, borderRadius: 12, alignItems: 'center' },
  startBtn: { backgroundColor: '#5856D6' },
  completeBtn: { backgroundColor: '#34C759' },
  actionBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  btnDisabled: { opacity: 0.6 },
  form: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  formTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  inputLabel: { fontSize: 14, color: '#666', marginBottom: 8, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  paymentMethods: { flexDirection: 'row', gap: 12 },
  methodBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  methodBtnActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  methodText: { fontSize: 14, color: '#333' },
  methodTextActive: { color: '#fff', fontWeight: '600' },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  formBtn: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#f0f0f0' },
  cancelBtnText: { color: '#666', fontSize: 16, fontWeight: '600' },
  submitBtn: { backgroundColor: '#34C759' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
