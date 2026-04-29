import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Calendar, Clock, Wallet,
  CheckCircle, Star, Shield, AlertCircle
} from 'lucide-react';
import { getService, getMitraList, createOrder, getWallet } from '../services/api';
import { toast } from 'sonner';
import WalletTopUpModal from '../components/WalletTopUpModal';

const formatCurrencyIDR = (amount) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount || 0);

const BookingPage = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [service, setService] = useState(null);
  const [mitras, setMitras] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0 });
  
  const [bookingData, setBookingData] = useState({
    mitra_id: '',
    scheduled_date: '',
    scheduled_time: '',
    address: '',
    notes: ''
  });

  const [selectedMitra, setSelectedMitra] = useState(null);
  const [insufficientModalOpen, setInsufficientModalOpen] = useState(false);
  const [topupModalOpen, setTopupModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const serviceRes = await getService(serviceId);
      const [mitrasRes, walletRes] = await Promise.all([
        getMitraList({ category: serviceRes.data.category, is_online: true }),
        getWallet()
      ]);
      setService(serviceRes.data);
      setMitras(mitrasRes.data);
      setWallet(walletRes.data);
    } catch (error) {
      toast.error('Gagal memuat data layanan');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [serviceId, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (step !== 3 || !service) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const w = await getWallet();
        if (!cancelled && w?.data) setWallet(w.data);
      } catch {
        //
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, service]);

  const handleMitraSelect = (mitra) => {
    setSelectedMitra(mitra);
    setBookingData({ ...bookingData, mitra_id: mitra.id });
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!bookingData.mitra_id || !bookingData.scheduled_date || !bookingData.scheduled_time || !bookingData.address) {
      toast.error('Mohon lengkapi semua data');
      return;
    }

    const price = Number(service?.price ?? 0);
    setSubmitting(true);
    try {
      const walletRes = await getWallet();
      const bal = Number(walletRes.data?.balance ?? 0);
      setWallet(walletRes.data || { balance: 0 });

      if (bal < price) {
        setInsufficientModalOpen(true);
        return;
      }

      const response = await createOrder({
        service_id: serviceId,
        mitra_id: bookingData.mitra_id,
        scheduled_date: bookingData.scheduled_date,
        scheduled_time: bookingData.scheduled_time,
        address: bookingData.address,
        notes: bookingData.notes
      });

      toast.success('Pesanan berhasil dibuat!');
      navigate(`/orders/${response.data.id}`);
    } catch (error) {
      const detail = error.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : 'Gagal membuat pesanan';
      toast.error(msg);
      if (
        typeof detail === 'string' &&
        (detail.toLowerCase().includes('tidak mencukupi') ||
          detail.toLowerCase().includes('top up'))
      ) {
        setInsufficientModalOpen(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const refreshWalletAfterTopUp = async () => {
    const w = await getWallet();
    setWallet(w.data || { balance: 0 });
  };

  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="spinner"></div>
      </div>
    );
  }

  const balanceNum = Number(wallet?.balance ?? 0);
  const totalPrice = Number(service?.price ?? 0);
  const shortfall = Math.max(0, totalPrice - balanceNum);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              data-testid="back-btn"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-heading font-semibold text-secondary">Booking</h1>
              <p className="text-sm text-slate-500">{service?.name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                step >= s 
                  ? 'bg-gradient-to-br from-primary to-[#FF9E2C] text-white' 
                  : 'bg-slate-200 text-slate-500'
              }`}>
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`flex-1 h-1 rounded-full ${step > s ? 'bg-primary' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>Pilih Mitra</span>
          <span>Jadwal & Alamat</span>
          <span>Konfirmasi</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-8">
        {/* Step 1: Select Mitra */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="font-heading font-semibold text-lg text-secondary">Pilih Mitra</h2>
            
            {mitras.length > 0 ? (
              <div className="grid gap-4">
                {mitras.map(mitra => (
                  <div 
                    key={mitra.id}
                    onClick={() => handleMitraSelect(mitra)}
                    className={`card p-4 cursor-pointer transition-all ${
                      selectedMitra?.id === mitra.id 
                        ? 'ring-2 ring-primary' 
                        : 'hover:shadow-md'
                    }`}
                    data-testid={`select-mitra-${mitra.id}`}
                  >
                    <div className="flex items-start gap-4">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${mitra.name}`}
                        alt={mitra.name}
                        className="w-16 h-16 rounded-xl"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-secondary flex items-center gap-2">
                              {mitra.name}
                              {mitra.mitra_profile?.is_verified && (
                                <Shield className="w-4 h-4 text-green-500" />
                              )}
                            </h3>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span className="text-sm font-medium">
                                {mitra.mitra_profile?.rating?.toFixed(1) || '0.0'}
                              </span>
                              <span className="text-xs text-slate-400">
                                ({mitra.mitra_profile?.total_orders || 0} pesanan)
                              </span>
                            </div>
                          </div>
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Online
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                          {mitra.mitra_profile?.description || 'Mitra profesional siap melayani Anda'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state card">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Belum ada mitra online untuk kategori ini</p>
                <p className="text-sm text-slate-400 mt-1">
                  Coba waktu lain, atau pilih layanan lain. Mitra perlu mengaktifkan keahlian yang sesuai di dashboard mereka.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Schedule & Address */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="font-heading font-semibold text-lg text-secondary">Jadwal & Alamat</h2>
            
            <div className="card p-4">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedMitra?.name}`}
                  alt={selectedMitra?.name}
                  className="w-10 h-10 rounded-lg"
                />
                <div>
                  <p className="font-medium text-secondary text-sm">{selectedMitra?.name}</p>
                  <p className="text-xs text-slate-500">Mitra terpilih</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Tanggal
                </label>
                <input
                  type="date"
                  min={getMinDate()}
                  value={bookingData.scheduled_date}
                  onChange={(e) => setBookingData({ ...bookingData, scheduled_date: e.target.value })}
                  className="input"
                  required
                  data-testid="date-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Waktu
                </label>
                <select
                  value={bookingData.scheduled_time}
                  onChange={(e) => setBookingData({ ...bookingData, scheduled_time: e.target.value })}
                  className="input"
                  required
                  data-testid="time-select"
                >
                  <option value="">Pilih waktu</option>
                  <option value="08:00">08:00</option>
                  <option value="09:00">09:00</option>
                  <option value="10:00">10:00</option>
                  <option value="11:00">11:00</option>
                  <option value="13:00">13:00</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                  <option value="16:00">16:00</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Alamat Lengkap
                </label>
                <textarea
                  value={bookingData.address}
                  onChange={(e) => setBookingData({ ...bookingData, address: e.target.value })}
                  className="input min-h-[100px] resize-none"
                  placeholder="Masukkan alamat lengkap..."
                  required
                  data-testid="address-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Catatan (opsional)
                </label>
                <textarea
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                  className="input min-h-[80px] resize-none"
                  placeholder="Catatan tambahan untuk mitra..."
                  data-testid="notes-input"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={!bookingData.scheduled_date || !bookingData.scheduled_time || !bookingData.address}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="continue-btn"
            >
              Lanjutkan
            </button>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="font-heading font-semibold text-lg text-secondary">Konfirmasi Pesanan</h2>
            
            {/* Order Summary */}
            <div className="card p-4 space-y-4">
              <div className="flex items-center gap-4">
                <img 
                  src={service?.image_url || 'https://images.pexels.com/photos/20285350/pexels-photo-20285350.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'}
                  alt={service?.name}
                  className="w-20 h-20 rounded-xl object-cover"
                />
                <div>
                  <h3 className="font-medium text-secondary">{service?.name}</h3>
                  <p className="text-sm text-slate-500">{service?.description}</p>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mitra</span>
                  <span className="font-medium">{selectedMitra?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal</span>
                  <span className="font-medium">{bookingData.scheduled_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Waktu</span>
                  <span className="font-medium">{bookingData.scheduled_time}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-500">Alamat</span>
                  <span className="font-medium text-right max-w-[200px]">{bookingData.address}</span>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="flex justify-between items-center pt-1">
                <span className="font-medium text-secondary">Total pembayaran</span>
                <span className="font-heading text-xl font-bold text-primary">
                  Rp {service?.price?.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Payment note */}
            <div className="card p-4 bg-blue-50 border-blue-100">
              <div className="flex items-start gap-3">
                <Wallet className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-blue-800">Bayar pakai saldo wallet</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Saat konfirmasi, total layanan langsung dibebankan dari saldo Anda. Dana di-hold sebagai escrow sampai pesanan selesai atau Anda membatalkan (saat tunggu konfirmasi mitra).
                  </p>
                </div>
              </div>
            </div>

            {/* Saldo terpisah — pola checkout super-app */}
            <div className="card flex items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-secondary">Saldo wallet</p>
                  <p className="text-xs text-slate-500">Saldo tersedia</p>
                </div>
              </div>
              <span className="shrink-0 font-heading text-lg font-semibold text-secondary">
                {formatCurrencyIDR(balanceNum)}
              </span>
            </div>

            {shortfall > 0 && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Saldo Anda kurang {formatCurrencyIDR(shortfall)} untuk melanjutkan. Silakan top up terlebih dahulu.
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="submit-booking-btn"
            >
              {submitting ? 'Memproses...' : 'Konfirmasi & Bayar'}
            </button>
          </div>
        )}
      </div>

      {insufficientModalOpen && (
        <div
          className="fixed inset-0 z-[55] flex items-end justify-center p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="insufficient-wallet-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Tutup"
            disabled={submitting}
            onClick={() => !submitting && setInsufficientModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
            <h2 id="insufficient-wallet-title" className="font-heading font-semibold text-lg text-secondary">
              Saldo tidak mencukupi
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Untuk pesanan ini diperlukan {formatCurrencyIDR(totalPrice)}. Saldo Anda{' '}
              {formatCurrencyIDR(balanceNum)}, sehingga Anda masih kurang{' '}
              <span className="font-semibold text-secondary">
                {formatCurrencyIDR(Math.max(0, totalPrice - balanceNum))}
              </span>
              . Silakan top up terlebih dahulu.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-xl px-4 py-2.5 font-medium text-slate-600 hover:bg-slate-50 sm:order-1"
                disabled={submitting}
                onClick={() => setInsufficientModalOpen(false)}
              >
                Kembali
              </button>
              <button
                type="button"
                className="btn-primary px-5 py-2.5 sm:order-2"
                disabled={submitting}
                onClick={() => {
                  setInsufficientModalOpen(false);
                  setTopupModalOpen(true);
                }}
              >
                Top up
              </button>
            </div>
          </div>
        </div>
      )}

      <WalletTopUpModal
        open={topupModalOpen}
        onClose={() => setTopupModalOpen(false)}
        onSuccess={refreshWalletAfterTopUp}
      />
    </div>
  );
};

export default BookingPage;
