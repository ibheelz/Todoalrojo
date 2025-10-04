'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid credentials')
      } else {
        const session = await getSession()
        if ((session?.user as any)?.userType === 'client') {
          router.push('/client/dashboard')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (err) {
      setError('An error occurred during sign in')
    } finally {
      setLoading(false)
    }
  }

  const fillCredentials = (emailValue: string, passwordValue: string) => {
    setEmail(emailValue)
    setPassword(passwordValue)
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ultra-Premium Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/90" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/8 rounded-full delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 rounded-full opacity-60" />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md xl:max-w-lg space-y-10">
          {/* Ultra-Premium Header */}
          <div className="text-center space-y-6">
            <div className="inline-block p-6 rounded-full bg-gradient-to-br from-primary/30 via-primary/20 to-secondary/20 mb-8">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center text-3xl font-black text-primary-foreground">
                ⚡
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl xl:text-7xl font-black leading-tight">
                <span className="text-primary">
                  Identity
                </span>
              </h1>
              <h2 className="text-4xl sm:text-5xl xl:text-6xl font-black">
                <span className="text-primary">
                  Graph CRM
                </span>
              </h2>
              <p className="text-lg sm:text-xl font-semibold text-muted-foreground max-w-md mx-auto leading-relaxed">
                Next-generation customer relationship management with advanced identity tracking and analytics
              </p>
            </div>
          </div>

          {/* Ultra-Premium Login Card */}
          <div className="premium-card p-10 sm:p-12 xl:p-14">
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="p-5 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-center font-semibold">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-lg">⚠️</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label htmlFor="email" className="block text-sm font-black text-foreground/90 uppercase tracking-widest">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="premium-input text-base font-medium"
                  placeholder="Enter your email address"
                />
              </div>

              <div className="space-y-3">
                <label htmlFor="password" className="block text-sm font-black text-foreground/90 uppercase tracking-widest">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="premium-input text-base font-medium"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="premium-button-primary w-full py-5 text-lg font-black"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-6 h-6 border-3 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>Sign In</span>
                    <span className="text-lg">→</span>
                  </div>
                )}
              </button>
            </form>

            {/* Ultra-Premium Demo Credentials */}
            <div className="mt-10 pt-8 border-t border-border/20">
              <div className="text-center mb-8">
                <span className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] bg-muted/10 px-4 py-2 rounded-full border border-border/30">
                  Demo Credentials
                </span>
              </div>

              <div className="grid gap-6">
                <div
                  className="premium-card p-6 cursor-pointer transition-all duration-300 group"
                  onClick={() => fillCredentials('abiola@mieladigital.com', 'admin123')}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center text-lg shadow-lg">
                          👑
                        </div>
                        <div>
                          <div className="text-sm font-black text-primary uppercase tracking-wider">
                            Super Admin
                          </div>
                          <div className="text-xs text-muted-foreground font-medium">
                            Full System Access
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1 ml-13">
                        <div className="text-sm font-mono text-primary/80 break-all">
                          abiola@mieladigital.com
                        </div>
                        <div className="text-sm font-mono text-primary/80">
                          admin123
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl opacity-40 group-hover:opacity-80 transition-all duration-300">
                      ⚡
                    </div>
                  </div>
                </div>

                <div
                  className="premium-card p-6 cursor-pointer transition-all duration-300 group"
                  onClick={() => fillCredentials('client@example.com', 'client123')}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-secondary to-secondary/80 rounded-xl flex items-center justify-center text-lg shadow-lg">
                          🏢
                        </div>
                        <div>
                          <div className="text-sm font-black text-secondary-foreground uppercase tracking-wider">
                            Client Portal
                          </div>
                          <div className="text-xs text-muted-foreground font-medium">
                            Limited Access
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1 ml-13">
                        <div className="text-sm font-mono text-secondary-foreground/80 break-all">
                          client@example.com
                        </div>
                        <div className="text-sm font-mono text-secondary-foreground/80">
                          client123
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl opacity-40 group-hover:opacity-80 transition-all duration-300">
                      📊
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <p className="text-xs text-muted-foreground/60 font-medium">
                  ✨ Click on any credential card to auto-fill the login form
                </p>
              </div>
            </div>
          </div>

          {/* Ultra-Premium Footer */}
          <div className="text-center text-xs text-muted-foreground/40 space-y-2 font-medium">
            <div className="flex items-center justify-center space-x-4">
              <span>© 2024 TodoAlRojo</span>
              <span>•</span>
              <span>All Rights Reserved</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span>Powered by</span>
              <span className="text-primary font-semibold">Next.js</span>
              <span>•</span>
              <span className="text-primary font-semibold">Tailwind</span>
              <span>•</span>
              <span className="text-primary font-semibold">Prisma</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}