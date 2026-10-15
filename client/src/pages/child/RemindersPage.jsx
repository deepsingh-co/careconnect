import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Button, Input, Select, Badge, EmptyState, Skeleton, Alert } from '../../components/ui';
import api from '../../services/api';
import { Pill, Plus, Trash2, Edit, Clock, History } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState('active');
  const [form, setForm] = useState({ medicineName: '', instructions: '', morningTime: '08:30', eveningTime: '20:30', recurrence: 'daily' });
  const [errors, setErrors] = useState({});

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [r, h] = await Promise.allSettled([
        api.get('/reminders'),
        api.get('/reminders/history?limit=20'),
      ]);
      setReminders(r.status === 'fulfilled' ? r.value.data.data.reminders : []);
      setHistory(h.status === 'fulfilled' ? h.value.data.data.events : []);
    } catch { toast.error('Failed to load reminders'); }
    finally { setLoading(false); }
  }

  const validate = () => {
    const e = {};
    if (!form.medicineName.trim()) e.medicineName = 'Medicine name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;
    try {
      const payload = {
        medicineName: form.medicineName,
        instructions: form.instructions,
        schedule: [
          { time: form.morningTime, label: 'Morning' },
          ...(form.eveningTime ? [{ time: form.eveningTime, label: 'Evening' }] : []),
        ],
        recurrence: form.recurrence,
        timezone: 'Asia/Kolkata',
      };
      if (editing) {
        await api.patch(`/reminders/${editing}`, payload);
        toast.success('Reminder updated');
      } else {
        await api.post('/reminders', payload);
        toast.success('Reminder created');
      }
      setShowForm(false); setEditing(null);
      setForm({ medicineName: '', instructions: '', morningTime: '08:30', eveningTime: '20:30', recurrence: 'daily' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save reminder');
    }
  }

  async function toggleReminder(r) {
    try {
      await api.patch(`/reminders/${r._id}`, { isActive: !r.isActive });
      toast.success(r.isActive ? 'Reminder disabled' : 'Reminder enabled');
      load();
    } catch { toast.error('Failed to update'); }
  }

  async function removeReminder(id) {
    if (!confirm('Delete this reminder?')) return;
    try {
      await api.patch(`/reminders/${id}`, { isActive: false });
      toast.success('Reminder deactivated');
      load();
    } catch { toast.error('Failed to delete'); }
  }

  function startEdit(r) {
    setEditing(r._id);
    setForm({
      medicineName: r.medicineName,
      instructions: r.instructions || '',
      morningTime: r.schedule?.[0]?.time || '08:30',
      eveningTime: r.schedule?.[1]?.time || '',
      recurrence: r.recurrence || 'daily',
    });
    setShowForm(true);
  }

  return (
    <DashboardLayout title="Medicine Reminders">
      <Alert type="info" className="mb-4">
        CareConnect sends reminders and tracks acknowledgement. It does not provide medical advice or dosage recommendations.
      </Alert>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'active' ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
          Active ({reminders.filter(r => r.isActive).length})
        </button>
        <button onClick={() => setTab('history')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'history' ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
          <span className="flex items-center gap-1"><History size={14} /> History</span>
        </button>
        <div className="flex-1" />
        {tab === 'active' && (
          <Button onClick={() => { setEditing(null); setShowForm(!showForm); }} size="sm">
            <Plus size={16} className="mr-1" /> New Reminder
          </Button>
        )}
      </div>

      {showForm && tab === 'active' && (
        <Card className="p-5 mb-6">
          <h3 className="font-semibold text-[#1e3a5f] mb-4">{editing ? 'Edit Reminder' : 'New Reminder'}</h3>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <Input label="Medicine Name" placeholder="e.g. Metformin 500mg" value={form.medicineName}
              onChange={(e) => setForm({ ...form, medicineName: e.target.value })} error={errors.medicineName} />
            <Input label="Instructions (from prescription)" placeholder="e.g. Take after breakfast" value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
            <Input label="Morning Time" type="time" value={form.morningTime}
              onChange={(e) => setForm({ ...form, morningTime: e.target.value })} />
            <Input label="Evening Time (optional)" type="time" value={form.eveningTime}
              onChange={(e) => setForm({ ...form, eveningTime: e.target.value })} />
            <Select label="Recurrence" value={form.recurrence} onChange={(e) => setForm({ ...form, recurrence: e.target.value })}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom</option>
            </Select>
            <div className="flex items-end gap-2">
              <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
              <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {tab === 'active' && (
        loading ? (
          <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
        ) : reminders.length ? (
          <div className="space-y-3">
            {reminders.map((r) => (
              <Card key={r._id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 shrink-0">
                  <Pill size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800">{r.medicineName}</p>
                    <Badge variant={r.isActive ? 'success' : 'default'}>{r.isActive ? 'Active' : 'Disabled'}</Badge>
                    {r.isDemo && <Badge variant="warning">Demo</Badge>}
                  </div>
                  {r.instructions && <p className="text-sm text-gray-500 mt-0.5">{r.instructions}</p>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock size={12} />
                      {r.schedule?.map(s => `${s.label}: ${s.time}`).join(' • ')}
                    </span>
                    <span>{r.recurrence}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(r)}><Edit size={16} /></Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleReminder(r)}>
                    {r.isActive ? 'Disable' : 'Enable'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => removeReminder(r._id)} className="text-red-500"><Trash2 size={16} /></Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Pill size={32} />} title="No reminders yet"
            description="Create a medicine reminder to get started."
            action={<Button onClick={() => setShowForm(true)}>Create Reminder</Button>} />
        )
      )}

      {tab === 'history' && (
        loading ? (
          <Skeleton className="h-40 w-full" />
        ) : history.length ? (
          <Card className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-medium">Medicine</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Scheduled</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Acknowledgement</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Delivery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {history.map((e) => (
                    <tr key={e._id}>
                      <td className="py-2.5 text-gray-800">{e.reminder?.medicineName || '—'}</td>
                      <td className="py-2.5 text-gray-500">{new Date(e.scheduledAt).toLocaleString('en-IN')}</td>
                      <td className="py-2.5">
                        {e.acknowledgement === 'taken' && <Badge variant="success">Taken</Badge>}
                        {e.acknowledgement === 'remind_later' && <Badge variant="warning">Remind Later</Badge>}
                        {e.acknowledgement === 'need_help' && <Badge variant="danger">Need Help</Badge>}
                        {!e.acknowledgement && <Badge variant="default">Pending</Badge>}
                      </td>
                      <td className="py-2.5">
                        <Badge variant={e.deliveryStatus === 'sent' ? 'success' : e.deliveryStatus === 'failed' ? 'danger' : 'default'}>
                          {e.deliveryStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <EmptyState icon={<History size={32} />} title="No history yet" description="Reminder events will appear here once scheduled." />
        )
      )}
    </DashboardLayout>
  );
}
