'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Plus, Calendar, MapPin, Key, Copy, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { toIDR } from '@/lib/utils'

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
          <h1 className="text-2xl font-bold text-foreground mb-4">Akses Ditolak</h1>
          <p className="text-muted-foreground">Silakan login dulu untuk akses dashboard.</p>
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
            Halo{userProfile?.full_name ? `, ${userProfile.full_name}` : `, ${user.email}`}! 👋
          </h1>
          <p className="text-muted-foreground">
            Kelola semua titipan dan riwayat penyimpananmu di sini.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Titipan Aktif</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeBookings}</div>
              <p className="text-xs text-muted-foreground">
                barang lagi disimpan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{toIDR(stats.totalSpent)}</div>
              <p className="text-xs text-muted-foreground">
                total biaya penyimpanan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lokasi Dipakai</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.locationsUsed}</div>
              <p className="text-xs text-muted-foreground">
                lokasi penyimpanan
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
                  <CardTitle>Titipan Saya</CardTitle>
                  <CardDescription>Kelola titipan aktif & riwayatmu</CardDescription>
                </div>
                <Link href="/booking">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Titip Baru
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Memuat data titipan...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Belum ada titipan</h3>
                  <p className="text-muted-foreground mb-4">
                    Kamu belum buat titipan. Yuk mulai sekarang!
                  </p>
                  <Link href="/booking">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Buat Titipan Pertama
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
                              {booking.status === 'active' && 'aktif'}
                              {booking.status === 'confirmed' && 'terkonfirmasi'}
                              {booking.status === 'pending' && 'menunggu'}
                              {booking.status === 'completed' && 'selesai'}
                              {booking.status === 'cancelled' && 'batal'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {new Date(booking.start_date).toLocaleDateString('id-ID')} 
                                {booking.end_date && ` - ${new Date(booking.end_date).toLocaleDateString('id-ID')}`}
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
                                {toIDR(booking.total_amount)}
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
                                <span className="font-semibold text-primary">Password Pengambilan</span>
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
                            Simpan password ini baik-baik ya. Dibutuhkan saat ambil barang.
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
              <CardTitle>Aksi Cepat</CardTitle>
              <CardDescription>Beberapa tindakan cepat buat kamu</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/booking">
                <Button className="w-full justify-start" size="lg" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Titip Barang
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start" size="lg" disabled>
                <Package className="h-4 w-4 mr-2" />
                Lihat Barang
              </Button>
              <Button variant="outline" className="w-full justify-start" size="lg" disabled>
                <MapPin className="h-4 w-4 mr-2" />
                Cari Lokasi
              </Button>
              <Button variant="outline" className="w-full justify-start" size="lg" disabled>
                <Calendar className="h-4 w-4 mr-2" />
                Jadwal Pickup
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Storage Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Panduan TitipYuk</CardTitle>
            <CardDescription>Langkah sederhana buat mulai nitip</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Hitung & Booking</h3>
                <p className="text-sm text-muted-foreground">
                  Pakai kalkulator buat estimasi harga lalu buat booking
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Dapat Password</h3>
                <p className="text-sm text-muted-foreground">
                  Setelah bayar, kamu bakal terima password pengambilan
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Simpan & Ambil</h3>
                <p className="text-sm text-muted-foreground">
                  Antar barangmu dan ambil lagi kapan saja dengan password
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
