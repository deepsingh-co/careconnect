import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { Card, Badge, EmptyState, Button, Input, Alert } from '../../components/ui';
import {
  User, Pill, Heart, Clock, MapPin, Phone, Shield,
  Save, Loader2, Edit, AlertCircle, CheckCircle, XCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function ParentProfilePage() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    preferredLanguage: user?.preferredLanguage || 'en',
    address: { line1: '', line2: '', city: '', state: '', pincode: '' },
    emergencyContacts: [{ name: '', phone: '', relationship: '', isPrimary: true }],
    reminderPreferences: {
      morningCheckIn: '08:00',
      eveningCheckIn: '19:00',
      timezone: 'Asia/Kolkata',
      wantsWhatsappReminders: true,
    },
    notificationSettings: {
      notifyFamilyOnMissedCheckin: true,
      notifyFamilyOnEmergency: true,
      notifyFamilyOnBooking: true,
      checkInGracePeriodMinutes: 30,
    },
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // In real app, there would be a /parent/profile endpoint
      // For now, we'll use mock data structure
      setLoading(false);
    } catch (err) {
      toast.error('Failed to load profile');
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/auth/profile', {
        name: profile.name,
        phone: profile.phone,
        preferredLanguage: profile.preferredLanguage,
      });
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const addEmergencyContact = () => {
    setProfile(prev => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, { name: '', phone: '', relationship: '', isPrimary: false }],
    }));
  };

  const removeEmergencyContact = (index) => {
    if (profile.emergencyContacts.length <= 1) return;
    setProfile(prev => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.filter((_, i) => i !== index),
    }));
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 animate-pulse bg-gray-200 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">My Profile</h1>
        <p className="text-gray-600">Manage your personal information and preferences.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Info */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" /> Personal Information
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              name="name"
              value={profile.name}
              onChange={e => setProfile({...profile, name: e.target.value})}
              required
            />
            <Input
              label="Phone Number"
              type="tel"
              name="phone"
              value={profile.phone}
              onChange={e => setProfile({...profile, phone: e.target.value})}
              placeholder="+91 98765 43210"
            />
            <Input
              label="Preferred Language"
              type="select"
              name="preferredLanguage"
              value={profile.preferredLanguage}
              onChange={e => setProfile({...profile, preferredLanguage: e.target.value})}
              options={[
                { value: 'en', label: 'English' },
                { value: 'hi', label: 'Hindi' },
                { value: 'hinglish', label: 'Hinglish' },
              ]}
            />
          </div>
        </Card>

        {/* Address */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" /> Service Address
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Address Line 1"
              name="address.line1"
              value={profile.address.line1}
              onChange={e => setProfile({...profile, address: {...profile.address, line1: e.target.value}})}
              placeholder="House/Building, Street"
            />
            <Input
              label="Address Line 2 (optional)"
              name="address.line2"
              value={profile.address.line2}
              onChange={e => setProfile({...profile, address: {...profile.address, line2: e.target.value}})}
              placeholder="Landmark, Area"
            />
            <Input
              label="City"
              name="address.city"
              value={profile.address.city}
              onChange={e => setProfile({...profile, address: {...profile.address, city: e.target.value}})}
            />
            <Input
              label="State"
              name="address.state"
              value={profile.address.state}
              onChange={e => setProfile({...profile, address: {...profile.address, state: e.target.value}})}
            />
            <Input
              label="Pincode"
              name="address.pincode"
              value={profile.address.pincode}
              onChange={e => setProfile({...profile, address: {...profile.address, pincode: e.target.value}})}
              placeholder="6-digit pincode"
            />
          </div>
        </Card>

        {/* Emergency Contacts */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5" /> Emergency Contacts
            </h2>
            <Button variant="secondary" size="sm" type="button" onClick={addEmergencyContact}>
              <span className="text-lg">+</span> Add Contact
            </Button>
          </div>
          <div className="space-y-4">
            {profile.emergencyContacts.map((contact, index) => (
              <div key={index} className="grid md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <Input
                  label="Name"
                  name={`emergencyContacts[${index}].name`}
                  value={contact.name}
                  onChange={e => setProfile(prev => ({
                    ...prev,
                    emergencyContacts: prev.emergencyContacts.map((c, i) => i === index ? {...c, name: e.target.value} : c)
                  }))}
                />
                <Input
                  label="Phone"
                  type="tel"
                  name={`emergencyContacts[${index}].phone`}
                  value={contact.phone}
                  onChange={e => setProfile(prev => ({
                    ...prev,
                    emergencyContacts: prev.emergencyContacts.map((c, i) => i === index ? {...c, phone: e.target.value} : c)
                  }))}
                  placeholder="+91 98765 43210"
                />
                <Input
                  label="Relationship"
                  name={`emergencyContacts[${index}].relationship`}
                  value={contact.relationship}
                  onChange={e => setProfile(prev => ({
                    ...prev,
                    emergencyContacts: prev.emergencyContacts.map((c, i) => i === index ? {...c, relationship: e.target.value} : c)
                  }))}
                  placeholder="Son, Daughter, Doctor, etc."
                />
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contact.isPrimary}
                      onChange={e => setProfile(prev => ({
                        ...prev,
                        emergencyContacts: prev.emergencyContacts.map((c, i) =>
                          i === index ? {...c, isPrimary: e.target.checked}
                          : i !== index && e.target.checked ? {...c, isPrimary: false} : c)
                      }))}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm">Primary</span>
                  </label>
                  {profile.emergencyContacts.length > 1 && (
                    <Button variant="ghost" size="sm" type="button" onClick={() => removeEmergencyContact(index)}>
                      <XCircle className="w-4 h-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Reminder Preferences */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" /> Reminder Preferences
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Input
              label="Morning Check-in"
              type="time"
              name="reminderPreferences.morningCheckIn"
              value={profile.reminderPreferences.morningCheckIn}
              onChange={e => setProfile({...profile, reminderPreferences: {...profile.reminderPreferences, morningCheckIn: e.target.value}})}
            />
            <Input
              label="Evening Check-in"
              type="time"
              name="reminderPreferences.eveningCheckIn"
              value={profile.reminderPreferences.eveningCheckIn}
              onChange={e => setProfile({...profile, reminderPreferences: {...profile.reminderPreferences, eveningCheckIn: e.target.value}})}
            />
            <Input
              label="Timezone"
              type="select"
              name="reminderPreferences.timezone"
              value={profile.reminderPreferences.timezone}
              onChange={e => setProfile({...profile, reminderPreferences: {...profile.reminderPreferences, timezone: e.target.value}})}
              options={[
                { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
                { value: 'UTC', label: 'UTC' },
              ]}
            />
          </div>
          <label className="flex items-center gap-2 mt-4 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.reminderPreferences.wantsWhatsappReminders}
              onChange={e => setProfile({...profile, reminderPreferences: {...profile.reminderPreferences, wantsWhatsappReminders: e.target.checked}})}
              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
            />
            <span>Receive reminders via WhatsApp</span>
          </label>
        </Card>

        {/* Notification Settings */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" /> Family Notification Settings
          </h2>
          <div className="space-y-3">
            {[
              { key: 'notifyFamilyOnMissedCheckin', label: 'Notify family on missed check-in' },
              { key: 'notifyFamilyOnEmergency', label: 'Notify family on emergency alert' },
              { key: 'notifyFamilyOnBooking', label: 'Notify family on new booking' },
            ].map(item => (
              <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.notificationSettings[item.key]}
                  onChange={e => setProfile({...profile, notificationSettings: {...profile.notificationSettings, [item.key]: e.target.checked}})}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <span className="text-gray-700">{item.label}</span>
              </label>
            ))}
            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
              <Input
                label="Check-in Grace Period (minutes)"
                type="number"
                min="5"
                max="120"
                name="notificationSettings.checkInGracePeriodMinutes"
                value={profile.notificationSettings.checkInGracePeriodMinutes}
                onChange={e => setProfile({...profile, notificationSettings: {...profile.notificationSettings, checkInGracePeriodMinutes: parseInt(e.target.value) || 30}})}
              />
            </div>
          </div>
        </Card>

        <div className="flex gap-3 pt-4">
          <Button type="submit" loading={saving} className="flex-1">
            <Save className="w-4 h-4 mr-2" /> Save Changes
          </Button>
        </div>
      </form>

      <Card className="border-amber-200 bg-amber-50">
        <Alert type="warning">
          <strong>Note:</strong> This is a demo profile. In production, this data would be persisted to the database
          and used for WhatsApp messaging, emergency alerts, and service coordination.
        </Alert>
      </Card>
    </div>
  );
}