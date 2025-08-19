'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Navigation from '@/components/Navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Calendar, Weight, Ruler, DollarSign, CreditCard, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface BookingData {
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

// Helper format Rupiah (asumsi nilai awal dalam USD -> dikonversi, ubah EXCHANGE_RATE jika perlu)
const EXCHANGE_RATE = 15000 // 1 USD ~ 15.000 IDR (sesuaikan sesuai kebutuhan)
function toIDR(value: number) {
  const rupiah = Math.round(value * EXCHANGE_RATE)
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(rupiah)
}

export default function CheckoutPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStep, setPaymentStep] = useState<'ready' | 'processing' | 'saving' | 'success'>('ready')
  const [defaultLocationId, setDefaultLocationId] = useState<string | null>(null)
  const [defaultBoxTypeId, setDefaultBoxTypeId] = useState<string | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)

  useEffect(() => {
    // Get booking data from sessionStorage
    const storedData = sessionStorage.getItem('bookingData')
    if (storedData) {
      setBookingData(JSON.parse(storedData))
    } else {
      // If no booking data, redirect to booking page
      router.push('/booking')
    }
  }, [router])

  // Fetch one active location & box type once user known
  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      try {
        const [{ data: locData, error: locErr }, { data: boxData, error: boxErr }] = await Promise.all([
          supabase.from('storage_locations').select('id').eq('is_active', true).limit(1),
          supabase.from('box_types').select('id').eq('is_active', true).limit(1),
        ])
        if (locErr || boxErr) throw locErr || boxErr
        if (!locData?.length || !boxData?.length) throw new Error('No active location or box type found')
        if (!cancelled) {
          setDefaultLocationId(locData[0].id)
          setDefaultBoxTypeId(boxData[0].id)
        }
      } catch (e: any) {
        if (!cancelled) setLookupError(e.message || 'Lookup failed')
      }
    })()
    return () => { cancelled = true }
  }, [user])

  const generateRetrievalPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let password = ''
    for (let i = 0; i < 6; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const handlePayment = async () => {
    if (!bookingData || !user || paymentStep !== 'ready') return
    if (lookupError) {
      alert('Tidak bisa lanjut: ' + lookupError)
      return
    }
    if (!defaultLocationId || !defaultBoxTypeId) {
      alert('Data lokasi lagi dimuat, tunggu sebentar...')
      return
    }

    setIsProcessing(true)
    setPaymentStep('processing')

    try {
      // 1. Simulasi proses pembayaran
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 2. Ganti state ke saving (menyimpan booking)
      setPaymentStep('saving')

      // 3. Generate password & simpan booking (baru dianggap sukses setelah ini)
      const retrievalPassword = generateRetrievalPassword()

      const { data, error } = await supabase
        .from('storage_bookings')
        .insert({
          user_id: user.id,
          location_id: defaultLocationId,
          box_type_id: defaultBoxTypeId,
          item_description: `${bookingData.itemType} item - ${bookingData.weight}kg`,
          item_value: null,
          start_date: bookingData.startDate,
          end_date: bookingData.endDate,
          status: 'confirmed',
          total_amount: bookingData.calculation.totalPrice,
          payment_status: 'paid',
          retrieval_password: retrievalPassword,
        })
        .select()
        .single()

      if (error) throw error

      // 4. Tandai sukses baru setelah insert berhasil
      setPaymentStep('success')

      const confirmationData = {
        bookingId: data.id,
        bookingData,
        retrievalPassword,
        totalAmount: bookingData.calculation.totalPrice,
      }
      sessionStorage.setItem('confirmationData', JSON.stringify(confirmationData))

      // 5. Tunda sedikit agar user melihat status sukses
      setTimeout(() => {
        router.push('/confirmation')
      }, 800)
    } catch (error) {
      console.error('Payment failed:', error)
      alert('Gagal menyimpan booking setelah pembayaran. Coba lagi ya.')
      setPaymentStep('ready')
    } finally {
      setIsProcessing(false)
    }
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
            Kamu harus login dulu buat lanjut ke halaman checkout.
          </p>
          <Button asChild>
            <a href="/login">Login dulu</a>
          </Button>
        </div>
      </div>
    )
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-foreground mb-4">Tidak Ada Data Booking</h1>
          <p className="text-muted-foreground mb-8">
            Mulai dengan bikin booking dulu ya.
          </p>
          <Button asChild>
            <a href="/booking">Buat Booking Baru</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Pembayaran
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Cek lagi detail titipanmu sebelum lanjut bayar.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Payment Modal Overlay */}
          {isProcessing && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-background p-8 rounded-lg shadow-lg text-center max-w-sm mx-4">
                <div className="mb-4">
                  {paymentStep === 'processing' && (
                    <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
                  )}
                  {paymentStep === 'saving' && (
                    <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
                  )}
                  {paymentStep === 'success' && (
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <div className="h-6 w-6 bg-green-600 rounded-full flex items-center justify-center">
                        <div className="text-white text-xs">✓</div>
                      </div>
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {paymentStep === 'processing' && 'Memproses Pembayaran...'}
                  {paymentStep === 'saving' && 'Menyimpan Booking...'}
                  {paymentStep === 'success' && 'Pembayaran Berhasil!'}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {paymentStep === 'processing' && 'Tunggu sebentar ya, lagi diproses.'}
                  {paymentStep === 'saving' && 'Finalisasi & simpan data booking kamu.'}
                  {paymentStep === 'success' && 'Booking kamu sudah dikonfirmasi.'}
                </p>
              </div>
            </div>
          )}

          {/* Booking Summary */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Ringkasan Titipan
              </CardTitle>
              <CardDescription>
                Detail titipan kamu
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
                        {bookingData.itemType}
                        {bookingData.itemType === 'fragile' && (
                          <span className="text-orange-600 ml-1">(+50% fragile)</span>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Weight className="h-4 w-4 text-muted-foreground" />
                        <span>Berat</span>
                      </div>
                      <span className="font-medium">{bookingData.weight} kg</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-muted-foreground" />
                        <span>Dimensi</span>
                      </div>
                      <span className="font-medium">
                        {bookingData.length} × {bookingData.width} × {bookingData.height} cm
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="ml-6">Volume</span>
                      <span className="font-medium">{bookingData.volume.toLocaleString()} cm³</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-base">Lama Penyimpanan</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Tanggal Mulai</span>
                      </div>
                      <span className="font-medium">
                        {new Date(bookingData.startDate).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Tanggal Selesai</span>
                      </div>
                      <span className="font-medium">
                        {new Date(bookingData.endDate).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between font-semibold">
                      <span>Total Hari</span>
                      <span className="text-primary">
                        {bookingData.calculation.days} {bookingData.calculation.days === 1 ? 'hari' : 'hari'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <hr />

              {/* Price Breakdown */}
              <div className="space-y-4">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Rincian Biaya
                </h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Tarif Dasar</span>
                    <span>{toIDR(bookingData.calculation.baseRate)}</span>
                  </div>
                  
                  {bookingData.calculation.volumeSurcharge > 0 && (
                    <div className="flex justify-between">
                      <span>Biaya Volume</span>
                      <span>{toIDR(bookingData.calculation.volumeSurcharge)}</span>
                    </div>
                  )}
                  
                  {bookingData.calculation.weightSurcharge > 0 && (
                    <div className="flex justify-between">
                      <span>Biaya Berat</span>
                      <span>{toIDR(bookingData.calculation.weightSurcharge)}</span>
                    </div>
                  )}
                  
                  {bookingData.calculation.fragileMultiplier > 1 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Fragile (+50%)</span>
                      <span>×{bookingData.calculation.fragileMultiplier}</span>
                    </div>
                  )}
                </div>

                <hr />
                
                {/* Total */}
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Bayar:</span>
                  <span className="text-2xl text-primary">
                    {toIDR(bookingData.calculation.totalPrice)}
                  </span>
                </div>
                
                <div className="text-sm text-muted-foreground text-center">
                  ≈ {toIDR(bookingData.calculation.totalPrice / bookingData.calculation.days)} / hari
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Pembayaran
              </CardTitle>
              <CardDescription>
                Selesaikan pembayaran untuk konfirmasi titipanmu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="bg-muted/50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Pembayaran Aman</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Pembayaran diproses secara aman (demo saja).
                  </p>
                  
                  <Button 
                    size="lg" 
                    className="px-8 py-3 text-lg"
                    onClick={handlePayment}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Bayar Sekarang - {toIDR(bookingData.calculation.totalPrice)}
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="flex flex-col md:flex-row items-center justify-center md:space-x-4 space-y-1 md:space-y-0 text-sm text-muted-foreground">
                  <span>🔒 Aman</span>
                  <span className="hidden md:inline">•</span>
                  <span>💳 Banyak metode</span>
                  <span className="hidden md:inline">•</span>
                  <span>🛡️ Terenkripsi</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Back to Booking */}
          <div className="mt-8 text-center">
            <Button variant="outline" onClick={() => router.push('/booking')}>
              ← Kembali ke Booking
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
