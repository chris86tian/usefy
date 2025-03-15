import { Archive } from "lucide-react";

const ArchivedOverlay = () => (
    <div className="absolute inset-0 bg-black/90 flex items-center justify-center flex-col gap-2 p-4 text-center rounded-lg">
      <Archive className="h-12 w-12" />
      <p className="text-lg font-semibold">Archived</p>
      <p className="text-sm text-gray-300">This course is no longer available for viewing</p>
    </div>
  )

export default ArchivedOverlay;