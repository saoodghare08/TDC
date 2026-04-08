'use client';

import {
    MessageSquare, ClipboardList, Utensils, PhoneCall,
    MessageCircle, Layers, Dumbbell, TrendingUp,
    Map, ShieldCheck, Search, BookOpen, ArrowRight
} from 'lucide-react';
import Stack from '@/components/ui/Stack';
import { motion } from 'motion/react';
import Section from '@/components/ui/Section';
import data from '@/data/content.json';
import clsx from 'clsx';

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

const ServiceCard = ({ service, index, isStack = false }) => {
    const isColored = [1, 3, 5, 7, 8, 10].includes(index);

    if (isStack) {
        return (
            <div className="w-full h-full bg-linear-to-br from-white to-blue-50 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden border border-blue-100 shadow-2xl rounded-2xl">
                <div className="mb-6 p-4 rounded-full bg-primary/10">
                    <ServiceIcon text={service} className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-heading mb-4 leading-snug">{service}</h3>
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span>Swipe to see more</span>
                    <ArrowRight size={16} className="animate-pulse" />
                </div>
                <ServiceIcon
                    text={service}
                    className="absolute -right-6 -bottom-6 w-32 h-32 text-primary/5 -rotate-12"
                />
            </div>
        );
    }

    return (
        <div
            className={clsx(
                "p-5 md:p-8 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center text-center min-h-[140px] md:h-56 border group relative overflow-hidden transition-shadow duration-200",
                isColored
                    ? "bg-linear-to-br from-blue-50/50 to-white border-blue-100/50"
                    : "bg-white border-gray-100 shadow-xs"
            )}
        >
            <div className="absolute top-0 left-0 w-0 h-1 bg-primary transition-all duration-250 group-hover:w-full" style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }} />
            <div className="mb-3 md:mb-5 transition-transform duration-250 group-hover:scale-110 group-hover:-translate-y-1" style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}>
                <ServiceIcon
                    text={service}
                    className="w-6 h-6 md:w-8 md:h-8 text-primary/70 group-hover:text-primary transition-colors duration-200"
                />
            </div>
            <p className="font-bold text-xs sm:text-sm md:text-base leading-tight md:leading-snug text-heading cursor-default">
                {service}
            </p>
            <ServiceIcon
                text={service}
                className="absolute -right-4 -bottom-4 w-12 h-12 md:w-20 md:h-20 text-primary/5 group-hover:text-primary/10 transition-colors duration-200 -rotate-12"
            />
        </div>
    );
};

export default function ServiceSuite() {
    return (
        <Section id="services" className="bg-white">
            <div className="max-w-7xl mx-auto px-4 md:px-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Left Column */}
                    <div className="text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, transform: 'translateX(-16px)' }}
                            whileInView={{ opacity: 1, transform: 'translateX(0)' }}
                            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                            viewport={{ once: true }}
                        >
                            <span className="text-primary font-bold tracking-widest uppercase text-xs md:text-sm mb-4 block">Comprehensive Care</span>
                            <h2 className="text-4xl md:text-5xl lg:text-7xl font-heading font-bold text-heading mb-6 leading-tight">
                                Efficient Service <span className="text-primary italic">Suite</span>
                            </h2>
                            <p className="text-gray-500 text-lg md:text-xl mb-10 max-w-xl leading-relaxed mx-auto lg:mx-0">
                                Experience a personalized approach to your health and wellness journey. Our services are crafted to provide holistic care across all life stages.
                            </p>

                            <div className="hidden lg:grid grid-cols-2 gap-6 mb-10">
                                {data.services.slice(0, 4).map((service, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        {service.split(' ').slice(0, 4).join(' ')}...
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                                className="px-8 py-4 bg-heading text-white rounded-full font-bold transition-transform duration-150 active:scale-[0.97] shadow-xl shadow-heading/20 cursor-pointer"
                            >
                                Get Started Today
                            </button>
                        </motion.div>
                    </div>

                    {/* Right Column: Stack */}
                    <div className="flex justify-center items-center h-[450px] md:h-[500px] lg:h-[600px] overflow-visible">
                        <div className="w-full max-w-[320px] md:max-w-[400px] h-[400px] md:h-[480px]">
                            <Stack
                                randomRotation={true}
                                sensitivity={180}
                                sendToBackOnClick={true}
                                cards={data.services.map((service, index) => (
                                    <ServiceCard key={index} service={service} index={index} isStack={true} />
                                ))}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-24 pt-12 border-t border-gray-100 hidden lg:block">
                <div className="grid grid-cols-6 gap-6 max-w-6xl mx-auto opacity-40">
                    {data.services.map((service, index) => (
                        <div key={index} className="flex flex-col items-center gap-2 grayscale hover:grayscale-0 transition-all duration-200 cursor-default group">
                            <ServiceIcon text={service} className="w-6 h-6 group-hover:text-primary" />
                            <span className="text-[10px] uppercase tracking-tighter text-center font-bold">{service.split(' ')[0]}</span>
                        </div>
                    ))}
                </div>
            </div>
        </Section>
    );
}