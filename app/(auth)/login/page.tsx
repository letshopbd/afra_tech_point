"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Lock, User } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      toast.error("Please fill in all fields")
      return
    }

    setIsLoading(true)
    try {
      const result = await signIn("credentials", {
        username: username,
        password: password,
        redirect: false,
      })

      if (result?.error) {
        toast.error(result.error === "CredentialsSignin" ? "Invalid username or password" : result.error)
      } else {
        toast.success("Login successful")
        setTimeout(() => { window.location.href = "/" }, 300)
      }
    } catch (error: any) {
      toast.error(error?.message || "An unexpected error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <script dangerouslySetInnerHTML={{ __html: `
        window.onerror = function (msg, url, lineNo, columnNo, error) {
          alert("Login Page JS Error: " + msg + "\\nLine: " + lineNo + ":" + columnNo + "\\nURL: " + url);
          return false;
        };
        window.onunhandledrejection = function (event) {
          alert("Login Page Promise Error: " + (event.reason?.message || event.reason));
        };
      `}} />
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
          <div className="auth-form-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <img src="/logo.png" alt="Logo" style={{ height: '56px', marginBottom: 'var(--space-4)', objectFit: 'contain' }} />
            <h2>Welcome Back</h2>
            <p>Please enter your details to sign in.</p>
          </div>

          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <User size={18} />
                </div>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  placeholder="••••••••"
                  required
                />
              </div>
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
