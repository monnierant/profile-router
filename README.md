# Aiguillage de profil — plugin Hermes Desktop

Plugin runtime pour Hermes Desktop : une pastille
dans la rangée d'actions du composer permet de choisir **sur quel profil** ouvrir la prochaine
conversation.

## Fonctionnement

- La pastille affiche le profil courant (pastille colorée + nom).
- Un clic ouvre une liste filtrable des profils joignables sur la connexion active.
- Choisir un profil ouvre une **nouvelle conversation** sur ce profil (`host.newChat(route)`) ;
  la conversation en cours reste intacte dans la barre latérale.
- `Entrée` dans le champ de filtre valide la première cible affichée.
- Le survol d'une ligne préchauffe l'agent du profil (`host.warmAgent`) quand l'hôte le permet.
- Avec moins de deux profils disponibles, la pastille ne s'affiche pas.
- **Plusieurs sources** (cet appareil + une gateway distante, un VPS…) : chaque profil porte
  une étiquette avec le nom de sa connexion (`local`, `hermes.exemple.fr`…), pour distinguer
  deux profils de même nom. Le filtre cherche aussi dans ce nom de source, et la coche ne
  marque que le profil de la connexion active. Avec une seule source, aucune étiquette.

### Pourquoi une nouvelle conversation ?

Le gateway lie `HERMES_HOME` à la session au moment de `session.create` et le re-lie à chaque tour :
une session ne change jamais de profil. Le plugin ne modifie donc pas la conversation courante.

### Limite connue

Le SDK n'expose le texte du composer qu'à l'envoi (`composer.middleware`) : un message déjà tapé
n'est pas transplanté dans la nouvelle conversation. Le geste est « je choisis, puis j'écris ».

## Installation

Dans Hermes Desktop : **Capabilities → Plugins → Install from Git**, puis coller
l'URL du dépôt :

```
https://github.com/monnierant/profile-router
```

Le plugin est copié dans `desktop-plugins/profile-router/` et s'active tout seul
(`defaultEnabled: true`). Il se désactive dans Capabilities → Plugins.

## Développement

```
git clone https://github.com/monnierant/profile-router.git
hermes plugins validate profile-router
```

- `plugin.yaml` : manifeste (nom, version, description).
- `desktop/plugin.js` : le plugin lui-même, un module ES qui n'importe que
  `@hermes/plugin-sdk` et `react`.

Pour tester une modification, copier `desktop/plugin.js` dans
`desktop-plugins/profile-router/plugin.js` : Hermes le recharge à chaud.

## À faire / contributions bienvenues

- [ ] Proposer le plugin au catalogue Hermes (`hermes plugins search`).
- [ ] Transplanter le brouillon en cours dans la nouvelle conversation si le SDK l'expose un jour.
- [ ] Traduction anglaise de l'interface.
- [ ] Captures d'écran dans ce README.

Les issues et pull requests sont les bienvenues.

## Licence

MIT — voir [LICENSE](LICENSE).
