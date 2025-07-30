import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spin, Alert, Typography, Button, message } from "antd";
import { SaveOutlined, RollbackOutlined } from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import OnboardingPhase from "../components/onboarding/OnboardingPhase";
import OnboardingSummary from "../components/onboarding/OnboardingSummary";
import { OnboardingJourney, Task, OnboardingStage } from "../types/onboarding";
import onboardingService from "../services/onboardingService";

const { Title } = Typography;

const OnboardingDetail: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [journey, setJourney] = useState<OnboardingJourney | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Determine permissions and endpoints based on user role
  const isHR = user?.role === "hr";
  const isSupervisor = user?.role === "supervisor";
  const isManager = user?.role === "manager";
  const isEmployee = user?.role === "employee";
  const isViewingOwnJourney = !userId || userId === user?.id;

  // Determine what actions the user can perform
  const canEditTasks = onboardingService.canEditTasks(user?.role || "employee");
  const canAdvancePhases = onboardingService.canAdvancePhases(
    user?.role || "employee"
  );
  const canValidateTasks = onboardingService.canValidateTasks(
    user?.role || "employee"
  );

  useEffect(() => {
    const fetchJourney = async () => {
      try {
        setLoading(true);
        const targetUserId = userId || user?.id;
        if (!targetUserId) throw new Error("User ID not available");

        let data;

        // Use role-appropriate endpoint
        if (isViewingOwnJourney) {
          // Employee viewing their own journey
          data = await onboardingService.getMyProgress();
        } else if (isHR) {
          // HR viewing any user's journey
          data = await onboardingService.getUserProgressHR(targetUserId);
        } else if (isSupervisor || isManager) {
          // Supervisor or Manager viewing direct report/department member's journey
          data = await onboardingService.getUserProgress(targetUserId);
        } else {
          throw new Error(
            "Insufficient permissions to view this onboarding journey"
          );
        }

        // Map API response to OnboardingJourney shape if needed
        const rawData = data as unknown;
        const tasksByPhase =
          (rawData as { tasksByPhase?: Record<string, Task[]> }).tasksByPhase ||
          {};
        const perPhaseProgress =
          typeof (rawData as { progress?: unknown }).progress === "object"
            ? (rawData as { progress: Record<string, number> }).progress
            : {};
        const mappedJourney = {
          user: data.User,
          progress: {
            id: data.id,
            stage: data.stage,
            progress: data.progress?.overall ?? 0,
            stageStartDate: data.stageStartDate,
            estimatedCompletionDate: data.estimatedCompletionDate,
            UserId: data.User?.id,
            User: data.User,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          },
          overallProgress: data.progress?.overall ?? 0,
          currentStage: data.stage,
          tasksCompleted: Object.values(tasksByPhase)
            .flat()
            .filter((task: unknown) => {
              const t = task as Task;
              return (
                t.completed ||
                (typeof t === "object" &&
                  t !== null &&
                  "isCompleted" in t &&
                  (t as { isCompleted?: boolean }).isCompleted)
              );
            }).length,
          totalTasks: Object.values(tasksByPhase).flat().length,
          phases: (Object.keys(tasksByPhase) as string[]).map((phaseKey) => ({
            stage: phaseKey as OnboardingStage,
            title: phaseKey.charAt(0).toUpperCase() + phaseKey.slice(1),
            description: "",
            tasks: (tasksByPhase[phaseKey] || []).map((task: unknown) => {
              const t = task as Task;
              return {
                ...t,
                id: t.id ?? "",
                completed:
                  typeof t.completed === "boolean"
                    ? t.completed
                    : (typeof t === "object" &&
                        t !== null &&
                        "isCompleted" in t &&
                        (t as { isCompleted?: boolean }).isCompleted) ||
                      false,
              };
            }),
            completionPercentage:
              typeof perPhaseProgress[phaseKey] === "number"
                ? perPhaseProgress[phaseKey]
                : 0,
            isActive: data.stage === phaseKey,
            isCompleted:
              typeof perPhaseProgress[phaseKey] === "number" &&
              perPhaseProgress[phaseKey] === 100,
          })),
        };
        setJourney(mappedJourney);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch onboarding journey:", err);
        setError("Failed to load onboarding journey. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchJourney();
  }, [userId, user, isViewingOwnJourney, isHR, isSupervisor, isManager]);

  const handleTaskComplete = async (
    phaseIndex: number,
    taskId: string,
    completed: boolean
  ) => {
    if (!journey || !user) return;
    // Check if user can edit tasks
    if (!canEditTasks) {
      message.error("You do not have permission to edit tasks");
      return;
    }
    try {
      // Use role-appropriate endpoint
      const targetUserId = userId || user.id;
      if (isHR) {
        await onboardingService.updateTaskCompletion(
          taskId,
          completed,
          targetUserId
        );
      } else if (isSupervisor) {
        await onboardingService.updateTaskCompletion(
          taskId,
          completed,
          targetUserId
        );
      } else {
        message.error("You do not have permission to complete tasks");
        return;
      }
      // Update local state
      const updatedJourney = { ...journey };
      if (updatedJourney.phases && updatedJourney.phases[phaseIndex]) {
        const task = updatedJourney.phases[phaseIndex].tasks.find(
          (t) => t.id === taskId
        ) as Task;
        if (task) {
          task.completed = completed;
          task.completedAt = completed ? new Date().toISOString() : undefined;
          setJourney(updatedJourney);
          setHasChanges(true);
        }
      }
      message.success(
        completed ? "Task marked as complete" : "Task marked as not completed"
      );
    } catch (err) {
      console.error("Failed to complete task:", err);
      message.error("Failed to update task. Please try again.");
    }
  };

  const handleAdvancePhase = async () => {
    if (!journey || !userId || !canAdvancePhases) {
      message.error("You do not have permission to advance phases");
      return;
    }

    try {
      // Use role-appropriate endpoint
      if (isHR) {
        await onboardingService.advanceToNextPhaseHR(userId);
      } else if (isSupervisor) {
        await onboardingService.advanceToNextPhase(userId);
      } else {
        message.error("You do not have permission to advance phases");
        return;
      }

      // Refresh journey data
      const updatedJourney = await onboardingService.getJourney(userId);
      setJourney(updatedJourney);

      message.success("Advanced to next phase successfully");
    } catch (err) {
      console.error("Failed to advance phase:", err);
      message.error("Failed to advance to next phase. Please try again.");
    }
  };

  const handleTaskVerify = async (
    progressId: string,
    status: "approved" | "rejected",
    notes?: string
  ) => {
    if (!canValidateTasks) {
      message.error("Only HR can validate tasks");
      return;
    }

    try {
      await onboardingService.verifyChecklistItem(progressId, status, notes);
      // Refresh journey data
      const targetUserId = userId || user?.id;
      if (targetUserId) {
        const updatedJourney = await onboardingService.getJourney(targetUserId);
        setJourney(updatedJourney);
        setHasChanges(false); // Reset changes after verification
      }
    } catch (err) {
      console.error("Failed to verify task:", err);
      message.error("Failed to verify task. Please try again.");
    }
  };

  const handleSaveProgress = async () => {
    if (!journey || !user) return;

    try {
      setSaving(true);

      // Collect all completed tasks
      const completedTasks = journey.phases
        .flatMap((phase) => phase.tasks)
        .filter((task) => task.completed)
        .map((task) => ({
          id: task.id,
          completed: task.completed,
          hrValidated: task.hrValidated || false,
        }));

      // Use role-appropriate endpoint
      const targetUserId = userId || user.id;
      if (!targetUserId) throw new Error("User ID not available");

      // For each task, update its completion status with the user ID
      const updatePromises = completedTasks.map((task) => {
        return onboardingService.updateTaskCompletion(
          task.id,
          task.completed,
          targetUserId
        );
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);

      // Also update the overall progress using the existing endpoints
      if (isHR) {
        await onboardingService.updateUserProgressHR(targetUserId, {
          tasks: completedTasks,
        });
      } else if (isSupervisor) {
        await onboardingService.updateUserProgress(targetUserId, {
          tasks: completedTasks,
        });
      } else {
        message.error("You do not have permission to save progress");
        return;
      }

      message.success("Progress saved successfully");
      setHasChanges(false);
    } catch (err) {
      console.error("Failed to save progress:", err);
      message.error("Failed to save progress. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Add a function to refresh the journey data
  const refreshJourney = async () => {
    try {
      setLoading(true);
      const targetUserId = userId || user?.id;
      if (!targetUserId) throw new Error("User ID not available");
      let data;
      if (isViewingOwnJourney) {
        data = await onboardingService.getMyProgress();
      } else if (isHR) {
        data = await onboardingService.getUserProgressHR(targetUserId);
      } else if (isSupervisor || isManager) {
        data = await onboardingService.getUserProgress(targetUserId);
      } else {
        throw new Error(
          "Insufficient permissions to view this onboarding journey"
        );
      }
      // Map API response to OnboardingJourney shape if needed (same as in useEffect)
      const rawData = data as unknown;
      const tasksByPhase =
        (rawData as { tasksByPhase?: Record<string, Task[]> }).tasksByPhase ||
        {};
      const perPhaseProgress =
        typeof (rawData as { progress?: unknown }).progress === "object"
          ? (rawData as { progress: Record<string, number> }).progress
          : {};
      const mappedJourney = {
        user: data.User,
        progress: {
          id: data.id,
          stage: data.stage,
          progress: data.progress?.overall ?? 0,
          stageStartDate: data.stageStartDate,
          estimatedCompletionDate: data.estimatedCompletionDate,
          UserId: data.User?.id,
          User: data.User,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        },
        overallProgress: data.progress?.overall ?? 0,
        currentStage: data.stage,
        tasksCompleted: Object.values(tasksByPhase)
          .flat()
          .filter((task: unknown) => {
            const t = task as Task;
            return (
              t.completed ||
              (typeof t === "object" &&
                t !== null &&
                "isCompleted" in t &&
                (t as { isCompleted?: boolean }).isCompleted)
            );
          }).length,
        totalTasks: Object.values(tasksByPhase).flat().length,
        phases: (Object.keys(tasksByPhase) as string[]).map((phaseKey) => ({
          stage: phaseKey as OnboardingStage,
          title: phaseKey.charAt(0).toUpperCase() + phaseKey.slice(1),
          description: "",
          tasks: (tasksByPhase[phaseKey] || []).map((task: unknown) => {
            const t = task as Task;
            return {
              ...t,
              id: t.id ?? "",
              completed:
                typeof t.completed === "boolean"
                  ? t.completed
                  : (typeof t === "object" &&
                      t !== null &&
                      "isCompleted" in t &&
                      (t as { isCompleted?: boolean }).isCompleted) ||
                    false,
            };
          }),
          completionPercentage:
            typeof perPhaseProgress[phaseKey] === "number"
              ? perPhaseProgress[phaseKey]
              : 0,
          isActive: data.stage === phaseKey,
          isCompleted:
            typeof perPhaseProgress[phaseKey] === "number" &&
            perPhaseProgress[phaseKey] === 100,
        })),
      };
      setJourney(mappedJourney);
      setError(null);
    } catch (err) {
      setError("Failed to load onboarding journey. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        className="max-w-3xl mx-auto mt-8"
      />
    );
  }

  if (!journey) {
    return (
      <Alert
        message="No Onboarding Journey"
        description="No onboarding journey found for this user."
        type="info"
        showIcon
        className="max-w-3xl mx-auto mt-8"
      />
    );
  }

  // Use phases if available, otherwise fallback to stages
  let journeyPhases = journey.phases || journey.stages || [];

  // Only show current phase for employees viewing their own journey
  if (isEmployee && isViewingOwnJourney && Array.isArray(journeyPhases)) {
    journeyPhases = journeyPhases.filter(
      (phase) => phase.stage === journey.currentStage
    );
  }

  if (!Array.isArray(journeyPhases) || journeyPhases.length === 0) {
    return (
      <Alert
        message="No Onboarding Phases"
        description="No onboarding phases found for this user."
        type="info"
        showIcon
        className="max-w-3xl mx-auto mt-8"
      />
    );
  }

  const currentPhaseIndex = journeyPhases.findIndex(
    (phase) =>
      Array.isArray(phase.tasks) && phase.tasks.some((task) => !task.completed)
  );

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>
          {isViewingOwnJourney
            ? "My Onboarding Journey"
            : `${
                journey.user && journey.user.name
                  ? journey.user.name
                  : "Employee"
              }'s Onboarding Journey`}
        </Title>

        {/* Show role-specific information */}
        <div className="flex items-center gap-4">
          {isEmployee && (
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded">
              Read-only view
            </div>
          )}

          {canEditTasks && !isViewingOwnJourney && (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveProgress}
              loading={saving}
              disabled={!hasChanges}
            >
              Save Progress
            </Button>
          )}

          {!isViewingOwnJourney && (
            <Button
              type="default"
              icon={<RollbackOutlined />}
              onClick={() => navigate("/admin/onboarding")}
            >
              Exit
            </Button>
          )}
        </div>
      </div>

      <OnboardingSummary journey={journey} />

      <div className="space-y-6">
        {journeyPhases.map((phase, index) => (
          <OnboardingPhase
            key={index}
            title={phase.title}
            description={phase.description}
            progress={Math.round(
              (phase.tasks.filter((t) => t.completed).length /
                phase.tasks.length) *
                100
            )}
            tasks={phase.tasks}
            isCurrentPhase={index === currentPhaseIndex}
            onTaskComplete={(taskId, completed) =>
              handleTaskComplete(index, taskId, completed)
            }
            canEditTasks={canEditTasks}
            userRole={user?.role || "employee"}
            onTaskVerify={handleTaskVerify}
            refreshJourney={refreshJourney}
          />
        ))}
      </div>
    </div>
  );
};

export default OnboardingDetail;
