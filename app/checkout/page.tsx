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

export default function CheckoutPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStep, setPaymentStep] = useState<'ready' | 'processing' | 'success'>('ready')

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

  const generateRetrievalPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let password = ''
    for (let i = 0; i < 6; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const handlePayment = async () => {
    if (!bookingData || !user) return

    setIsProcessing(true)
    setPaymentStep('processing')

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setPaymentStep('success')
      
      // Wait another second to show success message
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Generate unique retrieval password
      const retrievalPassword = generateRetrievalPassword()

      // Save booking to Supabase
      const { data, error } = await supabase
        .from('storage_bookings')
        .insert({
          user_id: user.id,
          // For now, we'll use a default location and box type
          location_id: '00000000-0000-0000-0000-000000000001', // This should be selected by user later
          box_type_id: '00000000-0000-0000-0000-000000000001', // This should be based on size calculation
          item_description: `${bookingData.itemType} item - ${bookingData.weight}kg`,
          item_value: null, // Could be added in future
          start_date: bookingData.startDate,
          end_date: bookingData.endDate,
          status: 'confirmed',
          total_amount: bookingData.calculation.totalPrice,
          payment_status: 'paid',
          retrieval_password: retrievalPassword
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving booking:', error)
        throw error
      }

      // Store confirmation data for the confirmation page
      const confirmationData = {
        bookingId: data.id,
        bookingData,
        retrievalPassword,
        totalAmount: bookingData.calculation.totalPrice
      }

      sessionStorage.setItem('confirmationData', JSON.stringify(confirmationData))
      
      // Redirect to confirmation page
      router.push('/confirmation')

    } catch (error) {
      console.error('Payment failed:', error)
      alert('Payment failed. Please try again.')
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
          <h1 className="text-3xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-8">
            You need to be logged in to access the checkout page.
          </p>
          <Button asChild>
            <a href="/login">Login to Continue</a>
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
          <h1 className="text-3xl font-bold text-foreground mb-4">No Booking Data</h1>
          <p className="text-muted-foreground mb-8">
            Please start by creating a booking first.
          </p>
          <Button asChild>
            <a href="/booking">Create New Booking</a>
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
            Checkout
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Review your booking details and complete your payment to secure your storage space.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Payment Modal Overlay */}
          {isProcessing && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-background p-8 rounded-lg shadow-lg text-center max-w-sm mx-4">
                <div className="mb-4">
                  {paymentStep === 'processing' ? (
                    <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
                  ) : (
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <div className="h-6 w-6 bg-green-600 rounded-full flex items-center justify-center">
                        <div className="text-white text-xs">✓</div>
                      </div>
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {paymentStep === 'processing' ? 'Processing Payment...' : 'Payment Successful!'}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {paymentStep === 'processing' 
                    ? 'Please wait while we process your payment.' 
                    : 'Your booking has been confirmed.'}
                </p>
              </div>
            </div>
          )}

          {/* Booking Summary */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Booking Summary
              </CardTitle>
              <CardDescription>
                Review your storage booking details below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Item Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-base">Item Details</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>Item Type</span>
                      </div>
                      <span className="capitalize font-medium">
                        {bookingData.itemType}
                        {bookingData.itemType === 'fragile' && (
                          <span className="text-orange-600 ml-1">(+50% handling fee)</span>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Weight className="h-4 w-4 text-muted-foreground" />
                        <span>Weight</span>
                      </div>
                      <span className="font-medium">{bookingData.weight} kg</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-muted-foreground" />
                        <span>Dimensions</span>
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
                  <h3 className="font-semibold text-base">Storage Duration</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Start Date</span>
                      </div>
                      <span className="font-medium">
                        {new Date(bookingData.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>End Date</span>
                      </div>
                      <span className="font-medium">
                        {new Date(bookingData.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between font-semibold">
                      <span>Total Duration</span>
                      <span className="text-primary">
                        {bookingData.calculation.days} {bookingData.calculation.days === 1 ? 'day' : 'days'}
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
                  Price Breakdown
                </h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Base Rate ({bookingData.calculation.days} days × $0.50)</span>
                    <span>${bookingData.calculation.baseRate.toFixed(2)}</span>
                  </div>
                  
                  {bookingData.calculation.volumeSurcharge > 0 && (
                    <div className="flex justify-between">
                      <span>Volume Surcharge ({(bookingData.volume/1000).toFixed(1)}k cm³)</span>
                      <span>${bookingData.calculation.volumeSurcharge.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {bookingData.calculation.weightSurcharge > 0 && (
                    <div className="flex justify-between">
                      <span>Weight Surcharge ({bookingData.weight}kg)</span>
                      <span>${bookingData.calculation.weightSurcharge.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {bookingData.calculation.fragileMultiplier > 1 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Fragile Handling (+50%)</span>
                      <span>×{bookingData.calculation.fragileMultiplier}</span>
                    </div>
                  )}
                </div>

                <hr />
                
                {/* Total */}
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-2xl text-primary">
                    ${bookingData.calculation.totalPrice.toFixed(2)}
                  </span>
                </div>
                
                <div className="text-sm text-muted-foreground text-center">
                  ≈ ${(bookingData.calculation.totalPrice / bookingData.calculation.days).toFixed(2)} per day
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment
              </CardTitle>
              <CardDescription>
                Complete your payment to confirm your storage booking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="bg-muted/50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Secure Payment</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Your payment is processed securely. This is a demo payment process.
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
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Pay Now - ${bookingData.calculation.totalPrice.toFixed(2)}
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                  <span>🔒 Secure checkout</span>
                  <span>•</span>
                  <span>💳 All payment methods accepted</span>
                  <span>•</span>
                  <span>🛡️ Protected by encryption</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Back to Booking */}
          <div className="mt-8 text-center">
            <Button variant="outline" onClick={() => router.push('/booking')}>
              ← Back to Booking
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
