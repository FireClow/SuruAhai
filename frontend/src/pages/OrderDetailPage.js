import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Calendar, Clock, Phone, Star,
  CheckCircle, AlertCircle, XCircle, MessageCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getOrder, updateOrderStatus, createReview, getMitra } from '../services/api';
import { toast } from 'sonner';

const statusConfig = {
  PENDING: { color: 'warning', label: 'Menunggu Konfirmasi', step: 1 },
  CONFIRMED: { color: 'info', label: 'Dikonfirmasi', step: 2 },
  IN_PROGRESS: { color: 'info', label: 'Sedang Dikerjakan', step: 3 },
  COMPLETED: { color: 'success', label: 'Selesai', step: 4 },
  CANCELLED: { color: 'error', label: 'Dibatalkan', step: 0 }
};

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [mitra, setMitra] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadOrder = useCallback(async () => {
    try {
      const response = await getOrder(orderId);
      setOrder(response.data);
      
      if (response.data.mitra_id) {
        const mitraRes = await getMitra(response.data.mitra_id);
        setMitra(mitraRes.data);
      }
    } catch (error) {
      toast.error('Gagal memuat detail pesanan');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [orderId, navigate]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleStatusUpdate = async (status) => {
    try {
      await updateOrderStatus(orderId, status);
      toast.success(`Status pesanan diperbarui ke ${statusConfig[status].label}`);
      loadOrder();
    } catch (error) {
      toast.error('Gagal memperbarui status');
    }
  };

  const handleReviewSubmit = async () => {
    if (!review.rating) {
      toast.error('Mohon berikan rating');
      return;
    }

    setSubmitting(true);
    try {
      await createReview({
        order_id: orderId,
        rating: review.rating,
        comment: review.comment
      });
      toast.success('Ulasan berhasil dikirim!');
      setShowReview(false);
      loadOrder();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal mengirim ulasan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-slate-500">Pesanan tidak ditemukan</p>
      </div>
    );
  }

  const status = statusConfig[order.status];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              data-testid="back-btn"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-heading font-semibold text-secondary">Detail Pesanan</h1>
              <p className="text-sm text-slate-500">#{order.id?.slice(-8)}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Status Card */}
        <div className={`card p-6 border-l-4 ${
          status.color === 'success' ? 'border-l-green-500 bg-green-50' :
          status.color === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
          status.color === 'error' ? 'border-l-red-500 bg-red-50' :
          'border-l-blue-500 bg-blue-50'
        }`}>
          <div className="flex items-center gap-3">
            {status.color === 'success' && <CheckCircle className="w-6 h-6 text-green-500" />}
            {status.color === 'warning' && <AlertCircle className="w-6 h-6 text-yellow-500" />}
            {status.color === 'error' && <XCircle className="w-6 h-6 text-red-500" />}
            {status.color === 'info' && <AlertCircle className="w-6 h-6 text-blue-500" />}
            <div>
              <p className={`font-heading font-semibold ${
                status.color === 'success' ? 'text-green-700' :
                status.color === 'warning' ? 'text-yellow-700' :
                status.color === 'error' ? 'text-red-700' :
                'text-blue-700'
              }`}>
                {status.label}
              </p>
              <p className={`text-sm ${
                status.color === 'success' ? 'text-green-600' :
                status.color === 'warning' ? 'text-yellow-600' :
                status.color === 'error' ? 'text-red-600' :
                'text-blue-600'
              }`}>
                {order.status === 'PENDING' && 'Menunggu konfirmasi dari mitra'}
                {order.status === 'CONFIRMED' && 'Mitra akan datang sesuai jadwal'}
                {order.status === 'IN_PROGRESS' && 'Pekerjaan sedang berlangsung'}
                {order.status === 'COMPLETED' && 'Pekerjaan telah selesai'}
                {order.status === 'CANCELLED' && 'Pesanan telah dibatalkan'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Timeline */}
        {order.status !== 'CANCELLED' && (
          <div className="card p-6">
            <h3 className="font-heading font-semibold text-secondary mb-4">Status Pesanan</h3>
            <div className="status-timeline">
              {['Menunggu', 'Dikonfirmasi', 'Dikerjakan', 'Selesai'].map((label, index) => {
                const stepNum = index + 1;
                const isCompleted = status.step >= stepNum;
                const isActive = status.step === stepNum;
                
                return (
                  <div key={index} className={`status-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                    <div className="step-icon">
                      {isCompleted && stepNum < status.step ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-xs">{stepNum}</span>
                      )}
                    </div>
                    <span className={`text-xs ${isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Service Details */}
        <div className="card p-6">
          <h3 className="font-heading font-semibold text-secondary mb-4">Detail Layanan</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">🔧</span>
              </div>
              <div>
                <p className="font-medium text-secondary">{order.service_name}</p>
                <p className="text-sm text-slate-500">{order.service_category}</p>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="grid gap-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Tanggal:</span>
                <span className="font-medium">{order.scheduled_date}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Waktu:</span>
                <span className="font-medium">{order.scheduled_time}</span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                <span className="text-slate-500">Alamat:</span>
                <span className="font-medium">{order.address}</span>
              </div>
              {order.notes && (
                <div className="flex items-start gap-3 text-sm">
                  <MessageCircle className="w-4 h-4 text-slate-400 mt-0.5" />
                  <span className="text-slate-500">Catatan:</span>
                  <span className="font-medium">{order.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mitra Info */}
        <div className="card p-6">
          <h3 className="font-heading font-semibold text-secondary mb-4">Mitra</h3>
          <div className="flex items-center gap-4">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${order.mitra_name}`}
              alt={order.mitra_name}
              className="w-14 h-14 rounded-xl"
            />
            <div className="flex-1">
              <p className="font-medium text-secondary">{order.mitra_name}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm text-slate-600">
                  {mitra?.mitra_profile?.rating?.toFixed(1) || '0.0'}
                </span>
              </div>
            </div>
            <a 
              href={`tel:${mitra?.phone || ''}`}
              className="p-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Phone className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Payment Info */}
        <div className="card p-6">
          <h3 className="font-heading font-semibold text-secondary mb-4">Pembayaran</h3>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Total</span>
            <span className="font-heading text-2xl font-bold text-primary">
              Rp {order.total_amount?.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="mt-3 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">
              ✓ Dana disimpan di escrow - aman hingga pekerjaan selesai
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* User Actions */}
          {user?.role === 'USER' && (
            <>
              {order.status === 'COMPLETED' && !showReview && (
                <button
                  onClick={() => setShowReview(true)}
                  className="btn-primary w-full"
                  data-testid="review-btn"
                >
                  Beri Ulasan
                </button>
              )}
              {order.status === 'PENDING' && (
                <button
                  onClick={() => handleStatusUpdate('CANCELLED')}
                  className="btn-secondary w-full text-red-500 border-red-200 hover:bg-red-50"
                  data-testid="cancel-btn"
                >
                  Batalkan Pesanan
                </button>
              )}
            </>
          )}

          {/* Mitra Actions */}
          {user?.role === 'MITRA' && (
            <>
              {order.status === 'PENDING' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleStatusUpdate('CONFIRMED')}
                    className="btn-primary flex-1"
                    data-testid="confirm-btn"
                  >
                    Terima Pesanan
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('CANCELLED')}
                    className="btn-secondary flex-1 text-red-500"
                    data-testid="reject-btn"
                  >
                    Tolak
                  </button>
                </div>
              )}
              {order.status === 'CONFIRMED' && (
                <button
                  onClick={() => handleStatusUpdate('IN_PROGRESS')}
                  className="btn-primary w-full"
                  data-testid="start-btn"
                >
                  Mulai Pengerjaan
                </button>
              )}
              {order.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => handleStatusUpdate('COMPLETED')}
                  className="btn-primary w-full"
                  data-testid="complete-btn"
                >
                  Selesaikan Pesanan
                </button>
              )}
            </>
          )}
        </div>

        {/* Review Modal */}
        {showReview && (
          <div className="card p-6 animate-fade-in">
            <h3 className="font-heading font-semibold text-secondary mb-4">Beri Ulasan</h3>
            
            <div className="mb-4">
              <p className="text-sm text-slate-500 mb-2">Rating</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setReview({ ...review, rating: star })}
                    className="p-1"
                    data-testid={`star-${star}`}
                  >
                    <Star 
                      className={`w-8 h-8 transition-colors ${
                        star <= review.rating 
                          ? 'text-yellow-400 fill-yellow-400' 
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-slate-500 mb-2">Komentar (opsional)</p>
              <textarea
                value={review.comment}
                onChange={(e) => setReview({ ...review, comment: e.target.value })}
                className="input min-h-[100px] resize-none"
                placeholder="Bagikan pengalaman Anda..."
                data-testid="review-comment"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReview(false)}
                className="btn-secondary flex-1"
              >
                Batal
              </button>
              <button
                onClick={handleReviewSubmit}
                disabled={submitting}
                className="btn-primary flex-1"
                data-testid="submit-review-btn"
              >
                {submitting ? 'Mengirim...' : 'Kirim Ulasan'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailPage;
