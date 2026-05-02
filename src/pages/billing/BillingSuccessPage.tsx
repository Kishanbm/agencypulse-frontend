import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function BillingSuccessPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) {
          clearInterval(interval);
          navigate('/settings/billing', { replace: true });
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" as const }}
        className="w-full max-w-md mx-auto"
      >
        <div className="bg-white rounded-3xl overflow-hidden text-center" style={{ border: '1px solid #ECECE6', boxShadow: '0 20px 60px rgba(16,217,160,0.08)' }}>
          <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#10D9A0,#5B47E0,#FF7A59)' }} />

          <div className="px-8 py-10 space-y-6">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" as const }}
              className="flex justify-center"
            >
              <div className="relative">
                <div
                  className="size-20 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(16,217,160,0.12)', border: '2px solid rgba(16,217,160,0.30)' }}
                >
                  <CheckCircle2 className="size-10" style={{ color: '#10D9A0' }} />
                </div>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.4, ease: "easeOut" as const }}
                  className="absolute -top-1 -right-1 size-7 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(91,71,224,0.12)', border: '2px solid rgba(91,71,224,0.25)' }}
                >
                  <Sparkles className="size-3.5" style={{ color: '#5B47E0' }} />
                </motion.div>
              </div>
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.25, ease: "easeOut" as const }}
              className="space-y-2"
            >
              <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-foreground">
                Subscription Activated!
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your plan has been upgraded. You now have access to all features included in your new plan.
              </p>
            </motion.div>

            {/* Features unlocked pills */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.35, ease: "easeOut" as const }}
              className="flex flex-wrap justify-center gap-2"
            >
              {["Unlimited clients", "All integrations", "PDF reports", "White-label"].map((f) => (
                <span
                  key={f}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(16,217,160,0.08)', color: '#059669', border: '1px solid rgba(16,217,160,0.20)' }}
                >
                  {f}
                </span>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.45, ease: "easeOut" as const }}
              className="space-y-3 pt-1"
            >
              <button
                onClick={() => navigate('/settings/billing', { replace: true })}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
              >
                Go to Billing
                <ArrowRight className="size-4" />
              </button>
              <p className="text-xs text-muted-foreground">
                Redirecting automatically in <span className="font-semibold tabular-nums" style={{ color: '#5B47E0' }}>{countdown}s</span>
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
