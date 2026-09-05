import { useState } from 'react';

const EMBED_URL = 'https://calendar.google.com/calendar/embed?src=saybrook.electric%40gmail.com&ctz=America%2FNew_York';

// Build a "Schedule Job" URL that opens Google Calendar new event pre-filled
function buildNewEventUrl({ title = '', date = '', startTime = '', endTime = '', location = '', details = '' }) {
  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const dateStr = date.replace(/-/g, '');
  let dates = '';
  if (dateStr && startTime && endTime) {
    const st = startTime.replace(':', '') + '00';
    const et = endTime.replace(':', '') + '00';
    dates = `&dates=${dateStr}T${st}/${dateStr}T${et}`;
  } else if (dateStr) {
    dates = `&dates=${dateStr}/${dateStr}`;
  }
  return `${base}&text=${encodeURIComponent(title)}${dates}&location=${encodeURIComponent(location)}&details=${encodeURIComponent(details)}`;
}

// ── Schedule Job Modal ─────────────────────────────────────────────────────────
function ScheduleJobModal({ jobs, onClose }) {
  const [selectedJob, setSelectedJob] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [notes, setNotes] = useState('');

  const activeJobs = jobs.filter(j => !['complete', 'declined'].includes(j.status));
  const job = jobs.find(j => j.id === selectedJob);

  const handleOpen = () => {
    if (!selectedJob || !date) return;
    const url = buildNewEventUrl({
      title: `⚡ ${job?.customerName || 'Job'} — ${job?.scopeTitle || job?.jobType || 'Electrical'}`,
      date,
      startTime,
      endTime,
      location: job?.jobAddress || '',
      details: [
        job?.notes ? `Notes: ${job.notes}` : '',
        job?.customerPhone ? `Phone: ${job.customerPhone}` : '',
        notes,
      ].filter(Boolean).join('\n'),
    });
    window.open(url, '_blank');
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
          <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#f59e0b]">
            <option value="">Choose a job...</option>
            {activeJobs.map(j => (
              <option key={j.id} value={j.id}>
                {j.customerName || 'No name'} — {j.scopeTitle || j.jobType || 'Job'}
              </option>
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
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#f59e0b]" />
        </div>

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

        <div>
          <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">Additional Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            placeholder="Crew, special instructions..."
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#f59e0b] resize-none" />
        </div>

        <button onClick={handleOpen} disabled={!selectedJob || !date}
          className="w-full bg-[#f59e0b] disabled:opacity-40 text-black font-black py-3 rounded-lg text-sm">
          📅 Open in Google Calendar
        </button>
        <p className="text-xs text-[#333] text-center">Opens Google Calendar pre-filled — review and save there</p>
      </div>
    </div>
  );
}

// ── New Event Modal ────────────────────────────────────────────────────────────
function NewEventModal({ onClose }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [allDay, setAllDay] = useState(false);

  const handleOpen = () => {
    if (!title || !date) return;
    const url = buildNewEventUrl({
      title,
      date: allDay ? date : date,
      startTime: allDay ? '' : startTime,
      endTime: allDay ? '' : endTime,
      location,
      details: notes,
    });
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
          {allDay ? '✓ All Day' : '○ All Day'}
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
          <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Address"
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#f59e0b]" />
        </div>

        <div>
          <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#f59e0b] resize-none" />
        </div>

        <button onClick={handleOpen} disabled={!title || !date}
          className="w-full bg-[#f59e0b] disabled:opacity-40 text-black font-black py-3 rounded-lg text-sm">
          📅 Open in Google Calendar
        </button>
        <p className="text-xs text-[#333] text-center">Opens Google Calendar pre-filled — review and save there</p>
      </div>
    </div>
  );
}

// ── Main Calendar View ────────────────────────────────────────────────────────
export default function CalendarView({ jobs }) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [calView, setCalView] = useState('month'); // month | week | agenda

  const viewMap = { month: 'month', week: 'week', agenda: 'agenda' };
  const embedUrl = `${EMBED_URL}&mode=${viewMap[calView]}&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=0&showCalendars=0&showTz=1`;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 57px)' }}>
      {showSchedule && <ScheduleJobModal jobs={jobs} onClose={() => setShowSchedule(false)} />}
      {showNewEvent && <NewEventModal onClose={() => setShowNewEvent(false)} />}

      {/* Toolbar */}
      <div className="bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 py-2 flex items-center justify-between flex-shrink-0">
        {/* View toggles */}
        <div className="flex gap-1">
          {['month', 'week', 'agenda'].map(v => (
            <button key={v} onClick={() => setCalView(v)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors capitalize ${
                calView === v ? 'border-[#f59e0b] bg-[#f59e0b]/10 text-[#f59e0b]' : 'border-[#1a1a1a] text-[#555] hover:border-[#2a2a2a]'
              }`}>
              {v}
            </button>
          ))}
        </div>
        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={() => setShowSchedule(true)}
            className="text-xs px-3 py-1.5 bg-[#0d0d0d] border border-[#1a1a1a] hover:border-[#f59e0b]/50 text-[#A7A5A6] hover:text-[#f59e0b] rounded-lg transition-colors">
            ⚡ Schedule Job
          </button>
          <button onClick={() => setShowNewEvent(true)}
            className="text-xs px-3 py-1.5 bg-[#f59e0b] text-black font-bold rounded-lg hover:opacity-90 transition-opacity">
            + Event
          </button>
        </div>
      </div>

      {/* Embedded Google Calendar */}
      <div className="flex-1 relative">
        <iframe
          src={embedUrl}
          style={{ border: 0, width: '100%', height: '100%', display: 'block' }}
          frameBorder="0"
          scrolling="yes"
          title="Google Calendar"
        />
      </div>

      {/* Footer note */}
      <div className="bg-[#0a0a0a] border-t border-[#1a1a1a] px-4 py-2 flex-shrink-0">
        <p className="text-xs text-[#333] text-center">Showing saybrook.electric@gmail.com · Tap ⚡ Schedule Job to add jobs from SBK</p>
      </div>
    </div>
  );
}
