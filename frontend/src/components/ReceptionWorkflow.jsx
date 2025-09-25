import NewBatch from "./NewBatch";
import BatchLists from "./BatchLists";

export default function ReceptionWorkflow({ batches }) {
  return (
    <div className="flex flex-col gap-4">
      <NewBatch />
      <BatchLists batches={batches} />
    </div>
  );
}
