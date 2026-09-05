import React from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * DataTable - Reusable enterprise data table with responsive scrolling,
 * custom cell renderers, empty states, and pagination controls.
 *
 * @param {Object} props
 * @param {Array<{
 *   key: string,
 *   label: string,
 *   render?: (row: any, index: number) => React.ReactNode,
 *   align?: 'left'|'center'|'right',
 *   className?: string,
 *   headerClassName?: string
 * }>} props.columns - Column configuration
 * @param {Array<Object>} props.data - Array of table row records
 * @param {boolean} [props.loading=false] - Whether data is actively loading
 * @param {string} [props.keyField='_id'] - Unique record identifier field
 * @param {Function} [props.onRowClick] - Optional callback when row is clicked
 * @param {string} [props.emptyTitle='No records found'] - Heading for empty data
 * @param {string} [props.emptyDescription='There are no items to display at this time.'] - Empty subtitle
 * @param {React.ReactNode} [props.emptyAction] - Action button if table is empty
 * @param {{
 *   page: number,
 *   totalPages: number,
 *   totalRecords?: number,
 *   onPageChange: (newPage: number) => void
 * }} [props.pagination] - Pagination properties
 * @param {string} [props.className=''] - Additional wrapper classes
 */
export const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  keyField = '_id',
  onRowClick,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display at this time.',
  emptyAction,
  pagination,
  className = '',
}) => {
  const getAlignmentClass = (align) => {
    if (align === 'right') return 'text-right justify-end';
    if (align === 'center') return 'text-center justify-center';
    return 'text-left justify-start';
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col ${className}`}>
      {/* Table responsive viewport */}
      <div className="overflow-x-auto min-h-[160px]">
        <table className="w-full text-left text-sm text-gray-600 border-collapse">
          <thead className="bg-slate-50/80 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold select-none">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key || col.label}
                  className={`py-3.5 px-4 whitespace-nowrap ${getAlignmentClass(col.align)} ${col.headerClassName || ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              // Skeleton rows
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="animate-pulse">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="py-4 px-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-4/5" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty Table Body
              <tr>
                <td colSpan={columns.length} className="py-12 px-4 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">{emptyTitle}</h4>
                    <p className="text-xs text-gray-500 mb-4">{emptyDescription}</p>
                    {emptyAction}
                  </div>
                </td>
              </tr>
            ) : (
              // Data Rows
              data.map((row, rowIdx) => {
                const rowKey = row[keyField] || row.id || rowIdx;
                const isClickable = typeof onRowClick === 'function';

                return (
                  <tr
                    key={rowKey}
                    onClick={() => isClickable && onRowClick(row)}
                    className={`transition-colors duration-150 ${
                      isClickable ? 'cursor-pointer hover:bg-slate-50' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key || col.label}
                        className={`py-3.5 px-4 align-middle whitespace-nowrap ${getAlignmentClass(col.align)} ${col.className || ''}`}
                      >
                        {col.render ? col.render(row, rowIdx) : row[col.key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-4 py-3 bg-slate-50/60 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div>
            Showing page <span className="font-semibold text-gray-800">{pagination.page}</span> of{' '}
            <span className="font-semibold text-gray-800">{pagination.totalPages}</span>
            {pagination.totalRecords !== undefined && (
              <span> ({pagination.totalRecords} total records)</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </button>

            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm font-medium"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
