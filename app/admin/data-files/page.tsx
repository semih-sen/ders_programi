import AnatomiUploadForm from './AnatomiUploadForm';

export const metadata = {
  title: 'Admin - Veri Dosyaları',
  description: 'Anatomi grupları .docx yükleme sayfası',
};

export default function DataFilesPage() {
  // Admin layout already enforces ADMIN session; no need to repeat here.
  return <AnatomiUploadForm />;
}
