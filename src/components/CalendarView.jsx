import { useState, useEffect } from 'react';

// Public calendar open link
const CALENDAR_OPEN = `https://calendar.google.com/calendar/r`;

function buildNewEventUrl({ title='', date='', startTime='', endTime='', location='', details='' }) {
  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const dateStr = date.replace(/-/g,'');
  let dates = '';
  if (dateStr && startTime && endTime) {
    dates = `&dates=${dateStr}T${startTime.replace(':','')}00/${dateStr}T${endTime.replace(':','')}00`;
  } else if (dateStr) {
    dates = `&dates=${dateStr}/${dateStr}`;
  }
  return `${base}&text=${encodeURIComponent(title)}${dates}&location=${encodeURIComponent(location)}&details=${encodeURIComponent(details)}&cid=${encodeURIComponent(CALENDAR_ID)}`;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
}
function formatTime(iso) {
  if (!iso) return 'All day';
  return new Date(iso).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
}
function daysFromNow(n) {
  const d = new Date(); d.setDate(d.getDate()+n); return d;
}

// Parse ICS feed for upcoming events
async function fetchEvents() {
  // Use a CORS proxy to fetch the ICS feed
  const icsUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(CALENDAR_ID)}/public/basic.ics`;
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(icsUrl)}`;
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error('Failed to fetch calendar');
  const text = await res.text();
  return parseICS(text);
}

function parseICS(text) {
  const events = [];
  const lines = text.replace(/\r\n /g,'').replace(/\r\n/g,'\n').split('\n');
  let current = null;
  
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { current = {}; continue; }
    if (line === 'END:VEVENT') {
      if (current && current.start) events.push(current);
      current = null; continue;
    }
    if (!current) continue;
    
    if (line.startsWith('SUMMARY:')) current.title = line.slice(8).trim();
    if (line.startsWith('LOCATION:')) current.location = line.slice(9).trim();
    if (line.startsWith('DESCRIPTION:')) current.description = line.slice(12).replace(/\\n/g,'\n').trim();
    
    if (line.startsWith('DTSTART')) {
      const val = line.split(':')[1]?.trim();
      if (val?.includes('T')) current.start = parseICSDate(val);
      else current.start = parseICSDateOnly(val);
      current.allDay = !val?.includes('T');
    }
    if (line.startsWith('DTEND')) {
      const val = line.split(':')[1]?.trim();
      if (val?.includes('T')) current.end = parseICSDate(val);
    }
  }
  
  const now = new Date();
  const future = daysFromNow(60);
  return events
    .filter(e => e.start && new Date(e.start) >= now && new Date(e.start) <= future)
    .sort((a,b) => new Date(a.start) - new Date(b.start));
}

function parseICSDate(val) {
  // 20240115T080000Z or 20240115T080000
  const y=val.slice(0,4),m=val.slice(4,6),d=val.slice(6,8);
  const h=val.slice(9,11),mn=val.slice(11,13);
  const isUTC = val.endsWith('Z');
  if (isUTC) return new Date(`${y}-${m}-${d}T${h}:${mn}:00Z`).toISOString();
  return new Date(`${y}-${m}-${d}T${h}:${mn}:00`).toISOString();
}
function parseICSDateOnly(val) {
  if (!val) return null;
  const y=val.slice(0,4),m=val.slice(4,6),d=val.slice(6,8);
  return `${y}-${m}-${d}T12:00:00`;
}

// Group events by date
function groupByDate(events) {
  const groups = {};
  events.forEach(ev => {
    const key = new Date(ev.start).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(ev);
  });
  return Object.entries(groups);
}

