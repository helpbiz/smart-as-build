import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { assignmentsApi } from '../api';
import type { RepairRequest } from '../types';

export default function AssignmentListScreen({ navigation }: any) {
  const [assignments, setAssignments] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAssignments = async () => {
    try {
      const response = await assignmentsApi.list();
      setAssignments(response.data);
    } catch (error: any) {
      Alert.alert('오류', '배정 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAssignments();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAssignments();
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기';
      case 'assigned': return '배정됨';
      case 'repairing': return '수리중';
      case 'completed': return '완료';
      default: return status;
    }
  };

  const renderItem = ({ item }: { item: RepairRequest }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('JobDetail', { job: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.productName}>{item.product_name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
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
        <Text style={styles.value} numberOfLines={1}>{item.address}</Text>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
        <Text style={styles.detailBtn}>상세보기 →</Text>
      </View>
    </TouchableOpacity>
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
        data={assignments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>배정된 작업이 없습니다</Text>
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
  productName: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  info: { flexDirection: 'row', marginBottom: 8 },
  label: { width: 70, fontSize: 14, color: '#666' },
  value: { flex: 1, fontSize: 14, color: '#333' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  date: { fontSize: 12, color: '#999' },
  detailBtn: { color: '#007AFF', fontSize: 14, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#999' },
});
