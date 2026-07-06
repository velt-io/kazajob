import { NextRequest, NextResponse } from 'next/server'
import { listJobs } from '@/lib/queries/jobs'
import type { JobFilters } from '@/lib/types'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const num = (v: string | null) => (v != null && v !== '' ? Number(v) : undefined)

  const locationsList = sp.getAll('locations')
  const filters: JobFilters = {
    q:          sp.get('q') ?? undefined,
    location:   sp.get('location') ?? undefined,
    locations:  locationsList.length > 0 ? locationsList : undefined,
    job_type:   sp.get('job_type') ?? undefined,
    sector:     sp.get('sector') ?? undefined,
    remote:     sp.get('remote') == null ? undefined : sp.get('remote') === 'true',
    salary_min: num(sp.get('salary_min')),
    date_range: (sp.get('date_range') as JobFilters['date_range']) ?? undefined,
    level:      sp.get('level') ?? undefined,
    sort:       (sp.get('sort') as JobFilters['sort']) ?? undefined,
    page:       num(sp.get('page')),
    limit:      num(sp.get('limit')),
  }

  const result = await listJobs(filters)
  return NextResponse.json(result)
}
