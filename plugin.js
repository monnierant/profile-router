/**
 * Aiguillage de profil — pastille dans la rangée d'actions du composer qui
 * ouvre une NOUVELLE conversation sur le profil choisi.
 *
 * Ce n'est pas un réglage de la conversation courante : le gateway lie
 * HERMES_HOME à la session au moment de `session.create` et le re-bind à
 * chaque tour, donc une session ne change jamais de profil. Choisir un profil
 * ici appelle `host.newChat(route)` — un brouillon frais sur ce profil — et
 * laisse la conversation en cours intacte dans la barre latérale.
 *
 * Limite assumée : le SDK n'expose le texte du composer qu'à l'envoi
 * (`composer.middleware`), donc un message déjà tapé n'est pas transplanté.
 * Le geste est « je choisis, puis j'écris ».
 */

import {
  COMPOSER_AREAS,
  Codicon,
  Popover,
  PopoverContent,
  PopoverTrigger,
  RowButton,
  SearchField,
  host,
  profileColor,
  useQuery,
  useValue
} from '@hermes/plugin-sdk'
import { useState } from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'

const PLUGIN_ID = 'profile-router'

const PILL_CLASS =
  'inline-flex h-(--composer-control-size) min-w-0 max-w-40 shrink items-center gap-1.5 rounded-md px-2 text-xs font-normal text-(--ui-text-tertiary) hover:bg-(--chrome-action-hover) hover:text-foreground'

const ROW_CLASS =
  'flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs text-(--ui-text-secondary) hover:bg-(--ui-bg-hover) hover:text-(--ui-text-primary)'

function norm(value) {
  return (value ?? '').trim().toLowerCase()
}

function routeKey(route) {
  return `${route.connectionId ?? ''}::${norm(route.profile)}`
}

function dotStyle(name) {
  return { backgroundColor: profileColor(name) ?? 'var(--ui-text-tertiary)' }
}

/** Les profils joignables sur la connexion active, dédoublonnés. */
function useActiveConnectionRoutes() {
  const gateway = useValue(host.state.gateway)
  const connectionId = useValue(host.state.connectionId)

  const query = useQuery({
    queryKey: [PLUGIN_ID, 'routes'],
    queryFn: () => host.profileRoutes(),
    enabled: gateway === 'open',
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 1
  })

  const all = Array.isArray(query.data) ? query.data : []
  const onActive = connectionId ? all.filter(route => route.connectionId === connectionId) : all
  // Repli : si l'id de connexion du gateway ne s'écrit pas comme celui des
  // routes, le filtre viderait la liste et la pastille disparaîtrait sans
  // raison visible. Mieux vaut tout montrer que ne rien montrer.
  const scoped = onActive.length > 1 || all.length < 2 ? onActive : all
  const seen = new Set()

  return scoped.filter(route => {
    const key = routeKey(route)

    if (seen.has(key)) return false

    seen.add(key)

    return true
  })
}

function isCurrentRoute(route, current) {
  const key = norm(current)

  return key !== '' && (norm(route.profile) === key || norm(route.targetProfile) === key)
}

function switchTo(route) {
  if (typeof host.newChat !== 'function') {
    host.notify({
      kind: 'error',
      title: 'Aiguillage de profil',
      message: 'Cette version de Hermes ne permet pas d’ouvrir une conversation sur un autre profil.'
    })

    return
  }

  host.newChat({
    connectionId: route.connectionId,
    mode: route.mode,
    profile: route.profile,
    targetProfile: route.targetProfile
  })
}

function warm(route) {
  if (typeof host.warmAgent !== 'function') return

  host.warmAgent(route.connectionId, route.profile)
}

function ProfileRow({ current, onPicked, route }) {
  const label = route.profile || 'default'

  return jsxs(RowButton, {
    className: ROW_CLASS,
    onClick: () => {
      onPicked()

      if (!current) switchTo(route)
    },
    onMouseEnter: current ? undefined : () => warm(route),
    title: current
      ? `Conversation courante sur ${label}`
      : `Nouvelle conversation sur ${label}`,
    children: [
      jsx('span', { className: 'size-2 shrink-0 rounded-full', style: dotStyle(route.profile) }),
      jsx('span', { className: 'min-w-0 flex-1 truncate', children: label }),
      current
        ? jsx(Codicon, { className: 'shrink-0 text-(--ui-text-tertiary)', name: 'check', size: '0.9em' })
        : null
    ]
  })
}

