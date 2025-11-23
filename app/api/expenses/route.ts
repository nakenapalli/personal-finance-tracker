import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const expenses = await prisma.expense.findMany({
    where: { userId: parseInt(session.user.id) },
    orderBy: { createdAt: "desc" }
  })

  return NextResponse.json(expenses)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, category, amount, date } = body

    if (!name || !category || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const expense = await prisma.expense.create({
      data: {
        name,
        category,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        userId: parseInt(session.user.id)
      }
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error creating expense:", error)
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    )
  }
}