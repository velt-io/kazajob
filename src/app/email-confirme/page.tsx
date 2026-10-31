import Link from 'next/link'
import type { Metadata } from 'next'
import { MailCheck, MailX, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/layout/Logo'
import { KZ } from '@/lib/constants'

export const metadata: Metadata = { title: 'Confirmation de l’email', robots: { index: false } }

export default async function EmailVerifiedPage(
  { searchParams }: { searchParams: Promise<{ status?: string }> },
) {
  const ok = (await searchParams).status === 'ok'

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10" style={{ background: KZ.cream }}>
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center mb-8"><Logo size={36} /></div>
        <div className="rounded-2xl border-[1.5px] border-[var(--kz-edge)] bg-[var(--kz-paper)] p-6 sm:p-8 text-center" style={{ boxShadow: '6px 6px 0 var(--kz-shadow)' }}>
          <span className="w-14 h-14 mx-auto mb-4 rounded-2xl border border-[var(--kz-edge)] flex items-center justify-center"
            style={{ background: ok ? KZ.greenSoft : KZ.orangeSoft }}>
            {ok ? <MailCheck size={26} className="text-[var(--kz-ink)]" /> : <MailX size={26} className="text-[var(--kz-ink)]" />}
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight mb-2 text-[var(--kz-ink)]">
            {ok ? 'Adresse confirmée' : 'Lien invalide ou expiré'}
          </h1>
          <p className="text-sm text-[var(--kz-mute)] leading-relaxed mb-6">
            {ok
              ? 'Merci ! Ton compte Kazajob est maintenant entièrement activé.'
              : 'Connecte-toi puis clique sur « Renvoyer le lien » dans le bandeau en haut de ton espace pour recevoir un nouveau lien.'}
          </p>
          <Link href="/connexion">
            <Button kind="primary" size="lg" full iconRight={<ArrowRight size={16} />}>
              {ok ? 'Accéder à mon espace' : 'Me connecter'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
