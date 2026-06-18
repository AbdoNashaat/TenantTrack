import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'
import { getAllTenants, getAllBills, getAllExpenses, generateMonthlyBills, createSplitExpense, getAllApartments, updateBill, updateExpense } from '../utils/adminService'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('tenants')
  const [tenants, setTenants] = useState<any[]>([])
  const [bills, setBills] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [apartments, setApartments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Bills Form
  const [billYear, setBillYear] = useState(new Date().getFullYear())
  const [billMonth, setBillMonth] = useState(new Date().getMonth() + 1)
  const [isGeneratingBills, setIsGeneratingBills] = useState(false)
  const [editingBill, setEditingBill] = useState<any>(null)

  // Expense Split Form
  const [expenseDesc, setExpenseDesc] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [splitShares, setSplitShares] = useState<any[]>([])
  const [isSplitting, setIsSplitting] = useState(false)
  const [isSavingExpense, setIsSavingExpense] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [tData, bData, eData, aData] = await Promise.all([
        getAllTenants(),
        getAllBills(),
        getAllExpenses(),
        getAllApartments()
      ])
      setTenants(tData || [])
      setBills(bData || [])
      setExpenses(eData || [])
      setApartments(aData || [])
    } catch (error) {
      console.error(error)
      alert('Failed to load admin data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const handleGenerateBills = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGeneratingBills(true)
    try {
      const count = await generateMonthlyBills(billYear, billMonth)
      alert(`Successfully generated ${count} bills!`)
      fetchData()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsGeneratingBills(false)
    }
  }

  const handleUpdateBill = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateBill(editingBill.id, Number(editingBill.amount_paid), editingBill.status)
      setEditingBill(null)
      fetchData()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateExpense(editingExpense.id, Number(editingExpense.amount_paid), editingExpense.status)
      setEditingExpense(null)
      fetchData()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleStartExpenseSplit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenants || tenants.length === 0) return alert('No tenants available to split expense with.')
    
    const amount = parseFloat(expenseAmount)
    const splitAmount = Number((amount / tenants.length).toFixed(2))
    
    setSplitShares(tenants.map(t => ({
      tenantId: t.id,
      name: t.name,
      amount: splitAmount
    })))
    setIsSplitting(true)
  }

  const handleShareChange = (tenantId: string, amount: string) => {
    setSplitShares(shares => shares.map(s => 
      s.tenantId === tenantId ? { ...s, amount: parseFloat(amount) || 0 } : s
    ))
  }

  const handleSaveSplitExpense = async () => {
    setIsSavingExpense(true)
    try {
      const totalAmount = parseFloat(expenseAmount)
      await createSplitExpense(expenseDesc, totalAmount, splitShares)
      alert('Expense logged and split successfully!')
      setExpenseDesc('')
      setExpenseAmount('')
      setIsSplitting(false)
      fetchData()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsSavingExpense(false)
    }
  }

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading admin dashboard...</div>

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <button 
          onClick={handleLogout}
          className="rounded-md bg-red-50 text-red-700 px-4 py-2 text-sm font-medium hover:bg-red-100 transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {['tenants', 'bills', 'expenses'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium capitalize transition-colors`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        {activeTab === 'tenants' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">All Tenants</h2>
            </div>
            
            {/* Create Tenant Form */}
            <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Register New Tenant</h3>
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const formData = new FormData(form);
                  try {
                    const { createTenant } = await import('../utils/adminService');
                    const aptId = formData.get('apartmentId') as string;
                    await createTenant({
                      email: formData.get('email'),
                      password: formData.get('password'),
                      name: formData.get('name'),
                      phoneNumber: formData.get('phone'),
                      standardMonthlyFee: Number(formData.get('fee')),
                      apartmentId: aptId || null
                    }, formData.get('serviceRoleKey') as string);
                    alert('Tenant created successfully!');
                    form.reset();
                    fetchData(); // reload
                  } catch (err: any) {
                    alert('Failed to create tenant: ' + err.message);
                  }
                }} 
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 items-end"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input name="name" type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input name="email" type="email" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input name="password" type="password" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input name="phone" type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Standard Fee ($)</label>
                  <input name="fee" type="number" step="0.01" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Apartment</label>
                  <select name="apartmentId" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border bg-white">
                    <option value="">Unassigned</option>
                    {apartments.map(apt => (
                      <option key={apt.id} value={apt.id}>Floor {apt.floor_number}, Unit {apt.unit_number}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Admin Service Key <span className="text-xs text-gray-500 font-normal">(Paste your service_role key here, never saved)</span></label>
                  <input name="serviceRoleKey" type="password" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border bg-red-50 focus:bg-white" />
                </div>
                <div className="lg:col-span-4 flex items-end">
                  <button type="submit" className="w-full lg:w-auto bg-blue-600 border border-transparent rounded-md shadow-sm py-2 px-6 inline-flex justify-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Add Tenant
                  </button>
                </div>
              </form>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="border-b bg-gray-50 text-gray-700 uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Apartment</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3 text-right">Standard Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 font-medium text-gray-900">{t.name}</td>
                    <td className="px-4 py-4">{t.apartments ? `Floor ${t.apartments.floor_number}, Unit ${t.apartments.unit_number}` : 'Unassigned'}</td>
                    <td className="px-4 py-4">{t.phone_number || 'N/A'}</td>
                    <td className="px-4 py-4 text-right font-mono">${Number(t.standard_monthly_fee).toFixed(2)}</td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-6 text-gray-500">No tenants found</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {activeTab === 'bills' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Monthly Bills</h2>
              
              <form onSubmit={handleGenerateBills} className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-600 px-2">Generate:</span>
                <input 
                  type="number" 
                  value={billYear} 
                  onChange={e => setBillYear(Number(e.target.value))} 
                  className="w-20 rounded-md border-gray-300 shadow-sm sm:text-sm px-2 py-1 border"
                />
                <input 
                  type="number" 
                  min="1" max="12" 
                  value={billMonth} 
                  onChange={e => setBillMonth(Number(e.target.value))} 
                  className="w-16 rounded-md border-gray-300 shadow-sm sm:text-sm px-2 py-1 border"
                />
                <button 
                  type="submit" 
                  disabled={isGeneratingBills}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-500 disabled:opacity-50 transition-colors"
                >
                  {isGeneratingBills ? 'Wait...' : 'Generate'}
                </button>
              </form>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="border-b bg-gray-50 text-gray-700 uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-4 py-3">Month</th>
                    <th className="px-4 py-3">Tenant</th>
                    <th className="px-4 py-3 text-right">Due</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bills.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 font-medium text-gray-900">
                        {b.monthly_records ? `${b.monthly_records.year}-${String(b.monthly_records.month).padStart(2, '0')}` : 'N/A'}
                      </td>
                      <td className="px-4 py-4">
                        {b.tenants?.name || 'Unknown'}
                        <div className="text-xs text-gray-400">
                          {b.tenants?.apartments ? `Unit ${b.tenants.apartments.unit_number}` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-mono">${Number(b.amount_due).toFixed(2)}</td>
                      
                      {/* Editing Mode */}
                      {editingBill?.id === b.id ? (
                        <td colSpan={3} className="px-4 py-2 bg-gray-50">
                          <form onSubmit={handleUpdateBill} className="flex items-center justify-end gap-2">
                            <span className="text-xs font-medium">Paid: $</span>
                            <input 
                              type="number" step="0.01" 
                              value={editingBill.amount_paid} 
                              onChange={e => setEditingBill({ ...editingBill, amount_paid: e.target.value })}
                              className="w-20 rounded border-gray-300 text-sm px-2 py-1"
                            />
                            <select 
                              value={editingBill.status} 
                              onChange={e => setEditingBill({ ...editingBill, status: e.target.value })}
                              className="rounded border-gray-300 text-sm px-2 py-1"
                            >
                              <option value="Red">Red</option>
                              <option value="Yellow">Yellow</option>
                              <option value="Green">Green</option>
                            </select>
                            <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-500">Save</button>
                            <button type="button" onClick={() => setEditingBill(null)} className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs font-medium hover:bg-gray-400">Cancel</button>
                          </form>
                        </td>
                      ) : (
                        <>
                          <td className="px-4 py-4 text-right font-mono text-green-600">${Number(b.amount_paid).toFixed(2)}</td>
                          <td className="px-4 py-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              b.status === 'Green' ? 'bg-green-100 text-green-800' :
                              b.status === 'Yellow' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button 
                              onClick={() => setEditingBill({ ...b })}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Update
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {bills.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-6 text-gray-500">No bills found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">All Expenses</h2>
            
            {/* Split Expense Form */}
            <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Log & Split New Expense</h3>
              {!isSplitting ? (
                <form onSubmit={handleStartExpenseSplit} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <input type="text" required value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm px-3 py-2 border" placeholder="e.g. Elevator Repair" />
                  </div>
                  <div className="w-48">
                    <label className="block text-sm font-medium text-gray-700">Total Amount ($)</label>
                    <input type="number" step="0.01" required value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm px-3 py-2 border" placeholder="0.00" />
                  </div>
                  <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-500 transition-colors">
                    Split with Tenants -
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-gray-900">Adjust Tenant Shares for "{expenseDesc}"</h4>
                      <span className="font-mono text-gray-600 bg-gray-100 px-3 py-1 rounded text-sm">Total: ${parseFloat(expenseAmount).toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {splitShares.map(share => (
                        <div key={share.tenantId}>
                          <label className="block text-xs font-medium text-gray-600 truncate" title={share.name}>{share.name}</label>
                          <input 
                            type="number" step="0.01" 
                            value={share.amount} 
                            onChange={e => handleShareChange(share.tenantId, e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm px-3 py-2 border" 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setIsSplitting(false)} className="px-4 py-2 text-sm text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSaveSplitExpense} disabled={isSavingExpense} className="px-6 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-500 disabled:opacity-50">
                      {isSavingExpense ? 'Saving...' : 'Confirm & Log Expense'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="border-b bg-gray-50 text-gray-700 uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Tenant</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        {new Date(e.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-gray-900">{e.tenants?.name || 'Admin'}</td>
                      <td className="px-4 py-4 font-medium">{e.description}</td>
                      <td className="px-4 py-4 text-right font-mono text-red-600">
                        ${Number(e.amount).toFixed(2)}
                      </td>
                      
                      {/* Editing Mode */}
                      {editingExpense?.id === e.id ? (
                        <td colSpan={3} className="px-4 py-2 bg-gray-50">
                          <form onSubmit={handleUpdateExpense} className="flex items-center justify-end gap-2">
                            <span className="text-xs font-medium">Paid: $</span>
                            <input 
                              type="number" step="0.01" 
                              value={editingExpense.amount_paid} 
                              onChange={ev => setEditingExpense({ ...editingExpense, amount_paid: ev.target.value })}
                              className="w-20 rounded border-gray-300 text-sm px-2 py-1"
                            />
                            <select 
                              value={editingExpense.status} 
                              onChange={ev => setEditingExpense({ ...editingExpense, status: ev.target.value })}
                              className="rounded border-gray-300 text-sm px-2 py-1"
                            >
                              <option value="Red">Red</option>
                              <option value="Yellow">Yellow</option>
                              <option value="Green">Green</option>
                            </select>
                            <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-500">Save</button>
                            <button type="button" onClick={() => setEditingExpense(null)} className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs font-medium hover:bg-gray-400">Cancel</button>
                          </form>
                        </td>
                      ) : (
                        <>
                          <td className="px-4 py-4 text-right font-mono text-green-600">${Number(e.amount_paid || 0).toFixed(2)}</td>
                          <td className="px-4 py-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              e.status === 'Green' ? 'bg-green-100 text-green-800' :
                              e.status === 'Yellow' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {e.status || 'Red'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button 
                              onClick={() => setEditingExpense({ ...e })}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Update
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-6 text-gray-500">No expenses found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
