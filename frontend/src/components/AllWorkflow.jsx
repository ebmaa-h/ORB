import { useEffect } from 'react'

export default function AllWorkflow({ batches }) {
  useEffect(() => {
    console.log("All batches:", batches);
  }, [batches]);

  return (
    <div>
      all tab
    </div>
  )
}
