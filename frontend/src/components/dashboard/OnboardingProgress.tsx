import React, { useState, useEffect } from "react";
import { CheckCircle, Circle, AlertTriangle, XCircle } from "lucide-react";
import { OnboardingStage } from "../../types/user";
import onboardingService from "../../services/onboardingService";
import type { OnboardingJourney } from "../../types/onboarding";
import { useAuth } from "../../context/AuthContext";

type Task = {
  id: string;
  title: string;
  isCompleted: boolean;
  [key: string]: unknown;
};

// If needed, extend OnboardingProgress type for 'overall'
type OnboardingProgressWithOverall = {
  [key: string]: unknown;
  overall?: number;
};

const OnboardingProgress: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [journey, setJourney] = useState<
    (OnboardingJourney & { tasksByPhase?: Record<string, Task[]> }) | null
  >(null);
  const [defaultTasks, setDefaultTasks] = useState<Record<
    string,
    Task[]
  > | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isEmployee = currentUser?.role === "employee";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [journeyData, defaultTasksData] = await Promise.all([
          onboardingService.getJourney(),
          onboardingService.getDefaultTasks(),
        ]);
        setJourney(journeyData);
        setDefaultTasks(defaultTasksData);
      } catch (err) {
        console.error("Error fetching onboarding journey or tasks:", err);
        setError("Failed to load onboarding journey");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-24 bg-gray-200 rounded w-full"></div>
          <div className="h-24 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error || !journey || !defaultTasks) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden p-6">
        <p className="text-red-500">{error || "No onboarding journey found"}</p>
      </div>
    );
  }

  // Only show current and completed phases
  const stages: OnboardingStage[] = [
    "pre_onboarding",
    "phase_1",
    "phase_2",
  ];
  const currentStageIndex = stages.findIndex(
    (stage) => stage === journey.currentStage
  );

  // Calculate overall progress using backend value
  const progressPercent =
    (journey.progress as unknown as OnboardingProgressWithOverall)?.overall ??
    0;

  // Check if Phase 1 is completed and there's a supervisor assessment
  const phase1Tasks = journey.tasksByPhase?.["phase_1"] || [];
  const phase1Completed = phase1Tasks.length > 0 && phase1Tasks.every((t) => t.isCompleted);
  const supervisorAssessment = (journey as any).supervisorAssessment;

  // Check if Phase 2 is completed and there's an HR assessment
  const phase2Tasks = journey.tasksByPhase?.["phase_2"] || [];
  const phase2Completed = phase2Tasks.length > 0 && phase2Tasks.every((t) => t.isCompleted);
  const hrAssessment = (journey as any).hrAssessment;

  // Determine which stages to show based on supervisor assessment and HR assessment
  let visibleStages = stages.filter((stage, idx) => idx <= currentStageIndex);
  
  // If Phase 1 is completed but HR hasn't approved, hide Phase 2
  if (phase1Completed && supervisorAssessment) {
    if (supervisorAssessment.status === "hr_rejected") {
      // Show all stages but indicate rejection
      visibleStages = stages;
    } else if (supervisorAssessment.status !== "hr_approved" && supervisorAssessment.status !== "completed") {
      // Hide Phase 2 if not approved
      visibleStages = stages.filter((stage) => stage !== "phase_2");
    }
  }

  // If Phase 2 is completed but HR hasn't made final decision, show completion message
  if (phase2Completed && hrAssessment) {
    if (hrAssessment.status === "hr_rejected") {
      // Show all stages but indicate final rejection
      visibleStages = stages;
    } else if (hrAssessment.status !== "decision_made" && hrAssessment.status !== "completed") {
      // Keep all stages visible but show pending status
      visibleStages = stages;
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Onboarding Journey
        </h2>
        {/* Progress Bar */}
        <div className="flex items-center mb-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden mr-2">
            <div
              className="h-2 bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <span className="text-blue-600 text-sm font-medium">
            {progressPercent}%
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-6">
          {visibleStages.map((stageKey, index) => {
            const isCurrentStage = stageKey === journey.currentStage;
            const isPastStage = index < currentStageIndex;
            // Use tasksByPhase from journey, which includes isCompleted
            const tasks: Task[] = journey.tasksByPhase?.[stageKey] || [];
            const phaseCompleted =
              tasks.length > 0 && tasks.every((t) => t.isCompleted);

            // Check if this is Phase 2 and should show rejection message
            const isPhase2Rejected = stageKey === "phase_2" && 
              phase1Completed && 
              supervisorAssessment?.status === "hr_rejected";

            // Check if this is Phase 2 and should show HR assessment status
            const isPhase2HRAssessment = stageKey === "phase_2" && 
              phase2Completed && 
              hrAssessment;

            // Check if HR assessment is pending
            const isHRAssessmentPending = isPhase2HRAssessment && 
              hrAssessment.status === "pending_assessment";

            // Check if HR assessment is completed but decision pending
            const isHRDecisionPending = isPhase2HRAssessment && 
              hrAssessment.status === "assessment_completed";

            // Check if HR assessment is rejected
            const isHRAssessmentRejected = isPhase2HRAssessment && 
              hrAssessment.status === "decision_made" && 
              hrAssessment.hrDecision === "reject";

            // Check if HR assessment is approved
            const isHRAssessmentApproved = isPhase2HRAssessment && 
              hrAssessment.status === "decision_made" && 
              hrAssessment.hrDecision === "approve";

            return (
              <div
                key={stageKey}
                className={`border rounded-lg p-4 transition-all duration-200 ${
                  isPhase2Rejected || isHRAssessmentRejected
                    ? "border-red-300 bg-red-50"
                    : isHRAssessmentPending || isHRDecisionPending
                    ? "border-yellow-300 bg-yellow-50"
                    : isHRAssessmentApproved
                    ? "border-green-300 bg-green-50"
                    : phaseCompleted
                    ? "border-green-300 bg-green-50"
                    : isCurrentStage
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    {isPhase2Rejected || isHRAssessmentRejected ? (
                      <XCircle className="w-6 h-6 text-red-500" />
                    ) : isHRAssessmentPending || isHRDecisionPending ? (
                      <AlertTriangle className="w-6 h-6 text-yellow-500" />
                    ) : isHRAssessmentApproved ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : phaseCompleted ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : isCurrentStage ? (
                      <CheckCircle className="w-6 h-6 text-blue-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">
                        {onboardingService.getPhaseTitle(stageKey)}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {tasks.filter((t) => t.isCompleted).length}/
                        {tasks.length} Tasks
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {onboardingService.getPhaseDescription(stageKey)}
                    </p>

                    {/* Show rejection message for Phase 2 if HR rejected supervisor assessment */}
                    {isPhase2Rejected && (
                      <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-md">
                        <div className="flex items-center">
                          <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                          <div>
                            <p className="text-red-800 font-medium">Assessment Rejected</p>
                            <p className="text-red-600 text-sm">
                              {supervisorAssessment.hrDecisionComments || 
                                "Your Phase 1 assessment has been rejected by HR. Please contact your supervisor for more information."}
                            </p>
                            {supervisorAssessment.hrDecisionDate && (
                              <p className="text-red-500 text-xs mt-1">
                                Decision Date: {new Date(supervisorAssessment.hrDecisionDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Show pending approval message for Phase 2 if waiting for HR */}
                    {stageKey === "phase_2" && 
                     phase1Completed && 
                     supervisorAssessment?.status === "hr_approval_pending" && (
                      <div className="mt-3 p-3 bg-yellow-100 border border-yellow-200 rounded-md">
                        <div className="flex items-center">
                          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                          <div>
                            <p className="text-yellow-800 font-medium">Assessment Under Review</p>
                            <p className="text-yellow-600 text-sm">
                              Your Phase 1 assessment is currently being reviewed by HR. You will be notified once a decision is made.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Show HR assessment pending message for Phase 2 */}
                    {isHRAssessmentPending && (
                      <div className="mt-3 p-3 bg-blue-100 border border-blue-200 rounded-md">
                        <div className="flex items-center">
                          <AlertTriangle className="w-5 h-5 text-blue-600 mr-2" />
                          <div>
                            <p className="text-blue-800 font-medium">HR Assessment Pending</p>
                            <p className="text-blue-600 text-sm">
                              Your Phase 2 completion is being assessed by HR. You will be notified once the assessment is complete.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Show HR assessment completed but decision pending */}
                    {isHRDecisionPending && (
                      <div className="mt-3 p-3 bg-purple-100 border border-purple-200 rounded-md">
                        <div className="flex items-center">
                          <AlertTriangle className="w-5 h-5 text-purple-600 mr-2" />
                          <div>
                            <p className="text-purple-800 font-medium">HR Assessment Completed</p>
                            <p className="text-purple-600 text-sm">
                              Your Phase 2 assessment has been completed by HR. Final decision is pending.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Show HR assessment rejection message */}
                    {isHRAssessmentRejected && (
                      <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-md">
                        <div className="flex items-center">
                          <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                          <div>
                            <p className="text-red-800 font-medium">Final Assessment Rejected</p>
                            <p className="text-red-600 text-sm">
                              {hrAssessment.hrDecisionComments || 
                                "Your Phase 2 assessment has been rejected by HR. Please contact HR for more information."}
                            </p>
                            {hrAssessment.hrDecisionDate && (
                              <p className="text-red-500 text-xs mt-1">
                                Decision Date: {new Date(hrAssessment.hrDecisionDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Show HR assessment approval message */}
                    {isHRAssessmentApproved && (
                      <div className="mt-3 p-3 bg-green-100 border border-green-200 rounded-md">
                        <div className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                          <div>
                            <p className="text-green-800 font-medium">Onboarding Completed!</p>
                            <p className="text-green-600 text-sm">
                              Congratulations! Your onboarding has been successfully completed and approved by HR.
                            </p>
                            {hrAssessment.hrDecisionDate && (
                              <p className="text-green-500 text-xs mt-1">
                                Completion Date: {new Date(hrAssessment.hrDecisionDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Always show tasks for all phases */}
                    <div className="mt-3 space-y-2">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center text-sm"
                        >
                          <CheckCircle
                            className={`w-4 h-4 mr-2 ${
                              task.isCompleted
                                ? "text-green-500"
                                : "text-gray-300"
                            }`}
                          />
                          <span
                            className={`${
                              task.isCompleted
                                ? "text-gray-800"
                                : "text-gray-400"
                            } ${isEmployee ? "italic" : ""}`}
                          >
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OnboardingProgress;
