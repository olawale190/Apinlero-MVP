import { Quote } from "lucide-react";

export function Testimonial() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary-600 px-8 py-16 sm:px-16 sm:py-20">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10" />
          <div className="relative mx-auto max-w-3xl text-center">
            <Quote className="mx-auto h-12 w-12 text-white/50" />
            <blockquote className="mt-8 text-2xl font-medium leading-relaxed text-white sm:text-3xl">
              &ldquo;Àpínlẹ̀rọ transformed how we handle customer orders. We
              used to miss messages all the time — now everything is in one
              place and our response time dropped from hours to minutes.&rdquo;
            </blockquote>
            <div className="mt-8">
              <div className="font-semibold text-white">
                Isha Adeyemi
              </div>
              <div className="mt-1 text-white/80">
                Founder, Isha's Treat
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
