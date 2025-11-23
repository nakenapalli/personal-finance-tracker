"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import React from "react"
import { Button, Icon, ToggleButton, ToggleButtonGroup } from "@mui/material"
import bcrypt from "bcryptjs"
import { appTheme, getPrimaryColor } from "@/lib/theme"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [formMode, setFormMode] = useState("login")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (formMode === "register") {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })

      if (res.ok) {
        console.log("User created successfully")
      } else if (res.status === 409) {
        setError("Username already exists")
      }
    }

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    })

    setIsLoading(false)

    if (result?.error) {
      formMode === "login"
        ? setError("Invalid username or password")
        : setError("Registration failed. Please try again.")
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow">
        <div className="relative w-full flex justify-center items-center">
          <appTheme.logo.icon
            className="absolute left-[calc(50%-6.25rem)]"
            sx={{
              color: getPrimaryColor(700),
              fontSize: '32px'
            }} />
          <h2 className="text-3xl text-purple-700 font-bold">{appTheme.logo.text}</h2>
        </div>
        <div>
          <LogInRegisterToggle mode={formMode} onToggle={(mode: string) => setFormMode(mode)} />
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-app-primary">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full text-gray-500 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-700 focus:outline-none focus:ring-purple-500"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-purple-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full text-gray-500 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-700 focus:outline-none focus:ring-purple-500"
              required
              disabled={isLoading}
            />
          </div>
          {/* <Button className="w-full" type="submit" disabled={isLoading} sx={{
            '&:hover': {
              backgroundColor: '#f3e8ff',  // purple-500
            },
            '&:focus': {
              backgroundColor: '#d8b4fe'
            }
          }}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button> */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-purple-300 py-2 px-4 text-purple-700 font-medium hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {
              isLoading
                ? formMode === "login" ? "Signing in..." : "Signing up..."
                : formMode === "login" ? "Sign In" : "Sign Up"
            }
          </button>
        </form>
      </div>
    </div>
  )
}

function LogInRegisterToggle({ onToggle, mode }: { onToggle: (mode: string) => void, mode: string }) {

  const handleFormMode = (
    event: React.MouseEvent<HTMLElement>,
    newFormMode: string,
  ) => {
    onToggle(newFormMode);
  };

  return (
    <ToggleButtonGroup
      fullWidth
      value={mode}
      exclusive
      onChange={handleFormMode}
      aria-label="text alignment"
    >
      <ToggleButton disabled={mode === "login"} value="login" aria-label="login" sx={{
        '&:hover': {
          backgroundColor: '#f3e8ff',  // purple-500
        },
        '&:focus': {
          backgroundColor: '#d8b4fe'
        },
        '&.Mui-selected': {
          backgroundColor: '#d8b4fe'
        }
      }}>
        <p className="font-sans normal-case text-purple-700">Log In</p>
      </ToggleButton>
      <ToggleButton disabled={mode === "register"} value="register" aria-label="register" sx={{
        '&:hover': {
          backgroundColor: '#f3e8ff',  // purple-500
        },
        '&:focus': {
          backgroundColor: '#d8b4fe'
        },
        '&.Mui-selected': {
          backgroundColor: '#d8b4fe'
        }
      }}>
        <p className="font-sans normal-case text-purple-700">Register</p>
      </ToggleButton>
    </ToggleButtonGroup>
  );
}