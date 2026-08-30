import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PageHeader = ({ title, description, backTo, actions }) => {
  return (
    <div className="flex flex-col gap-4 border-b border-white/8 px-4 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
      <div>
        {backTo && (
          <Link
            to={backTo}
            className="mb-2 inline-flex items-center gap-1 text-sm text-gray transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
};

export default PageHeader;