// ── Schedule Job Modal ────────────────────────────────────────────────────────
function ScheduleJobModal({ jobs, onClose }) {
  const [selectedJob, setSelectedJob] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [notes, setNotes] = useState('');
  const job = jobs.find(j => j.id === selectedJob);
  const activeJobs = jobs.filter(j => !['complete','declined'].includes(j.status));

  const handleOpen = () => {
    if (!selectedJob || !date) return;
    const url = buildNewEventUrl({
      title: `⚡ ${job?.customerName || 'Job'} — ${job?.scopeTitle || job?.jobType || 'Electrical'}`,
      date, startTime, endTime,
      location: job?.jobAddress || '',
      details: [job?.notes, job?.customerPhone ? `📞 ${job.customerPhone}` : '', notes].filter(Boolean).join('\n'),
    });
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold">⚡ Schedule a Job</h3>
          <button onClick={onClose} className="text-[#444] hover:text-white text-lg">✕</button>
        </div>
        <div>
          <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">Select Job</label>
          <select value={selectedJob} onChange={e=>setSelectedJob(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#f59e0b]">
            <option value="">Choose a job...</option>
            {activeJobs.map(j=>(
              <option key={j.id} value={j.id}>{j.customerName||'No name'} — {j.scopeTitle||j.jobType||'Job'}</option>
            ))}
          </select>
        </div>
        {job && (
          <div className="bg-[#111] border border-[#1a1a1a] rounded-lg px-3 py-2 text-xs text-[#555] space-y-0.5">
            {job.jobAddress && <p>📍 {job.jobAddress}</p>}
            {job.customerPhone && <p>📞 {job.customerPhone}</p>}
          </div>
        )}
        <div>
          <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">Date</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#f59e0b]" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">Start</label>
            <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#f59e0b]" />
          </div>
          <div>
            <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">End</label>
            <input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#f59e0b]" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">Additional Notes</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="Crew, instructions..."
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#f59e0b] resize-none" />
        </div>
        <button onClick={handleOpen} disabled={!selectedJob||!date}
          className="w-full bg-[#f59e0b] disabled:opacity-40 text-black font-black py-3 rounded-lg text-sm">
          📅 Open in Google Calendar
        </button>
        <p className="text-xs text-[#333] text-center">Opens Google Calendar pre-filled — save event there</p>
      </div>
    </div>
  );
}

// ── New Event Modal ───────────────────────────────────────────────────────────
function NewEventModal({ onClose }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [allDay, setAllDay] = useState(false);

  const handleOpen = () => {
    if (!title||!date) return;
    const url = buildNewEventUrl({ title, date, startTime: allDay?'':startTime, endTime: allDay?'':endTime, location, details: notes });
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold">New Event</h3>
          <button onClick={onClose} className="text-[#444] hover:text-white text-lg">✕</button>
        </div>
        <div>
          <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">Title</label>
          <input type="text" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Event title"
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#f59e0b]" />
        </div>
        <div>
          <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">Date</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#f59e0b]" />
        </div>
        <button onClick={()=>setAllDay(!allDay)}
          className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${allDay?'border-[#f59e0b] bg-[#f59e0b]/10 text-[#f59e0b]':'border-[#1a1a1a] text-[#555]'}`}>
          {allDay?'✓ All Day':'○ All Day'}
        </button>
        {!allDay && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">Start</label>
              <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#f59e0b]" />
            </div>
            <div>
              <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">End</label>
              <input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#f59e0b]" />
            </div>
          </div>
        )}
        <div>
          <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">Location</label>
          <input type="text" value={location} onChange={e=>setLocation(e.target.value)} placeholder="Address"
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#f59e0b]" />
        </div>
        <div>
          <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">Notes</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f59e0b] resize-none" />
        </div>
        <button onClick={handleOpen} disabled={!title||!date}
          className="w-full bg-[#f59e0b] disabled:opacity-40 text-black font-black py-3 rounded-lg text-sm">
          📅 Open in Google Calendar
        </button>
        <p className="text-xs text-[#333] text-center">Opens Google Calendar pre-filled — save event there</p>
      </div>
    </div>
  );
}

// ── Main Calendar View ────────────────────────────────────────────────────────
export default function CalendarView({ jobs, settings, onGoToSettings }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showNewEvent, setShowNewEvent] = useState(false);

  const icsUrl = settings?.calendarIcsUrl?.trim();

  useEffect(() => {
    if (!icsUrl) { setLoading(false); return; }
    setLoading(true);
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(icsUrl)}`;
    fetch(proxyUrl)
      .then(r => { if (!r.ok) throw new Error(); return r.text(); })
      .then(text => { setEvents(parseICS(text)); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [icsUrl]);

  const grouped = groupByDate(events);
  const today = new Date().toDateString();

  return (
    <div className="min-h-screen bg-black text-white">
      {showSchedule && <ScheduleJobModal jobs={jobs} onClose={() => setShowSchedule(false)} />}
      {showNewEvent && <NewEventModal onClose={() => setShowNewEvent(false)} />}

      {/* Header */}
      <div className="bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold">📅 Schedule</h2>
          <p className="text-xs text-[#444]">Next 60 days</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.open(CALENDAR_OPEN, '_blank')}
            className="text-xs px-3 py-1.5 border border-[#1a1a1a] text-[#555] hover:text-white hover:border-[#444] rounded-lg transition-colors">
            Open GCal ↗
          </button>
          <button onClick={() => setShowSchedule(true)}
            className="text-xs px-3 py-1.5 border border-[#1a1a1a] text-[#A7A5A6] hover:text-[#f59e0b] hover:border-[#f59e0b]/50 rounded-lg transition-colors">
            ⚡ Schedule Job
          </button>
          <button onClick={() => setShowNewEvent(true)}
            className="text-xs px-3 py-1.5 bg-[#f59e0b] text-black font-bold rounded-lg hover:opacity-90">
            + Event
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-6">
        {!icsUrl && !loading && (
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-6 text-center space-y-3">
            <p className="text-2xl">📅</p>
            <p className="text-sm text-[#A7A5A6] font-semibold">Calendar not connected</p>
            <p className="text-xs text-[#444]">Add your Google Calendar secret ICS URL in Settings → Calendar</p>
            <button onClick={() => onGoToSettings && onGoToSettings()}
              className="text-xs px-4 py-2 bg-[#f59e0b] text-black font-bold rounded-lg">
              Go to Settings
            </button>
          </div>
        )}

        {loading && icsUrl && (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 animate-pulse">
                <div className="h-3 bg-[#1a1a1a] rounded w-1/4 mb-2" />
                <div className="h-4 bg-[#1a1a1a] rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-6 text-center space-y-3">
            <p className="text-2xl">📅</p>
            <p className="text-sm text-[#A7A5A6] font-semibold">Couldn't load calendar events</p>
            <p className="text-xs text-[#444]">Make sure your calendar is set to public in Google Calendar settings</p>
            <button onClick={() => window.open(CALENDAR_OPEN, '_blank')}
              className="text-xs px-4 py-2 bg-[#f59e0b] text-black font-bold rounded-lg">
              Open Google Calendar ↗
            </button>
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <p className="text-4xl">📅</p>
            <p className="text-[#444] text-sm">No upcoming events in the next 60 days</p>
            <button onClick={() => setShowSchedule(true)}
              className="text-[#f59e0b] text-sm hover:opacity-80">
              Schedule your first job →
            </button>
          </div>
        )}

        {!loading && !error && grouped.map(([dateStr, dayEvents]) => {
          const isToday = dateStr === today;
          const dateObj = new Date(dayEvents[0].start);
          return (
            <div key={dateStr}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-2">
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center ${isToday ? 'bg-[#f59e0b]' : 'bg-[#0d0d0d] border border-[#1a1a1a]'}`}>
                  <span className={`text-xs font-bold leading-none ${isToday ? 'text-black' : 'text-[#555]'}`}>
                    {dateObj.toLocaleDateString('en-US',{weekday:'short'}).toUpperCase()}
                  </span>
                  <span className={`text-xl font-black leading-none ${isToday ? 'text-black' : 'text-white'}`}>
                    {dateObj.getDate()}
                  </span>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${isToday ? 'text-[#f59e0b]' : 'text-[#A7A5A6]'}`}>
                    {isToday ? 'Today' : dateObj.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}
                  </p>
                  <p className="text-xs text-[#333]">{dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Events */}
              <div className="space-y-2 ml-16">
                {dayEvents.map((ev, i) => (
                  <div key={i} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-3"
                    style={{borderLeft: `3px solid ${ev.title?.startsWith('⚡') ? '#f59e0b' : '#3b82f6'}`}}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{ev.title || 'Untitled'}</p>
                        <p className="text-xs text-[#555] mt-0.5">
                          {ev.allDay ? 'All day' : `${formatTime(ev.start)}${ev.end ? ` – ${formatTime(ev.end)}` : ''}`}
                        </p>
                        {ev.location && <p className="text-xs text-[#444] mt-0.5 truncate">📍 {ev.location}</p>}
                        {ev.description && <p className="text-xs text-[#333] mt-1 line-clamp-2">{ev.description}</p>}
                      </div>
                      {ev.title?.startsWith('⚡') && (
                        <span className="text-xs bg-[#f59e0b]/20 text-[#f59e0b] px-1.5 py-0.5 rounded flex-shrink-0">Job</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
