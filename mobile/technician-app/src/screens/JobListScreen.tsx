import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { jobsApi } from '../api';
import type { RepairRequest } from '../types';

export default function JobListScreen({ navigation }: any) {
  const [jobs, setJobs] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = async () => {
    try {
      const response = await jobsApi.list();
      setJobs(response.data);
    } catch (error: any) {
      Alert.alert('오류', '요청 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const handleAccept = async (jobId: number) => {
    Alert.alert(
      '수리 요청 수락',
      '이 요청을 수락하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '수락',
          onPress: async () => {
            try {
              await jobsApi.accept(jobId);
              Alert.alert('성공', '수리 요청을 수락했습니다.');
              fetchJobs();
            } catch (error: any) {
              Alert.alert('오류', error.response?.data?.error || '수락 실패');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const renderItem = ({ item }: { item: RepairRequest }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.productName}>{item.product_name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>
            {item.status === 'pending' ? '대기' : 
             item.status === 'assigned' ? '배정됨' :
             item.status === 'repairing' ? '수리중' : '완료'}
          </Text>
        </View>
      </View>
      
      <View style={styles.info}>
        <Text style={styles.label}>고객명</Text>
        <Text style={styles.value}>{item.customer_name}</Text>
      </View>
      
      <View style={styles.info}>
        <Text style={styles.label}>연락처</Text>
        <Text style={styles.value}>{item.phone}</Text>
      </View>
      
      <View style={styles.info}>
        <Text style={styles.label}>주소</Text>
        <Text style={styles.value}>{item.address}</Text>
      </View>
      
      <View style={styles.info}>
        <Text style={styles.label}>증상</Text>
        <Text style={styles.value}>{item.symptom_description || '없음'}</Text>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
        {item.status === 'pending' && (
          <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item.id)}>
            <Text style={styles.acceptBtnText}>수락</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>대기 중인 요청이 없습니다</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  productName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  info: { flexDirection: 'row', marginBottom: 8 },
  label: { width: 70, fontSize: 14, color: '#666' },
  value: { flex: 1, fontSize: 14, color: '#333' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  date: { fontSize: 12, color: '#999' },
  acceptBtn: { backgroundColor: '#34C759', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  acceptBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#999' },
});