function ProfilePill() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const routes = useActiveConnectionRoutes()
  const focused = useValue(host.state.focusedSessionProfile)
  const gatewayProfile = useValue(host.state.profile)
  const current = (focused ?? '').trim() || (gatewayProfile ?? '').trim()

  // Moins de deux cibles : la pastille n'a rien à offrir, elle ne s'affiche pas.
  if (routes.length < 2) return null

  const label = current || 'default'
  const needle = norm(query)
  const shown = needle
    ? routes.filter(route => norm(route.profile).includes(needle) || norm(route.targetProfile).includes(needle))
    : routes

  const close = () => {
    setOpen(false)
    setQuery('')
  }

  // Entrée valide la première cible affichée qui n'est pas déjà la courante :
  // filtrer puis appuyer sur Entrée suffit, sans quitter le clavier.
  const submitFirst = event => {
    if (event.key !== 'Enter') return

    const target = shown.find(route => !isCurrentRoute(route, current))

    if (!target) return

    event.preventDefault()
    close()
    switchTo(target)
  }

  return jsxs(Popover, {
    onOpenChange: next => (next ? setOpen(true) : close()),
    open,
    children: [
      jsx(PopoverTrigger, {
        asChild: true,
        children: jsxs('button', {
          'aria-label': 'Choisir le profil de la prochaine conversation',
          className: PILL_CLASS,
          title: `Profil ${label} — ouvrir une nouvelle conversation sur un autre profil`,
          type: 'button',
          children: [
            jsx('span', { className: 'size-2 shrink-0 rounded-full', style: dotStyle(current) }),
            jsx('span', { className: 'truncate', children: label }),
            jsx(Codicon, { className: 'shrink-0 opacity-50', name: 'chevron-down', size: '0.75em' })
          ]
        })
      }),
      jsx(PopoverContent, {
        align: 'end',
        className: 'flex w-56 flex-col p-1',
        collisionPadding: 12,
        side: 'top',
        // Radix publie la place réellement disponible entre la pastille et le
        // bord de l'écran : sans ce plafond, une longue liste déborde au lieu
        // de défiler.
        style: { maxHeight: 'var(--radix-popover-content-available-height)' },
        children: jsxs('div', {
          className: 'flex min-h-0 flex-col',
          children: [
            jsx('div', {
              className: 'shrink-0 px-2 pb-0.5 pt-0.5 text-[0.6875rem] text-(--ui-text-tertiary)',
              children: 'Nouvelle conversation sur…'
            }),
            jsx('div', {
              className: 'shrink-0 px-2 pb-1',
              onKeyDown: submitFirst,
              children: jsx(SearchField, {
                'aria-label': 'Filtrer les profils',
                containerClassName: 'w-full',
                onChange: setQuery,
                placeholder: 'Filtrer…',
                value: query
              })
            }),
            // Hauteur bornée : au-delà d'une poignée de profils la liste défile
            // au lieu de pousser le popover hors de l'écran.
            jsx('div', {
              className: 'min-h-0 max-h-44 flex-1 overflow-y-auto overscroll-contain',
              children:
                shown.length === 0
                  ? jsx('div', {
                      className: 'px-2 py-2 text-center text-[0.6875rem] text-(--ui-text-tertiary)',
                      children: 'Aucun profil ne correspond.'
                    })
                  : shown.map(route =>
                      jsx(ProfileRow, {
                        current: isCurrentRoute(route, current),
                        onPicked: close,
                        route
                      }, routeKey(route))
                    )
            })
          ]
        })
      })
    ]
  })
}

export default {
  id: PLUGIN_ID,
  name: 'Aiguillage de profil',
  description:
    'Pastille dans le composer : ouvre une nouvelle conversation sur le profil choisi.',
  defaultEnabled: true,
  register(ctx) {
    ctx.register({
      id: 'pill',
      area: COMPOSER_AREAS.actions,
      order: 100,
      render: () => jsx(ProfilePill, {})
    })
  }
}
