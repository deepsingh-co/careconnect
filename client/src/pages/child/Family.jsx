import { useState } from 'react';
import { Users, Copy, Check, Link2, Shield, AlertTriangle } from 'lucide-react';
import useApi from '../../hooks/useApi';
import api from '../../services/api';
import { Card, Button, Input, Badge, Skeleton, EmptyState, Alert } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

const permissionLabels = {
  viewMedications: 'View medication reminders',
  viewBookings: 'View bookings',
  viewCheckins: 'View check-ins',
  manageBookings: 'Manage bookings',
  receiveAlerts: 'Receive emergency alerts',
};

export default function FamilyPage() {
  const { user } = useAuth();
  const family = useApi('/family');
  const [code, setCode] = useState('');
  const [invite, setInvite] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const links = family.data?.data?.links || [];
  const isParent = user?.role === 'parent';

  const createInvite = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await api.post('/family/invitations');
      setInvite(res.data.data);
      success_('Invitation created. Share this code — it expires in 48 hours.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create invitation.');
    } finally {
      setBusy(false);
    }
  };

  const acceptInvite = async () => {
    if (!code.trim()) return setError('Enter an invitation code.');
    setError('');
    setBusy(true);
    try {
      await api.post('/family/invitations/accept', { code: code.trim().toUpperCase() });
      success_('Invitation accepted. You are now linked.');
      setCode('');
      family.refetch();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept invitation.');
    } finally {
      setBusy(false);
    }
  };

  const togglePermission = async (link, key) => {
    try {
      await api.patch('/family/consent', {
        linkId: link._id,
        permissions: { [key]: !link.permissions?.[key] },
      });
      family.refetch();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update consent.');
    }
  };

  const success_ = (m) => {
    setSuccess(m);
    setTimeout(() => setSuccess(''), 4000);
  };

  const copy = (t) => {
    navigator.clipboard?.writeText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
          <Users size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Family & consent</h1>
          <p className="text-sm text-gray-500">Link family members and manage what they can see.</p>
        </div>
      </div>

      {success && <Alert type="success" className="mt-4">{success}</Alert>}
      {error && <Alert type="error" className="mt-4">{error}</Alert>}

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        {/* Invite / Accept */}
        <Card className="p-5">
          <h2 className="font-semibold text-[#1e3a5f] mb-4">
            {isParent ? 'Invite a family member' : 'Accept an invitation'}
          </h2>

          {isParent ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Generate a one-time code that expires in 48 hours. Your family member enters it to
                link their account with yours. Consent is recorded when they accept.
              </p>
              {!invite ? (
                <Button onClick={createInvite} loading={busy}>
                  <Link2 size={16} className="mr-1" /> Generate invitation code
                </Button>
              ) : (
                <div className="border border-teal-200 bg-teal-50 rounded-xl p-4">
                  <div className="text-xs text-teal-700 uppercase font-semibold tracking-wide">Invitation code</div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="text-2xl font-mono font-bold text-[#0f766e] tracking-wider">{invite.code}</div>
                    <button onClick={() => copy(invite.code)} className="p-2 rounded hover:bg-teal-100" title="Copy">
                      {copied ? <Check size={16} className="text-teal-700" /> : <Copy size={16} className="text-teal-700" />}
                    </button>
                  </div>
                  <div className="text-xs text-teal-700 mt-2">
                    Expires: {new Date(invite.expiresAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter the code shared by your parent to link accounts. You will only see data after
                they have shared consent with you.
              </p>
              <Input
                label="Invitation code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. 3F9K2QW7ZT"
                maxLength={10}
              />
              <Button onClick={acceptInvite} loading={busy}>Accept invitation</Button>
            </div>
          )}
        </Card>

        {/* Consent info */}
        <Card className="p-5 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <Shield size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900">Consent & privacy</h3>
              <ul className="text-sm text-amber-800 mt-2 space-y-1.5 list-disc list-inside">
                <li>Family members only see data after an active, consented link.</li>
                <li>Parents control which permissions each caregiver receives.</li>
                <li>Providers never see a full address before accepting an assignment.</li>
                <li>All link changes are recorded for audit purposes.</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Links */}
      <Card className="p-5 mt-6">
        <h2 className="font-semibold text-[#1e3a5f] mb-4">Linked family members</h2>
        {family.loading ? (
          <Skeleton className="h-32" />
        ) : links.length === 0 ? (
          <EmptyState
            icon={<Users size={40} />}
            title="No family links yet"
            description={isParent ? 'Create an invitation code to get started.' : 'Ask your parent to share an invitation code.'}
            action={isParent ? <Button onClick={createInvite} loading={busy}>Generate code</Button> : null}
          />
        ) : (
          <div className="space-y-4">
            {links.map((l) => {
              const other = isParent ? l.child : l.parent;
              return (
                <div key={l._id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center font-semibold shrink-0">
                        {other?.name?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{other?.name}</div>
                        <div className="text-sm text-gray-500 truncate">{other?.email}</div>
                      </div>
                    </div>
                    <Badge variant={l.status === 'active' ? 'success' : l.status === 'pending' ? 'warning' : 'danger'}>
                      {l.status === 'active' ? 'Active link' : l.status === 'pending' ? 'Pending' : 'Revoked'}
                    </Badge>
                  </div>

                  {l.status === 'active' && isParent && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Consent permissions
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {Object.entries(permissionLabels).map(([key, label]) => (
                          <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={l.permissions?.[key] ?? false}
                              onChange={() => togglePermission(l, key)}
                              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {l.consentGivenAt && (
                    <div className="text-xs text-gray-400 mt-3">
                      Consent recorded: {new Date(l.consentGivenAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
