import { useContext } from "react";
import { WorkflowContext } from "../context/WorkflowContext";
import WorkflowEngine from "../components/workflow/WorkflowEngine";

export default function Workflow() {
  const { activeDept } = useContext(WorkflowContext);

  return (
    <div>
      <WorkflowEngine department={activeDept} />
    </div>
  );
}