import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Badge, EmptyState, Skeleton, Alert, Input } from '../../components/ui';
import api from '../../services/api';
import { Users, Copy, Check, Link as LinkIcon, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FamilyPage() {
  const { user } = useAuth();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [inviting, setInviting] = useState(false);
  const [acceptCode, setAcceptCode] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/family');
      setLinks(res.data.data.links);
    } catch { toast.error('Failed to load family links'); }
    finally { setLoading(false); }
  }

  async function createInvitation() {
    setInviting(true);
    try {
      const res = await api.post('/family/invitations');
      setCode(res.data.data.code);
      toast.success('Invitation code created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create invitation');
    } finally { setInviting(false); }
  }

  async function acceptInvitation() {
    if (!acceptCode.trim()) { toast.error('Enter a code'); return; }
    setAccepting(true);
    try {
      await api.post('/family/invitations/accept', { code: acceptCode.trim() });
      toast.success('Invitation accepted! Family link is now active.');
      setAcceptCode('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept invitation');
    } finally { setAccepting(false); }
  }

  async function updateConsent(linkId, permissions) {
    try {
      await api.patch('/family/consent', { linkId, permissions });
      toast.success('Consent updated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update consent');
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Code copied!');
  }

  return (
    <DashboardLayout title="Family & Consent">
      <Alert type="info" className="mb-4">
        Family members can only see data you consent to share. You control what each family member can view and manage.
      </Alert>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Links */}
        <Card className="p-5">
          <h3 className="font-semibold text-[#1e3a5f] mb-4 flex items-center gap-2"><Users size={18} /> Family Members</h3>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : links.length ? (
            <div className="space-y-3">
              {links.map((link) => {
                const other = user?.role === 'parent' ? link.child : link.parent;
                return (
                  <div key={link._id} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold">
                        {other?.name?.[0] || '?'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{other?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{other?.email}</p>
                      </div>
                      <Badge variant={link.status === 'active' ? 'success' : link.status === 'pending' ? 'warning' : 'danger'}>
                        {link.status}
                      </Badge>
                    </div>
                    {link.status === 'active' && user?.role === 'parent' && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1"><Shield size={12} /> Consent Permissions</p>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {Object.entries(link.permissions || {}).map(([key, val]) => (
                            <label key={key} className="flex items-center gap-1.5 text-gray-600">
                              <input type="checkbox" checked={val} className="rounded accent-teal-600"
                                onChange={(e) => updateConsent(link._id, { [key]: e.target.checked })} />
                              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={<Users size={32} />} title="No family links yet"
              description="Create an invitation code or accept one from a family member." />
          )}
        </Card>

        {/* Invite / Accept */}
        <div className="space-y-6">
          {user?.role === 'parent' && (
            <Card className="p-5">
              <h3 className="font-semibold text-[#1e3a5f] mb-4 flex items-center gap-2"><LinkIcon size={18} /> Invite Family Member</h3>
              <p className="text-sm text-gray-500 mb-4">Generate a one-time code to share with your child or caregiver. The code expires in 48 hours.</p>
              {!code ? (
                <Button onClick={createInvitation} loading={inviting}>Generate Invitation Code</Button>
              ) : (
                <div className="bg-teal-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-teal-600 mb-2">Share this code with your family member:</p>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="text-2xl font-mono font-bold text-[#1e3a5f] tracking-wider">{code}</span>
                    <button onClick={copyCode} className="p-1.5 rounded-lg hover:bg-teal-100" aria-label="Copy code">
                      {copied ? <Check size={18} className="text-teal-600" /> : <Copy size={18} className="text-teal-600" />}
                    </button>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setCode('')}>Generate New Code</Button>
                </div>
              )}
            </Card>
          )}

          <Card className="p-5">
            <h3 className="font-semibold text-[#1e3a5f] mb-4">Accept an Invitation</h3>
            <p className="text-sm text-gray-500 mb-4">Enter the invitation code shared by your parent to link accounts.</p>
            <div className="flex gap-2">
              <Input placeholder="Enter code (e.g. A1B2C3D4E5)" value={acceptCode}
                onChange={(e) => setAcceptCode(e.target.value.toUpperCase())} className="flex-1 font-mono" />
              <Button onClick={acceptInvitation} loading={accepting}>Accept</Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
