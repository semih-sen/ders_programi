'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'node:crypto';

/**
 * Bir JSON dosyasından belirli bir satırı (entry) siler
 * @param filePath - Dosya yolu (örn: "donem-2/anatomy")
 * @param entryId - Silinecek satırın ID'si
 */
export async function deleteEntry(filePath: string, entryId: string) {
  try {
    // Güvenlik: Admin kontrolü
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Bu işlem için admin yetkisi gereklidir.' };
    }

    // Dosya yolunu oluştur
    const fullPath = path.join('/home/ghrunner/cinnasium-data', 'private-data', `${filePath}.json`);

    // Dosya var mı kontrol et
    if (!fs.existsSync(fullPath)) {
      return { success: false, error: 'Dosya bulunamadı.' };
    }

    // Dosyayı oku ve parse et
    const fileContent = fs.readFileSync(fullPath, 'utf-8');
    const data = JSON.parse(fileContent);

    // Dizi mi kontrol et
    if (!Array.isArray(data)) {
      return { success: false, error: 'Dosya formatı geçersiz.' };
    }

    // Satırı filtrele (sil)
    const newData = data.filter((item: any) => item.id !== entryId);

    // Değişiklik var mı kontrol et
    if (newData.length === data.length) {
      return { success: false, error: 'Silinecek satır bulunamadı.' };
    }

    // Dosyayı güncelle
    fs.writeFileSync(fullPath, JSON.stringify(newData, null, 2), 'utf-8');

    // Sayfayı yenile
    revalidatePath(`/admin/data-files/edit/${filePath}`);
    revalidatePath('/admin/data-files');

    return { success: true, message: 'Satır başarıyla silindi.' };
  } catch (error) {
    console.error('deleteEntry hatası:', error);
    return { success: false, error: 'Silme işlemi sırasında bir hata oluştu.' };
  }
}

/**
 * Bir JSON dosyasındaki belirli bir satırı (entry) günceller
 * @param filePath - Dosya yolu (örn: "donem-2/anatomy")
 * @param entryId - Güncellenecek satırın ID'si
 * @param updatedData - Yeni veri objesi
 */
export async function updateEntry(
  filePath: string,
  entryId: string,
  updatedData: Record<string, any>
) {
  try {
    // Güvenlik: Admin kontrolü
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Bu işlem için admin yetkisi gereklidir.' };
    }

    // Dosya yolunu oluştur
    const fullPath = path.join('/home/ghrunner/cinnasium-data', 'private-data', `${filePath}.json`);

    // Dosya var mı kontrol et
    if (!fs.existsSync(fullPath)) {
      return { success: false, error: 'Dosya bulunamadı.' };
    }

    // Dosyayı oku ve parse et
    const fileContent = fs.readFileSync(fullPath, 'utf-8');
    const data = JSON.parse(fileContent);

    // Dizi mi kontrol et
    if (!Array.isArray(data)) {
      return { success: false, error: 'Dosya formatı geçersiz.' };
    }

    // Güncellenecek satırı bul
    const itemIndex = data.findIndex((item: any) => item.id === entryId);
    
    if (itemIndex === -1) {
      return { success: false, error: 'Güncellenecek satır bulunamadı.' };
    }

    // Satırı güncelle (ID'yi koru)
    data[itemIndex] = {
      ...data[itemIndex],
      ...updatedData,
      id: entryId, // ID'yi değiştirme
    };

    // Dosyayı güncelle
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf-8');

    // Sayfayı yenile
    revalidatePath(`/admin/data-files/edit/${filePath}`);
    revalidatePath('/admin/data-files');

    return { success: true, message: 'Satır başarıyla güncellendi.' };
  } catch (error) {
    console.error('updateEntry hatası:', error);
    return { success: false, error: 'Güncelleme işlemi sırasında bir hata oluştu.' };
  }
}

/**
 * Bir JSON dosyasına yeni bir satır (entry) ekler
 * @param filePath - Dosya yolu (örn: "donem-2/anatomy")
 * @param newEntryData - Yeni eklenecek veri objesi
 */
export async function createEntry(
  filePath: string,
  newEntryData: Record<string, any>
) {
  try {
    // Güvenlik: Admin kontrolü
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Bu işlem için admin yetkisi gereklidir.' };
    }

    // Dosya yolunu oluştur
    const fullPath = path.join('/home/ghrunner/cinnasium-data', 'private-data', `${filePath}.json`);

    // Dosya var mı kontrol et
    if (!fs.existsSync(fullPath)) {
      return { success: false, error: 'Dosya bulunamadı.' };
    }

    // Dosyayı oku ve parse et
    const fileContent = fs.readFileSync(fullPath, 'utf-8');
    const data = JSON.parse(fileContent);

    // Dizi mi kontrol et
    if (!Array.isArray(data)) {
      return { success: false, error: 'Dosya formatı geçersiz.' };
    }

    // Otomatik ID ekle
    const entryWithId = {
      ...newEntryData,
      id: randomUUID(),
    };

    // Yeni satırı dizinin sonuna ekle
    data.push(entryWithId);

    // Dosyayı güncelle
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf-8');

    // Sayfayı yenile
    revalidatePath(`/admin/data-files/edit/${filePath}`);
    revalidatePath('/admin/data-files');

    return { success: true, message: 'Yeni kayıt başarıyla eklendi.' };
  } catch (error) {
    console.error('createEntry hatası:', error);
    return { success: false, error: 'Kayıt ekleme işlemi sırasında bir hata oluştu.' };
  }
}
