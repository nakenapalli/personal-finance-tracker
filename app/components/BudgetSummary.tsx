"use client"

import { useState } from "react"

interface BudgetRecommendation {
  category: string
  recommended: number
  current: number
  reasoning: string
}

interface Recommendation {
  title: string
  description: string
  impact: string
}

interface BudgetAdvice {
  budgets: BudgetRecommendation[]
  strategy: {
    needs: number
    wants: number
    savings: number
    description: string
  }
  recommendations: Recommendation[]
  totalSavings: number
  summary: string
}

export default function BudgetSummary({ userId, budgets }: { userId: number, budgets: any[] }) {
  const [income, setIncome] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [advice, setAdvice] = useState<BudgetAdvice | null>(null)
  const [error, setError] = useState("")

  // ✅ Generate AI Budget Advice
  const getAdvice = async () => {
    if (!income || parseFloat(income) <= 0) {
      setError("Please enter a valid monthly income.")
      return
    }

    setIsLoading(true)
    setError("")
    setAdvice(null)

    try {
      const res = await fetch("/api/ai/budget-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          income: Number(income)
        })
      })

      if (!res.ok) {
        throw new Error("Failed to fetch advice")
      }

      const data = await res.json()
      setAdvice(data)
    } catch (err) {
      console.error(err)
      setError("Failed to generate budget advice. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ Save Recommended Budgets
  const saveBudgets = async () => {
    if (!advice) return

    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          budgets: advice.budgets.map(b => ({
            category: b.category,
            amount: b.recommended
          }))
        })
      })

      if (!res.ok) {
        throw new Error("Failed to save budgets")
      }

    } catch (err) {
      console.error(err)
      alert("❌ Failed to save budgets.")
    }
  }

  return (
    <div className="bg-white rounded-lg shadow max-h-[70vh] flex flex-col overflow-hidden">
      <h2 className="text-lg font-semibold text-gray-600 ml-5 mt-5">Budgets</h2>
      <div className="flex-1 overflow-y-auto">
        {budgets.length === 0 ? (
          <div>
            <div className="p-8 text-center text-gray-500">
              No budgets yet. Create yours:
            </div>
            <div className="bg-white shadow p-6 border">

              {/* ✅ Income Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Income
                </label>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={income}
                      onChange={(e) => setIncome(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                      placeholder="5000"
                      disabled={isLoading}
                    />
                  </div>

                  <button
                    onClick={getAdvice}
                    disabled={isLoading}
                    className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isLoading ? "Generating..." : "Generate"}
                  </button>
                </div>

                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </div>

              {/* ✅ Results */}
              {advice && (
                <div className="space-y-6">

                  {/* ✅ Summary */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-900 mb-2">Summary</h3>
                    <p className="text-sm text-purple-800">{advice.summary}</p>

                    {advice.totalSavings > 0 && (
                      <p className="text-sm font-semibold text-purple-900 mt-2">
                        💰 Potential Monthly Savings: ${advice.totalSavings.toFixed(0)}
                      </p>
                    )}
                  </div>

                  {/* ✅ 50/30/20 Strategy */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">
                      Budget Strategy
                    </h3>

                    <div className="grid grid-cols-3 gap-4 mb-2">
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-xs text-gray-600">Needs</p>
                        <p className="text-lg font-bold text-blue-700">
                          ${advice.strategy.needs}
                        </p>
                      </div>

                      <div className="bg-green-50 p-3 rounded">
                        <p className="text-xs text-gray-600">Wants</p>
                        <p className="text-lg font-bold text-green-700">
                          ${advice.strategy.wants}
                        </p>
                      </div>

                      <div className="bg-purple-50 p-3 rounded">
                        <p className="text-xs text-gray-600">Savings</p>
                        <p className="text-lg font-bold text-purple-700">
                          ${advice.strategy.savings}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600">
                      {advice.strategy.description}
                    </p>
                  </div>

                  {/* ✅ Category Budgets */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">
                      Recommended Category Budgets
                    </h3>

                    <div className="space-y-3">
                      {advice.budgets.map((budget) => (
                        <div
                          key={budget.category}
                          className="border border-gray-200 rounded-lg p-3"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-gray-800">
                                {budget.category}
                              </p>
                              <p className="text-xs text-gray-500">
                                {budget.reasoning}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-800">
                                ${budget.recommended.toFixed(0)}
                              </p>

                              {budget.current !== budget.recommended && (
                                <p className="text-xs text-gray-500">
                                  Current: ${budget.current.toFixed(0)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ✅ Personalized Recommendations */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">
                      Personalized Recommendations
                    </h3>

                    <div className="space-y-3">
                      {advice.recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">💡</span>

                            <div className="flex-1">
                              <p className="font-medium text-gray-800 mb-1">
                                {rec.title}
                              </p>

                              <p className="text-sm text-gray-600 mb-2">
                                {rec.description}
                              </p>

                              <p className="text-xs font-semibold text-green-600">
                                {rec.impact}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ✅ Save Button */}
                  <button
                    onClick={saveBudgets}
                    className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    Save These Budgets
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          budgets.map((budget) => (
            <div
              key={budget.category}
              className="p-6 border-b last:border-0 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-gray-700">{budget.category}</p>
              </div>
              <p className="text-lg font-bold text-app-primary">
                ${budget.amount.toFixed(2)}
              </p>
            </div>
          ))
        )}
      </div>

    </div>
  )
}
