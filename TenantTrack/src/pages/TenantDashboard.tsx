import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'
import { getMyBills, getMyExpenses } from '../utils/expenseService'

export default function TenantDashboard() {
  const [bills, setBills] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load data on mount
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [billsData, expensesData] = await Promise.all([
        getMyBills(),
        getMyExpenses()
      ])
      setBills(billsData || [])
      setExpenses(expensesData || [])
    } catch (error) {
      console.error(error)
      alert('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tenant Dashboard</h1>
        <button 
          onClick={handleLogout}
          className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 transition-colors"
        >
          Sign Out
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* MONTHLY BILLS */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">My Monthly Bills</h2>
          {bills.length === 0 ? (
            <p className="text-gray-500 text-sm">No bills issued yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="border-b bg-gray-50 text-gray-700 uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-4 py-3">Month</th>
                    <th className="px-4 py-3 text-right">Amount Due</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bills.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {b.monthly_records ? `${b.monthly_records.year}-${String(b.monthly_records.month).padStart(2, '0')}` : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">${Number(b.amount_due).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-mono text-green-600">${Number(b.amount_paid).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          b.status === 'Green' ? 'bg-green-100 text-green-800' :
                          b.status === 'Yellow' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* EXPENSES */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">My Expense Shares</h2>
          {expenses.length === 0 ? (
            <p className="text-gray-500 text-sm">No expenses allocated to you yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="border-b bg-gray-50 text-gray-700 uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">My Share</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {expense.description || 'Unknown Expense'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-red-600">
                        ${Number(expense.amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-green-600">
                        ${Number(expense.amount_paid || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          expense.status === 'Green' ? 'bg-green-100 text-green-800' :
                          expense.status === 'Yellow' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {expense.status || 'Red'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}