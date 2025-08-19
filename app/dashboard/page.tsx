'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Plus, Calendar, MapPin, Key, Copy, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

interface StorageBooking {
  id: string
  item_description: string
  start_date: string
  end_date: string | null
  status: string
  total_amount: number
  retrieval_password: string | null
  created_at: string
  storage_locations: {
    name: string
    address: string
  } | null
}

export default function DashboardPage() {
  const { user, loading } = useAuthContext()
  const [bookings, setBookings] = useState<StorageBooking[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [copiedPassword, setCopiedPassword] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<{ full_name?: string } | null>(null)
  const [stats, setStats] = useState({
    activeBookings: 0,
    totalSpent: 0,
    locationsUsed: 0
  })

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        setUserProfile(data)
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
    }

    fetchProfile()
  }, [user])

  // Fetch user's bookings
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('storage_bookings')
          .select(`
            *,
            storage_locations (
              name,
              address
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching bookings:', error)
          return
        }

        setBookings(data || [])

        // Calculate stats
        const activeBookings = (data || []).filter(booking => 
          booking.status === 'active' || booking.status === 'confirmed'
        ).length
        
        const totalSpent = (data || []).reduce((sum, booking) => 
          sum + (booking.total_amount || 0), 0
        )
        
        const uniqueLocations = new Set((data || []).map(booking => booking.location_id)).size

        setStats({
          activeBookings,
          totalSpent,
          locationsUsed: uniqueLocations
        })
      } catch (error) {
        console.error('Error fetching bookings:', error)
      } finally {
        setBookingsLoading(false)
      }
    }

    fetchBookings()
  }, [user])

  const copyToClipboard = async (password: string) => {
    try {
      await navigator.clipboard.writeText(password)
      setCopiedPassword(password)
      setTimeout(() => setCopiedPassword(null), 2000)
    } catch (error) {
      console.error('Failed to copy password:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50'
      case 'confirmed': return 'text-blue-600 bg-blue-50'
      case 'pending': return 'text-yellow-600 bg-yellow-50'
      case 'completed': return 'text-gray-600 bg-gray-50'
      case 'cancelled': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'confirmed': return <Clock className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Please log in to access the dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user.email}!
          </h1>
          <p className="text-muted-foreground">
            Manage your stored items and bookings from your dashboard
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Storage</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeBookings}</div>
              <p className="text-xs text-muted-foreground">
                items currently stored
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                total storage cost
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Locations</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.locationsUsed}</div>
              <p className="text-xs text-muted-foreground">
                storage locations used
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* My Bookings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>My Storage Bookings</CardTitle>
                  <CardDescription>
                    Manage your current and past storage bookings
                  </CardDescription>
                </div>
                <Link href="/booking">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Booking
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading your bookings...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't made any storage bookings. Start by creating your first booking!
                  </p>
                  <Link href="/booking">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Booking
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="border rounded-lg p-4 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">
                              {booking.item_description}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
                                booking.status
                              )}`}
                            >
                              {getStatusIcon(booking.status)}
                              {booking.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {new Date(booking.start_date).toLocaleDateString()} 
                                {booking.end_date && ` - ${new Date(booking.end_date).toLocaleDateString()}`}
                              </span>
                            </div>
                            
                            {booking.storage_locations && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{booking.storage_locations.name}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              <span>ID: {booking.id.slice(0, 8)}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                ${booking.total_amount?.toFixed(2) || '0.00'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Retrieval Password */}
                      {booking.retrieval_password && (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Key className="h-4 w-4 text-primary" />
                                <span className="font-semibold text-primary">Retrieval Password</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <code className="text-lg font-mono font-bold bg-background px-3 py-1 rounded border">
                                  {booking.retrieval_password}
                                </code>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(booking.retrieval_password!)}
                                  className="h-8"
                                >
                                  {copiedPassword === booking.retrieval_password ? (
                                    <CheckCircle className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            You'll need this password to retrieve your stored items. Keep it safe!
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common actions you can take from your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/booking">
                <Button className="w-full justify-start" size="lg" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Book New Storage
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start" size="lg" disabled>
                <Package className="h-4 w-4 mr-2" />
                View My Items
              </Button>
              <Button variant="outline" className="w-full justify-start" size="lg" disabled>
                <MapPin className="h-4 w-4 mr-2" />
                Find Locations
              </Button>
              <Button variant="outline" className="w-full justify-start" size="lg" disabled>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Pickup
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Storage Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started with TitipYuk</CardTitle>
            <CardDescription>
              Follow these simple steps to start storing your items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Calculate & Book</h3>
                <p className="text-sm text-muted-foreground">
                  Use our price calculator to estimate costs and create a booking
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Get Your Password</h3>
                <p className="text-sm text-muted-foreground">
                  Receive a unique retrieval password after payment confirmation
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Store & Retrieve</h3>
                <p className="text-sm text-muted-foreground">
                  Drop off your items and use your password to retrieve them later
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
