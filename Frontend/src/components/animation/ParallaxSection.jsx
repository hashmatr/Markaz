import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function ParallaxSection({
    children,
    bgImage,
    overlayColor = "rgba(0,0,0,0.4)",
    speed = 0.5,
    height = "60vh"
}) {
    const sectionRef = useRef(null);
    const bgRef = useRef(null);
    const contentRef = useRef(null);

    useEffect(() => {
        if (!sectionRef.current || !bgRef.current) return;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: sectionRef.current,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
            }
        });

        tl.fromTo(bgRef.current,
            { y: "-20%", scale: 1.2 },
            { y: "20%", scale: 1, ease: "none" }
        );

        // Content reveal
        gsap.fromTo(contentRef.current,
            { y: 50, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 1.2,
                ease: "power4.out",
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top 70%",
                    toggleActions: "play none none reverse"
                }
            }
        );

        return () => {
            ScrollTrigger.getAll().forEach(st => st.kill());
        };
    }, [speed]);

    return (
        <section
            ref={sectionRef}
            style={{
                position: 'relative',
                height: height,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#000'
            }}
        >
            <div
                ref={bgRef}
                style={{
                    position: 'absolute',
                    top: '-20%',
                    left: 0,
                    width: '100%',
                    height: '140%',
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    zIndex: 0,
                    willChange: 'transform'
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: overlayColor,
                    zIndex: 1
                }}
            />
            <div
                ref={contentRef}
                style={{
                    position: 'relative',
                    zIndex: 2,
                    textAlign: 'center',
                    color: '#fff',
                    padding: '0 20px'
                }}
            >
                {children}
            </div>
        </section>
    );
}
