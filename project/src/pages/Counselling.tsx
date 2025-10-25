import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { supabase, Counsellor } from '../lib/supabase';

// Locally extend Counsellor type to include charge_hr
type CounsellorWithCharge = Counsellor & { charge_hr?: string | null };

import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';

export default function Counselling() {
  const { user } = useAuth();
  const [counsellors, setCounsellors] = useState<CounsellorWithCharge[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    year: string;
    cause: string;
    type_assistance: string;
    available_days: string[];
    available_hours: string;
  }>({
  name: '',
  email: '',
  phone: '+91',
    year: '',
    cause: '',
    type_assistance: '',
    available_days: [],
    available_hours: '',
  });

  useEffect(() => {
    loadCounsellors();
    checkApplicationStatus();
  }, [applicationStatus]);

  async function loadCounsellors() {
    const { data, error } = await supabase
      .from('counsellors')
      .select('id, user_id, name, email, phone, year, cause, status, created_at, available_days, available_hours, type_assistance, "Charge/hr"')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error loading counsellors:', error);
      setCounsellors([]);
      return;
    }
    setCounsellors(
      (data || []).map((c) => {
        // Parse available_days if it's a stringified array
        let days = c.available_days;
        if (typeof days === 'string') {
          try {
            days = JSON.parse(days);
          } catch {
            days = [];
          }
        }
        // Compose available_slots for display
        let available_slots: string[] = [];
        if (days && days.length > 0 && c.available_hours) {
          available_slots = (days as string[]).map((d: string) => `${d} - ${c.available_hours}`);
        } else if (c.available_hours) {
          available_slots = [c.available_hours];
        }
        // Use type_assistance as an array for display
        let assistance_types: string[] = [];
        if (c.type_assistance) {
          try {
            // Try parsing as JSON array, fallback to string
            const parsed = JSON.parse(c.type_assistance);
            assistance_types = Array.isArray(parsed) ? parsed : [c.type_assistance];
          } catch {
            assistance_types = [c.type_assistance];
          }
        }
        return {
          ...c,
          assistance_types,
          people_connected: 0,
          reviews: [],
          available_slots,
          charge_hr: c["Charge/hr"] ?? null,
        };
      })
    );
  }

  async function checkApplicationStatus() {
    if (!user) return;
    const { data } = await supabase
      .from('counsellors')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) setApplicationStatus(data.status);
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('counsellors').insert({
        user_id: user.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        year: formData.year,
        cause: formData.cause,
        type_assistance: formData.type_assistance,
        available_days: formData.available_days,
        available_hours: formData.available_hours,
      });

      if (error) throw error;

      setApplicationStatus('pending');
      setFormData({ name: '', email: '', phone: '', year: '', cause: '', type_assistance: '', available_days: [], available_hours: '' });
      alert('Application submitted successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  }

  async function handleBookSlot(counsellorId: string, slot: string) {
    if (!user) return;

    try {
      const { error } = await supabase.from('bookings').insert({
        counsellor_id: counsellorId,
        user_id: user.id,
        slot,
        status: 'pending',
      });

      if (error) throw error;

      alert(`Booking request sent for ${slot}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to book slot');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 pb-24">
      <div className="max-w-6xl mx-auto pt-8 px-4">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Counselling Services</h1>

  <div className="grid lg:grid-cols-2 gap-12">
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-10 shadow-2xl">
            <h2 className="text-2xl font-bold text-teal-400 mb-6">Apply for Counsellor</h2>

            {applicationStatus ? (
              <div className={`p-6 rounded-xl text-center ${
                applicationStatus === 'pending'
                  ? 'bg-yellow-500/10 border border-yellow-500/50 text-yellow-400'
                  : applicationStatus === 'approved'
                  ? 'bg-green-500/10 border border-green-500/50 text-green-400'
                  : 'bg-red-500/10 border border-red-500/50 text-red-400'
              }`}>
                <p className="text-lg font-semibold">
                  Application Status: {applicationStatus.toUpperCase()}
                </p>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => {
                      let value = e.target.value;
                      if (!value.startsWith('+91')) {
                        value = '+91' + value.replace(/^\+?91?/, '');
                      }
                      setFormData({ ...formData, phone: value });
                    }}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Year</label>
                  <input
                    type="text"
                    required
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="Enter your year"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Cause (Optional)
                  </label>
                  <textarea
                    value={formData.cause}
                    onChange={(e) => setFormData({ ...formData, cause: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                    rows={3}
                    placeholder="Enter cause (optional)"
                  />
                </div>

                {/* Type of Assistance */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Type of Assistance</label>
                  <input
                    type="text"
                    required
                    value={formData.type_assistance}
                    onChange={(e) => setFormData({ ...formData, type_assistance: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="e.g. Academic, Personal, Career, etc."
                  />
                </div>
                {/* New: Available Days */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Available Days</label>
                  <div className="flex gap-4">
                    {['Weekdays', 'Weekends', 'Both'].map((day) => (
                      <label key={day} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.available_days.includes(day)}
                          onChange={() => {
                            setFormData((prev) => {
                              const updatedDays = prev.available_days.includes(day)
                                ? prev.available_days.filter((d) => d !== day)
                                : [...prev.available_days, day];
                              return { ...prev, available_days: updatedDays };
                            });
                          }}
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>

                {/* New: Available Hours */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Available Hours</label>
                  <select
                    value={formData.available_hours}
                    onChange={(e) => setFormData({ ...formData, available_hours: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    required
                    title="Available Hours"
                  >
                    <option value="">Select timeslot</option>
                    <option value="Morning (9AM–12PM)">Morning (9AM–12PM)</option>
                    <option value="Afternoon (12PM–4PM)">Afternoon (12PM–4PM)</option>
                    <option value="Evening (4PM–8PM)">Evening (4PM–8PM)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-lg font-semibold shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </form>
            )}
          </div>

          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-10 shadow-2xl">
            <h2 className="text-2xl font-bold text-teal-400 mb-6">Reach Out to a Counsellor</h2>
            <div className="space-y-8 max-h-[700px] overflow-y-auto pr-2">
              {counsellors.length === 0 ? (
                <p className="text-slate-400">No counsellors listed yet.</p>
              ) : (
                counsellors.map((counsellor) => (
                  <div
                    key={counsellor.id}
                    className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 hover:border-teal-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-white">{counsellor.name}</h3>
                        <p className="text-sm text-slate-400">{counsellor.year}</p>
                        <p className="text-sm text-slate-400">{counsellor.email}</p>
                        <p className="text-sm text-slate-400">
                          {counsellor.phone && counsellor.phone.startsWith('+91')
                            ? counsellor.phone.replace('+91', '+91 ')
                            : `+91 ${counsellor.phone?.replace(/^\+?91/, '')}`}
                        </p>
                      </div>
                      {counsellor.people_connected !== undefined && (
                        <span className="px-3 py-1 bg-teal-500/20 text-teal-400 rounded-full text-sm font-medium">
                          {counsellor.people_connected} connected
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 mb-3">
                      {counsellor.assistance_types && (
                        <p className="text-sm text-slate-400">
                          <span className="font-semibold text-slate-300">Types of Assistance:</span>{' '}
                          {counsellor.assistance_types.join(', ')}
                        </p>
                      )}
                      {/* Charge/hr section */}
                      <p className="text-sm text-slate-400">
                        <span className="font-semibold text-slate-300">Charge/hr:</span>{' '}
                        ₹{counsellor.charge_hr && counsellor.charge_hr.trim() !== '' ? counsellor.charge_hr : '0'}
                      </p>
                    </div>
                    <button
                      onClick={() => setExpandedId(expandedId === counsellor.id ? null : counsellor.id)}
                      className="flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors text-sm font-medium"
                    >
                      {expandedId === counsellor.id ? (
                        <>
                          <ChevronUp className="w-4 h-4" /> Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" /> Show More
                        </>
                      )}
                    </button>
                    {expandedId === counsellor.id && (
                      <div className="mt-4 space-y-4 border-t border-slate-700 pt-4">
                        {counsellor.reviews && (
                          <div>
                            <h4 className="font-semibold text-slate-300 mb-2">Reviews</h4>
                            <div className="space-y-2">
                              {counsellor.reviews.map((review, idx) => (
                                <p key={idx} className="text-sm text-slate-400 italic">
                                  "{review}"
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                        {counsellor.available_slots && (
                          <div>
                            <h4 className="font-semibold text-slate-300 mb-2">Available Time Slots</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {counsellor.available_slots.map((slot, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleBookSlot(counsellor.id, slot)}
                                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-teal-500/20 hover:border-teal-500 hover:text-teal-400 transition-all"
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
