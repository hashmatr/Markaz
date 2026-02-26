import { useRef, useEffect } from 'react';
import gsap from 'gsap';

export default function AnimatedNumber({ value, prefix = "", suffix = "", duration = 1.5, decimals = 0 }) {
    const numberRef = useRef(null);
    const valueRef = useRef({ val: 0 });

    useEffect(() => {
        if (!numberRef.current) return;

        gsap.to(valueRef.current, {
            val: value,
            duration: duration,
            ease: "power3.out",
            onUpdate: () => {
                if (numberRef.current) {
                    numberRef.current.innerText = `${prefix}${valueRef.current.val.toLocaleString(undefined, {
                        minimumFractionDigits: decimals,
                        maximumFractionDigits: decimals
                    })}${suffix}`;
                }
            },
        });
    }, [value, prefix, suffix, duration, decimals]);

    return <span ref={numberRef}>{prefix}{(0).toFixed(decimals)}{suffix}</span>;
}
