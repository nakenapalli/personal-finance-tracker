import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import OpenAI from "openai"

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { income } = await request.json()

        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)


        const expenses = await prisma.expense.findMany({
            where: {
                userId: parseInt(session.user.id),
                date: { gte: startOfMonth }
            },
            orderBy: { date: 'desc' }
        })

        // Calculate spending by category
        const categorySpending = expenses.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount
            return acc
        }, {} as Record<string, number>)

        // Get monthly averages
        const monthlyTotals = Object.entries(categorySpending).map(
            ([category, total]) => ({
                category,
                current: Number(total.toFixed(2))
            })
        )


        // Call OpenAI API for budget recommendations
        const recommendations = await getBudgetRecommendations(
            income,
            monthlyTotals,
            expenses.length
        )

        return NextResponse.json(recommendations)
    } catch (error) {
        console.error("Budget advisor error:", error)
        return NextResponse.json(
            { error: "Failed to generate budget recommendations" },
            { status: 500 }
        )
    }
}

async function getBudgetRecommendations(
    income: number,
    categoryTotals: { category: string; current: number }[],
    totalExpenses: number
) {
    const prompt = `You are a personal finance advisor. Analyze this user's financial situation and provide personalized budget recommendations.

User's Monthly Income: $${income}

Current Spending Patterns (month-to-date totals):
${categoryTotals.map(c => `- ${c.category}: $${c.current.toFixed(2)}`).join('\n')}

Total expenses tracked: ${totalExpenses}

Please provide:
1. A recommended monthly budget for each category
2. Overall budget strategy (50/30/20 rule or custom)
3. 3-5 specific, actionable recommendations to improve their finances
4. Estimated monthly savings if they follow your advice

Format your response as JSON with this structure:
{
  "budgets": [
    { "category": "Food", "recommended": 400, "current": 450, "reasoning": "..." }
  ],
  "strategy": {
    "needs": 2500,
    "wants": 1000,
    "savings": 500,
    "description": "..."
  },
  "recommendations": [
    { "title": "...", "description": "...", "impact": "$200/month savings" }
  ],
  "totalSavings": 300,
  "summary": "Overall financial health assessment"
}

Be encouraging but realistic. Focus on practical, achievable goals. Return ONLY valid JSON, no markdown or extra text.`

    const completion = await openai.chat.completions.create({
        model: "gpt-4o",  // or "gpt-4o-mini" for lower cost
        messages: [
            {
                role: "system",
                content: "You are a helpful personal finance advisor. Always respond with valid JSON only."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        response_format: { type: "json_object" },  // Ensures JSON response
        temperature: 0.7,
        max_tokens: 2000
    })

    const responseText = completion.choices[0].message.content

    if (!responseText) {
        throw new Error('No response from OpenAI')
    }

    return JSON.parse(responseText)
}