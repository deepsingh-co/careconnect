import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Button, Badge, StatusBadge, EmptyState, Skeleton, Alert, Input } from '../../components/ui';
import api from '../../services/api';
import { UtensilsCrossed, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FoodPage() {
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [m, o] = await Promise.allSettled([
        api.get('/services/menu'),
        api.get('/services/orders'),
      ]);
      setMenu(m.status === 'fulfilled' ? m.value.data.data.menu : []);
      setOrders(o.status === 'fulfilled' ? o.value.data.data.orders : []);
    } catch { toast.error('Failed to load menu'); }
    finally { setLoading(false); }
  }

  function addToCart(item) {
    setCart((prev) => {
      const existing = prev[item.id];
      return { ...prev, [item.id]: existing ? { ...existing, qty: existing.qty + 1 } : { ...item, qty: 1 } };
    });
  }

  function removeFromCart(id) {
    setCart((prev) => {
      const next = { ...prev };
      if (next[id].qty > 1) next[id] = { ...next[id], qty: next[id].qty - 1 };
      else delete next[id];
      return next;
    });
  }

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  async function placeOrder() {
    if (!address.trim()) { toast.error('Please enter a delivery address'); return; }
    setSubmitting(true);
    try {
      await api.post('/services/orders', {
        items: cartItems.map(i => ({ itemId: i.id, name: i.name, quantity: i.qty, unitPrice: i.price })),
        deliveryAddress: { line1: address },
        estimatedTotal: cartTotal,
      });
      toast.success('Order placed (demo). No real order was sent.');
      setCart({}); setShowCart(false); setAddress('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally { setSubmitting(false); }
  }

  return (
    <DashboardLayout title="Food & Grocery">
      <Alert type="demo" className="mb-4">
        DEMO MODE: This is a sample catalogue. No real order will be placed with any restaurant or delivery service.
      </Alert>

      {cartItems.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button onClick={() => setShowCart(true)} className="shadow-lg" size="lg">
            <ShoppingBag size={18} className="mr-2" />
            View Cart ({cartItems.reduce((s, i) => s + i.qty, 0)}) — ₹{cartTotal}
          </Button>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <Card className="w-full max-w-md p-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#1e3a5f]">Your Cart</h3>
              <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500">₹{item.price} × {item.qty}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-medium w-5 text-center">{item.qty}</span>
                  <button onClick={() => addToCart(item)} className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center hover:bg-teal-200">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between py-3 font-semibold text-[#1e3a5f]">
              <span>Total</span><span>₹{cartTotal}</span>
            </div>
            <Input label="Delivery Address" placeholder="House/Street, City" value={address} onChange={(e) => setAddress(e.target.value)} className="mb-3" />
            <Button onClick={placeOrder} loading={submitting} className="w-full">Place Order (Demo)</Button>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-40" />)}</div>
      ) : menu.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {menu.map((item) => (
            <Card key={item.id} className="p-4 flex flex-col">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 mb-3">
                <UtensilsCrossed size={20} />
              </div>
              <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
              <p className="text-xs text-gray-500 mt-1 flex-1">{item.description}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="font-bold text-[#1e3a5f]">₹{item.price}</span>
                <Button size="sm" onClick={() => addToCart(item)}>Add</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={<UtensilsCrossed size={32} />} title="Menu unavailable" description="The demo catalogue could not be loaded." />
      )}

      {orders.length > 0 && (
        <Card className="mt-6 p-5">
          <h3 className="font-semibold text-[#1e3a5f] mb-4">Order History</h3>
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">{o.items?.length} item(s) — ₹{o.estimatedTotal}</p>
                  <p className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={o.status} />
                  {o.isDemo && <Badge variant="warning">Demo</Badge>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}
