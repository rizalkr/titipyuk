'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import Navigation from '@/components/Navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, MapPin, Clock, Star, Package, Users } from 'lucide-react'

export default function HomePage() {
  const { user, loading } = useAuth()

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
      
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Store Your Items Safely in{' '}
            <span className="text-primary">Semarang</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            TitipYuk provides secure, convenient, and affordable item storage solutions 
            throughout Semarang. Store anything from documents to personal belongings.
          </p>
          <div className="flex gap-4 justify-center">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" className="px-8">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button size="lg" className="px-8">
                  Start Storing Your Items
                </Button>
              </Link>
            )}
            <Link href="#features">
              <Button variant="outline" size="lg" className="px-8">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Why Choose TitipYuk?
            </h2>
            <p className="text-xl text-muted-foreground">
              Three key reasons why TitipYuk is the best choice for your storage needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader className="text-center">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Secure Storage</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Your items are protected with 24/7 security monitoring, 
                  climate control, and comprehensive insurance coverage.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Prime Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Multiple storage locations across Semarang for easy access. 
                  All locations are strategically placed near public transportation.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Flexible Access</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Access your items anytime with our 24/7 access policy. 
                  Book pickup and drop-off services through our platform.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-primary mr-2" />
                <span className="text-4xl font-bold text-foreground">1000+</span>
              </div>
              <p className="text-muted-foreground">Happy Customers</p>
            </div>
            <div>
              <div className="flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-primary mr-2" />
                <span className="text-4xl font-bold text-foreground">5000+</span>
              </div>
              <p className="text-muted-foreground">Items Stored</p>
            </div>
            <div>
              <div className="flex items-center justify-center mb-4">
                <Star className="h-8 w-8 text-primary mr-2" />
                <span className="text-4xl font-bold text-foreground">4.9</span>
              </div>
              <p className="text-muted-foreground">Average Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              No hidden fees. Pay only for what you need.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Small Box</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">Rp 25K</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>
                  Perfect for documents, small electronics, and personal items.
                  <br />
                  <strong>Size:</strong> 30×20×15 cm
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-primary">
              <CardHeader className="text-center">
                <div className="bg-primary text-primary-foreground text-sm py-1 px-3 rounded-full inline-block mb-2">
                  Most Popular
                </div>
                <CardTitle className="text-2xl">Medium Box</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">Rp 45K</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>
                  Great for clothes, books, and medium-sized items.
                  <br />
                  <strong>Size:</strong> 50×40×30 cm
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Large Box</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">Rp 75K</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>
                  Ideal for furniture, large electronics, and bulk items.
                  <br />
                  <strong>Size:</strong> 80×60×50 cm
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" className="px-8">
                  Book Your Storage
                </Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button size="lg" className="px-8">
                  Get Started Today
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-8 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <Package className="h-6 w-6 text-primary mr-2" />
            <span className="font-bold text-lg">TitipYuk Semarang</span>
          </div>
          <p className="text-muted-foreground">
            © 2025 TitipYuk Semarang. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
