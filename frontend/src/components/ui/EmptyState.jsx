import React from "react";
import { Inbox } from "lucide-react";

const EmptyState = ({ title = "Nothing here yet", description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <Inbox className="h-10 w-10 text-gray" />
      <p className="font-semibold text-white">{title}</p>
      {description && <p className="max-w-sm text-sm text-gray">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
};

export default EmptyState;
