import { useState } from 'react';

function buildEventUrl({ title='', date='', startTime='', endTime='', location='', details='' }) {
  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const dateStr = date.replace(/-/g,'');
  let dates = '';
  if (dateStr && startTime && endTime) {
    dates = `&dates=${dateStr}T${startTime.replace(':','')}00/${dateStr}T${endTime.replace(':','')}00`;
  } else if (dateStr) {
    dates = `&dates=${dateStr}/${dateStr}`;
  }
  return `${base}&text=${encodeURIComponent(title)}${dates}&location=${encodeURIComponent(location)}&details=${encodeURIComponent(details)}`;
}

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
    const url = buildEventUrl({
      title: `⚡ ${job?.customerName || 'Job'} — ${job?.scopeTitle || job?.jobType || 'Electrical'}`,
      date, startTime, endTime,
      location: job?.jobAddress || '',
      details: [
        job?.notes,
        job?.customerPhone ? `📞 ${job.customerPhone}` : '',
        job?.customerEmail ? `✉ ${job.customerEmail}` : '',
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
          <h3 className="text-white font-bold">⚡ Schedule a Job</h3>
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
            {job.customerEmail && <p>✉ {job.customerEmail}</p>}
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
    const url = buildEventUrl({
      title,
      date,
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
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f59e0b] resize-none" />
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

export default function CalendarView({ jobs }) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [showNewEvent, setShowNewEvent] = useState(false);

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Upcoming jobs (next 30 days with a scheduled date — from job notes or title)
  const upcomingJobs = jobs
    .filter(j => !['complete','declined'].includes(j.status))
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-black text-white">
      {showSchedule && <ScheduleJobModal jobs={jobs} onClose={() => setShowSchedule(false)} />}
      {showNewEvent && <NewEventModal onClose={() => setShowNewEvent(false)} />}

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Today card */}
        <div className="bg-[#f59e0b] rounded-2xl p-5">
          <p className="text-black/60 text-sm font-semibold uppercase tracking-wider">{dayName}</p>
          <p className="text-black font-black text-2xl">{dateStr}</p>
        </div>

        {/* Open Google Calendar */}
        <button
          onClick={() => window.open('https://calendar.google.com', '_blank')}
          className="w-full bg-[#0d0d0d] border border-[#1a1a1a] hover:border-[#f59e0b]/40 rounded-2xl p-5 text-left transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-base group-hover:text-[#f59e0b] transition-colors">
                📅 Open Google Calendar
              </p>
              <p className="text-xs text-[#444] mt-1">View your full schedule</p>
            </div>
            <span className="text-[#333] group-hover:text-[#f59e0b] text-xl transition-colors">↗</span>
          </div>
        </button>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowSchedule(true)}
            className="bg-[#0d0d0d] border border-[#1a1a1a] hover:border-[#f59e0b]/40 rounded-xl p-4 text-left transition-colors group"
          >
            <p className="text-2xl mb-2">⚡</p>
            <p className="text-sm font-bold text-white group-hover:text-[#f59e0b] transition-colors">Schedule Job</p>
            <p className="text-xs text-[#444] mt-0.5">Add job to calendar</p>
          </button>
          <button
            onClick={() => setShowNewEvent(true)}
            className="bg-[#0d0d0d] border border-[#1a1a1a] hover:border-[#f59e0b]/40 rounded-xl p-4 text-left transition-colors group"
          >
            <p className="text-2xl mb-2">📝</p>
            <p className="text-sm font-bold text-white group-hover:text-[#f59e0b] transition-colors">New Event</p>
            <p className="text-xs text-[#444] mt-0.5">Any custom event</p>
          </button>
        </div>

        {/* Active jobs — quick schedule */}
        {upcomingJobs.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-3">Active Jobs — Tap to Schedule</p>
            <div className="space-y-2">
              {upcomingJobs.map(job => (
                <button
                  key={job.id}
                  onClick={() => setShowSchedule(true)}
                  className="w-full bg-[#0d0d0d] border border-[#1a1a1a] hover:border-[#f59e0b]/30 rounded-xl px-4 py-3 text-left transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{job.customerName || 'No name'}</p>
                      <p className="text-xs text-[#444] truncate">{job.jobAddress || job.scopeTitle || job.jobType || '—'}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        job.status === 'signed' ? 'border-green-500/30 text-green-400' :
                        job.status === 'approved' ? 'border-blue-500/30 text-blue-400' :
                        'border-[#1a1a1a] text-[#555]'
                      }`}>{job.status || 'draft'}</span>
                      <span className="text-[#333] group-hover:text-[#f59e0b] transition-colors text-sm">📅</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-[#333] text-center pb-4">
          Scheduling opens Google Calendar pre-filled with job details
        </p>
      </div>
    </div>
  );
}
