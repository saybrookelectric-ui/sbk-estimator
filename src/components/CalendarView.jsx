import { useState, useEffect, useCallback } from 'react';

// ── Google Calendar API via Anthropic MCP proxy ──────────────────────────────
// Uses the Anthropic API with Google Calendar MCP server
const CALENDAR_MCP_URL = 'https://calendarmcp.googleapis.com/mcp/v1';

async function callCalendarAPI(prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: 'You are a Google Calendar assistant. Always respond with valid JSON only, no markdown, no explanation. Use ISO 8601 dates.',
      messages: [{ role: 'user', content: prompt }],
      mcp_servers: [{ type: 'url', url: CALENDAR_MCP_URL, name: 'google-calendar' }],
    }),
  });
  const data = await response.json();
  const text = data.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '';
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return { raw: text };
  }
}

// ── Color helpers ─────────────────────────────────────────────────────────────
const EVENT_COLORS = [
  '#f59e0b','#22c55e','#3b82f6','#ec4899','#8b5cf6','#f97316','#06b6d4','#84cc16',
];

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
}

function formatTime(iso) {
  if (!iso) return 'All day';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' });
}

function isToday(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

function isSameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

// Group events by date
function groupByDate(events) {
  const groups = {};
  events.forEach(ev => {
    const dateKey = (ev.start?.dateTime || ev.start?.date || '').split('T')[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(ev);
  });
  return Object.entries(groups).sort(([a],[b]) => a.localeCompare(b));
}

// ── Schedule Job Modal ────────────────────────────────────────────────────────
function ScheduleJobModal({ jobs, onSchedule, onClose }) {
  const [selectedJob, setSelectedJob] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const activeJobs = jobs.filter(j => !['complete','declined'].includes(j.status));

  const handleSchedule = async () => {
    if (!selectedJob || !date) return;
    setSaving(true);
    const job = jobs.find(j => j.id === selectedJob);
    const startISO = `${date}T${startTime}:00`;
    const endISO = `${date}T${endTime}:00`;
    await onSchedule({
      title: `⚡ ${job?.customerName || 'Job'} — ${job?.scopeTitle || job?.jobType || 'Electrical'}`,
      start: startISO,
      end: endISO,
      location: job?.jobAddress || '',
      description: [
        job?.notes ? `Notes: ${job.notes}` : '',
        job?.customerPhone ? `Phone: ${job.customerPhone}` : '',
        notes,
      ].filter(Boolean).join('\n'),
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold">Schedule a Job</h3>
          <button onClick={onClose} className="text-[#444] hover:text-white text-lg">✕</button>
        </div>

        <div>
          <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">Select Job</label>
          <select
            value={selectedJob}
            onChange={e => setSelectedJob(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#f59e0b]"
          >
            <option value="">Choose a job...</option>
            {activeJobs.map(j => (
              <option key={j.id} value={j.id}>
                {j.customerName || 'No name'} — {j.scopeTitle || j.jobType || 'Job'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#f59e0b]" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">Start Time</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#f59e0b]" />
          </div>
          <div>
            <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">End Time</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#f59e0b]" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">Additional Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            placeholder="Crew needed, special instructions..."
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#f59e0b] resize-none" />
        </div>

        <button
          onClick={handleSchedule}
          disabled={!selectedJob || !date || saving}
          className="w-full bg-[#f59e0b] disabled:opacity-40 text-black font-black py-3 rounded-lg text-sm"
        >
          {saving ? 'Scheduling...' : '📅 Add to Google Calendar'}
        </button>
      </div>
    </div>
  );
}

// ── New Event Modal ───────────────────────────────────────────────────────────
function NewEventModal({ onSave, onClose }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [allDay, setAllDay] = useState(false);

  const handleSave = async () => {
    if (!title || !date) return;
    setSaving(true);
    await onSave({
      title,
      start: allDay ? date : `${date}T${startTime}:00`,
      end: allDay ? date : `${date}T${endTime}:00`,
      allDay,
      location,
      description: notes,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold">New Calendar Event</h3>
          <button onClick={onClose} className="text-[#444] hover:text-white text-lg">✕</button>
        </div>

        <div>
          <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title"
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#f59e0b]" />
        </div>

        <div>
          <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#f59e0b]" />
        </div>

        <button onClick={() => setAllDay(!allDay)}
          className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${allDay ? 'border-[#f59e0b] bg-[#f59e0b]/10 text-[#f59e0b]' : 'border-[#1a1a1a] text-[#555]'}`}>
          {allDay ? '✓ All Day Event' : '○ All Day Event'}
        </button>

        {!allDay && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">Start</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#f59e0b]" />
            </div>
            <div>
              <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">End</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#f59e0b]" />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">Location</label>
          <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Address or location"
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#f59e0b]" />
        </div>

        <div>
          <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Optional notes"
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#f59e0b] resize-none" />
        </div>

        <button onClick={handleSave} disabled={!title || !date || saving}
          className="w-full bg-[#f59e0b] disabled:opacity-40 text-black font-black py-3 rounded-lg text-sm">
          {saving ? 'Saving...' : '📅 Create Event'}
        </button>
      </div>
    </div>
  );
}

// ── Main Calendar Component ───────────────────────────────────────────────────
export default function CalendarView({ jobs }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [view, setView] = useState('upcoming'); // upcoming | week | month

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const thirtyDays = new Date(Date.now() + 30 * 86400000).toISOString();
      const result = await callCalendarAPI(
        `List all calendar events from ${now} to ${thirtyDays}. Return JSON array: [{id, summary, start:{dateTime or date}, end:{dateTime or date}, location, description, colorId}]. If no events return [].`
      );
      const evArr = Array.isArray(result) ? result : (result.events || result.items || []);
      setEvents(evArr.sort((a,b) => {
        const aStart = a.start?.dateTime || a.start?.date || '';
        const bStart = b.start?.dateTime || b.start?.date || '';
        return aStart.localeCompare(bStart);
      }));
    } catch (e) {
      setError('Could not load calendar. Make sure Google Calendar is connected in settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleScheduleJob = async ({ title, start, end, location, description }) => {
    try {
      await callCalendarAPI(
        `Create a Google Calendar event: title="${title}", start="${start}", end="${end}", location="${location}", description="${description}". Return JSON {success:true, eventId:string}.`
      );
      showSuccess('Job scheduled on Google Calendar!');
      loadEvents();
    } catch {
      setError('Failed to create event.');
    }
  };

  const handleNewEvent = async ({ title, start, end, allDay, location, description }) => {
    try {
      await callCalendarAPI(
        `Create a Google Calendar event: title="${title}", start="${start}", end="${end}", ${allDay ? 'allDay=true,' : ''} location="${location}", description="${description}". Return JSON {success:true}.`
      );
      showSuccess('Event created!');
      loadEvents();
    } catch {
      setError('Failed to create event.');
    }
  };

  const grouped = groupByDate(events);
  const today = new Date().toDateString();

  return (
    <div className="min-h-screen bg-black text-white">
      {showSchedule && <ScheduleJobModal jobs={jobs} onSchedule={handleScheduleJob} onClose={() => setShowSchedule(false)} />}
      {showNewEvent && <NewEventModal onSave={handleNewEvent} onClose={() => setShowNewEvent(false)} />}

      {/* Header */}
      <div className="bg-[#0a0a0a] border-b border-[#1a1a1a] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                📅 Schedule
              </h2>
              <p className="text-xs text-[#444]">Google Calendar · Next 30 days</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadEvents}
                className="text-[#444] hover:text-white text-sm transition-colors p-1"
                title="Refresh"
              >
                ↻
              </button>
              <button
                onClick={() => setShowSchedule(true)}
                className="text-xs px-3 py-2 bg-[#0d0d0d] border border-[#1a1a1a] hover:border-[#f59e0b]/50 text-[#A7A5A6] hover:text-[#f59e0b] rounded-lg transition-colors"
              >
                ⚡ Schedule Job
              </button>
              <button
                onClick={() => setShowNewEvent(true)}
                className="text-xs px-3 py-2 bg-[#f59e0b] text-black font-bold rounded-lg hover:opacity-90 transition-opacity"
              >
                + Event
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4">
        {/* Success message */}
        {successMsg && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-4 text-center">
            <p className="text-sm text-green-400 font-semibold">✓ {successMsg}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={loadEvents} className="text-xs text-red-400/70 mt-2 hover:text-red-400">Try again</button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 animate-pulse">
                <div className="h-3 bg-[#1a1a1a] rounded w-1/3 mb-2" />
                <div className="h-4 bg-[#1a1a1a] rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Events */}
        {!loading && !error && (
          <>
            {grouped.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">📅</p>
                <p className="text-[#444] text-sm">No upcoming events in the next 30 days</p>
                <button onClick={() => setShowSchedule(true)} className="mt-4 text-[#f59e0b] text-sm hover:opacity-80">
                  Schedule your first job →
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {grouped.map(([dateKey, dayEvents]) => {
                  const dateObj = new Date(dateKey + 'T12:00:00');
                  const isDayToday = dateObj.toDateString() === today;
                  return (
                    <div key={dateKey}>
                      {/* Date header */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center ${isDayToday ? 'bg-[#f59e0b]' : 'bg-[#0d0d0d] border border-[#1a1a1a]'}`}>
                          <span className={`text-xs font-bold leading-none ${isDayToday ? 'text-black' : 'text-[#555]'}`}>
                            {dateObj.toLocaleDateString('en-US',{weekday:'short'}).toUpperCase()}
                          </span>
                          <span className={`text-lg font-black leading-none ${isDayToday ? 'text-black' : 'text-white'}`}>
                            {dateObj.getDate()}
                          </span>
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${isDayToday ? 'text-[#f59e0b]' : 'text-[#A7A5A6]'}`}>
                            {isDayToday ? 'Today' : dateObj.toLocaleDateString('en-US',{month:'long',day:'numeric'})}
                          </p>
                          <p className="text-xs text-[#333]">{dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>

                      {/* Events for this day */}
                      <div className="space-y-2 ml-13" style={{marginLeft:'52px'}}>
                        {dayEvents.map((ev, i) => {
                          const startDT = ev.start?.dateTime || ev.start?.date;
                          const endDT = ev.end?.dateTime || ev.end?.date;
                          const isAllDay = !ev.start?.dateTime;
                          const color = EVENT_COLORS[i % EVENT_COLORS.length];
                          const isJobEvent = (ev.summary || '').startsWith('⚡');

                          return (
                            <div key={ev.id || i}
                              className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-3 flex gap-3"
                              style={{borderLeft: `3px solid ${color}`}}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="text-sm font-semibold text-white truncate">{ev.summary || 'Untitled'}</p>
                                  {isJobEvent && <span className="text-xs bg-[#f59e0b]/20 text-[#f59e0b] px-1.5 py-0.5 rounded flex-shrink-0">Job</span>}
                                </div>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <p className="text-xs text-[#555]">
                                    {isAllDay ? 'All day' : `${formatTime(startDT)} – ${formatTime(endDT)}`}
                                  </p>
                                  {ev.location && (
                                    <p className="text-xs text-[#444] truncate max-w-[200px]">📍 {ev.location}</p>
                                  )}
                                </div>
                                {ev.description && (
                                  <p className="text-xs text-[#333] mt-1 line-clamp-2">{ev.description}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
