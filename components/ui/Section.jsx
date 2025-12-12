import clsx from 'clsx';

export default function Section({ id, className, children, containerClass }) {
    return (
        <section id={id} className={clsx("py-20 md:py-32 relative overflow-hidden", className)}>
            <div className={clsx("container mx-auto px-6 md:px-12", containerClass)}>
                {children}
            </div>
        </section>
    );
}
