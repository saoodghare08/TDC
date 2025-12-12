'use client';

import data from '@/data/content.json';
import Section from '@/components/ui/Section';
import { Package, Check } from 'lucide-react';
import clsx from 'clsx';

export default function Pricing() {
    const handleEnroll = (planTitle) => {
        const message = `Hi, I am interested in the ${planTitle} and would like to know more.`;
        const url = `https://wa.me/+919004491160?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    return (
        <Section id="pricing" className="bg-linear-to-br from-blue-50/50 to-white relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 p-20 bg-blue-100 rounded-full blur-[100px] opacity-30 pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 p-32 bg-purple-100 rounded-full blur-[120px] opacity-30 pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

            <div className="text-center mb-16 relative z-10">
                <span className="text-primary font-bold tracking-wider uppercase text-sm mb-2 block">Our Packages</span>
                <h2 className="text-4xl md:text-5xl font-heading font-bold text-heading mb-4">Plan Benefits</h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                    Invest in your health with our structured, expert-led nutrition plans designed for sustainable results.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto relative z-10 px-4">
                {data.pricing.map((plan, index) => {
                    const isPopular = index === 1;
                    return (
                        <div
                            key={index}
                            className={clsx(
                                "relative p-8 rounded-4xl flex flex-col transition-all duration-300",
                                isPopular
                                    ? "bg-white border-2 border-primary shadow-xl scale-105 z-20"
                                    : "bg-white/60 backdrop-blur-sm border border-white shadow-lg hover:shadow-xl hover:-translate-y-2"
                            )}
                        >
                            {isPopular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-linear-to-r from-primary to-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                                    Most Popular
                                </div>
                            )}

                            <div className={clsx(
                                "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-2xl font-heading font-bold",
                                isPopular ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-600"
                            )}>
                                {plan.icon}M
                            </div>

                            <h3 className="text-2xl font-bold text-heading mb-2">{plan.title}</h3>
                            <p className="text-gray-500 text-sm mb-6">Comprehensive care for {plan.title}</p>

                            <div className="h-px w-full bg-linear-to-r from-transparent via-gray-200 to-transparent mb-6"></div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex gap-3 text-gray-700 text-sm items-start">
                                        <div className="mt-0.5 p-0.5 rounded-full bg-green-100 shrink-0">
                                            <Check className="text-green-600 w-3 h-3" strokeWidth={3} />
                                        </div>
                                        <span className="leading-tight">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleEnroll(plan.title)}
                                className={clsx(
                                    "w-full py-4 rounded-xl font-bold transition-all transform active:scale-95 duration-200",
                                    isPopular
                                        ? "bg-linear-to-r from-primary to-blue-600 text-white shadow-lg hover:shadow-primary/30 hover:brightness-110 hover:cursor-pointer"
                                        : "bg-white border-2 border-gray-100 text-gray-700 hover:border-primary hover:text-primary z-10 hover:cursor-pointer"
                                )}
                            >
                                Choose Plan
                            </button>
                        </div>
                    );
                })}
            </div>
        </Section>
    );
}
