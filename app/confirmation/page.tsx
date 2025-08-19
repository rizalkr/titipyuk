'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Navigation from '@/components/Navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Calendar, Weight, Ruler, DollarSign, CheckCircle, Key, Copy } from 'lucide-react'
import { toIDR } from '@/lib/utils'

interface ConfirmationData {
  bookingId: string
  retrievalPassword: string
  totalAmount: number
  bookingData: {
    itemType: 'normal' | 'fragile'
    weight: number
    length: number
    width: number
    height: number
    volume: number
    startDate: string
    endDate: string
    calculation: {
      baseRate: number
      volumeSurcharge: number
      weightSurcharge: number
      fragileMultiplier: number
      totalPrice: number
      days: number
    }
  }
}

export default function ConfirmationPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null)
  const [passwordCopied, setPasswordCopied] = useState(false)

  useEffect(() => {
    // Get confirmation data from sessionStorage
    const storedData = sessionStorage.getItem('confirmationData')
    if (storedData) {
      setConfirmationData(JSON.parse(storedData))
      // Clear the session storage data
      sessionStorage.removeItem('confirmationData')
      sessionStorage.removeItem('bookingData')
    } else {
      // If no confirmation data, redirect to dashboard
      router.push('/dashboard')
    }
  }, [router])

  const copyPassword = () => {
    if (confirmationData?.retrievalPassword) {
      navigator.clipboard.writeText(confirmationData.retrievalPassword)
      setPasswordCopied(true)
      setTimeout(() => setPasswordCopied(false), 2000)
    }
  }

  const handleReturnToDashboard = () => {
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-foreground mb-4">Akses Ditolak</h1>
          <p className="text-muted-foreground mb-8">
            Kamu harus login dulu untuk akses halaman ini.
          </p>
          <Button asChild>
            <a href="/login">Login Dulu</a>
          </Button>
        </div>
      </div>
    )
  }

  if (!confirmationData) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-foreground mb-4">Booking Tidak Ditemukan</h1>
          <p className="text-muted-foreground mb-8">
            Kami nggak nemu data konfirmasi kamu. Cek dashboard ya.
          </p>
          <Button asChild>
            <a href="/dashboard">Ke Dashboard</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="mb-8 text-center">
          <div className="mb-6">
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Booking Berhasil! 🎉
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Booking penyimpanan kamu sudah dikonfirmasi & pembayaran sukses. Barangmu sudah siap dititipkan.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Retrieval Password - Most Important */}
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Key className="h-5 w-5" />
                Password Pengambilan
              </CardTitle>
              <CardDescription className="text-green-700">
                <strong>PENTING:</strong> Simpan password ini. Dibutuhkan saat ambil barang.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="bg-white p-6 rounded-lg border-2 border-dashed border-green-300">
                  <div className="text-4xl font-mono font-bold text-green-800 mb-2 tracking-widest">
                    {confirmationData.retrievalPassword}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={copyPassword}
                    className="text-green-700 border-green-300 hover:bg-green-50"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {passwordCopied ? 'Tersalin!' : 'Salin Password'}
                  </Button>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <p>• Catat / simpan password ini di tempat aman</p>
                  <p>• Screenshot / foto halaman ini</p>
                  <p>• Tunjukkan password saat ambil barang</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Details Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Konfirmasi Booking
              </CardTitle>
              <CardDescription>
                ID Booking: <span className="font-mono">{confirmationData.bookingId}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Item Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-base">Detail Barang</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>Jenis Barang</span>
                      </div>
                      <span className="capitalize font-medium">
                        {confirmationData.bookingData.itemType}
                        {confirmationData.bookingData.itemType === 'fragile' && (
                          <span className="text-orange-600 ml-1">(Rapuh)</span>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Weight className="h-4 w-4 text-muted-foreground" />
                        <span>Berat</span>
                      </div>
                      <span className="font-medium">{confirmationData.bookingData.weight} kg</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-muted-foreground" />
                        <span>Dimensi</span>
                      </div>
                      <span className="font-medium">
                        {confirmationData.bookingData.length} × {confirmationData.bookingData.width} × {confirmationData.bookingData.height} cm
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="ml-6">Volume</span>
                      <span className="font-medium">{confirmationData.bookingData.volume.toLocaleString()} cm³</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-base">Periode Penyimpanan</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Mulai</span>
                      </div>
                      <span className="font-medium">
                        {new Date(confirmationData.bookingData.startDate).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Selesai</span>
                      </div>
                      <span className="font-medium">
                        {new Date(confirmationData.bookingData.endDate).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between font-semibold">
                      <span>Durasi</span>
                      <span className="text-primary">
                        {confirmationData.bookingData.calculation.days} {confirmationData.bookingData.calculation.days === 1 ? 'hari' : 'hari'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <hr />

              {/* Payment Summary */}
              <div className="space-y-4">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Ringkasan Pembayaran
                </h3>
                
                <div className="bg-green-50/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Dibayar:</span>
                    <span className="text-2xl font-bold text-green-800">
                      {toIDR(confirmationData.totalAmount)}
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    ✓ Pembayaran sukses
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Langkah Berikutnya</CardTitle>
              <CardDescription>
                Ikuti langkah ini untuk selesaikan proses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Datang ke Lokasi</h4>
                    <p className="text-sm text-muted-foreground">
                      Kunjungi TitipYuk Semarang dalam 7 hari untuk antar barang.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Bawa Password Pengambilan</h4>
                    <p className="text-sm text-muted-foreground">
                      Tunjukkan password <strong>{confirmationData.retrievalPassword}</strong> ke staf kami.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Mulai Penyimpanan</h4>
                    <p className="text-sm text-muted-foreground">
                      Barangmu akan kami simpan dengan aman sampai waktunya diambil.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="text-center space-y-4">
            <Button size="lg" onClick={handleReturnToDashboard}>
              Ke Dashboard
            </Button>
            
            <div className="text-sm text-muted-foreground">
              <p>Butuh bantuan? Email <strong>support@titipyuk.com</strong> atau hubungi <strong>+62 24 1234567</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
