/**
 * KAZAJOB — Cron d'expiration des essais
 * Déclenché par Vercel Cron à 03:00 UTC (07:00 Réunion UTC+4).
 * Passe en `expired` les essais terminés qui n'ont jamais ajouté de paiement Stripe,
 * et les offres d'emploi publiées arrivées à échéance.
 */
import { NextRequest, NextResponse } from 'next/server'
import { expireEndedTrials } from '@/lib/queries/billing'
import { expireJobBoosts, expirePublishedJobs } from '@/lib/queries/jobs'
import { expireLaunchSubscriptions } from '@/lib/queries/launch'

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const expired = await expireEndedTrials()
    const boostsExpired = await expireJobBoosts()
    const launchExpired = await expireLaunchSubscriptions()
    const jobsExpired = await expirePublishedJobs()
    return NextResponse.json({ ok: true, expired, boostsExpired, launchExpired, jobsExpired })
  } catch (err) {
    console.error('[Cron expire-trials]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
