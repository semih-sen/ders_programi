import AnatomiUploadForm from '../data-files/AnatomiUploadForm';

export const metadata = {
  title: 'Veri Yükleme Merkezi',
  description: 'Cinnasium admin veri yükleme merkezi',
};

export default function DataUploadPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <section className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h1 className="text-2xl font-bold text-white mb-2">Veri Yükleme Merkezi</h1>
          <p className="text-slate-400 text-sm">Aşağıdan Anatomi programı .docx dosyasını yükleyebilirsiniz.</p>
        </section>

        <section className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <AnatomiUploadForm />
        </section>

        <section className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-xl font-semibold text-white mb-2">Amfi Programı CSV Yükle (Yakında)</h2>
          <p className="text-slate-400 text-sm">Bu özellik daha sonra eklenecektir.</p>
        </section>
      </div>
    </div>
  );
}
