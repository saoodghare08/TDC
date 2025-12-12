'use client';

import data from '@/data/content.json';
import Section from '@/components/ui/Section';
import clsx from 'clsx';

export default function ServiceSuite() {
    return (
        <Section id="services" className="bg-white">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-4xl md:text-5xl font-heading font-bold text-heading mb-4">
                    Efficient Service Suite
                </h2>
                <p className="text-gray-500 text-lg">
                    A comprehensive and personalized approach to your health and wellness journey.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {data.services.map((service, index) => {
                    // Check if index implies colored card (checkerboard pattern or random)
                    // Original: 2, 4, 6, 8, 9, 11 (index 1, 3, 5, 7, 8, 10)
                    // Let's us a simple pattern: index % 2 !== 0 usually, but let's make it look good.
                    const isColored = [1, 3, 5, 7, 8, 10].includes(index);

                    return (
                        <div
                            key={index}
                            className={clsx(
                                "p-8 rounded-2xl flex items-center justify-center text-center h-48 transition-all duration-300 hover:scale-105 hover:shadow-xl border",
                                isColored
                                    ? "bg-blue-50 border-blue-100 text-primary-dark"
                                    : "bg-white border-gray-100 text-gray-700 shadow-sm"
                            )}
                        >
                            <p className="font-medium text-lg leading-snug">
                                {service}
                            </p>
                        </div>
                    );
                })}
            </div>
        </Section>
    );
}
