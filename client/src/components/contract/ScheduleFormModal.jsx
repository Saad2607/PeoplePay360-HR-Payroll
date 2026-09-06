import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { scheduleApi } from '../../api/scheduleApi';
import { Clock, Calendar, Check, AlertCircle, Loader2 } from 'lucide-react';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const ScheduleFormModal = ({ isOpen, onClose, scheduleToEdit = null, onSuccess }) => {
  const isEditing = !!scheduleToEdit;

  const [formData, setFormData] = useState({
    name: '',
    type: 'Standard',
    weeklyWorkingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startTime: '09:00',
    endTime: '18:00',
    breakDuration: 60,
    isActive: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (scheduleToEdit) {
      setFormData({
        name: scheduleToEdit.name || '',
        type: scheduleToEdit.type || 'Standard',
        weeklyWorkingDays: scheduleToEdit.weeklyWorkingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        startTime: scheduleToEdit.startTime || '09:00',
        endTime: scheduleToEdit.endTime || '18:00',
        breakDuration: scheduleToEdit.breakDuration ?? 60,
        isActive: scheduleToEdit.isActive !== undefined ? scheduleToEdit.isActive : true,
      });
    } else {
      setFormData({
        name: '',
        type: 'Standard',
        weeklyWorkingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        startTime: '09:00',
        endTime: '18:00',
        breakDuration: 60,
        isActive: true,
      });
    }
    setError('');
  }, [scheduleToEdit, isOpen]);

  // Live Auto-Calculation of Weekly Hours (matches PDF Requirement A3)
  const calculateLiveWeeklyHours = () => {
    try {
      const { startTime, endTime, breakDuration, weeklyWorkingDays } = formData;
      if (!startTime || !endTime || !weeklyWorkingDays || weeklyWorkingDays.length === 0) return 0;

      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      let diffMinutes = (eh * 60 + em) - (sh * 60 + sm) - (Number(breakDuration) || 0);

      // Support overnight shifts (e.g. 22:00 to 06:00)
      if (diffMinutes < 0) {
        diffMinutes += 24 * 60;
      }

      const dailyHours = Math.max(0, diffMinutes / 60);
      const totalWeekly = dailyHours * weeklyWorkingDays.length;
      return Math.round(totalWeekly * 10) / 10;
    } catch {
      return 0;
    }
  };

  const calculatedHours = calculateLiveWeeklyHours();

  const handleToggleDay = (day) => {
    const currentDays = [...formData.weeklyWorkingDays];
    const index = currentDays.indexOf(day);
    if (index > -1) {
      if (currentDays.length === 1) {
        setError('A schedule must have at least one active working day');
        return;
      }
      currentDays.splice(index, 1);
    } else {
      currentDays.push(day);
    }
    setError('');
    setFormData({ ...formData, weeklyWorkingDays: currentDays });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Schedule name is required');
      return;
    }
    if (formData.weeklyWorkingDays.length === 0) {
      setError('Please select at least one working day');
      return;
    }

    setSubmitting(true);
    try {
      let result;
      if (isEditing) {
        result = await scheduleApi.update(scheduleToEdit._id, formData);
      } else {
        result = await scheduleApi.create(formData);
      }

      onSuccess(result.message || `Schedule ${isEditing ? 'updated' : 'created'} successfully`);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save working schedule');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Working Schedule: ${formData.name}` : 'Create Working Schedule'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Schedule Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
            Schedule Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Standard 40h Workweek, Shift Morning"
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Schedule Type */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
            Schedule Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="Standard">Standard</option>
            <option value="Flexible">Flexible</option>
            <option value="Shift">Shift</option>
            <option value="Part-Time">Part-Time</option>
          </select>
        </div>

        {/* Working Days Checkboxes */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5 flex items-center justify-between">
            <span>Active Working Days ({formData.weeklyWorkingDays.length} selected) *</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const isChecked = formData.weeklyWorkingDays.includes(day);
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => handleToggleDay(day)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-between ${
                    isChecked
                      ? 'bg-brand-50 border-brand-300 text-brand-700 shadow-xs'
                      : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  <span>{day.slice(0, 3)}</span>
                  {isChecked && <Check className="w-3.5 h-3.5 text-brand-600 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Pattern & Break */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Start Time *
            </label>
            <input
              type="time"
              required
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              End Time *
            </label>
            <input
              type="time"
              required
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Break (Mins)
            </label>
            <input
              type="number"
              min="0"
              max="240"
              value={formData.breakDuration}
              onChange={(e) => setFormData({ ...formData, breakDuration: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Live Automatic Weekly Hours Banner (PDF Requirement A3) */}
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-emerald-900">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Auto-Calculated Weekly Hours:
            </span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black text-emerald-800">{calculatedHours}</span>
            <span className="text-xs font-bold text-emerald-600">hrs/week</span>
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center space-x-2 pt-1">
          <input
            type="checkbox"
            id="isActiveSchedule"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
          />
          <label htmlFor="isActiveSchedule" className="text-xs font-medium text-gray-700">
            Active Schedule (Available for employee & contract assignment)
          </label>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition disabled:opacity-50 flex items-center"
          >
            {submitting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
            {isEditing ? 'Save Changes' : 'Create Schedule'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
