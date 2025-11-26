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

  const totalSpending = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount
    return acc
  }, {} as Record<string, number>)

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-600 mb-2">Money Out</h2>
            <p className="text-4xl font-bold text-purple-700">${totalSpending.toFixed(2)}</p>

            <div className="bg-white rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-600 mb-2">By Category</h2>
              <div className="space-y-2">
                {Object.entries(categoryTotals).sort(([, amount1], [, amount2]) => amount2 - amount1).map(([category, amount]) => (
                  <div key={category} className="flex justify-between text-sm">
                    <span className="text-gray-700">{category}</span>
                    <span className="font-semibold text-gray-500">${amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
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

            <div className="divide-y">
              {expenses.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No expenses yet. Click "Add Expense" to get started!
                </div>
              ) : (
                expenses.map((expense) => (
                  <div key={expense.id} className="p-6 flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-900">{expense.name}</p>
                      <p className="text-sm text-gray-600">{expense.category}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      ${expense.amount.toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </div>




          </div>
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