const ALIGN = {
  right: "text-right",
  center: "text-center",
  left: "text-left",
};

function cell(column, row) {
  return column.render ? column.render(row) : row[column.key];
}

/**
 * Renders a real table from `md` up and stacked label/value cards below it,
 * so the wide admin tables stay readable on a phone instead of scrolling sideways.
 *
 * Column shape: { key, header, render?, align?, primary?, label? }
 * - `primary` marks the column used as the card heading on mobile.
 * - `label: false` keeps a column out of the mobile definition list (used for actions).
 */
export default function DataTable({ columns, rows, rowKey, empty = null, caption }) {
  if (!rows || rows.length === 0) return empty;

  const keyOf = (row, index) => (rowKey ? rowKey(row) : (row.id ?? index));
  const primary = columns.find((column) => column.primary) || columns[0];
  const secondary = columns.filter(
    (column) => column !== primary && column.label !== false
  );
  const actions = columns.filter(
    (column) => column !== primary && column.label === false
  );

  return (
    <>
      <div className="mf-card hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="mf-table">
            {caption ? <caption className="sr-only">{caption}</caption> : null}
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={ALIGN[column.align] || ALIGN.left}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={keyOf(row, index)}>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={ALIGN[column.align] || ALIGN.left}
                    >
                      {cell(column, row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ul className="space-y-3 md:hidden">
        {rows.map((row, index) => (
          <li key={keyOf(row, index)} className="mf-card p-4">
            <div className="pb-3">{cell(primary, row)}</div>
            {secondary.length ? (
              <dl className="space-y-2 border-t border-hairline pt-3">
                {secondary.map((column) => (
                  <div
                    key={column.key}
                    className="flex items-start justify-between gap-4"
                  >
                    <dt className="shrink-0 pt-0.5 text-xs font-medium text-muted">
                      {column.header}
                    </dt>
                    <dd className="min-w-0 text-right text-sm text-ink">
                      {cell(column, row)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {actions.length ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-hairline pt-3">
                {actions.map((column) => (
                  <div key={column.key}>{cell(column, row)}</div>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
