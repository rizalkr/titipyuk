'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Navigation from '@/components/Navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Calendar, Weight, Ruler, DollarSign, CheckCircle, Key, Copy } from 'lucide-react'

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
          <h1 className="text-3xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-8">
            You need to be logged in to access this page.
          </p>
          <Button asChild>
            <a href="/login">Login to Continue</a>
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
          <h1 className="text-3xl font-bold text-foreground mb-4">No Booking Found</h1>
          <p className="text-muted-foreground mb-8">
            We couldn't find your booking confirmation. Please check your dashboard.
          </p>
          <Button asChild>
            <a href="/dashboard">Go to Dashboard</a>
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
            Booking Successful! 🎉
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your storage booking has been confirmed and payment processed successfully. 
            Your items are now reserved and ready for drop-off.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Retrieval Password - Most Important */}
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Key className="h-5 w-5" />
                Your Retrieval Password
              </CardTitle>
              <CardDescription className="text-green-700">
                <strong>IMPORTANT:</strong> Please save this password. You will need it to retrieve your items.
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
                    {passwordCopied ? 'Copied!' : 'Copy Password'}
                  </Button>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <p>• Write this password down in a safe place</p>
                  <p>• Take a screenshot or photo of this page</p>
                  <p>• You'll need this password when collecting your items</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Details Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Booking Confirmation
              </CardTitle>
              <CardDescription>
                Booking ID: <span className="font-mono">{confirmationData.bookingId}</span>
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
                        {confirmationData.bookingData.itemType}
                        {confirmationData.bookingData.itemType === 'fragile' && (
                          <span className="text-orange-600 ml-1">(Special handling)</span>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Weight className="h-4 w-4 text-muted-foreground" />
                        <span>Weight</span>
                      </div>
                      <span className="font-medium">{confirmationData.bookingData.weight} kg</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-muted-foreground" />
                        <span>Dimensions</span>
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
                  <h3 className="font-semibold text-base">Storage Period</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Start Date</span>
                      </div>
                      <span className="font-medium">
                        {new Date(confirmationData.bookingData.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>End Date</span>
                      </div>
                      <span className="font-medium">
                        {new Date(confirmationData.bookingData.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between font-semibold">
                      <span>Duration</span>
                      <span className="text-primary">
                        {confirmationData.bookingData.calculation.days} {confirmationData.bookingData.calculation.days === 1 ? 'day' : 'days'}
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
                  Payment Summary
                </h3>
                
                <div className="bg-green-50/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Paid:</span>
                    <span className="text-2xl font-bold text-green-800">
                      ${confirmationData.totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    ✓ Payment completed successfully
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
              <CardDescription>
                Follow these simple steps to complete your storage process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Visit Our Location</h4>
                    <p className="text-sm text-muted-foreground">
                      Come to TitipYuk Semarang within the next 7 days to drop off your items.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Bring Your Retrieval Password</h4>
                    <p className="text-sm text-muted-foreground">
                      Present your password <strong>{confirmationData.retrievalPassword}</strong> to our staff.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Secure Storage Begins</h4>
                    <p className="text-sm text-muted-foreground">
                      Your items will be safely stored in our climate-controlled facility.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="text-center space-y-4">
            <Button size="lg" onClick={handleReturnToDashboard}>
              Return to Dashboard
            </Button>
            
            <div className="text-sm text-muted-foreground">
              <p>Need help? Contact us at <strong>support@titipyuk.com</strong> or call <strong>+62 24 1234567</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
