import React from "react";


export type Column<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T, index: number) => React.ReactNode;
};


type TableProps<T> = {
  columns: Column<T>[];
  data: T[];
};



export default function Table<T>({ columns, data }: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-yellow-300 text-black">
          <tr>
            {columns.map((col) => (
              <th
                key={col.label}
                className="px-4 py-3 text-left font-semibold"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              className="border-t border-black/10 hover:bg-yellow-50"
            >
              {columns.map((col) => (
                <td key={String(col.key)} className="px-4 py-3">
                  {col.render ? col.render(row, i) : (row as Record<string, unknown>)[String(col.key)] as React.ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
