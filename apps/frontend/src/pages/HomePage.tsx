import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-accent rounded-lg p-12 text-white">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome to MiniShop
          </h1>
          <p className="text-lg mb-6 text-white/90">
            Discover amazing products at unbeatable prices. Shop now and get
            what you love delivered to your door.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            Shop Now <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 bg-card rounded-lg border border-border">
          <div className="w-12 h-12 bg-primary text-primary-foreground rounded-lg flex items-center justify-center mb-4">
            🚚
          </div>
          <h3 className="text-xl font-bold mb-2">Fast Delivery</h3>
          <p className="text-muted-foreground">
            Get your orders delivered quickly with our reliable courier service.
          </p>
        </div>

        <div className="p-6 bg-card rounded-lg border border-border">
          <div className="w-12 h-12 bg-primary text-primary-foreground rounded-lg flex items-center justify-center mb-4">
            💳
          </div>
          <h3 className="text-xl font-bold mb-2">Secure Payment</h3>
          <p className="text-muted-foreground">
            Your payments are safe with our encrypted payment system.
          </p>
        </div>

        <div className="p-6 bg-card rounded-lg border border-border">
          <div className="w-12 h-12 bg-primary text-primary-foreground rounded-lg flex items-center justify-center mb-4">
            💯
          </div>
          <h3 className="text-xl font-bold mb-2">Quality Assured</h3>
          <p className="text-muted-foreground">
            All products are verified and checked for quality.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground rounded-lg p-12 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Shopping?</h2>
        <p className="text-lg mb-6">
          Browse our collection of premium products curated just for you.
        </p>
        <Link
          to="/products"
          className="inline-block bg-background text-foreground px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition"
        >
          Explore Products
        </Link>
      </section>
    </div>
  );
}
