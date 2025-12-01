"use client"

import { appTheme, getPrimaryColor } from "@/lib/theme"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Expense {
  id: number
  name: string
  category: string
  amount: number
  date: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [budgets, setBudgets] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchExpenses()
      fetchBudgets()
    }
  }, [status])

  const fetchExpenses = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/expenses")
      if (res.ok) {
        const data = await res.json()
        setExpenses(data)
      }
    } catch (error) {
      console.error("Error fetching expenses:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBudgets = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/budgets")
      if (res.ok) {
        const data = await res.json()
        setBudgets(data)
      }
    } catch (error) {
      console.error("Error fetching budgets:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const totalSpending = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount
    return acc
  }, {} as Record<string, number>)

  // build a lookup for budgets by category for quick access
  const budgetMap = budgets.reduce((acc, b) => {
    acc[b.category] = Number(b.amount)
    return acc
  }, {} as Record<string, number>)

  // union categories from both budgets and expenses so we show categories that only have budgets too
  const allCategories = Array.from(new Set([
    ...Object.keys(categoryTotals),
    ...budgets.map((b) => b.category),
  ]))

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  // If no session or no user ID
  if (!session || !session.user || !session.user.id) {
    return <div className="p-8">Not authenticated</div>
  }

  // Convert string → number ONCE at the boundary
  const userId = Number(session.user.id)

  // Safety check (prevents NaN bugs)
  if (Number.isNaN(userId)) {
    return <div className="p-8 text-red-600">Invalid user session</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">

        {/* Top Bar */}
        <div className="flex justify-between items-center mb-8">
          {/* Left side - Logo */}
          <div className="flex items-center gap-2">
            <appTheme.logo.icon
              sx={{
                color: getPrimaryColor(700),
                fontSize: '38px'
              }}
            />
            <h2 className="text-3xl text-purple-700 font-bold">
              {appTheme.logo.text}
            </h2>
          </div>

          {/* Right side - Sign Out */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 whitespace-nowrap"
          >
            Sign Out
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 items-start">

          {/* Summary */}
          <div className="bg-white rounded-lg shadow max-h-[80vh] flex flex-col overflow-hidden">
            <h2 className="text-lg font-semibold text-gray-600 ml-5 mt-5">Money Out</h2>
            <p className="text-4xl font-bold text-purple-700 ml-5 mt-2">${totalSpending.toFixed(2)}</p>

            <div className="bg-white rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-600 mb-2">By Category</h2>
              <div className="space-y-2">
                {allCategories
                  .sort((a, b) => (categoryTotals[b] || 0) - (categoryTotals[a] || 0))
                  .map((category) => {
                    const spent = categoryTotals[category] || 0
                    const budgetAmount = budgetMap[category]

                    const over = typeof budgetAmount !== "undefined" && spent > budgetAmount

                    return (
                      <div key={category} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">{category}</span>

                        <div className="text-right">
                          {typeof budgetAmount !== "undefined" ? (
                            <p className={`font-semibold ${over ? 'text-red-900' : 'text-app-primary'}`}>
                              {`$${spent.toFixed(2)}`} <span className="text-xs text-gray-400">/</span> <span className="text-xs text-gray-600">{`$${budgetAmount.toFixed(2)}`}</span>
                            </p>
                          ) : (
                            <p className="font-semibold text-gray-500">{`$${spent.toFixed(2)}`}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>

          

          {/* Expense List */}
          <div className="bg-white rounded-lg shadow h-[145vh] row-span-2 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center border-b">
              <h2 className="text-xl font-semibold text-gray-600 p-6">Recent Expenses</h2>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-purple-700 text-white px-6 py-2 rounded-lg hover:bg-purple-700 font-medium mr-6"
              >
                {showForm ? "Cancel" : "Add Expense"}
              </button>
            </div>

            {showForm && (
              <ExpenseForm
                onSuccess={() => {
                  setShowForm(false)
                  fetchExpenses()
                }}
              />
            )}

            <div className="flex-1 overflow-y-auto divide-y">
              {expenses.length === 0 ? (
                <div className="p-8 text-center text-gray-700">
                  No expenses yet — click the Add Expense button to get started!
                </div>
              ) : (
                expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="p-6 flex justify-between items-center hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-semibold text-gray-700">{expense.name}</p>
                      <p className="text-sm text-gray-600">{expense.category}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-app-primary">
                      ${expense.amount.toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* budgets now shown in the left summary card; removed separate budgets card */}
          
        </div>




      </div>
    </div>
  )
}

function ExpenseForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, amount, date })
      })

      if (res.ok) {
        setName("")
        setCategory("")
        setAmount("")
        setDate(new Date().toISOString().split('T')[0])
        onSuccess()
      }
    } catch (error) {
      console.error("Error creating expense:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-8 space-y-4">
      <h3 className="text-lg font-semibold mb-4 text-gray-600">Add New Expense</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full text-gray-500 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="e.g., Groceries"
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full text-gray-500 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="e.g., Food, Transport, Entertainment"
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full text-gray-500 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="0.00"
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full text-gray-500 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          required
          disabled={isSubmitting}
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-purple-300 text-purple-700 py-2 rounded-md hover:bg-purple-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Saving..." : "Save Expense"}
      </button>
    </form>
  )
}