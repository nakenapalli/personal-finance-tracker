import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

// Get all budgets for user
export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const budgets = await prisma.budget.findMany({
    where: { userId: parseInt(session.user.id) },
    orderBy: { category: 'desc' }
  })

  return NextResponse.json(budgets)
}

// Create or update budgets
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const budgets = (body?.budgets ?? []) as Array<{ category: string; amount: number }>
    const userId = parseInt(session.user.id)

    // Delete existing budgets and create new ones
    await prisma.budget.deleteMany({
      where: { userId }
    })

    const created = await prisma.budget.createMany({
      data: budgets.map((b) => ({
        category: b.category,
        amount: typeof b.amount === 'number' ? b.amount : parseFloat(String(b.amount)),
        userId
      }))
    })

    return NextResponse.json({ success: true, count: created.count })
  } catch (error) {
    console.error("Budget creation error:", error)
    return NextResponse.json(
      { error: "Failed to save budgets" },
      { status: 500 }
    )
  }
}