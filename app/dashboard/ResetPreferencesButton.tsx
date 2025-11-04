'use client';

export default function ResetPreferencesButton() {
  const handleReset = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (confirm('Tercihlerinizi yeniden düzenlemek ister misiniz? Mevcut ayarlarınız kaybolacak.')) {
      try {
        // Reset onboarding status
        await fetch('/api/reset-onboarding', { method: 'POST' });
        window.location.reload();
      } catch (error) {
        console.error('Error resetting preferences:', error);
        alert('Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    }
  };

  return (
    <button
      onClick={handleReset}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm"
    >
      🔄 Yeniden Düzenle
    </button>
  );
}
