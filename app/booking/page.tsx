'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Navigation from '@/components/Navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calculator, Package, Calendar, Weight, Ruler, AlertTriangle } from 'lucide-react'
import { toIDR } from '@/lib/utils'

interface PriceCalculation {
  baseRate: number
  volumeSurcharge: number
  weightSurcharge: number
  fragileMultiplier: number
  totalPrice: number
  days: number
}

export default function BookingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [itemType, setItemType] = useState<'normal' | 'fragile'>('normal')
  const [weight, setWeight] = useState<string>('')
  const [length, setLength] = useState<string>('')
  const [width, setWidth] = useState<string>('')
  const [height, setHeight] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [volume, setVolume] = useState<number>(0)
  const [calculation, setCalculation] = useState<PriceCalculation | null>(null)
  const [isFormValid, setIsFormValid] = useState<boolean>(false)

  // Calculate volume when dimensions change
  useEffect(() => {
    const l = parseFloat(length) || 0
    const w = parseFloat(width) || 0
    const h = parseFloat(height) || 0
    setVolume(l * w * h)
  }, [length, width, height])

  // Calculate price whenever form values change
  useEffect(() => {
    const calculatePrice = () => {
      const weightNum = parseFloat(weight) || 0
      const startDateObj = new Date(startDate)
      const endDateObj = new Date(endDate)
      
      // Validation
      if (!weight || !length || !width || !height || !startDate || !endDate) {
        setCalculation(null)
        setIsFormValid(false)
        return
      }
      
      if (startDateObj >= endDateObj) {
        setCalculation(null)
        setIsFormValid(false)
        return
      }
      
      // Calculate number of days
      const timeDiff = endDateObj.getTime() - startDateObj.getTime()
      const days = Math.ceil(timeDiff / (1000 * 3600 * 24))
      
      if (days <= 0) {
        setCalculation(null)
        setIsFormValid(false)
        return
      }
      
      // Pricing logic
      const baseRate = 0.50 * days // $0.50 per day
      const volumeSurcharge = (volume / 1000) * 0.01 * days // $0.01 per 1,000 cm³ per day
      const weightSurcharge = weightNum * 0.10 * days // $0.10 per kg per day
      
      const fragileMultiplier = itemType === 'fragile' ? 1.5 : 1.0
      const totalPrice = (baseRate + volumeSurcharge + weightSurcharge) * fragileMultiplier
      
      setCalculation({
        baseRate,
        volumeSurcharge,
        weightSurcharge,
        fragileMultiplier,
        totalPrice,
        days
      })
      
      setIsFormValid(true)
    }
    
    calculatePrice()
  }, [itemType, weight, length, width, height, startDate, endDate, volume])

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
            <p className="text-muted-foreground mb-8">Kamu harus login dulu untuk akses halaman booking.</p>
            <Button asChild>
              <a href="/login">Login Dulu</a>
            </Button>
        </div>
      </div>
    )
  }

  const handleProceedToCheckout = () => {
    if (!calculation || !isFormValid) return
    
    // Store booking data in sessionStorage to pass to checkout page
    const bookingData = {
      itemType,
      weight: parseFloat(weight),
      length: parseFloat(length),
      width: parseFloat(width),
      height: parseFloat(height),
      volume,
      startDate,
      endDate,
      calculation
    }
    
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData))
    router.push('/checkout')
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Hitung Harga Penyimpanan
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Dapatkan estimasi biaya instan buat nitip barang kamu di TitipYuk Semarang. 
            Isi detail di bawah ini buat lihat harga.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Left Column - Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Detail Barang & Kalkulator
              </CardTitle>
              <CardDescription>
                Masukkan detail barang untuk hitung biaya
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Item Type */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Jenis Barang
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      itemType === 'normal' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-input hover:border-primary/50'
                    }`}
                    onClick={() => setItemType('normal')}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        name="itemType"
                        value="normal"
                        checked={itemType === 'normal'}
                        onChange={() => setItemType('normal')}
                        className="text-primary"
                      />
                      <Label className="font-medium cursor-pointer">Normal</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Barang standar seperti pakaian, buku, dokumen
                    </p>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      itemType === 'fragile' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-input hover:border-primary/50'
                    }`}
                    onClick={() => setItemType('fragile')}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        name="itemType"
                        value="fragile"
                        checked={itemType === 'fragile'}
                        onChange={() => setItemType('fragile')}
                        className="text-primary"
                      />
                      <Label className="font-medium cursor-pointer">Fragile</Label>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-orange-600">
                      <AlertTriangle className="h-3 w-3" />
                      Perlakuan khusus (+50%)
                    </div>
                  </div>
                </div>
              </div>

              {/* Weight */}
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-base font-semibold flex items-center gap-2">
                  <Weight className="h-4 w-4" />
                  Berat Barang (kg)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="Masukkan berat (kg)"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  min="0"
                  step="0.1"
                  className="text-base"
                />
              </div>

              {/* Dimensions */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Dimensi Barang (cm)
                </Label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="length" className="text-sm text-muted-foreground">Panjang</Label>
                    <Input
                      id="length"
                      type="number"
                      placeholder="P"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="width" className="text-sm text-muted-foreground">Lebar</Label>
                    <Input
                      id="width"
                      type="number"
                      placeholder="L"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="height" className="text-sm text-muted-foreground">Tinggi</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="T"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>
                {volume > 0 && (
                  <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                    Volume: <span className="font-semibold">{volume.toLocaleString()} cm³</span>
                  </div>
                )}
              </div>

              {/* Storage Duration */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Durasi Penyimpanan
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate" className="text-sm text-muted-foreground">Tanggal Mulai</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate" className="text-sm text-muted-foreground">Tanggal Selesai</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Price Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Estimasi Harga
              </CardTitle>
              <CardDescription>
                Harga realtime berdasarkan detail barang
              </CardDescription>
            </CardHeader>
            <CardContent>
              {calculation ? (
                <div className="space-y-4">
                  {/* Duration */}
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {calculation.days} {calculation.days === 1 ? 'Hari' : 'Hari'}
                      </div>
                      <div className="text-sm text-muted-foreground">Durasi Penyimpanan</div>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-base">Rincian Harga:</h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Tarif Dasar ({calculation.days} hari)</span>
                        <span>{toIDR(calculation.baseRate)}</span>
                      </div>
                      
                      {calculation.volumeSurcharge > 0 && (
                        <div className="flex justify-between">
                          <span>Biaya Volume ({(volume/1000).toFixed(1)}k cm³)</span>
                          <span>{toIDR(calculation.volumeSurcharge)}</span>
                        </div>
                      )}
                      
                      {calculation.weightSurcharge > 0 && (
                        <div className="flex justify-between">
                          <span>Biaya Berat ({weight}kg)</span>
                          <span>{toIDR(calculation.weightSurcharge)}</span>
                        </div>
                      )}
                      
                      {calculation.fragileMultiplier > 1 && (
                        <div className="flex justify-between text-orange-600">
                          <span>Barang Rapuh (+50%)</span>
                          <span>×{calculation.fragileMultiplier}</span>
                        </div>
                      )}
                    </div>

                    <hr className="my-3" />
                    
                    {/* Total */}
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total Harga:</span>
                      <span className="text-2xl text-primary">
                        {toIDR(calculation.totalPrice)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground text-center">
                      ≈ {toIDR(calculation.totalPrice / calculation.days)} per hari
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button 
                    className="w-full mt-6" 
                    size="lg"
                    onClick={handleProceedToCheckout}
                    disabled={!isFormValid}
                  >
                    Lanjut ke Checkout
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">
                    Isi form untuk lihat estimasi harga
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Semua field wajib diisi supaya akurat
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Information Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Package className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Penyimpanan Aman</h3>
              <p className="text-sm text-muted-foreground">
                Keamanan 24/7 dan lingkungan terkontrol
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Calendar className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Durasi Fleksibel</h3>
              <p className="text-sm text-muted-foreground">
                Harian, mingguan, atau bulanan tanpa komitmen panjang
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <AlertTriangle className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Perlakuan Khusus</h3>
              <p className="text-sm text-muted-foreground">
                Barang fragile diperlakukan ekstra hati-hati
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
