"use client";

import { ApplyModal } from "@/components/shared/ApplyModal";
import { Reveal } from "@/components/shared/Reveal";
import { IMG } from "@/data/site";
import { Link } from "@/i18n/routing";

export const FinalCTA = () => {
  return (
    <section className="bg-cream px-4 py-8 md:py-16">
      <div className="container-edit">
        <Reveal>
          <div className="overflow-hidden rounded-[10px] border border-stone-200 bg-warm-dark shadow-[0_24px_70px_rgba(35,35,30,0.14)]">
            <div className="relative grid min-h-[360px] lg:min-h-[390px] lg:grid-cols-[0.95fr_1.05fr]">
              <img
                src={IMG.graduation}
                alt="Bali YTTC graduates in Ubud"
                className="absolute inset-0 h-full w-full object-cover opacity-45 lg:hidden"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-warm-dark via-warm-dark/75 to-warm-dark/35 lg:hidden" />

              <div className="relative z-10 flex flex-col justify-center px-6 py-8 text-cream sm:px-10 lg:px-12 lg:py-10">
                <p className="label-caps text-gold-light">June 2026 &middot; Only 4 seats remaining</p>
                <h2 className="mt-4 max-w-xl font-serif text-[2.25rem] font-light leading-[1.08] text-cream md:text-[clamp(2rem,4vw,3.5rem)] md:leading-[1.15]">
                  Begin your training journey in <em className="text-terra-light">Ubud</em>
                </h2>
                <p className="mt-4 max-w-xl text-[0.95rem] leading-7 text-cream/78 md:text-[1.0625rem] md:leading-[1.75]">
                  Join 2,500+ graduates in an all-inclusive, Yoga Alliance certified training with small batches and guided practice.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row md:mt-8">
                  <ApplyModal
                    trigger={
                      <button className="btn-primary h-11 min-w-[170px] rounded-none bg-brand px-6 text-white shadow-none hover:bg-brand-dark md:h-12 md:min-w-[190px] md:px-7">
                        Secure Your Spot
                      </button>
                    }
                  />
                  <Link
                    href="/courses"
                    className="btn-outline inline-flex h-11 min-w-[170px] items-center justify-center rounded-none border-cream/60 bg-transparent px-6 text-cream hover:bg-cream hover:text-warm-dark md:h-12 md:min-w-[190px] md:px-7"
                  >
                    View Trainings
                  </Link>
                </div>
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-cream/70 md:mt-7 md:grid md:gap-3 md:text-sm lg:grid-cols-3">
                  <span>30-day cancellation</span>
                  <span>Installments available</span>
                  <span>RYS certified school</span>
                </div>
              </div>

              <div className="relative hidden min-h-[280px] lg:block lg:min-h-full">
                <img
                  src={IMG.graduation}
                  alt="Bali YTTC graduates in Ubud"
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-warm-dark/50 via-transparent to-transparent lg:bg-gradient-to-r lg:from-warm-dark/40 lg:via-transparent lg:to-transparent" />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
