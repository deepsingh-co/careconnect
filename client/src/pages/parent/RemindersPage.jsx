import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { Card, Badge, StatusBadge, EmptyState, Button, Alert } from '../../components/ui';
import {
  Pill, Clock, CheckCircle, XCircle, AlertCircle, Loader2,
  Check, Clock as ClockIcon, HelpCircle
} from 'lucide-react';
import { format, parseISO, isToday } from 'date-fns';

export default function ParentRemindersPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [remindersRes, historyRes] = await Promise.allSettled([
        api.get('/reminders'),
        api.get('/reminders/history?limit=50'),
      ]);
      if (remindersRes.status === 'fulfilled') setReminders(remindersRes.value.data.data.reminders || []);
      if (historyRes.status === 'fulfilled') setHistory(historyRes.value.data.data.events || []);
    } catch (err) {
      toast.error('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  const acknowledge = async (eventId, acknowledgement) => {
    try {
      await api.post(`/reminders/events/${eventId}/acknowledge`, { acknowledgement });
      toast.success(acknowledgement === 'taken' ? 'Marked as taken!' : acknowledgement === 'remind_later' ? 'Will remind in 30 minutes' : 'Family notified!');
      fetchData();
    } catch (err) {
      toast.error('Failed to acknowledge');
    }
  };

  const getTodaysEvents = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return reminders.flatMap(reminder =>
      reminder.schedule.map(s => ({
        reminder,
        time: s.time,
        label: s.label,
        event: history.find(h => h.reminder === reminder._id && h.scheduledAt.startsWith(today.toISOString().split('T')[0]) && h.scheduledAt.includes(s.time))
      }))
    ).filter(item => {
      const eventDate = item.event ? parseISO(item.event.scheduledAt) : null;
      return eventDate && isToday(eventDate);
    });
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const events = [];
    reminders.forEach(reminder => {
      reminder.schedule.forEach(s => {
        const historyEvent = history.find(h => h.reminder === reminder._id && h.scheduledAt.includes(s.time));
        if (historyEvent) {
          const eventDate = parseISO(historyEvent.scheduledAt);
          if (eventDate >= today && eventDate <= nextWeek) {
            events.push({ reminder, schedule: s, event: historyEvent });
          }
        }
      });
    });
    return events.sort((a, b) => new Date(a.event.scheduledAt) - new Date(b.event.scheduledAt));
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 animate-pulse bg-gray-200 rounded-xl" />)}</div>;

  const todaysEvents = getTodaysEvents();
  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">My Medications</h1>
        <p className="text-gray-600">View and acknowledge your medication reminders.</p>
      </div>

      {/* Today's Medications */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Today</h2>
        {todaysEvents.length === 0 ? (
          <EmptyState
            icon={<Pill className="w-12 h-12" />}
            title="No medications scheduled for today"
            description="Your reminders will appear here when scheduled."
          />
        ) : (
          <div className="space-y-3">
            {todaysEvents.map(({ reminder, time, label, event }) => (
              <div key={`${reminder._id}-${time}`} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                      <Pill className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{reminder.medicineName}</h3>
                      <p className="text-sm text-gray-500">{time} {label ? `(${label})` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {event && event.acknowledgement ? (
                      <Badge variant={
                        event.acknowledgement === 'taken' ? 'success' :
                        event.acknowledgement === 'need_help' ? 'danger' : 'warning'
                      }>
                        {event.acknowledgement === 'taken' ? 'Taken' : event.acknowledgement === 'remind_later' ? 'Remind Later' : 'Need Help'}
                      </Badge>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" variant="success" onClick={() => acknowledge(event?._id || 'new', 'taken')}>
                          <Check className="w-4 h-4 mr-1" /> Taken
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => acknowledge(event?._id || 'new', 'remind_later')}>
                          <ClockIcon className="w-4 h-4 mr-1" /> Later
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => acknowledge(event?._id || 'new', 'need_help')}>
                          <HelpCircle className="w-4 h-4 mr-1" /> Help
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Upcoming This Week */}
      {upcomingEvents.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming This Week</h2>
          <div className="space-y-3">
            {upcomingEvents.map(({ reminder, schedule, event }) => (
              <div key={`${reminder._id}-${schedule.time}-${event.scheduledAt}`} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                    <Pill className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{reminder.medicineName}</p>
                    <p className="text-sm text-gray-500">
                      {format(parseISO(event.scheduledAt), 'EEE, MMM d')} at {schedule.time} {schedule.label ? `(${schedule.label})` : ''}
                    </p>
                  </div>
                </div>
                <Badge variant={event.acknowledgement ? 'success' : 'default'}>
                  {event.acknowledgement ? event.acknowledgement : 'Pending'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* All Reminders */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Medication Reminders</h2>
        {reminders.length === 0 ? (
          <EmptyState
            icon={<Pill className="w-12 h-12" />}
            title="No reminders set up"
            description="Your family members can set up medication reminders for you."
          />
        ) : (
          <div className="space-y-4">
            {reminders.map(reminder => (
              <div key={reminder._id} className={`p-4 rounded-lg ${!reminder.isActive ? 'opacity-60 bg-gray-50' : 'bg-white border border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                      <Pill className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{reminder.medicineName}</h3>
                        <StatusBadge status={reminder.isActive ? 'active' : 'cancelled'} />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {reminder.schedule.map(s => `${s.time} ${s.label ? `(${s.label})` : ''}`).join(' • ')}
                        • {reminder.recurrence}
                      </p>
                    </div>
                  </div>
                  {!reminder.isActive && (
                    <Badge variant="default">Inactive</Badge>
                  )}
                </div>
                {reminder.instructions && (
                  <p className="text-sm text-gray-600 mt-3 ml-15">{reminder.instructions}</p>
                )}
              </div>
            ))}
          </div>
        </Card>

      {/* History */}
      <details className="group">
        <summary className="flex items-center gap-2 text-teal-600 hover:text-teal-700 cursor-pointer p-3 bg-teal-50 rounded-lg">
          <Clock className="w-5 h-5 group-open:rotate-90 transition-transform" />
          <span className="font-medium">Show Acknowledgement History</span>
        </summary>
        <Card className="mt-3">
          {history.length === 0 ? (
            <EmptyState
              icon={<Clock className="w-12 h-12" />}
              title="No history yet"
              description="Acknowledgement history will appear here."
            />
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.slice(0, 30).map(event => (
                <div key={event._id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                      <Pill className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{event.reminder?.medicineName || 'Medication'}</p>
                      <p className="text-xs text-gray-500">{format(parseISO(event.scheduledAt), 'MMM d, yyyy HH:mm')}</p>
                    </div>
                  </div>
                  <Badge variant={
                    event.acknowledgement === 'taken' ? 'success' :
                    event.acknowledgement === 'need_help' ? 'danger' :
                    event.acknowledgement === 'remind_later' ? 'warning' :
                    event.acknowledgement === 'missed' ? 'danger' : 'default'
                  }>
                    {event.acknowledgement || 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </details>
    </div>
  );
}