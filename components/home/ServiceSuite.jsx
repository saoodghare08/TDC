'use client';

import data from '@/data/content.json';
import Section from '@/components/ui/Section';
import clsx from 'clsx';
import {
    MessageSquare,
    ClipboardList,
    Utensils,
    PhoneCall,
    MessageCircle,
    Layers,
    Dumbbell,
    TrendingUp,
    Map,
    ShieldCheck,
    Search,
    BookOpen
} from 'lucide-react';

const iconMap = [
    { keywords: ['counseling'], icon: MessageSquare },
    { keywords: ['clinical', 'anthropometric'], icon: ClipboardList },
    { keywords: ['customized'], icon: Utensils },
    { keywords: ['follow up'], icon: PhoneCall },
    { keywords: ['whatsapp'], icon: MessageCircle },
    { keywords: ['periodisation'], icon: Layers },
    { keywords: ['workout'], icon: Dumbbell },
    { keywords: ['progress', 'tracking'], icon: TrendingUp },
    { keywords: ['travel'], icon: Map },
    { keywords: ['maintenance'], icon: ShieldCheck },
    { keywords: ['nutritional', 'guidance'], icon: BookOpen },
    { keywords: ['diet recall'], icon: Search }
];

const ServiceIcon = ({ text, className }) => {
    const lower = text.toLowerCase();
    const match = iconMap.find(item => item.keywords.some(kw => lower.includes(kw)));
    const Icon = match ? match.icon : ShieldCheck;
    return <Icon className={className} />;
};

export default function ServiceSuite() {
    return (
        <Section id="services" className="bg-white">
            <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
                <span className="text-primary font-bold tracking-widest uppercase text-xs md:text-sm mb-2 block">Comprehensive Care</span>
                <h2 className="text-3xl md:text-5xl font-heading font-bold text-heading mb-4">
                    Efficient Service Suite
                </h2>
                <p className="text-gray-500 text-base md:text-lg px-4">
                    A personalized approach to your health and wellness journey.
                </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 max-w-7xl mx-auto px-2 md:px-0">
                {data.services.map((service, index) => {
                    const isColored = [1, 3, 5, 7, 8, 10].includes(index);

                    return (
                        <div
                            key={index}
                            className={clsx(
                                "p-5 md:p-8 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center text-center min-h-[140px] md:h-56 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 border group relative overflow-hidden",
                                isColored
                                    ? "bg-linear-to-br from-blue-50/50 to-white border-blue-100/50"
                                    : "bg-white border-gray-100 shadow-xs"
                            )}
                        >
                            {/* Suble hover indicator */}
                            <div className="absolute top-0 left-0 w-0 h-1 bg-primary transition-all duration-300 group-hover:w-full" />

                            <div className="mb-3 md:mb-5 transform transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1">
                                <ServiceIcon
                                    text={service}
                                    className="w-6 h-6 md:w-8 md:h-8 text-primary/70 group-hover:text-primary transition-colors"
                                />
                            </div>

                            <p className="font-bold text-xs sm:text-sm md:text-base leading-tight md:leading-snug text-heading cursor-default">
                                {service}
                            </p>

                            {/* Background Decorative Icon */}
                            <ServiceIcon
                                text={service}
                                className="absolute -right-4 -bottom-4 w-12 h-12 md:w-20 md:h-20 text-primary/5 group-hover:text-primary/10 transition-colors -rotate-12"
                            />
                        </div>
                    );
                })}
            </div>
        </Section>
    );
}
