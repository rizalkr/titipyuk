"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, Eye, EyeOff } from "lucide-react";
import { serverRequestOtp, serverVerifyOtp } from "@/app/actions/auth";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { signUp } = useAuth();
  const router = useRouter();

  // OTP state
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer
  useState(() => {
    if (!resendCooldown) return;
    const id = setInterval(() => {
      setResendCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  });

  const customOtpEnabled = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_ENABLE_CUSTOM_OTP === 'true') : true

  useEffect(() => {
    // If redirected back needing verify (middleware), show OTP form
    const params = new URLSearchParams(window.location.search)
    if (params.get('needVerify') === '1') {
      setAwaitingOtp(true)
      setMessage('Verifikasi email dulu ya dengan kode OTP.')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (!email || !password || !fullName.trim()) {
      setError("Isi semua field dulu ya");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter ya");
      setLoading(false);
      return;
    }

    const { user, error } = await signUp(email, password, fullName.trim());

    if (error) {
      if (error.message.includes("User already registered")) {
        setError("Email ini sudah terdaftar. Coba login aja ya.");
      } else {
        setError(error.message);
      }
    } else if (user) {
      if ((user as any).email_confirmed_at) {
        router.push("/dashboard");
      } else {
        if (customOtpEnabled) {
          setMessage("Akun berhasil dibuat! Masukkan kode OTP yang dikirim ke email kamu.");
          setAwaitingOtp(true);
          setResendCooldown(60);
        } else {
          setMessage("Akun dibuat! Cek inbox untuk link konfirmasi dari Supabase.");
        }
      }
    }

    setLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;
    setVerifying(true);
    setError("");
    const res = await serverVerifyOtp(email, otpCode.trim());
    if (res.error) {
      setError(res.error);
    } else if (res.ok && res.verified) {
      setMessage("Email berhasil diverifikasi! Mengarahkan ke dashboard...");
      setTimeout(() => router.push("/dashboard"), 1200);
    } else if (res.alreadyVerified) {
      router.push("/dashboard");
    }
    setVerifying(false);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    const res = await serverRequestOtp(email);
    if (res.error) setError(res.error);
    else setMessage("Kode baru sudah dikirim. Cek email ya.");
    setResendCooldown(60);
  };

  if (!customOtpEnabled && awaitingOtp) {
    // Should not show OTP UI when disabled
    setAwaitingOtp(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-muted/50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-8">
            <Package className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">TitipYuk Semarang</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {awaitingOtp ? 'Verifikasi Email' : 'Buat Akun Baru 🚀'}
            </CardTitle>
            <CardDescription>
              {awaitingOtp ? 'Masukkan kode OTP yang barusan kami kirim' : 'Gabung TitipYuk dan mulai titip barang dengan aman & gampang'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!awaitingOtp && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="bg-green-50 text-green-600 text-sm p-3 rounded-md">
                    {message}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="fullName">Nama Lengkap</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan nama lengkap kamu"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan email kamu"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Buat password (min. 6 karakter)"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Lagi bikin akun..." : "Daftar"}
                </Button>
              </form>
            )}

            {awaitingOtp && (
              <form onSubmit={handleVerify} className="space-y-6">
                {error && (
                  <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="bg-green-50 text-green-600 text-sm p-3 rounded-md">
                    {message}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="otp">Kode OTP</Label>
                  <Input
                    id="otp"
                    name="otp"
                    type="text"
                    value={otpCode}
                    maxLength={6}
                    pattern="[0-9]{6}"
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Masukkan 6 digit kode"
                    autoFocus
                    required
                  />
                  <p className="text-xs text-muted-foreground">Kode berlaku 10 menit. Jangan bagikan ke siapapun.</p>
                </div>
                <Button type="submit" className="w-full" disabled={verifying}>
                  {verifying ? 'Memverifikasi...' : 'Verifikasi'}
                </Button>
                <div className="text-center text-sm">
                  <button type="button" className="text-primary disabled:opacity-50" disabled={resendCooldown>0} onClick={handleResend}>
                    {resendCooldown>0 ? `Kirim ulang dalam ${resendCooldown}s` : 'Kirim ulang kode'}
                  </button>
                </div>
              </form>
            )}

            {!awaitingOtp && (
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Sudah punya akun?{" "}
                  <Link
                    href="/login"
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    Masuk di sini
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
