import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, Eye, EyeOff, ArrowLeft, User, Briefcase } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: searchParams.get('role') === 'mitra' ? 'MITRA' : 'USER'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Password tidak cocok!');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password minimal 6 karakter!');
      return;
    }

    setLoading(true);
    
    try {
      const user = await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role
      });
      
      toast.success('Registrasi berhasil!');
      
      if (user.role === 'MITRA') {
        navigate('/mitra');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registrasi gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Link>

          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#FF9E2C] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-secondary">SuruAhai</span>
          </div>

          <h1 className="font-heading text-3xl font-bold text-secondary mb-2">Buat Akun</h1>
          <p className="text-slate-500 mb-8">Daftar untuk mulai menggunakan SuruAhai</p>

          {/* Role Selection */}
          <div className="flex gap-3 mb-6">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'USER' })}
              data-testid="role-user-btn"
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                formData.role === 'USER' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <User className={`w-6 h-6 mx-auto mb-2 ${formData.role === 'USER' ? 'text-primary' : 'text-slate-400'}`} />
              <p className={`font-medium text-sm ${formData.role === 'USER' ? 'text-primary' : 'text-slate-600'}`}>
                Pengguna
              </p>
              <p className="text-xs text-slate-400 mt-1">Cari jasa rumah tangga</p>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'MITRA' })}
              data-testid="role-mitra-btn"
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                formData.role === 'MITRA' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Briefcase className={`w-6 h-6 mx-auto mb-2 ${formData.role === 'MITRA' ? 'text-primary' : 'text-slate-400'}`} />
              <p className={`font-medium text-sm ${formData.role === 'MITRA' ? 'text-primary' : 'text-slate-600'}`}>
                Mitra
              </p>
              <p className="text-xs text-slate-400 mt-1">Tawarkan jasa Anda</p>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nama Lengkap</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="Masukkan nama lengkap"
                required
                data-testid="register-name-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                placeholder="nama@email.com"
                required
                data-testid="register-email-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nomor Telepon</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
                placeholder="08xxxxxxxxxx"
                required
                data-testid="register-phone-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input pr-10"
                  placeholder="Minimal 6 karakter"
                  required
                  data-testid="register-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Konfirmasi Password</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="input"
                placeholder="Ulangi password"
                required
                data-testid="register-confirm-password-input"
              />
            </div>

            <div className="flex items-start gap-2">
              <input 
                type="checkbox" 
                required
                className="w-4 h-4 mt-1 rounded border-slate-300 text-primary focus:ring-primary" 
                data-testid="terms-checkbox"
              />
              <span className="text-sm text-slate-600">
                Saya setuju dengan{' '}
                <a href="#" className="text-primary hover:underline">Syarat & Ketentuan</a>
                {' '}dan{' '}
                <a href="#" className="text-primary hover:underline">Kebijakan Privasi</a>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              data-testid="register-submit-btn"
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Memproses...' : 'Daftar'}
            </button>
          </form>

          <p className="text-center mt-6 text-slate-500">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline" data-testid="login-link">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img 
          src="https://images.pexels.com/photos/5463581/pexels-photo-5463581.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
          alt="AC repair service"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/80 to-primary/80" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center text-white">
            <h2 className="font-heading text-3xl font-bold mb-4">
              {formData.role === 'MITRA' ? 'Bergabung sebagai Mitra' : 'Bergabung dengan Kami'}
            </h2>
            <p className="text-white/80 max-w-md">
              {formData.role === 'MITRA' 
                ? 'Dapatkan penghasilan tambahan dengan menawarkan keahlian Anda. Jadwal fleksibel, bayaran kompetitif.'
                : 'Nikmati kemudahan mencari mitra profesional untuk berbagai kebutuhan rumah tangga Anda.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
