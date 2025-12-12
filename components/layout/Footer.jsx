import Link from 'next/link';
import { Instagram, Linkedin, Phone, Mail, MapPin } from 'lucide-react';
import data from '@/data/content.json';

export default function Footer() {
    return (
        <footer id="contact" className="bg-heading text-white pt-20 pb-10 rounded-t-[3rem] mt-20 relative overflow-hidden">
            <div className="container mx-auto px-6 md:px-12 grid md:grid-cols-3 gap-12 mb-16 relative z-10">
                {/* Brand */}
                <div>
                    <h2 className="text-3xl font-heading font-bold mb-4">TDC</h2>
                    <p className="text-gray-400 leading-relaxed mb-6">
                        {data.footer.about}
                    </p>
                    <div className="flex gap-4">
                        <Link href={data.contact.instagram} target="_blank" className="bg-white/10 p-3 rounded-full hover:bg-primary transition text-white">
                            <Instagram size={20} />
                        </Link>
                        <Link href={data.contact.linkedin} target="_blank" className="bg-white/10 p-3 rounded-full hover:bg-primary transition text-white">
                            <Linkedin size={20} />
                        </Link>
                    </div>
                </div>

                {/* Contact Info */}
                <div>
                    <h3 className="text-xl font-bold mb-6">Contact Us</h3>
                    <ul className="space-y-4 text-gray-400">
                        <li className="flex items-center gap-3">
                            <MapPin size={20} className="text-primary" />
                            <span>{data.footer.address}</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Phone size={20} className="text-primary" />
                            <a href={`tel:${data.footer.phone}`} className="hover:text-white transition">{data.footer.phone}</a>
                        </li>
                        <li className="flex items-center gap-3">
                            <Mail size={20} className="text-primary" />
                            <a href={`mailto:${data.footer.email}`} className="hover:text-white transition">{data.footer.email}</a>
                        </li>
                    </ul>
                </div>

                {/* Links */}
                <div>
                    <h3 className="text-xl font-bold mb-6">Quick Links</h3>
                    <ul className="space-y-3 text-gray-400">
                        <li><Link href="/#home" className="hover:text-primary transition">Home</Link></li>
                        <li><Link href="/#about" className="hover:text-primary transition">About</Link></li>
                        <li><Link href="/#regimen" className="hover:text-primary transition">Regimens</Link></li>
                        <li><Link href="/#reviews" className="hover:text-primary transition">Testimonials</Link></li>
                        <li><Link href="/blog" className="hover:text-primary transition">Blog</Link></li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-white/10 pt-8 text-center text-gray-500 text-sm relative z-10">
                <p>&copy; {new Date().getFullYear()} The Diet Cascade. All rights reserved.</p>
                <p className="mt-2">Designed by <a href="https://saoodghare08.github.io/MyPortfolio/" target="_blank" className="hover:text-primary transition underline">Saood</a></p>
            </div>

            {/* Decorative Blur */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
        </footer>
    );
}
