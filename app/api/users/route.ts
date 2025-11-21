import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { username, password } = body

        if (!username || !password) {
            return NextResponse.json(
                { error: "Username and password are required" },
                { status: 400 }
            )
        }

        const existingUser = await prisma.user.findUnique({
            where: { username }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: "Username already exists" },
                { status: 409 }
            )
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const user = await prisma.user.create({
            data: {
                username: username,
                password: hashedPassword
            }
        })

        return NextResponse.json(
            {
                message: "User created successfully",
                user: { id: user.id, username: user.username }
            },
            { status: 201 }
        )
    } catch (error) {
        console.error("Registration error: ", error)
        return NextResponse.json(
            { error: "Failed to create user" },
            { status: 500 }
        )
    }
}