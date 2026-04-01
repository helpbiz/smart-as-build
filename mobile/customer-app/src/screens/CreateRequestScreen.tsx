import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { authApi, repairApi } from '../api';

export default function CreateRequestScreen() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    product_name: '',
    purchase_date: '',
    customer_name: '',
    phone: '',
    address: '',
    symptom_description: '',
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const handleGetLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '위치 권한이 필요합니다.');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setLocation({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });
    Alert.alert('위치获取', `위치: ${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotos([...photos, ...result.assets.map(a => a.uri)]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.product_name || !formData.customer_name || !formData.phone || !formData.address) {
      Alert.alert('입력 오류', '필수 항목을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        latitude: location?.latitude || 0,
        longitude: location?.longitude || 0,
      };
      
      if (photos.length > 0) {
        await repairApi.createWithPhotos(payload, photos);
      } else {
        await repairApi.create(payload);
      }
      
      Alert.alert('성공', 'A/S 접수가 완료되었습니다.', [
        { text: '확인', onPress: () => {
          setFormData({
            product_name: '', purchase_date: '', customer_name: '',
            phone: '', address: '', symptom_description: '',
          });
          setPhotos([]);
        }},
      ]);
    } catch (error: any) {
      Alert.alert('오류', error.response?.data?.error || '접수 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>A/S 접수</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>제품명 *</Text>
        <TextInput
          style={styles.input}
          placeholder="예: 삼성 냉장고"
          value={formData.product_name}
          onChangeText={(v) => setFormData({ ...formData, product_name: v })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>구매일 *</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={formData.purchase_date}
          onChangeText={(v) => setFormData({ ...formData, purchase_date: v })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>고객명 *</Text>
        <TextInput
          style={styles.input}
          placeholder="이름"
          value={formData.customer_name}
          onChangeText={(v) => setFormData({ ...formData, customer_name: v })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>연락처 *</Text>
        <TextInput
          style={styles.input}
          placeholder="010-xxxx-xxxx"
          keyboardType="phone-pad"
          value={formData.phone}
          onChangeText={(v) => setFormData({ ...formData, phone: v })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>주소 *</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="주소"
            value={formData.address}
            onChangeText={(v) => setFormData({ ...formData, address: v })}
          />
          <TouchableOpacity style={styles.locationBtn} onPress={handleGetLocation}>
            <Text>📍</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>증상 설명</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="증상을 설명해주세요"
          multiline
          numberOfLines={4}
          value={formData.symptom_description}
          onChangeText={(v) => setFormData({ ...formData, symptom_description: v })}
        />
      </View>

      <TouchableOpacity style={styles.photoBtn} onPress={handlePickImage}>
        <Text>📷 사진 추가</Text>
      </TouchableOpacity>

      {photos.length > 0 && (
        <Text style={styles.photoCount}>{photos.length}张照片已选择</Text>
      )}

      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>접수하기</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: '#666', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 8 },
  locationBtn: { padding: 12, backgroundColor: '#eee', borderRadius: 8 },
  photoBtn: { padding: 16, backgroundColor: '#f0f0f0', borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  photoCount: { fontSize: 12, color: '#666', marginBottom: 12 },
  submitBtn: { backgroundColor: '#007AFF', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
