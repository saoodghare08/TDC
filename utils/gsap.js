import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register all GSAP plugins once here — imported by any component that needs them.
// GSAP deduplicates internally, but this pattern avoids redundant registerPlugin
// calls scattered across components, and ensures consistent tree-shaking.
gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };
