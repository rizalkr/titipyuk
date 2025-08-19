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
  
  // Form state
  const [itemType, setItemType] = useState<'normal' | 'fragile'>('normal')
  const [weight, setWeight] = useState<string>('')
  const [length, setLength] = useState<string>('')
  const [width, setWidth] = useState<string>('')
  const [height, setHeight] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  
  // Calculated values
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
      
      let subtotal = baseRate + volumeSurcharge + weightSurcharge
      const fragileMultiplier = itemType === 'fragile' ? 1.5 : 1.0
      const totalPrice = subtotal * fragileMultiplier
      
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
          <h1 className="text-3xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-8">
            You need to be logged in to access the booking page.
          </p>
          <Button asChild>
            <a href="/login">Login to Continue</a>
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
            Calculate Storage Price
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get an instant quote for storing your items with TitipYuk Semarang. 
            Fill out the details below to see your personalized pricing.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Left Column - Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Item Details & Calculator
              </CardTitle>
              <CardDescription>
                Provide your item details to calculate storage costs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Item Type */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Item Type
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
                      Standard items like clothes, books, documents
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
                      Special handling (+50%)
                    </div>
                  </div>
                </div>
              </div>

              {/* Weight */}
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-base font-semibold flex items-center gap-2">
                  <Weight className="h-4 w-4" />
                  Item Weight (kg)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="Enter weight in kg"
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
                  Item Dimensions (cm)
                </Label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="length" className="text-sm text-muted-foreground">Length</Label>
                    <Input
                      id="length"
                      type="number"
                      placeholder="L"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="width" className="text-sm text-muted-foreground">Width</Label>
                    <Input
                      id="width"
                      type="number"
                      placeholder="W"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="height" className="text-sm text-muted-foreground">Height</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="H"
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
                  Storage Duration
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate" className="text-sm text-muted-foreground">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate" className="text-sm text-muted-foreground">End Date</Label>
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
                Price Estimate
              </CardTitle>
              <CardDescription>
                Real-time pricing based on your item details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {calculation ? (
                <div className="space-y-4">
                  {/* Duration */}
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {calculation.days} {calculation.days === 1 ? 'Day' : 'Days'}
                      </div>
                      <div className="text-sm text-muted-foreground">Storage Duration</div>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-base">Price Breakdown:</h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Base Rate ({calculation.days} days × $0.50)</span>
                        <span>${calculation.baseRate.toFixed(2)}</span>
                      </div>
                      
                      {calculation.volumeSurcharge > 0 && (
                        <div className="flex justify-between">
                          <span>Volume Surcharge ({(volume/1000).toFixed(1)}k cm³)</span>
                          <span>${calculation.volumeSurcharge.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {calculation.weightSurcharge > 0 && (
                        <div className="flex justify-between">
                          <span>Weight Surcharge ({weight}kg)</span>
                          <span>${calculation.weightSurcharge.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {calculation.fragileMultiplier > 1 && (
                        <div className="flex justify-between text-orange-600">
                          <span>Fragile Handling (+50%)</span>
                          <span>×{calculation.fragileMultiplier}</span>
                        </div>
                      )}
                    </div>

                    <hr className="my-3" />
                    
                    {/* Total */}
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total Price:</span>
                      <span className="text-2xl text-primary">
                        ${calculation.totalPrice.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground text-center">
                      ≈ ${(calculation.totalPrice / calculation.days).toFixed(2)} per day
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button 
                    className="w-full mt-6" 
                    size="lg"
                    onClick={handleProceedToCheckout}
                    disabled={!isFormValid}
                  >
                    Proceed to Checkout
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">
                    Fill out the form to see your price estimate
                  </p>
                  <p className="text-sm text-muted-foreground">
                    All fields are required for accurate pricing
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
              <h3 className="font-semibold mb-2">Secure Storage</h3>
              <p className="text-sm text-muted-foreground">
                24/7 security monitoring and climate-controlled environments
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Calendar className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Flexible Duration</h3>
              <p className="text-sm text-muted-foreground">
                Store for days, weeks, or months. No long-term commitments required
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <AlertTriangle className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Special Handling</h3>
              <p className="text-sm text-muted-foreground">
                Extra care for fragile items with specialized packaging and handling
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
