'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import DataTable from '@/components/DataTable';
import Badge from '@/components/Badge';
import { useExpenses } from '@/hooks/useSales';
import AddExpenseModal from '@/components/AddExpenseModal';
import { Plus, Search } from 'lucide-react';

export default function ExpensesPage() {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseSearch, setExpenseSearch] = useState('');
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();

  const filteredExpenses = expenseSearch
    ? expenses.filter((e) =>
        e.category.toLowerCase().includes(expenseSearch.toLowerCase()) ||
        (e.description ?? '').toLowerCase().includes(expenseSearch.toLowerCase())
      )
    : expenses;

  return (
    <div className="flex flex-col flex-1 h-full max-h-screen overflow-hidden">
      <Navbar title="Expenses" subtitle="Manage your business expenses" />

      <AddExpenseModal open={showAddExpense} onClose={() => setShowAddExpense(false)} />

      <main className="flex-1 p-6 space-y-5 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 w-64">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={expenseSearch}
              onChange={(e) => setExpenseSearch(e.target.value)}
              className="text-sm outline-none bg-transparent w-full placeholder-slate-400"
            />
          </div>
          <button
            onClick={() => setShowAddExpense(true)}
            className="flex items-center gap-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-3 py-2 font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> Add Expense
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex-1">
          <DataTable
            data={filteredExpenses as unknown as Record<string, unknown>[]}
            columns={[
              {
                header: 'Date',
                accessor: 'expenseDate',
                cell: (row: Record<string, unknown>) => new Date(row.expenseDate as string).toLocaleDateString(),
              },
              { header: 'Category', accessor: 'category' },
              {
                header: 'Amount',
                accessor: 'amount',
                cell: (row: Record<string, unknown>) => `$${Number(row.amount).toLocaleString()}`,
              },
              {
                header: 'Status',
                accessor: 'status',
                cell: (row: Record<string, unknown>) => (
                  <Badge variant={row.status === 'PAID' ? 'success' : 'warning'}>
                    {row.status as string}
                  </Badge>
                ),
              },
              { header: 'Reference', accessor: 'reference' },
            ]}
            isLoading={expensesLoading}
          />
        </div>
      </main>
    </div>
  );
}
