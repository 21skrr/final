import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { createEvaluation } from '../../services/evaluationService';
import { useNavigate } from 'react-router-dom';
import teamService from '../../services/teamService';
import {
  User,
  Calendar,
  Clock,
  MessageSquare,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  ClipboardList,
  Briefcase,
  Target,
  Info,
  Award,
} from 'lucide-react';

/* ─── types ───────────────────────────────────────────── */
interface TeamMember {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

/* ─── evaluation types config ────────────────────────── */
const EVAL_TYPES = [
  {
    value: '3-month',
    label: '3-Month Review',
    description: 'Short-term probation check-in',
    icon: <Clock className="h-5 w-5" />,
    color: 'amber',
  },
  {
    value: '6-month',
    label: '6-Month Review',
    description: 'Mid-year performance evaluation',
    icon: <Calendar className="h-5 w-5" />,
    color: 'blue',
  },
  {
    value: '12-month',
    label: '12-Month Review',
    description: 'Annual performance evaluation',
    icon: <TrendingUp className="h-5 w-5" />,
    color: 'purple',
  },
  {
    value: 'training',
    label: 'Training Assessment',
    description: 'Post-training skills evaluation',
    icon: <Target className="h-5 w-5" />,
    color: 'emerald',
  },
  {
    value: 'general',
    label: 'General Evaluation',
    description: 'Ad-hoc or on-the-job assessment',
    icon: <Briefcase className="h-5 w-5" />,
    color: 'slate',
  },
  {
    value: 'performance',
    label: 'Performance Review',
    description: 'Formal performance improvement review',
    icon: <Award className="h-5 w-5" />,
    color: 'red',
  },
  {
    value: 'probation',
    label: 'Probation Review',
    description: 'End-of-probation formal assessment',
    icon: <CheckCircle className="h-5 w-5" />,
    color: 'orange',
  },
];

const TYPE_COLOR_MAP: Record<string, string> = {
  blue: 'border-blue-400 bg-blue-50 text-blue-700',
  amber: 'border-amber-400 bg-amber-50 text-amber-700',
  purple: 'border-purple-400 bg-purple-50 text-purple-700',
  emerald: 'border-emerald-400 bg-emerald-50 text-emerald-700',
  slate: 'border-slate-400 bg-slate-50 text-slate-700',
  red: 'border-red-400 bg-red-50 text-red-700',
  orange: 'border-orange-400 bg-orange-50 text-orange-700',
};

/* ─── step indicator ─────────────────────────────────── */
const STEPS = ['Basic Info', 'Schedule & Notes', 'Review & Submit'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((label, idx) => {
        const done = idx < current;
        const active = idx === current;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center">
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  done
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                    : active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 ring-4 ring-blue-100'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {done ? <CheckCircle className="h-5 w-5" /> : idx + 1}
              </div>
              <span
                className={`mt-1 text-xs font-medium ${
                  active ? 'text-blue-600' : done ? 'text-emerald-600' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-12 md:w-20 rounded-full mt-[-14px] transition-colors duration-300 ${
                  idx < current ? 'bg-emerald-400' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─── main component ──────────────────────────────────── */
const SupervisorEvaluationCreate: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);

  // form state
  const [employeeId, setEmployeeId] = useState('');
  const [type, setType] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [supervisorComments, setSupervisorComments] = useState('');
  const [developmentRecommendations, setDevelopmentRecommendations] = useState('');

  // validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const members = await teamService.getMyTeam();
        setTeamMembers(members || []);
      } catch {
        // silent — team may be empty
      } finally {
        setLoadingTeam(false);
      }
    };
    fetchTeam();
  }, []);

  /* ── selected helpers ── */
  const selectedMember = teamMembers.find(m => m.id === employeeId);
  const selectedType = EVAL_TYPES.find(t => t.value === type);

  /* ── validation per step ── */
  const validateStep = (s: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (s === 0) {
      if (!employeeId) newErrors.employeeId = 'Please select an employee.';
      if (!type) newErrors.type = 'Please select an evaluation type.';
      if (!dueDate) newErrors.dueDate = 'Please set a due date.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);

  /* ── submit ── */
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await createEvaluation({
        employeeId,
        type,
        dueDate: dueDate || undefined,
        criteria: [],
      });
      // Navigate to criteria page to add criteria next
      const evaluationId = res?.data?.id || res?.id;
      if (evaluationId) {
        navigate(`/supervisor/evaluations/${evaluationId}/criteria`);
      } else {
        navigate('/supervisor/evaluations');
      }
    } catch {
      setError('Failed to create evaluation. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ────────────────────────────────────────────────────────
     STEP 1 — Basic Info
  ──────────────────────────────────────────────────────── */
  const Step1 = () => (
    <div className="space-y-6">
      {/* Employee Selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Employee <span className="text-red-500">*</span>
        </label>
        {loadingTeam ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
            Loading team members…
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            No team members found. Make sure you have employees assigned to your team.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {teamMembers.map(member => (
              <button
                key={member.id}
                type="button"
                onClick={() => {
                  setEmployeeId(member.id);
                  setErrors(prev => ({ ...prev, employeeId: '' }));
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                  employeeId === member.id
                    ? 'border-blue-500 bg-blue-50 shadow-sm shadow-blue-100'
                    : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                }`}
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                  {member.email && (
                    <p className="text-xs text-gray-400 truncate">{member.email}</p>
                  )}
                </div>
                {employeeId === member.id && (
                  <CheckCircle className="h-5 w-5 text-blue-500 ml-auto flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
        {errors.employeeId && (
          <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" /> {errors.employeeId}
          </p>
        )}
      </div>

      {/* Evaluation Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Evaluation Type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {EVAL_TYPES.map(et => (
            <button
              key={et.value}
              type="button"
              onClick={() => {
                setType(et.value);
                setErrors(prev => ({ ...prev, type: '' }));
              }}
              className={`flex items-start gap-3 px-4 py-4 rounded-xl border-2 text-left transition-all ${
                type === et.value
                  ? `${TYPE_COLOR_MAP[et.color]} border-2 shadow-sm`
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <span className={type === et.value ? '' : 'text-gray-400'}>{et.icon}</span>
              <div>
                <p className="text-sm font-semibold">{et.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{et.description}</p>
              </div>
            </button>
          ))}
        </div>
        {errors.type && (
          <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" /> {errors.type}
          </p>
        )}
      </div>



      {/* Due Date */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Due Date <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="date"
            value={dueDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => {
              setDueDate(e.target.value);
              setErrors(prev => ({ ...prev, dueDate: '' }));
            }}
            className={`w-full border rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.dueDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          />
        </div>
        {errors.dueDate && (
          <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" /> {errors.dueDate}
          </p>
        )}
      </div>
    </div>
  );

  /* ────────────────────────────────────────────────────────
     STEP 2 — Schedule & Notes
  ──────────────────────────────────────────────────────── */
  const Step2 = () => (
    <div className="space-y-6">
      {/* Session Date & Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Session Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={sessionDate}
              onChange={e => setSessionDate(e.target.value)}
              className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">When will the session take place?</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Session Time</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="time"
              value={sessionTime}
              onChange={e => setSessionTime(e.target.value)}
              className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Supervisor Pre-Evaluation Notes */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Pre-Evaluation Notes
          <span className="ml-1 text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={supervisorComments}
          onChange={e => setSupervisorComments(e.target.value)}
          rows={4}
          placeholder="Note any key observations, goals, or context to guide this evaluation session…"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
        />
      </div>

      {/* Development Recommendations */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Development Recommendations
          <span className="ml-1 text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={developmentRecommendations}
          onChange={e => setDevelopmentRecommendations(e.target.value)}
          rows={4}
          placeholder="Suggest areas of growth, training opportunities, or development goals for this employee…"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
        />
      </div>

      {/* Info tip */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>
          After creating the evaluation, you'll be taken to the <strong>criteria setup</strong> page where you can
          define the performance criteria to rate this employee on.
        </p>
      </div>
    </div>
  );

  /* ────────────────────────────────────────────────────────
     STEP 3 — Review & Submit
  ──────────────────────────────────────────────────────── */
  const Step3 = () => (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">
        Review the details below before creating the evaluation. You'll add criteria right after.
      </p>

      {/* Summary card */}
      <div className="bg-gray-50 rounded-2xl border border-gray-200 divide-y divide-gray-200 overflow-hidden">
        {/* Employee */}
        <div className="px-5 py-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold flex-shrink-0">
            {selectedMember?.name.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Employee</p>
            <p className="text-sm font-semibold text-gray-900">{selectedMember?.name ?? '—'}</p>
            {selectedMember?.email && (
              <p className="text-xs text-gray-400">{selectedMember.email}</p>
            )}
          </div>
        </div>

        {/* Type */}
        <div className="px-5 py-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
            {selectedType?.icon ?? <ClipboardList className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Evaluation Type</p>
            <p className="text-sm font-semibold text-gray-900">{selectedType?.label ?? '—'}</p>
          </div>
        </div>



        {/* Dates */}
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Due Date</p>
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-gray-400" />
              {dueDate ? new Date(dueDate).toLocaleDateString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Session</p>
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gray-400" />
              {sessionDate
                ? `${new Date(sessionDate).toLocaleDateString()}${sessionTime ? ' at ' + sessionTime : ''}`
                : 'Not set'}
            </p>
          </div>
        </div>

        {/* Notes preview */}
        {(supervisorComments || developmentRecommendations) && (
          <div className="px-5 py-4 space-y-3">
            {supervisorComments && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Pre-Evaluation Notes</p>
                <p className="text-sm text-gray-700 line-clamp-2">{supervisorComments}</p>
              </div>
            )}
            {developmentRecommendations && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Development Recommendations</p>
                <p className="text-sm text-gray-700 line-clamp-2">{developmentRecommendations}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* What's next tip */}
      <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700">
        <TrendingUp className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold">What happens next?</p>
          <p className="mt-0.5">
            After creation, you'll be redirected to <strong>add performance criteria</strong> — the specific
            areas you'll rate the employee on. The evaluation won't be active until criteria are added.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );

  /* ─── render ─────────────────────────────────────────── */
  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Page title */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Create New Evaluation</h1>
          <p className="mt-1 text-sm text-gray-500">
            Follow the steps to set up a performance evaluation for one of your team members.
          </p>
        </div>

        {/* Step indicator */}
        <StepIndicator current={step} />

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-7">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">{STEPS[step]}</h2>
            <div className="mt-1 h-1 w-12 bg-blue-600 rounded-full" />
          </div>

          {step === 0 && <Step1 />}
          {step === 1 && <Step2 />}
          {step === 2 && <Step3 />}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={step === 0 ? () => navigate('/supervisor/evaluations') : handleBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              {step === 0 ? 'Cancel' : 'Back'}
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-emerald-200"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Creating…
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Create Evaluation
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SupervisorEvaluationCreate;