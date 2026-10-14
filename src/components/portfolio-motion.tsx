"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const revealSelector = [
  ".section-heading",
  ".project-card",
  ".timeline-item",
  ".about-card",
  ".contact-panel",
  ".contact-page-hero",
  ".contact-social-panel",
  ".contact-page-footer",
  ".project-feature-visual",
  ".project-gallery-item",
  ".experience-project-card",
].join(",");

const mediaFrameSelector =
  ".project-visual, .project-feature-visual, .project-gallery-item";

export function PortfolioMotion() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let context: gsap.Context | undefined;
    let cleanups: Array<() => void> = [];

    const initializeAnimations = () => {
      cleanups.forEach((cleanup) => cleanup());
      cleanups = [];
      context?.revert();
      context = undefined;

      if (reducedMotion.matches) {
        return;
      }

      context = gsap.context(() => {
        const hero = document.querySelector<HTMLElement>(".hero-copy");
        const heroContent = hero?.querySelectorAll<HTMLElement>(
          ":scope > h1, :scope > p, :scope > .hero-actions",
        );

        if (heroContent?.length) {
          gsap.fromTo(
            heroContent[0],
            { y: 16, clipPath: "inset(0 0 100% 0)" },
            {
              y: 0,
              clipPath: "inset(0 0 0% 0)",
              duration: 0.62,
              ease: "power3.out",
              clearProps: "clipPath,transform",
            },
          );

          if (heroContent.length > 1) {
            gsap.fromTo(
              Array.from(heroContent).slice(1),
              { y: 12 },
              {
                y: 0,
                duration: 0.5,
                stagger: 0.04,
                ease: "power3.out",
                clearProps: "transform",
              },
            );
          }
        }

        gsap.utils
          .toArray<HTMLElement>(revealSelector)
          .forEach((element) => {
            const trigger = {
              trigger: element,
              start: "top 90%",
              once: true,
            };

            gsap.fromTo(
              element,
              { y: 14 },
              {
                y: 0,
                duration: 0.5,
                ease: "power2.out",
                clearProps: "transform",
                scrollTrigger: trigger,
              },
            );

            const heading = element.querySelector<HTMLElement>("h1, h2, h3");

            if (heading) {
              gsap.fromTo(
                heading,
                { clipPath: "inset(0 0 100% 0)" },
                {
                  clipPath: "inset(0 0 0% 0)",
                  duration: 0.55,
                  ease: "power3.out",
                  clearProps: "clipPath",
                  scrollTrigger: trigger,
                },
              );
            }
          });

        gsap.utils
          .toArray<HTMLElement>(mediaFrameSelector)
          .forEach((frame) => {
            const image = frame.querySelector<HTMLElement>("img, video");

            if (!image) {
              return;
            }

            gsap.fromTo(
              image,
              { scale: 1.06, clipPath: "inset(0 0 0 8%)" },
              {
                scale: 1,
                clipPath: "inset(0 0 0 0)",
                duration: 0.72,
                ease: "power2.out",
                clearProps: "clipPath,transform",
                scrollTrigger: {
                  trigger: frame,
                  start: "top 90%",
                  once: true,
                },
              },
            );

            const grow = (event?: Event) => {
              if (
                event instanceof PointerEvent &&
                event.pointerType === "touch"
              ) {
                return;
              }

              gsap.to(image, {
                scale: 1.035,
                duration: 0.45,
                ease: "power2.out",
                overwrite: "auto",
              });
            };
            const reset = (event?: FocusEvent) => {
              if (
                event?.relatedTarget instanceof Node &&
                frame.contains(event.relatedTarget)
              ) {
                return;
              }

              gsap.to(image, {
                scale: 1,
                duration: 0.35,
                ease: "power2.out",
                overwrite: "auto",
              });
            };

            frame.addEventListener("pointerenter", grow);
            frame.addEventListener("pointerleave", reset);
            frame.addEventListener("focusin", grow);
            frame.addEventListener("focusout", reset);

            cleanups.push(() => {
              frame.removeEventListener("pointerenter", grow);
              frame.removeEventListener("pointerleave", reset);
              frame.removeEventListener("focusin", grow);
              frame.removeEventListener("focusout", reset);
              gsap.killTweensOf(image);
              gsap.set(image, { clearProps: "transform" });
            });
          });
      });

    };

    initializeAnimations();
    reducedMotion.addEventListener("change", initializeAnimations);

    return () => {
      reducedMotion.removeEventListener("change", initializeAnimations);
      cleanups.forEach((cleanup) => cleanup());
      context?.revert();
    };
  }, [pathname]);

  return null;
}
