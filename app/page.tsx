'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import Navigation from '@/components/Navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, MapPin, Clock, Star, Package, Users } from 'lucide-react'

export default function HomePage() {
  const { user, loading } = useAuth()
  console.log(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Bagian Hero */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Simpan Barangmu Dengan Aman di{' '}
            <span className="text-primary">Semarang</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            TitipYuk menyediakan solusi penyimpanan barang yang aman, nyaman, dan terjangkau 
            di seluruh Semarang. Simpan apa saja, mulai dari dokumen hingga barang-barang pribadi Anda.
          </p>
          <div className="flex gap-4 justify-center">
            {user ? (
              <Link href="/booking">
                <Button size="lg" className="px-8">
                  Mulai Titipkan Barangmu
                </Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button size="lg" className="px-8">
                  Mulai Titipkan Barangmu
                </Button>
              </Link>
            )}
            <Link href="#features">
              <Button variant="outline" size="lg" className="px-8">
                Pelajari Lebih Lanjut
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Bagian Fitur */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Mengapa Memilih TitipYuk?
            </h2>
            <p className="text-xl text-muted-foreground">
              Tiga alasan utama mengapa TitipYuk adalah pilihan terbaik untuk kebutuhan penyimpanan Anda
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader className="text-center">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Penyimpanan Aman</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Barang Anda dilindungi dengan pemantauan keamanan 24/7, 
                  kontrol suhu, dan perlindungan asuransi yang komprehensif.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Lokasi Strategis</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Berbagai lokasi penyimpanan di seluruh Semarang untuk akses yang mudah. 
                  Semua lokasi berada di dekat transportasi umum.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Akses Fleksibel</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Akses barang Anda kapan saja dengan kebijakan akses 24/7 kami. 
                  Pesan layanan antar-jemput melalui platform kami.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Bagian Statistik */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-primary mr-2" />
                <span className="text-4xl font-bold text-foreground">1000+</span>
              </div>
              <p className="text-muted-foreground">Pelanggan Puas</p>
            </div>
            <div>
              <div className="flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-primary mr-2" />
                <span className="text-4xl font-bold text-foreground">5000+</span>
              </div>
              <p className="text-muted-foreground">Barang Tersimpan</p>
            </div>
            <div>
              <div className="flex items-center justify-center mb-4">
                <Star className="h-8 w-8 text-primary mr-2" />
                <span className="text-4xl font-bold text-foreground">4.9</span>
              </div>
              <p className="text-muted-foreground">Rating Rata-rata</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bagian Harga */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Harga Simpel dan Transparan
            </h2>
            <p className="text-xl text-muted-foreground">
              Tanpa biaya tersembunyi. Bayar hanya untuk yang Anda butuhkan.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Kotak Kecil</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">Rp 25K</span>
                  <span className="text-muted-foreground">/bulan</span>
                </div>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>
                  Sempurna untuk dokumen, elektronik kecil, dan barang-barang pribadi.
                  <br />
                  <strong>Ukuran:</strong> 30×20×15 cm
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-primary">
              <CardHeader className="text-center">
                <div className="bg-primary text-primary-foreground text-sm py-1 px-3 rounded-full inline-block mb-2">
                  Paling Populer
                </div>
                <CardTitle className="text-2xl">Kotak Sedang</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">Rp 45K</span>
                  <span className="text-muted-foreground">/bulan</span>
                </div>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>
                  Cocok untuk pakaian, buku, dan barang berukuran sedang.
                  <br />
                  <strong>Ukuran:</strong> 50×40×30 cm
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Kotak Besar</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">Rp 75K</span>
                  <span className="text-muted-foreground">/bulan</span>
                </div>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>
                  Ideal untuk perabotan, elektronik besar, dan barang dalam jumlah besar.
                  <br />
                  <strong>Ukuran:</strong> 80×60×50 cm
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" className="px-8">
                  Pesan Penyimpanan Anda
                </Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button size="lg" className="px-8">
                  Mulai Hari Ini
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Bagian Footer */}
      <footer className="bg-background border-t py-8 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <Package className="h-6 w-6 text-primary mr-2" />
            <span className="font-bold text-lg">TitipYuk Semarang</span>
          </div>
          <p className="text-muted-foreground">
            © 2025 TitipYuk Semarang. Hak cipta dilindungi undang-undang.
          </p>
        </div>
      </footer>
    </div>
  )
}