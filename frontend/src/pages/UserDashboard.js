import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, ShoppingBag, Wallet, Bell, User, LogOut, Search,
  Sparkles, Wind, Droplets, Zap, Truck, Hammer, Star, ChevronRight,
  Clock, MapPin, Calendar, CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getServices, getCategories, getOrders, getWallet, getMitraList } from '../services/api';
import { toast } from 'sonner';

const categoryIcons = {
  cleaning: Sparkles,
  ac: Wind,
  plumbing: Droplets,
  electrical: Zap,
  moving: Truck,
  renovation: Hammer
};

const statusColors = {
  PENDING: 'badge-warning',
  CONFIRMED: 'badge-info',
  IN_PROGRESS: 'badge-info',
  COMPLETED: 'badge-success',
  CANCELLED: 'badge-error'
};

const statusLabels = {
  PENDING: 'Menunggu',
  CONFIRMED: 'Dikonfirmasi',
  IN_PROGRESS: 'Sedang Dikerjakan',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan'
};

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0 });
  const [mitras, setMitras] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [servicesRes, categoriesRes, ordersRes, walletRes, mitrasRes] = await Promise.all([
        getServices(),
        getCategories(),
        getOrders(),
        getWallet(),
        getMitraList()
      ]);
      setServices(servicesRes.data);
      setCategories(categoriesRes.data);
      setOrders(ordersRes.data);
      setWallet(walletRes.data);
      setMitras(mitrasRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logout berhasil');
  };

  const filteredServices = services.filter(s => 
    (!selectedCategory || s.category === selectedCategory) &&
    (!searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const recentOrders = orders.slice(0, 5);
  const pendingOrders = orders.filter(o => ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(o.status));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 glass border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#FF9E2C] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="font-heading font-bold text-secondary">SuruAhai</p>
                <p className="text-xs text-slate-500">Halo, {user?.name}</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6">
              {['home', 'orders', 'wallet'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:text-primary'
                  }`}
                  data-testid={`nav-${tab}`}
                >
                  {tab === 'home' && 'Beranda'}
                  {tab === 'orders' && 'Pesanan'}
                  {tab === 'wallet' && 'Wallet'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors" data-testid="notifications-btn">
                <Bell className="w-5 h-5 text-slate-600" />
                {pendingOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                    {pendingOrders.length}
                  </span>
                )}
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-red-50 text-slate-600 hover:text-red-500 transition-colors"
                data-testid="logout-btn"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Home Tab */}
        {activeTab === 'home' && (
          <div className="space-y-8 animate-fade-in">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari layanan..."
                className="input pl-12"
                data-testid="search-input"
              />
            </div>

            {/* Categories */}
            <div>
              <h2 className="font-heading font-semibold text-lg text-secondary mb-4">Kategori Layanan</h2>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {categories.map(cat => {
                  const IconComponent = categoryIcons[cat.id] || Sparkles;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        selectedCategory === cat.id
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-100 bg-white hover:border-primary/30'
                      }`}
                      data-testid={`filter-${cat.id}`}
                    >
                      <IconComponent className={`w-6 h-6 mx-auto mb-2 ${
                        selectedCategory === cat.id ? 'text-primary' : 'text-slate-500'
                      }`} />
                      <p className={`text-xs font-medium ${
                        selectedCategory === cat.id ? 'text-primary' : 'text-slate-600'
                      }`}>{cat.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Services */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold text-lg text-secondary">Layanan Tersedia</h2>
                {selectedCategory && (
                  <button 
                    onClick={() => setSelectedCategory(null)}
                    className="text-sm text-primary hover:underline"
                  >
                    Lihat Semua
                  </button>
                )}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredServices.map(service => (
                  <div key={service.id} className="card overflow-hidden" data-testid={`service-card-${service.id}`}>
                    <div className="h-40 relative">
                      <img 
                        src={service.image_url || 'https://images.pexels.com/photos/20285350/pexels-photo-20285350.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <span className="badge badge-info">{categories.find(c => c.id === service.category)?.name || service.category}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-heading font-semibold text-secondary mb-1">{service.name}</h3>
                      <p className="text-sm text-slate-500 mb-3 line-clamp-2">{service.description}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-400">Mulai dari</p>
                          <p className="font-heading font-bold text-primary">
                            Rp {service.price.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <button 
                          onClick={() => navigate(`/booking/${service.id}`)}
                          className="btn-primary py-2 px-4 text-sm"
                          data-testid={`book-service-${service.id}`}
                        >
                          Pesan
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {filteredServices.length === 0 && (
                <div className="empty-state">
                  <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Tidak ada layanan ditemukan</p>
                </div>
              )}
            </div>

            {/* Available Mitra */}
            {mitras.length > 0 && (
              <div>
                <h2 className="font-heading font-semibold text-lg text-secondary mb-4">Mitra Tersedia</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {mitras.filter(m => m.mitra_profile?.is_online).slice(0, 4).map(mitra => (
                    <div key={mitra.id} className="card p-4" data-testid={`mitra-card-${mitra.id}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <img 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${mitra.name}`}
                          alt={mitra.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <p className="font-medium text-secondary">{mitra.name}</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm text-slate-600">
                              {mitra.mitra_profile?.rating?.toFixed(1) || '0.0'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="text-xs text-green-600">Online</span>
                        {mitra.mitra_profile?.is_verified && (
                          <span className="badge badge-success ml-auto">Verified</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="font-heading font-semibold text-xl text-secondary">Pesanan Saya</h2>
            
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map(order => (
                  <div 
                    key={order.id} 
                    className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/orders/${order.id}`)}
                    data-testid={`order-card-${order.id}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-secondary">{order.service_name}</p>
                        <p className="text-sm text-slate-500">{order.mitra_name}</p>
                      </div>
                      <span className={`badge ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {order.scheduled_date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {order.scheduled_time}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <p className="font-heading font-bold text-primary">
                        Rp {order.total_amount?.toLocaleString('id-ID')}
                      </p>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state card">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Belum ada pesanan</p>
                <button 
                  onClick={() => setActiveTab('home')}
                  className="btn-primary mt-4"
                >
                  Pesan Sekarang
                </button>
              </div>
            )}
          </div>
        )}

        {/* Wallet Tab */}
        {activeTab === 'wallet' && (
          <div className="space-y-6 animate-fade-in">
            <div className="card p-6 bg-gradient-to-br from-primary to-[#FF9E2C] text-white">
              <p className="text-white/80 mb-2">Saldo Wallet</p>
              <p className="font-heading text-4xl font-bold">
                Rp {wallet.balance?.toLocaleString('id-ID') || '0'}
              </p>
              <p className="text-white/60 text-sm mt-2">
                Saldo dari refund atau kredit
              </p>
            </div>

            <div className="card p-6">
              <h3 className="font-heading font-semibold text-secondary mb-4">Tentang Wallet</h3>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p>Saldo wallet bisa digunakan untuk pembayaran pesanan</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p>Refund dari pembatalan otomatis masuk ke wallet</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p>Sistem escrow menjamin keamanan transaksi</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 md:hidden pb-safe z-50">
        <div className="flex items-center justify-around py-2">
          {[
            { id: 'home', icon: Home, label: 'Beranda' },
            { id: 'orders', icon: ShoppingBag, label: 'Pesanan' },
            { id: 'wallet', icon: Wallet, label: 'Wallet' },
            { id: 'profile', icon: User, label: 'Profil' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => item.id === 'profile' ? null : setActiveTab(item.id)}
              className={`mobile-nav-item ${activeTab === item.id ? 'active' : ''}`}
              data-testid={`mobile-nav-${item.id}`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default UserDashboard;
