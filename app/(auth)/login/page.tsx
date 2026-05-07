"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Lock, User } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data: any) => {
    setIsLoading(true)
    const result = await signIn("credentials", {
      username: data.username,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      toast.error(result.error === "CredentialsSignin" ? "Invalid username or password" : result.error)
      setIsLoading(false)
    } else {
      toast.success("Login successful")
      router.push("/")
      router.refresh()
    }
  }

  return (
    <div className="auth-layout">
      {/* Left side - Brand/Illustration */}
      <div className="auth-brand">
        <div>
          <h1>Afra Tech Point</h1>
          <p>
            Premium stock management system for your retail business. Track sales, purchases, and inventory with ease.
          </p>
        </div>
        <div className="auth-testimonial">
          <p>
            "Streamlined our entire inventory process. Highly recommended for modern gadget shops."
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="auth-form-container">
        <div className="auth-form-wrapper">
          <div className="auth-form-header">
            <h2>Welcome Back</h2>
            <p>Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <User size={18} />
                </div>
                <input
                  {...register("username", { required: "Username is required" })}
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Enter your username"
                />
              </div>
              {errors.username && <p className="form-error">{errors.username.message as string}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  {...register("password", { required: "Password is required" })}
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="form-error">{errors.password.message as string}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 'var(--space-2)' }}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
