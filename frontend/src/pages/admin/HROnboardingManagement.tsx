import React, { useState, useEffect } from "react";
import { Card, Progress, Table, Button, message, Tag } from "antd";
import { CheckCircleOutlined, CheckOutlined } from "@ant-design/icons";

interface Task {
  id: string;
  title: string;
  stage: string;
  completed: boolean;
  order: number;
}

interface PhaseProgress {
  [key: string]: number;
}

interface TasksByPhase {
  [key: string]: Task[];
}

const HROnboardingManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<PhaseProgress>({});
  const [tasksByPhase, setTasksByPhase] = useState<TasksByPhase>({});
  const [overallProgress, setOverallProgress] = useState(0);

  const phases = ["prepare", "orient", "land", "integrate", "excel"];
  const phaseDisplayNames = {
    prepare: "Preparation",
    orient: "Orientation",
    land: "Landing",
    integrate: "Integration",
    excel: "Excellence",
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/onboarding/progress/detailed");
      const data = await response.json();
      setProgress(data.progress);
      setTasksByPhase(data.tasksByPhase);
      setOverallProgress(data.progress.overall);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching progress:", error);
      message.error("Failed to load onboarding progress");
      setLoading(false);
    }
  };

  const handleValidateTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/onboarding/tasks/${taskId}/validate`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to validate task");

      message.success("Task validated successfully");
      fetchProgress(); // Refresh data
    } catch (error) {
      console.error("Error validating task:", error);
      message.error("Failed to validate task");
    }
  };

  const getTaskStatusTag = (task: Task) => {
    if (task.completed) {
      return (
        <Tag color="blue" icon={<CheckOutlined />}>
          Completed
        </Tag>
      );
    }
    return <Tag color="default">Not Completed</Tag>;
  };

  const columns = [
    {
      title: "Task",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Status",
      key: "status",
      render: (task: Task) => getTaskStatusTag(task),
    },
    {
      title: "Actions",
      key: "actions",
      render: (task: Task) =>
        task.completed ? (
          <Button type="primary" onClick={() => handleValidateTask(task.id)}>
            Validate
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">HR Onboarding Management</h1>

      {/* Overall Progress */}
      <Card className="mb-6">
        <h2 className="text-xl mb-4">Overall Onboarding Progress</h2>
        <Progress
          percent={overallProgress}
          status="active"
          strokeColor={{
            "0%": "#108ee9",
            "100%": "#87d068",
          }}
        />
      </Card>

      {/* Phase-wise Progress and Tasks */}
      {phases.map((phase) => (
        <Card
          key={phase}
          title={phaseDisplayNames[phase]}
          className="mb-4"
          extra={<span>Progress: {progress[phase]}%</span>}
        >
          <Progress
            percent={progress[phase]}
            status="active"
            strokeColor={{
              "0%": "#108ee9",
              "100%": "#87d068",
            }}
            className="mb-4"
          />
          <Table
            dataSource={tasksByPhase[phase]}
            columns={columns}
            rowKey="id"
            pagination={false}
            loading={loading}
          />
        </Card>
      ))}
    </div>
  );
};

export default HROnboardingManagement;
