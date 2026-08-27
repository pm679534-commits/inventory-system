'use client';

import { Check, X, Sparkles, Zap, Building2, Crown } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      name: 'Starter',
      nameAz: 'Başlanğıc',
      price: '$49',
      period: '/ay',
      description: 'Kiçik bizneslər və startaplar üçün',
      icon: <Zap className="w-6 h-6" />,
      color: 'blue',
      features: [
        { text: '2 anbar', included: true },
        { text: '500-ə qədər məhsul', included: true },
        { text: '1000 sifariş/ay', included: true },
        { text: 'Əsas hesabatlar', included: true },
        { text: 'Excel/CSV ixrac', included: true },
        { text: 'E-poçt dəstəyi', included: true },
        { text: 'AI analitika', included: false },
        { text: 'Çoxlu istifadəçilər', included: false },
        { text: 'Prioritet dəstək', included: false },
      ],
    },
    {
      name: 'Professional',
      nameAz: 'Professional',
      price: '$149',
      period: '/ay',
      description: 'Böyüyən şirkətlər üçün',
      icon: <Sparkles className="w-6 h-6" />,
      color: 'purple',
      popular: true,
      features: [
        { text: '10 anbar', included: true },
        { text: '5000-ə qədər məhsul', included: true },
        { text: 'Limitsiz sifarişlər', included: true },
        { text: 'Təkmil hesabatlar', included: true },
        { text: 'Bütün ixrac formatları', included: true },
        { text: 'AI analitika', included: true },
        { text: '10-a qədər istifadəçi', included: true },
        { text: 'Prioritet dəstək', included: true },
        { text: 'API girişi', included: false },
      ],
    },
    {
      name: 'Enterprise',
      nameAz: 'Korporativ',
      price: 'Fərdi',
      period: '',
      description: 'Böyük təşkilatlar üçün',
      icon: <Crown className="w-6 h-6" />,
      color: 'gold',
      features: [
        { text: 'Limitsiz anbarlar', included: true },
        { text: 'Limitsiz məhsullar', included: true },
        { text: 'Limitsiz sifarişlər', included: true },
        { text: 'Fərdi hesabatlar', included: true },
        { text: 'Bütün ixrac formatları', included: true },
        { text: 'Təkmil AI analitika', included: true },
        { text: 'Limitsiz istifadəçilər', included: true },
        { text: '24/7 prioritet dəstək', included: true },
        { text: 'Tam API girişi', included: true },
        { text: 'Fərdi inteqrasiyalar', included: true },
        { text: 'Şəxsi hesab meneceri', included: true },
      ],
    },
  ];

  const colorClasses = {
    blue: {
      border: 'border-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      icon: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    },
    purple: {
      border: 'border-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-600 dark:text-purple-400',
      button: 'bg-purple-600 hover:bg-purple-700 text-white',
      icon: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    },
    gold: {
      border: 'border-yellow-600',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      text: 'text-yellow-600 dark:text-yellow-400',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      icon: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    },
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Qiymətləndirmə və Planlar
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
          Biznesinizə uyğun planı seçin
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
        {plans.map((plan) => {
          const colors = colorClasses[plan.color as keyof typeof colorClasses];
          return (
            <div
              key={plan.name}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl border-2 ${
                plan.popular ? colors.border : 'border-gray-200 dark:border-gray-700'
              } p-8 transition-all hover:shadow-xl ${plan.popular ? 'scale-105' : ''}`}
            >
              {plan.popular && (
                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 ${colors.bg} ${colors.text} px-4 py-1 rounded-full text-sm font-semibold border-2 ${colors.border}`}>
                  Ən populyar
                </div>
              )}

              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl ${colors.icon} flex items-center justify-center mb-4`}>
                {plan.icon}
              </div>

              {/* Plan Name */}
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {plan.nameAz}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {plan.description}
              </p>

              {/* Price */}
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900 dark:text-gray-100">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-gray-600 dark:text-gray-400 text-lg ml-1">
                    {plan.period}
                  </span>
                )}
              </div>

              {/* CTA Button */}
              <button
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all mb-8 ${colors.button}`}
              >
                {plan.price === 'Fərdi' ? 'Bizimlə əlaqə saxlayın' : 'Başlayın'}
              </button>

              {/* Features */}
              <div className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5" />
                    )}
                    <span
                      className={`text-sm ${
                        feature.included
                          ? 'text-gray-700 dark:text-gray-300'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
          Tez-tez verilən suallar
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Planımı istənilən vaxt dəyişə bilərəmmi?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Bəli, istənilən vaxt planınızı yüksəldə və ya aşağı sala bilərsiniz. Dəyişikliklər dərhal qüvvəyə minir.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Pulsuz sınaq mövcuddurmu?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Bəli, bütün planlar 14 günlük pulsuz sınaq ilə gəlir. Kredit kartı tələb olunmur.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Məlumatlarım təhlükəsizdirmi?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Bütün məlumatlar SSL şifrələməsi ilə qorunur və təhlükəsiz bulud infrastrukturunda saxlanılır.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Korporativ planın qiyməti nədir?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Korporativ qiymətlər tələblərinizə uyğunlaşdırılır. Xüsusi təklif üçün bizimlə əlaqə saxlayın.
            </p>
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="mt-12 text-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
        <Building2 className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Korporativ həll axtarırsınız?
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Fərdi qiymətləndirmə və xüsusi xüsusiyyətlər üçün satış komandamızla əlaqə saxlayın
        </p>
        <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all">
          Satışla əlaqə saxlayın
        </button>
      </div>
    </div>
  );
}
