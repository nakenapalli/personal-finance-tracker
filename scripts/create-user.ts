import { prisma } from "../lib/db"
import bcrypt from "bcryptjs"

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10)
  
  const user = await prisma.user.create({
    data: {
      username: "testuser",
      password: hashedPassword
    }
  })
  
  console.log("User created successfully!")
  console.log("Username:", user.username)
  console.log("Password: password123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })