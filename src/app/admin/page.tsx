"use client"
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

const AdminLogin = () => {
    const [email, setEmail] = useState("")    
    const [password, setPassword] = useState("")

    const router = useRouter()

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        if(email === "rayyan12@gmail.com" && password === "admin"){
            localStorage.setItem("isLoggedIn", "true")
            router.push("/admin/dashboard")
        } else{
            alert("Invalid email or password")
        }

    }
return (
    <div className="min-h-screen content-center">
        <form onSubmit={handleLogin} className="max-w-xl mx-auto border border-slate-200 shadow-2xl bg-gray-100 px-16 space-y-5 py-6">
            <h1 className="text-3xl font-bold text-center">Admin Dashboard</h1>
            <div className="flex flex-col gap-3">
                <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="px-4 py-2 border rounded border-black" />
                <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="px-4 py-2 border rounded border-black" />
            </div>
                <button type='submit' className="bg-blue-500 text-white px-8 py-2 w-full rounded-md cursor-pointer hover:bg-blue-600">Login</button>
        </form>
    </div>
  )
}

export default AdminLogin