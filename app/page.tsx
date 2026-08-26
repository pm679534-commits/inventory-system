import Link from 'next/link';
import { ArrowRight, BarChart3, Package, Shield, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Package className="w-7 h-7 text-blue-600" />
              <span className="text-xl font-semibold tracking-tight text-gray-900">
                Warehouse
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/30"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              <span>Enterprise-grade inventory management</span>
            </div>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-gray-900 mb-6 leading-[1.1]">
              Manage inventory
              <br />
              <span className="text-blue-600">across warehouses</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-3xl mx-auto">
              The modern inventory management system built for scale. Track stock, manage orders, and optimize operations across multiple warehouses with real-time visibility.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 group"
              >
                Start free trial
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
              Everything you need to manage inventory
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed for enterprise operations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Package className="w-6 h-6" />}
              title="Multi-warehouse support"
              description="Manage inventory across unlimited warehouses with centralized control and real-time synchronization."
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Real-time analytics"
              description="Get instant insights into stock levels, order trends, and warehouse performance with live dashboards."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Role-based access"
              description="Secure access control with granular permissions for admins, managers, and staff members."
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Automated workflows"
              description="Streamline operations with automated reordering, low-stock alerts, and fulfillment processes."
            />
            <FeatureCard
              icon={<Package className="w-6 h-6" />}
              title="Product management"
              description="Comprehensive product catalog with variants, categories, and detailed inventory tracking."
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Export & reporting"
              description="Generate detailed reports and export data in multiple formats for analysis and compliance."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-6">
            Ready to optimize your inventory?
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Join leading businesses managing their warehouses with our platform
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 group"
          >
            Get started for free
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Package className="w-6 h-6 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">Warehouse</span>
            </div>
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} Warehouse Inventory System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group p-8 bg-white rounded-2xl border border-gray-200 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-600/5 transition-all duration-200">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-xl mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
