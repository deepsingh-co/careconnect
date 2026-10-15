import { useState } from 'react';
import { ShoppingBasket, Plus, Minus, Trash2, X } from 'lucide-react';
import useApi from '../../hooks/useApi';
import api from '../../services/api';
import {
  Card, Button, Badge, StatusBadge, Skeleton, EmptyState, Alert, Input,
} from '../../components/ui';

export default function FoodOrders() {
  const menu = useApi('/services/menu');
  const orders = useApi('/services/orders');

  const [cart, setCart] = useState({});
  const [showCart, setShowCart] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [address, setAddress] = useState('');
  const [instructions, setInstructions] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const items = menu.data?.data?.menu || [];
  const orderList = orders.data?.data?.orders || [];

  const add = (id) => setCart({ ...cart, [id]: (cart[id] || 0) + 1 });
  const remove = (id) => {
    const next = { ...cart };
    if (next[id] > 1) next[id] -= 1;
    else delete next[id];
    setCart(next);
  };

  const cartItems = items
    .filter((i) => cart[i.id])
    .map((i) => ({ ...i, quantity: cart[i.id] }));
  const total = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const review = () => {
    if (cartCount === 0) return setError('Add at least one item.');
    if (!address.trim()) return setError('Delivery address is required.');
    setError('');
    setShowSummary(true);
  };

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      await api.post('/services/orders', {
        items: cartItems.map((i) => ({
          itemId: i.id, name: i.name, quantity: i.quantity, unitPrice: i.price,
        })),
        deliveryAddress: { line1: address, city: 'Jaipur', pincode: '' },
        specialInstructions: instructions,
        estimatedTotal: total,
      });
      setSuccess('Order placed in demo mode — no real restaurant or delivery service was contacted.');
      setCart({});
      setAddress('');
      setInstructions('');
      setShowSummary(false);
      setShowCart(false);
      orders.refetch();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order.');
      setShowSummary(false);
    } finally {
      setSaving(false);
    }
  };

  const cancelOrder = async (o) => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await api.patch(`/services/orders/${o._id}/cancel`).catch(() => {});
      setSuccess('Order cancelled.');
      orders.refetch();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to cancel order.');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Food & grocery requests</h1>
          <p className="text-sm text-gray-500 mt-1">Choose items for home delivery.</p>
        </div>
        <Button onClick={() => setShowCart(!showCart)}>
          <ShoppingBasket size={16} className="mr-1" /> Cart ({cartCount})
        </Button>
      </div>

      <Alert type="demo" className="mt-4">
        <strong>DEMO MODE:</strong> {menu.data?.data?.notice ||
          'This is a fictional demo catalogue. No real order will be placed with any restaurant or delivery service.'}
      </Alert>

      {success && <Alert type="success" className="mt-4">{success}</Alert>}
      {error && !showSummary && <Alert type="error" className="mt-4">{error}</Alert>}

      {/* Cart panel */}
      {showCart && (
        <Card className="p-5 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#1e3a5f]">Your cart</h2>
            <button onClick={() => setShowCart(false)} className="text-gray-400"><X size={18} /></button>
          </div>
          {cartCount === 0 ? (
            <EmptyState icon={<ShoppingBasket size={36} />} title="Cart is empty" description="Add items from the menu below." />
          ) : (
            <>
              <div className="space-y-3">
                {cartItems.map((i) => (
                  <div key={i.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{i.name}</div>
                      <div className="text-xs text-gray-500">₹{i.price} each</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => remove(i.id)} className="p-1.5 border rounded hover:bg-gray-50"><Minus size={14} /></button>
                      <span className="text-sm font-medium w-5 text-center">{i.quantity}</span>
                      <button onClick={() => add(i.id)} className="p-1.5 border rounded hover:bg-gray-50"><Plus size={14} /></button>
                      <span className="text-sm font-semibold w-16 text-right">₹{i.price * i.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t pt-4">
                <Input label="Delivery address *" value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House no., street, area, city" />
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special instructions</label>
                  <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows={2}
                    placeholder="e.g. Less spice, call on arrival" />
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="text-lg font-bold text-[#1e3a5f]">Total: ₹{total}</div>
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setShowCart(false)}>Keep browsing</Button>
                    <Button onClick={review}>Review order</Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Order summary */}
      {showSummary && (
        <Card className="p-5 mt-4 border-teal-300">
          <h2 className="font-semibold text-[#1e3a5f] mb-3">Confirm your order</h2>
          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
            {cartItems.map((i) => (
              <div key={i.id} className="flex justify-between">
                <span>{i.name} × {i.quantity}</span>
                <span>₹{i.price * i.quantity}</span>
              </div>
            ))}
            <div className="flex justify-between border-t pt-2 mt-2 font-bold">
              <span>Total</span><span>₹{total}</span>
            </div>
            <div className="pt-2 text-gray-600"><strong>Deliver to:</strong> {address}</div>
            {instructions && <div className="text-gray-600"><strong>Notes:</strong> {instructions}</div>}
          </div>
          <Alert type="warning" className="mt-4">
            This creates a demo order record only. No restaurant or delivery partner is contacted
            in demo mode.
          </Alert>
          <div className="mt-4 flex gap-3">
            <Button onClick={submit} loading={saving}>Place demo order</Button>
            <Button variant="secondary" onClick={() => setShowSummary(false)}>Go back</Button>
          </div>
        </Card>
      )}

      {/* Menu */}
      <div className="mt-6">
        <h2 className="font-semibold text-[#1e3a5f] mb-4">Menu</h2>
        {menu.loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((i) => (
              <div key={i.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{i.name}</div>
                    <div className="text-xs text-gray-500 capitalize mt-0.5">{i.category}</div>
                  </div>
                  <div className="font-bold text-[#1e3a5f]">₹{i.price}</div>
                </div>
                <p className="text-xs text-gray-500 mt-2">{i.description}</p>
                <div className="flex items-center justify-between mt-3">
                  {cart[i.id] ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => remove(i.id)} className="p-1.5 border rounded hover:bg-gray-50"><Minus size={14} /></button>
                      <span className="text-sm font-medium">{cart[i.id]}</span>
                      <button onClick={() => add(i.id)} className="p-1.5 border rounded hover:bg-gray-50"><Plus size={14} /></button>
                    </div>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => add(i.id)}>
                      <Plus size={14} className="mr-1" /> Add
                    </Button>
                  )}
                  <Badge variant="default">Demo item</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order history */}
      <Card className="p-5 mt-6">
        <h2 className="font-semibold text-[#1e3a5f] mb-4">Order history</h2>
        {orders.loading ? (
          <Skeleton className="h-32" />
        ) : orderList.length === 0 ? (
          <EmptyState icon={<ShoppingBasket size={36} />} title="No orders yet" description="Orders you place will appear here." />
        ) : (
          <div className="space-y-3">
            {orderList.map((o) => (
              <div key={o._id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">
                        {o.items?.length} item{o.items?.length !== 1 ? 's' : ''}
                      </span>
                      <StatusBadge status={o.status} />
                      {o.isDemo && <Badge variant="warning">Demo</Badge>}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {o.items?.map((i) => `${i.name} × ${i.quantity}`).join(', ')}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(o.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} IST
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="font-semibold text-[#1e3a5f]">₹{o.estimatedTotal}</div>
                    {['placed', 'preparing'].includes(o.status) && (
                      <Button size="sm" variant="secondary" onClick={() => cancelOrder(o)}>Cancel</Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
