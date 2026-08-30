import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import EmptyState from "./EmptyState";
import Loader from "./Loader";

const DataTable = ({
  columns,
  data,
  keyField = "_id",
  onRowClick,
  actions,
  loading = false,
  emptyTitle = "No records found",
  emptyDescription,
  emptyAction,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  toolbarRight,
  pageSize = 8,
}) => {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [data.length, searchValue]);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const paged = data.slice((page - 1) * pageSize, page * pageSize);

  const showToolbar = onSearchChange || toolbarRight;

  return (
    <div>
      {showToolbar && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {onSearchChange ? (
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-xl border border-white/10 bg-elevated py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-gray/70 focus:outline-none focus:ring-2 focus:ring-red/60"
              />
            </div>
          ) : (
            <div />
          )}
          {toolbarRight}
        </div>
      )}

      {loading && data.length === 0 ? (
        <Loader />
      ) : data.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-white/8 bg-surface">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/8 bg-white/3">
                  {columns.map((col) => (
                    <th key={col.key} className={`px-4 py-3.5 font-medium text-gray ${col.className || ""}`}>
                      {col.header}
                    </th>
                  ))}
                  {actions && <th className="px-4 py-3.5" />}
                </tr>
              </thead>
              <tbody>
                {paged.map((row) => (
                  <tr
                    key={row[keyField]}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`border-b border-white/5 last:border-0 ${
                      onRowClick ? "cursor-pointer hover:bg-white/4" : ""
                    }`}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`px-4 py-3.5 align-middle text-white ${col.className || ""}`}>
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        {actions(row)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-xl border border-white/10 px-3 py-1.5 text-white disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 rounded-xl border border-white/10 px-3 py-1.5 text-white disabled:opacity-30"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DataTable;
