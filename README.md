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

### Pourquoi une nouvelle conversation ?

Le gateway lie `HERMES_HOME` à la session au moment de `session.create` et le re-lie à chaque tour :
une session ne change jamais de profil. Le plugin ne modifie donc pas la conversation courante.

### Limite connue

Le SDK n'expose le texte du composer qu'à l'envoi (`composer.middleware`) : un message déjà tapé
n'est pas transplanté dans la nouvelle conversation. Le geste est « je choisis, puis j'écris ».

## Installation (manuelle)

Copier le dossier dans le répertoire des plugins desktop de Hermes :

- Windows : `%LOCALAPPDATA%\hermes\desktop-plugins\profile-router\`

Le fichier `plugin.js` est chargé à chaud, sans reconstruire l'application.

## À faire / contributions bienvenues

- [ ] Empaquetage installable via `hermes plugins install` (manifeste `plugin.yaml`).
- [ ] Transplanter le brouillon en cours dans la nouvelle conversation si le SDK l'expose un jour.
- [ ] Traduction anglaise de l'interface.
- [ ] Captures d'écran dans ce README.

Les issues et pull requests sont les bienvenues.

## Licence

MIT — voir [LICENSE](LICENSE).
