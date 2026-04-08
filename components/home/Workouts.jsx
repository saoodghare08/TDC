'use client';

import { useState } from 'react';
import data from '@/data/content.json';
import Section from '@/components/ui/Section';
import Image from 'next/image';
import clsx from 'clsx';

export default function Workouts() {
    const [activeId, setActiveId] = useState(0);

    return (
        <Section id="program" className="bg-heading text-white py-24">
            <div className="mb-12 px-4">
                <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">Work-Out Program</h2>
                <p className="text-gray-400">Holistic training programs for every body type.</p>
            </div>

            <div className="flex flex-col md:flex-row h-[80vh] w-full gap-2 md:gap-4 px-4 overflow-hidden">
                {data.workouts.map((workout, index) => (
                    <div
                        key={index}
                        className={clsx(
                            "relative rounded-3xl overflow-hidden cursor-pointer transition-[flex] duration-500",
                            activeId === index ? "flex-5" : "flex-1"
                        )}
                        style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
                        onClick={() => setActiveId(index)}
                        onMouseEnter={() => setActiveId(index)}
                    >
                        <Image
                            src={workout.image}
                            alt={workout.title}
                            fill
                            className="object-cover"
                        />
                        <div className={clsx(
                            "absolute inset-0 transition-opacity duration-300",
                            activeId === index ? 'bg-black/20' : 'bg-black/50'
                        )} />

                        <div className={clsx(
                            "absolute bottom-8 left-8 transition-all duration-400",
                            activeId === index
                                ? "opacity-100 translate-y-0"
                                : "opacity-0 translate-y-6 md:opacity-100 md:-rotate-90 md:bottom-20 md:left-1/2 md:-translate-x-1/2 md:origin-left md:whitespace-nowrap"
                        )} style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}>
                            <h3 className="text-2xl md:text-3xl font-bold uppercase tracking-wider drop-shadow-lg">
                                {workout.title}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    );
}
