import type { TrackingIntegration, TrackingPlacement } from '@/lib/types'

export interface RenderedScript {
  id: string
  placement: TrackingPlacement
  content?: string
  src?: string
}

// N'autorise que des identifiants courts alphanumériques (+ - _ .) dans les templates —
// élimine tout risque d'injection pour les fournisseurs structurés (l'admin ne fournit jamais de HTML/JS brut).
function safeIdentifier(raw: string): string | null {
  const cleaned = raw.trim()
  if (!/^[A-Za-z0-9_.-]{1,64}$/.test(cleaned)) return null
  return cleaned
}

export function renderIntegrationScripts(integration: TrackingIntegration): RenderedScript[] {
  if (integration.provider === 'custom') {
    return integration.custom_code
      ? [{ id: integration.id, placement: integration.placement, content: integration.custom_code }]
      : []
  }

  const id = integration.identifier ? safeIdentifier(integration.identifier) : null
  if (!id) return []

  if (integration.provider === 'linkedin_insight') {
    return [{
      id: integration.id, placement: integration.placement, content: `
        _linkedin_partner_id = "${id}";
        window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
        window._linkedin_data_partner_ids.push(_linkedin_partner_id);
        (function(l) {
        if (!l){window.lintrk = function (a, b) { window.lintrk.q.push([a, b]) };
        window.lintrk.q=[]}
        var s = document.getElementsByTagName("script")[0];
        var b = document.createElement("script");
        b.type = "text/javascript";b.async = true;
        b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
        s.parentNode.insertBefore(b, s);})(window.lintrk);
      `,
    }]
  }

  if (integration.provider === 'meta_pixel') {
    return [{
      id: integration.id, placement: integration.placement, content: `
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
        document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${id}');
        fbq('track', 'PageView');
      `,
    }]
  }

  if (integration.provider === 'ga4') {
    return [
      { id: `${integration.id}-lib`, placement: integration.placement, src: `https://www.googletagmanager.com/gtag/js?id=${id}` },
      { id: integration.id, placement: integration.placement, content: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${id}');
      ` },
    ]
  }

  if (integration.provider === 'gtm') {
    return [{
      id: integration.id, placement: integration.placement, content: `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${id}');
      `,
    }]
  }

  return []
}

export function matchesRouteScope(integration: TrackingIntegration, pathname: string): boolean {
  const scope = integration.route_scope
  if (!scope || scope.mode === 'all') return true
  if (scope.mode === 'public') return !/^\/(candidate|recruiter|admin)/.test(pathname)
  if (scope.mode === 'candidate') return pathname.startsWith('/candidate')
  if (scope.mode === 'recruiter') return pathname.startsWith('/recruiter')
  if (scope.mode === 'admin') return pathname.startsWith('/admin')
  if (scope.mode === 'custom') {
    if (scope.exclude?.some((p) => pathname.startsWith(p))) return false
    if (scope.include?.length) return scope.include.some((p) => pathname.startsWith(p))
    return true
  }
  return true
}
